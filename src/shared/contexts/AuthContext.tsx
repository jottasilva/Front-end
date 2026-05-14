import { createContext, useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import * as authService from "../../features/auth/authService";
import { useToast } from "./ToastContext";
import type { ChangePasswordPayload, LoginPayload, RegisterPayload, UpdateProfilePayload, User } from "../types/api";

const defaultUserPermissions = ["dashboard", "reservations", "calendar"] as const;
const adminPermissions = ["dashboard", "reservations", "rooms", "calendar", "reports", "settings", "users"] as const;

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<void>;
  changePassword: (payload: ChangePasswordPayload) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

function readStoredUser(): User | null {
  const stored = localStorage.getItem("authUser");
  if (!stored) {
    return null;
  }

  try {
    const parsed = JSON.parse(stored) as Partial<User>;
    if (!parsed.id || !parsed.name || !parsed.email) {
      return null;
    }

    const isDefaultAdmin = parsed.email === "jefferson@teste.com";

    return {
      id: parsed.id,
      name: parsed.name,
      email: parsed.email,
      role: parsed.role ?? (isDefaultAdmin ? "admin" : "user"),
      permissions: parsed.permissions?.length ? parsed.permissions : isDefaultAdmin ? [...adminPermissions] : [...defaultUserPermissions],
      avatarUrl: parsed.avatarUrl ?? "",
    };
  } catch {
    localStorage.removeItem("authUser");
    return null;
  }
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(readStoredUser);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    function handleExpiredSession() {
      setUser(null);
      toast.warning("Sessao expirada", "Entre novamente para continuar usando o sistema.");
      navigate("/login", { replace: true });
    }

    window.addEventListener("auth:expired", handleExpiredSession);
    return () => window.removeEventListener("auth:expired", handleExpiredSession);
  }, [navigate]);

  async function handleLogin(payload: LoginPayload) {
    setIsLoading(true);
    try {
      const response = await authService.login(payload);
      localStorage.setItem("accessToken", response.accessToken);
      localStorage.setItem("authUser", JSON.stringify(response.user));
      setUser(response.user);
      toast.success("Login realizado", "Bem-vindo de volta ao painel de reservas.");
      navigate("/", { replace: true });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRegister(payload: RegisterPayload) {
    setIsLoading(true);
    try {
      await authService.register(payload);
      toast.success("Cadastro criado", "Sua conta foi criada com sucesso.");
      await handleLogin({ email: payload.email, password: payload.password });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUpdateProfile(payload: UpdateProfilePayload) {
    setIsLoading(true);
    try {
      const updatedUser = await authService.updateProfile(payload);
      localStorage.setItem("authUser", JSON.stringify(updatedUser));
      setUser(updatedUser);
      toast.success("Perfil atualizado", "Foto e dados do perfil foram salvos.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleChangePassword(payload: ChangePasswordPayload) {
    setIsLoading(true);
    try {
      await authService.changePassword(payload);
      toast.success("Senha alterada", "Sua senha foi atualizada com seguranca.");
    } finally {
      setIsLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("authUser");
    setUser(null);
    toast.info("Sessao encerrada", "Voce saiu do sistema com seguranca.");
    navigate("/login", { replace: true });
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user && localStorage.getItem("accessToken")),
        isLoading,
        login: handleLogin,
        register: handleRegister,
        updateProfile: handleUpdateProfile,
        changePassword: handleChangePassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
