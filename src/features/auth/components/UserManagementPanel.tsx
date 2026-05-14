import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { Camera, ImageOff, KeyRound, Pencil, ShieldCheck, Trash2, X } from "lucide-react";
import * as authService from "../authService";
import { ConfirmModal } from "../../../shared/components/ConfirmModal";
import { useToast } from "../../../shared/contexts/ToastContext";
import type { ManagedUser, PermissionKey, UpdateUserPayload, User, UserRole } from "../../../shared/types/api";

const permissionOptions: Array<{ key: PermissionKey; label: string; adminOnly: boolean }> = [
  { key: "dashboard", label: "Inicio", adminOnly: false },
  { key: "reservations", label: "Reservas", adminOnly: false },
  { key: "calendar", label: "Calendario", adminOnly: false },
  { key: "rooms", label: "Salas", adminOnly: true },
  { key: "reports", label: "Relatorios", adminOnly: true },
  { key: "settings", label: "Configuracoes", adminOnly: true },
  { key: "users", label: "Usuarios", adminOnly: true },
];

const adminPermissions = permissionOptions.map((permission) => permission.key);
const userPermissions = permissionOptions.filter((permission) => !permission.adminOnly).map((permission) => permission.key);
const acceptedAvatarTypes = ["image/png", "image/jpeg", "image/webp"];
const maxAvatarSizeInBytes = 1_000_000;

interface UserManagementPanelProps {
  currentUser: User;
}

