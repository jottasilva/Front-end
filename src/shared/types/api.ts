export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  permissions: PermissionKey[];
  avatarUrl?: string;
}

export type UserRole = "admin" | "user";

export type PermissionKey = "dashboard" | "reservations" | "rooms" | "calendar" | "reports" | "settings" | "users";

export interface ManagedUser extends User {
  createdAt: string;
}

export interface UpdateUserPayload {
  name: string;
  email: string;
  role: UserRole;
  permissions: PermissionKey[];
  avatarUrl: string;
  newPassword?: string;
  confirmPassword?: string;
}

export interface UpdateProfilePayload {
  name: string;
  avatarUrl: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  expiresIn: number;
  user: User;
}

export interface Location {
  id: string;
  name: string;
  address: string;
}

export interface LocationPayload {
  name: string;
  address: string;
}

export interface Room {
  id: string;
  locationId: string;
  locationName: string;
  name: string;
  capacity: number;
  imageUrl: string;
  available: boolean;
  availableUntil?: string;
}

export interface RoomPayload {
  locationId: string;
  name: string;
  capacity: number;
  imageUrl: string;
}

export type ReservationStatus = "confirmed" | "pending" | "expired";

export interface Reservation {
  id: string;
  roomId: string;
  roomName: string;
  locationId: string;
  locationName: string;
  userId: string;
  responsibleName: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  coffeeService?: boolean;
  attendeesCount?: number;
  status: ReservationStatus;
}

export interface ReservationPayload {
  roomId: string;
  responsibleName: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  coffeeService: boolean;
  attendeesCount: number;
}

export interface ProblemDetails {
  title?: string;
  detail?: string;
  status?: number;
}
