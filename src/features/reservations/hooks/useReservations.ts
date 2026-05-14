import axios from "axios";
import { useEffect, useState } from "react";
import { bookingApi } from "../../../shared/api/bookingApi";
import type { Location, LocationPayload, ProblemDetails, Reservation, ReservationPayload, Room, RoomPayload } from "../../../shared/types/api";

const demoLocations: Location[] = [
  { id: "loc-1", name: "Matriz Paulista", address: "Av. Paulista, 1000" },
  { id: "loc-2", name: "Filial Pinheiros", address: "Rua dos Pinheiros, 540" },
];

const demoRooms: Room[] = [
  {
    id: "room-1",
    locationId: "loc-1",
    locationName: "Matriz Paulista",
    name: "Sala Agora",
    capacity: 8,
    imageUrl: "https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=320&q=80",
    available: true,
  },
  {
    id: "room-2",
    locationId: "loc-1",
    locationName: "Matriz Paulista",
    name: "Sala Panorama",
    capacity: 12,
    imageUrl: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=320&q=80",
    available: true,
  },
  {
    id: "room-3",
    locationId: "loc-2",
    locationName: "Filial Pinheiros",
    name: "Sala Conceito",
    capacity: 6,
    imageUrl: "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=320&q=80",
    available: false,
    availableUntil: "11:30",
  },
  {
    id: "room-4",
    locationId: "loc-2",
    locationName: "Filial Pinheiros",
    name: "Sala Inovacao",
    capacity: 10,
    imageUrl: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=320&q=80",
    available: true,
  },
  {
    id: "room-5",
    locationId: "loc-1",
    locationName: "Matriz Paulista",
    name: "Sala Strategy",
    capacity: 16,
    imageUrl: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=320&q=80",
    available: true,
  },
];

const demoReservations: Reservation[] = [
  {
    id: "res-1",
    roomId: "room-1",
    roomName: "Sala Agora",
    locationId: "loc-1",
    locationName: "Matriz Paulista",
    userId: "demo-user",
    responsibleName: "Usuário Teste",
    title: "Reuniao de Planejamento",
    startTime: "2026-05-23T10:00:00.000Z",
    endTime: "2026-05-23T11:00:00.000Z",
    coffeeService: false,
    attendeesCount: 8,
    status: new Date("2026-05-23T11:00:00.000Z") < new Date() ? "expired" : "confirmed",
  },
  {
    id: "res-2",
    roomId: "room-2",
    roomName: "Sala Panorama",
    locationId: "loc-1",
    locationName: "Matriz Paulista",
    userId: "demo-user",
    responsibleName: "Usuário Teste",
    title: "Planejamento de Campanha",
    startTime: "2026-05-23T14:00:00.000Z",
    endTime: "2026-05-23T15:30:00.000Z",
    coffeeService: true,
    attendeesCount: 12,
    status: new Date("2026-05-23T15:30:00.000Z") < new Date() ? "expired" : "confirmed",
  },
  {
    id: "res-3",
    roomId: "room-3",
    roomName: "Sala Conceito",
    locationId: "loc-2",
    locationName: "Filial Pinheiros",
    userId: "demo-user",
    responsibleName: "Equipe Comercial",
    title: "Reuniao com Cliente",
    startTime: "2026-05-24T09:00:00.000Z",
    endTime: "2026-05-24T10:00:00.000Z",
    coffeeService: false,
    attendeesCount: 6,
    status: new Date("2026-05-24T10:00:00.000Z") < new Date() ? "expired" : "pending",
  },
];

function shouldUseDemoData() {
  return import.meta.env.VITE_ENABLE_DEMO_DATA === "true";
}

function getProblemMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<ProblemDetails>(error)) {
    return error.response?.data.detail ?? error.response?.data.title ?? fallback;
  }
  return fallback;
}