function formatCreatedAt(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function normalizePermissions(role: UserRole, permissions: PermissionKey[]) {
  if (role === "admin") {
    return adminPermissions;
  }

  const allowed = new Set(userPermissions);
  return permissions.filter((permission) => allowed.has(permission));
}

function isStrongPassword(value: string) {
  return value.length >= 8 && /[A-Z]/.test(value) && /\d/.test(value);
}

export function UserManagementPanel({ currentUser }: UserManagementPanelProps) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [editingUserId, setEditingUserId] = useState("");
  const [userToDelete, setUserToDelete] = useState<ManagedUser | null>(null);
  const [form, setForm] = useState<UpdateUserPayload>({
    name: "",
    email: "",
    role: "user",
    permissions: [],
    avatarUrl: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(true);

  const editingUser = useMemo(() => users.find((user) => user.id === editingUserId) ?? null, [editingUserId, users]);

  useEffect(() => {
    let isMounted = true;

    async function loadUsers() {
      setIsLoading(true);
      try {
        const response = await authService.listUsers();
        if (isMounted) {
          setUsers(response);
        }
      } catch {
        if (isMounted) {
          toast.error("Usuarios nao carregados", "Nao foi possivel carregar usuarios.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadUsers();
    return () => {
      isMounted = false;
    };
  }, [toast]);

  function startEditing(user: ManagedUser) {
    setEditingUserId(user.id);
    setForm({
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: normalizePermissions(user.role, user.permissions),
      avatarUrl: user.avatarUrl ?? "",
      newPassword: "",
      confirmPassword: "",
    });
  }

  function cancelEditing() {
    setEditingUserId("");
    setForm({ name: "", email: "", role: "user", permissions: [], avatarUrl: "", newPassword: "", confirmPassword: "" });
  }

  function updateRole(role: UserRole) {
    setForm((current) => ({
      ...current,
      role,
      permissions: role === "admin" ? adminPermissions : normalizePermissions("user", current.permissions),
    }));
  }

  function togglePermission(permission: PermissionKey) {
    setForm((current) => {
      if (current.role === "admin") {
        return current;
      }

      const permissions = current.permissions.includes(permission)
        ? current.permissions.filter((item) => item !== permission)
        : [...current.permissions, permission];

      return {
        ...current,
        permissions: normalizePermissions(current.role, permissions),
      };
    });
  }

  function handleAvatarUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    if (!acceptedAvatarTypes.includes(file.type)) {
      toast.warning("Imagem invalida", "Use apenas imagens PNG, JPG ou WEBP para evitar arquivos inseguros.");
      return;
    }

    if (file.size > maxAvatarSizeInBytes) {
      toast.warning("Imagem muito grande", "A foto do usuario deve ter no maximo 1MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const avatarUrl = String(reader.result ?? "");
      if (!avatarUrl.startsWith("data:image/")) {
        toast.error("Imagem nao validada", "Nao foi possivel validar a imagem enviada.");
        return;
      }
      setForm((current) => ({ ...current, avatarUrl }));
    };
    reader.onerror = () => toast.error("Falha no upload", "Nao foi possivel carregar a imagem.");
    reader.readAsDataURL(file);
  }

  function clearAvatar() {
    setForm((current) => ({ ...current, avatarUrl: "" }));
  }

  async function submitEdit() {
    if (!editingUser) {
      return;
    }

    if (!form.name.trim() || !form.email.trim()) {
      toast.warning("Campos obrigatorios", "Informe nome e email antes de salvar.");
      return;
    }

    const hasPasswordChange = Boolean(form.newPassword || form.confirmPassword);
    if (hasPasswordChange) {
      if (!form.newPassword || !form.confirmPassword) {
        toast.warning("Senha incompleta", "Preencha a nova senha e a confirmacao.");
        return;
      }

      if (form.newPassword !== form.confirmPassword) {
        toast.warning("Confirmacao invalida", "A confirmacao da senha nao confere.");
        return;
      }

      if (!isStrongPassword(form.newPassword)) {
        toast.warning("Senha fraca", "A nova senha deve ter no minimo 8 caracteres, 1 maiuscula e 1 numero.");
        return;
      }
    }

    try {
      const updated = await authService.updateUser(editingUser.id, {
        ...form,
        permissions: normalizePermissions(form.role, form.permissions),
        newPassword: hasPasswordChange ? form.newPassword : undefined,
        confirmPassword: hasPasswordChange ? form.confirmPassword : undefined,
      });
      setUsers((current) => current.map((user) => (user.id === updated.id ? updated : user)));
      toast.success("Usuario atualizado", "Dados, permissao, foto e senha foram processados.");
      cancelEditing();
    } catch {
      toast.error("Usuario nao atualizado", "Nao foi possivel atualizar este usuario.");
    }
  }

  async function confirmDelete() {
    if (!userToDelete) {
      return;
    }

    try {
      await authService.deleteUser(userToDelete.id);
      setUsers((current) => current.filter((user) => user.id !== userToDelete.id));
      toast.success("Usuario excluido", "O acesso do usuario foi removido.");
      setUserToDelete(null);
    } catch {
      toast.error("Usuario nao excluido", "Nao foi possivel excluir este usuario.");
    }
  }

  return (
    <section className="user-admin-panel">
      <div className="panel-title-row">
        <div>
          <span className="section-eyebrow">Administracao</span>
          <h3>Usuarios e permissoes</h3>
          <p className="panel-description">
            Apenas administradores podem editar acessos. Usuarios com perfil user ficam sem paginas administrativas.
          </p>
        </div>
      </div>

      <div className="access-hierarchy">
        <article>
          <ShieldCheck size={20} />
          <strong>admin</strong>
          <span>Acesso total: reservas, salas, relatorios, configuracoes e usuarios.</span>
        </article>
        <article>
          <ShieldCheck size={20} />
          <strong>user</strong>
          <span>Acesso operacional: inicio, reservas e calendario. Sem telas administrativas.</span>
        </article>
      </div>

      {isLoading ? (
        <p className="empty-state">Carregando usuarios...</p>
      ) : (
        <div className="user-table">
          {users.map((managedUser) => {
            const isEditing = editingUserId === managedUser.id;
            const isCurrentUser = managedUser.id === currentUser.id;

            return (
              <article className="user-row" key={managedUser.id}>
                {isEditing ? (
                  <>
                    <div className="user-avatar-editor">
                      {form.avatarUrl ? <img src={form.avatarUrl} alt="Foto do usuario" /> : <span>{form.name.slice(0, 1) || "U"}</span>}
                      <div>
                        <strong>Foto do usuario</strong>
                        <small>PNG, JPG ou WEBP. Maximo 1MB.</small>
                        <div className="avatar-editor-actions">
                          <button className="secondary-button compact" type="button" onClick={() => fileInputRef.current?.click()}>
                            <Camera size={16} />
                            Upload
                          </button>
                          <button className="secondary-button compact" type="button" onClick={clearAvatar}>
                            <ImageOff size={16} />
                            Remover
                          </button>
                        </div>
                      </div>
                      <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleAvatarUpload} hidden />
                    </div>
                    <div className="user-edit-grid">
                      <label>
                        Nome
                        <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
                      </label>
                      <label>
                        Email
                        <input value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
                      </label>
                      <label>
                        Perfil
                        <select value={form.role} onChange={(event) => updateRole(event.target.value as UserRole)}>
                          <option value="admin">admin</option>
                          <option value="user">user</option>
                        </select>
                      </label>
                    </div>
                    <div className="permission-grid">
                      {permissionOptions.map((permission) => {
                        const disabled = form.role === "admin" || permission.adminOnly;
                        return (
                          <label className={disabled ? "permission-pill disabled" : "permission-pill"} key={permission.key}>
                            <input
                              type="checkbox"
                              checked={form.permissions.includes(permission.key)}
                              disabled={disabled}
                              onChange={() => togglePermission(permission.key)}
                            />
                            {permission.label}
                          </label>
                        );
                      })}
                    </div>
                    <div className="user-password-grid">
                      <div className="password-edit-note">
                        <KeyRound size={18} />
                        <div>
                          <strong>Alterar senha</strong>
                          <span>Opcional. Use minimo 8 caracteres, 1 maiuscula e 1 numero.</span>
                        </div>
                      </div>
                      <label>
                        Nova senha
                        <input
                          type="password"
                          value={form.newPassword ?? ""}
                          onChange={(event) => setForm((current) => ({ ...current, newPassword: event.target.value }))}
                          autoComplete="new-password"
                        />
                      </label>
                      <label>
                        Confirmar senha
                        <input
                          type="password"
                          value={form.confirmPassword ?? ""}
                          onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                          autoComplete="new-password"
                        />
                      </label>
                    </div>
                    <div className="user-actions">
                      <button className="secondary-button compact" type="button" onClick={cancelEditing}>
                        <X size={16} />
                        Cancelar
                      </button>
                      <button className="primary-button compact" type="button" onClick={() => void submitEdit()}>
                        Salvar
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="user-identity">
                      <div className="user-avatar-mini">
                        {managedUser.avatarUrl ? <img src={managedUser.avatarUrl} alt="" /> : <span>{managedUser.name.slice(0, 1) || "U"}</span>}
                      </div>
                      <div>
                        <strong>{managedUser.name}</strong>
                        <span>{managedUser.email}</span>
                        <small>Criado em {formatCreatedAt(managedUser.createdAt)}</small>
                      </div>
                    </div>
                    <div className={`role-badge ${managedUser.role}`}>{managedUser.role}</div>
                    <div className="permission-list">
                      {managedUser.permissions.map((permission) => (
                        <span key={permission}>{permissionOptions.find((option) => option.key === permission)?.label ?? permission}</span>
                      ))}
                    </div>
                    <div className="user-actions">
                      <button className="secondary-button compact" type="button" onClick={() => startEditing(managedUser)}>
                        <Pencil size={16} />
                        Editar
                      </button>
                      <button
                        className="danger-button compact"
                        type="button"
                        disabled={isCurrentUser}
                        title={isCurrentUser ? "Voce nao pode excluir sua propria conta" : undefined}
                        onClick={() => setUserToDelete(managedUser)}
                      >
                        <Trash2 size={16} />
                        Excluir
                      </button>
                    </div>
                  </>
                )}
              </article>
            );
          })}
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(userToDelete)}
        title="Excluir usuario"
        message={`Confirma a exclusao de ${userToDelete?.name ?? "este usuario"}? Esta acao remove o acesso ao sistema.`}
        confirmLabel="Excluir usuario"
        onCancel={() => setUserToDelete(null)}
        onConfirm={() => void confirmDelete()}
      />
    </section>
  );
}
