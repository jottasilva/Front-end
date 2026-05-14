import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { Camera, KeyRound, Save } from "lucide-react";
import { useToast } from "../../../shared/contexts/ToastContext";
import type { ChangePasswordPayload, UpdateProfilePayload, User } from "../../../shared/types/api";

interface ProfileSettingsPanelProps {
  user: User;
  onUpdateProfile: (payload: UpdateProfilePayload) => Promise<void>;
  onChangePassword: (payload: ChangePasswordPayload) => Promise<void>;
}

function isStrongPassword(value: string) {
  return value.length >= 8 && /[A-Z]/.test(value) && /\d/.test(value);
}

const acceptedAvatarTypes = ["image/png", "image/jpeg", "image/webp"];
const maxAvatarSizeInBytes = 1_000_000;

export function ProfileSettingsPanel({ user, onUpdateProfile, onChangePassword }: ProfileSettingsPanelProps) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [name, setName] = useState(user.name);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    setName(user.name);
    setAvatarUrl(user.avatarUrl ?? "");
  }, [user.avatarUrl, user.name]);

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!acceptedAvatarTypes.includes(file.type)) {
      toast.warning("Imagem invalida", "Use apenas imagens PNG, JPG ou WEBP para evitar arquivos inseguros.");
      return;
    }

    if (file.size > maxAvatarSizeInBytes) {
      toast.warning("Imagem muito grande", "A imagem deve ter ate 1MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setAvatarUrl(String(reader.result ?? ""));
    reader.onerror = () => toast.error("Falha no upload", "Nao foi possivel carregar a imagem.");
    reader.readAsDataURL(file);
  }

  async function submitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      toast.warning("Nome obrigatorio", "Informe o nome do perfil.");
      return;
    }

    setIsSavingProfile(true);
    try {
      await onUpdateProfile({ name: name.trim(), avatarUrl });
    } catch {
      toast.error("Perfil nao atualizado", "Nao foi possivel atualizar o perfil.");
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.warning("Campos obrigatorios", "Preencha a senha atual, a nova senha e a confirmacao.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.warning("Confirmacao invalida", "A confirmacao da senha nao confere.");
      return;
    }

    if (!isStrongPassword(newPassword)) {
      toast.warning("Senha fraca", "A nova senha deve ter no minimo 8 caracteres, 1 maiuscula e 1 numero.");
      return;
    }

    setIsSavingPassword(true);
    try {
      await onChangePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast.error("Senha nao alterada", "Nao foi possivel alterar a senha. Confira a senha atual.");
    } finally {
      setIsSavingPassword(false);
    }
  }

  return (
    <section className="profile-settings-panel">
      <form className="profile-card-large" onSubmit={submitProfile}>
        <div className="profile-photo-editor">
          {avatarUrl ? <img src={avatarUrl} alt="Foto do perfil" /> : <span>{name.slice(0, 1) || "U"}</span>}
          <button className="photo-upload-button" type="button" onClick={() => fileInputRef.current?.click()}>
            <Camera size={16} />
            Alterar foto
          </button>
          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handlePhotoChange} hidden />
        </div>

        <div className="profile-form-fields">
          <span className="section-eyebrow">Perfil</span>
          <h4>Foto e dados do usuario</h4>
          <p>Atualize a imagem exibida no topo do painel e o nome do perfil autenticado.</p>
          <label>
            Nome
            <input value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label>
            Email
            <input value={user.email} disabled />
          </label>
          <button className="primary-button" type="submit" disabled={isSavingProfile}>
            <Save size={18} />
            {isSavingProfile ? "Salvando..." : "Salvar perfil"}
          </button>
        </div>
      </form>

      <form className="password-card" onSubmit={submitPassword}>
        <div>
          <span className="section-eyebrow">Seguranca</span>
          <h4>Alterar senha</h4>
          <p>A senha nova precisa ter no minimo 8 caracteres, 1 letra maiuscula e 1 numero.</p>
        </div>
        <label>
          Senha atual
          <input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
        </label>
        <label>
          Nova senha
          <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
        </label>
        <label>
          Confirmar nova senha
          <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
        </label>
        <button className="secondary-button" type="submit" disabled={isSavingPassword}>
          <KeyRound size={18} />
          {isSavingPassword ? "Alterando..." : "Alterar senha"}
        </button>
      </form>
    </section>
  );
}
