import axios from "axios";
import { authApi } from "../../shared/api/authApi";
import type {
  AuthResponse,
  ChangePasswordPayload,
  LoginPayload,
  ManagedUser,
  RegisterPayload,
  UpdateProfilePayload,
  UpdateUserPayload,
  User,
} from "../../shared/types/api";

const adminPermissions = ["dashboard", "reservations", "rooms", "calendar", "reports", "settings", "users"] as const;

function shouldUseDemoData() {
  return import.meta.env.VITE_ENABLE_DEMO_DATA === "true";
}

function demoUser(name = "Usuario Teste", email = "jefferson@teste.com"): User {
  return {
    id: "demo-user",
    name,
    email,
    role: "admin",
    permissions: [...adminPermissions],
    avatarUrl: "",
  };
}

const demoManagedUsers: ManagedUser[] = [
  {
    ...demoUser("Usuario Teste", "jefferson@teste.com"),
    id: "demo-admin",
    createdAt: "2026-05-14T12:00:00.000Z",
  },
  {
    id: "demo-user-2",
    name: "Colaborador Teste",
    email: "colaborador@teste.com",
    role: "user",
    permissions: ["dashboard", "reservations", "calendar"],
    createdAt: "2026-05-14T12:30:00.000Z",
  },
];

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  try {
    const response = await authApi.post<AuthResponse>("/api/auth/login", payload);
    return response.data;
  } catch (error) {
    if (shouldUseDemoData() && axios.isAxiosError(error)) {
      return {
        accessToken: "demo-access-token",
        expiresIn: 28800,
        user: demoUser("Usuario Teste", payload.email || "jefferson@teste.com"),
      };
    }
    throw error;
  }
}

export async function register(payload: RegisterPayload): Promise<User> {
  try {
    const response = await authApi.post<User>("/api/auth/register", payload);
    return response.data;
  } catch (error) {
    if (shouldUseDemoData() && axios.isAxiosError(error)) {
      return {
        ...demoUser(payload.name, payload.email),
        role: "user",
        permissions: ["dashboard", "reservations", "calendar"],
      };
    }
    throw error;
  }
}

export async function listUsers(): Promise<ManagedUser[]> {
  try {
    const response = await authApi.get<ManagedUser[]>("/api/auth/users");
    return response.data;
  } catch (error) {
    if (shouldUseDemoData() && axios.isAxiosError(error)) {
      return demoManagedUsers;
    }
    throw error;
  }
}

export async function updateUser(id: string, payload: UpdateUserPayload): Promise<ManagedUser> {
  try {
    const response = await authApi.put<ManagedUser>(`/api/auth/users/${id}`, payload);
    return response.data;
  } catch (error) {
    if (shouldUseDemoData() && axios.isAxiosError(error)) {
      return {
        id,
        name: payload.name,
        email: payload.email,
        role: payload.role,
        permissions: payload.permissions,
        avatarUrl: payload.avatarUrl,
        createdAt: new Date().toISOString(),
      };
    }
    throw error;
  }
}

export async function deleteUser(id: string): Promise<void> {
  try {
    await authApi.delete(`/api/auth/users/${id}`);
  } catch (error) {
    if (shouldUseDemoData() && axios.isAxiosError(error)) {
      return;
    }
    throw error;
  }
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<User> {
  try {
    const response = await authApi.put<User>("/api/auth/me", payload);
    return response.data;
  } catch (error) {
    if (shouldUseDemoData() && axios.isAxiosError(error)) {
      return {
        ...demoUser(payload.name, "jefferson@teste.com"),
        avatarUrl: payload.avatarUrl,
      };
    }
    throw error;
  }
}

export async function changePassword(payload: ChangePasswordPayload): Promise<void> {
  try {
    await authApi.put("/api/auth/me/password", payload);
  } catch (error) {
    if (shouldUseDemoData() && axios.isAxiosError(error)) {
      return;
    }
    throw error;
  }
}