export function useReservations() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadReservations(date?: string) {
    setIsLoading(true);
    setError("");

    try {
      const [reservationsResponse, locationsResponse, roomsResponse] = await Promise.all([
        bookingApi.get<Reservation[]>("/api/v1/reservations", { params: date ? { date } : undefined }),
        bookingApi.get<Location[]>("/api/v1/locations"),
        bookingApi.get<Room[]>("/api/v1/rooms"),
      ]);
      setReservations(reservationsResponse.data);
      setLocations(locationsResponse.data);
      setRooms(roomsResponse.data);
    } catch (requestError) {
      if (shouldUseDemoData()) {
        setReservations(demoReservations);
        setLocations(demoLocations);
        setRooms(demoRooms);
      } else {
        setError(getProblemMessage(requestError, "Nao foi possivel carregar as reservas."));
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function createReservation(payload: ReservationPayload) {
    setError("");
    try {
      const response = await bookingApi.post<Reservation>("/api/v1/reservations", payload);
      setReservations((current) => [response.data, ...current]);
    } catch (requestError) {
      if (shouldUseDemoData()) {
        const room = rooms.find((item) => item.id === payload.roomId);
        const demoReservation: Reservation = {
          id: crypto.randomUUID(),
          roomId: payload.roomId,
          roomName: room?.name ?? "Sala",
          locationId: room?.locationId ?? "",
          locationName: room?.locationName ?? "",
          userId: "demo-user",
          responsibleName: payload.responsibleName,
          title: payload.title,
          description: payload.description,
          startTime: payload.startTime,
          endTime: payload.endTime,
          coffeeService: payload.coffeeService,
          attendeesCount: payload.attendeesCount,
          status: "confirmed",
        };
        setReservations((current) => [demoReservation, ...current]);
        return;
      }
      throw new Error(getProblemMessage(requestError, "Nao foi possivel criar a reserva."));
    }
  }

  async function updateReservation(id: string, payload: ReservationPayload) {
    setError("");
    try {
      const response = await bookingApi.put<Reservation>(`/api/v1/reservations/${id}`, payload);
      setReservations((current) => current.map((reservation) => (reservation.id === id ? response.data : reservation)));
    } catch (requestError) {
      if (shouldUseDemoData()) {
        const room = rooms.find((item) => item.id === payload.roomId);
        setReservations((current) =>
          current.map((reservation) =>
            reservation.id === id
              ? {
                  ...reservation,
                  roomId: payload.roomId,
                  roomName: room?.name ?? reservation.roomName,
                  locationId: room?.locationId ?? reservation.locationId,
                  locationName: room?.locationName ?? reservation.locationName,
                  responsibleName: payload.responsibleName,
                  title: payload.title,
                  description: payload.description,
                  startTime: payload.startTime,
                  endTime: payload.endTime,
                  coffeeService: payload.coffeeService,
                  attendeesCount: payload.attendeesCount,
                }
              : reservation,
          ),
        );
        return;
      }
      throw new Error(getProblemMessage(requestError, "Nao foi possivel atualizar a reserva."));
    }
  }

  async function deleteReservation(id: string) {
    setError("");
    try {
      await bookingApi.delete(`/api/v1/reservations/${id}`);
      setReservations((current) => current.filter((reservation) => reservation.id !== id));
    } catch (requestError) {
      if (shouldUseDemoData()) {
        setReservations((current) => current.filter((reservation) => reservation.id !== id));
        return;
      }
      throw new Error(getProblemMessage(requestError, "Nao foi possivel excluir a reserva."));
    }
  }

  async function bulkDeleteReservations(ids: string[]) {
    setError("");
    try {
      await bookingApi.delete("/api/v1/reservations", { data: { ids } });
      setReservations((current) => current.filter((reservation) => !ids.includes(reservation.id)));
    } catch (requestError) {
      if (shouldUseDemoData()) {
        setReservations((current) => current.filter((reservation) => !ids.includes(reservation.id)));
        return;
      }
      throw new Error(getProblemMessage(requestError, "Nao foi possivel excluir as reservas selecionadas."));
    }
  }

  async function createRoom(payload: RoomPayload) {
    setError("");
    try {
      const response = await bookingApi.post<Room>("/api/v1/rooms", payload);
      setRooms((current) => [...current, response.data].sort((first, second) => first.name.localeCompare(second.name)));
    } catch (requestError) {
      if (shouldUseDemoData()) {
        const location = locations.find((item) => item.id === payload.locationId);
        const room: Room = {
          id: crypto.randomUUID(),
          locationId: payload.locationId,
          locationName: location?.name ?? "Local",
          name: payload.name,
          capacity: payload.capacity,
          imageUrl: payload.imageUrl,
          available: true,
        };
        setRooms((current) => [...current, room].sort((first, second) => first.name.localeCompare(second.name)));
        return;
      }
      throw new Error(getProblemMessage(requestError, "Nao foi possivel adicionar a sala."));
    }
  }

  async function updateRoom(id: string, payload: RoomPayload) {
    setError("");
    try {
      const response = await bookingApi.put<Room>(`/api/v1/rooms/${id}`, payload);
      setRooms((current) =>
        current.map((room) => (room.id === id ? response.data : room)).sort((first, second) => first.name.localeCompare(second.name)),
      );
    } catch (requestError) {
      if (shouldUseDemoData()) {
        const location = locations.find((item) => item.id === payload.locationId);
        setRooms((current) =>
          current
            .map((room) =>
              room.id === id
                ? {
                    ...room,
                    locationId: payload.locationId,
                    locationName: location?.name ?? room.locationName,
                    name: payload.name,
                    capacity: payload.capacity,
                    imageUrl: payload.imageUrl,
                  }
                : room,
            )
            .sort((first, second) => first.name.localeCompare(second.name)),
        );
        return;
      }
      throw new Error(getProblemMessage(requestError, "Nao foi possivel editar a sala."));
    }
  }

  async function createLocation(payload: LocationPayload) {
    setError("");
    try {
      const response = await bookingApi.post<Location>("/api/v1/locations", payload);
      setLocations((current) => [...current, response.data].sort((first, second) => first.name.localeCompare(second.name)));
    } catch (requestError) {
      if (shouldUseDemoData()) {
        const location: Location = {
          id: crypto.randomUUID(),
          name: payload.name,
          address: payload.address,
        };
        setLocations((current) => [...current, location].sort((first, second) => first.name.localeCompare(second.name)));
        return;
      }
      throw new Error(getProblemMessage(requestError, "Nao foi possivel adicionar a unidade."));
    }
  }

  async function updateLocation(id: string, payload: LocationPayload) {
    setError("");
    try {
      const response = await bookingApi.put<Location>(`/api/v1/locations/${id}`, payload);
      setLocations((current) =>
        current.map((location) => (location.id === id ? response.data : location)).sort((first, second) => first.name.localeCompare(second.name)),
      );
      setRooms((current) => current.map((room) => (room.locationId === id ? { ...room, locationName: response.data.name } : room)));
      setReservations((current) =>
        current.map((reservation) => (reservation.locationId === id ? { ...reservation, locationName: response.data.name } : reservation)),
      );
    } catch (requestError) {
      if (shouldUseDemoData()) {
        setLocations((current) =>
          current
            .map((location) => (location.id === id ? { ...location, name: payload.name, address: payload.address } : location))
            .sort((first, second) => first.name.localeCompare(second.name)),
        );
        setRooms((current) => current.map((room) => (room.locationId === id ? { ...room, locationName: payload.name } : room)));
        setReservations((current) =>
          current.map((reservation) => (reservation.locationId === id ? { ...reservation, locationName: payload.name } : reservation)),
        );
        return;
      }
      throw new Error(getProblemMessage(requestError, "Nao foi possivel editar a unidade."));
    }
  }

  async function deleteLocation(id: string) {
    setError("");
    try {
      await bookingApi.delete(`/api/v1/locations/${id}`);
      setLocations((current) => current.filter((location) => location.id !== id));
    } catch (requestError) {
      if (shouldUseDemoData()) {
        if (rooms.some((room) => room.locationId === id)) {
          throw new Error("Nao e possivel excluir uma unidade com salas vinculadas.");
        }
        setLocations((current) => current.filter((location) => location.id !== id));
        return;
      }
      throw new Error(getProblemMessage(requestError, "Nao foi possivel excluir a unidade."));
    }
  }

  useEffect(() => {
    void loadReservations();
  }, []);

  return {
    reservations,
    locations,
    rooms,
    isLoading,
    error,
    loadReservations,
    createReservation,
    updateReservation,
    deleteReservation,
    bulkDeleteReservations,
    createRoom,
    updateRoom,
    createLocation,
    updateLocation,
    deleteLocation,
  };
}
