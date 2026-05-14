import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Bell,
  Building2,
  CalendarCheck,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Headphones,
  Home,
  LogOut,
  MapPin,
  Menu,
  Pencil,
  Plus,
  Search,
  Settings,
  Star,
  Trash2,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { UserManagementPanel } from "../features/auth/components/UserManagementPanel";
import { ProfileSettingsPanel } from "../features/auth/components/ProfileSettingsPanel";
import { useAuth } from "../features/auth/hooks/useAuth";
import { BulkDeleteBar } from "../features/reservations/components/BulkDeleteBar";
import { DeleteConfirmModal } from "../features/reservations/components/DeleteConfirmModal";
import { LocationForm } from "../features/reservations/components/LocationForm";
import { ReservationForm } from "../features/reservations/components/ReservationForm";
import { ReservationList } from "../features/reservations/components/ReservationList";
import { RoomForm } from "../features/reservations/components/RoomForm";
import { useReservations } from "../features/reservations/hooks/useReservations";
import { ConfirmModal } from "../shared/components/ConfirmModal";
import { LoadingSpinner } from "../shared/components/LoadingSpinner";
import { useToast } from "../shared/contexts/ToastContext";
import type { Location, LocationPayload, PermissionKey, Reservation, ReservationPayload, Room, RoomPayload } from "../shared/types/api";
import bananaLogo from "../assets/BANANALTDA.svg";

type MenuKey = "inicio" | "reservar" | "minhas" | "salas" | "calendario" | "relatorios" | "configuracoes";
type RoomsTab = "salas" | "unidades";

interface NavItem {
  key: MenuKey;
  label: string;
  icon: LucideIcon;
  permission: PermissionKey;
  adminOnly?: boolean;
}

interface CalendarDay {
  dateKey: string;
  day: string;
  muted: boolean;
  marked: boolean;
  active: boolean;
}

const navItems: NavItem[] = [
  { key: "inicio", label: "Inicio", icon: Home, permission: "dashboard" },
  { key: "reservar", label: "Reservar Sala", icon: CalendarPlus, permission: "reservations" },
  { key: "minhas", label: "Minhas Reservas", icon: CalendarDays, permission: "reservations" },
  { key: "salas", label: "Salas", icon: Users, permission: "rooms", adminOnly: true },
  { key: "calendario", label: "Calendario", icon: CalendarCheck, permission: "calendar" },
  { key: "relatorios", label: "Relatorios", icon: BarChart3, permission: "reports", adminOnly: true },
  { key: "configuracoes", label: "Configuracoes", icon: Settings, permission: "settings", adminOnly: true },
];

const menuTitles: Record<Exclude<MenuKey, "reservar">, { eyebrow: string; title: string; description: string }> = {
  inicio: {
    eyebrow: "Agenda",
    title: "Proximas Reservas",
    description: "Acompanhe as reservas mais recentes e aja rapido quando precisar editar ou excluir.",
  },
  minhas: {
    eyebrow: "Minha agenda",
    title: "Minhas Reservas",
    description: "Veja apenas as reservas vinculadas ao usuario autenticado.",
  },
  salas: {
    eyebrow: "Catalogo",
    title: "Salas Disponiveis",
    description: "Consulte capacidade, local e disponibilidade antes de abrir uma nova reserva.",
  },
  calendario: {
    eyebrow: "Calendario",
    title: "Reservas por Data",
    description: "Selecione uma data para conferir rapidamente o que ja esta agendado.",
  },
  relatorios: {
    eyebrow: "Indicadores",
    title: "Relatorios do Painel",
    description: "Resumo operacional com reservas, disponibilidade e salas mais usadas.",
  },
  configuracoes: {
    eyebrow: "Conta",
    title: "Configuracoes",
    description: "Dados da sessao atual e atalhos de operacao do painel.",
  },
};

const bookingApiUrl = import.meta.env.VITE_BOOKING_API_URL ?? "http://localhost:8000";
const authApiUrl = import.meta.env.VITE_AUTH_API_URL ?? "http://localhost:5000";
const appTimeZone = "America/Sao_Paulo";

function firstName(name?: string) {
  return name?.split(" ")[0] || "Usuario";
}

function padDatePart(value: number) {
  return String(value).padStart(2, "0");
}

function formatDateKey(date: Date) {
  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`;
}

function formatReservationDateKey(value: string) {
  const parts = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: appTimeZone,
    year: "numeric",
  }).formatToParts(new Date(value));
  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${lookup.year}-${lookup.month}-${lookup.day}`;
}

function todayDateKey() {
  const parts = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: appTimeZone,
    year: "numeric",
  }).formatToParts(new Date());
  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${lookup.year}-${lookup.month}-${lookup.day}`;
}

function dateFromKey(value: string) {
  return new Date(`${value}T12:00:00`);
}

function toLocalDateKey(value: string) {
  return formatReservationDateKey(value);
}

function toLocalDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00`);
}

function splitTimeRange(value: string) {
  const [start, end] = value.split("-");
  return { start, end };
}

function formatLongDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(dateFromKey(value));
}

function formatCalendarMonth(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(dateFromKey(value));
}

function getCalendarDays(selectedDate: string, markedDates: Set<string>): CalendarDay[] {
  const selected = dateFromKey(selectedDate);
  const firstMonthDay = new Date(selected.getFullYear(), selected.getMonth(), 1, 12);
  const gridStart = new Date(firstMonthDay);
  gridStart.setDate(firstMonthDay.getDate() - firstMonthDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const current = new Date(gridStart);
    current.setDate(gridStart.getDate() + index);
    const dateKey = formatDateKey(current);

    return {
      dateKey,
      day: String(current.getDate()),
      muted: current.getMonth() !== selected.getMonth(),
      marked: markedDates.has(dateKey),
      active: dateKey === selectedDate,
    };
  });
}

function nextReservationTime(reservations: Reservation[]) {
  const sorted = [...reservations].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  const next = sorted[0];
  if (!next) {
    return "--:--";
  }
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: appTimeZone }).format(
    new Date(next.startTime),
  );
}

function formatShortTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: appTimeZone }).format(
    new Date(value),
  );
}

function formatReservationTimeRange(reservation: Reservation) {
  return `${formatShortTime(reservation.startTime)} - ${formatShortTime(reservation.endTime)}`;
}

function sortReservationsByStartTime(reservations: Reservation[]) {
  return [...reservations].sort((first, second) => new Date(first.startTime).getTime() - new Date(second.startTime).getTime());
}

function countBy<T>(items: T[], getKey: (item: T) => string) {
  return items.reduce<Record<string, number>>((accumulator, item) => {
    const key = getKey(item);
    accumulator[key] = (accumulator[key] ?? 0) + 1;
    return accumulator;
  }, {});
}

function sortedEntries(record: Record<string, number>) {
  return Object.entries(record).sort(([, first], [, second]) => second - first);
}

function groupReservationsByDate(reservations: Reservation[]) {
  return reservations.reduce<Record<string, Reservation[]>>((groups, reservation) => {
    const dateKey = toLocalDateKey(reservation.startTime);
    const existingReservations = groups[dateKey] ?? [];
    groups[dateKey] = [...existingReservations, reservation];
    return groups;
  }, {});
}

function reservationCountLabel(count: number) {
  if (count === 0) {
    return "Sem reservas";
  }
  return `${count} reserva${count === 1 ? "" : "s"}`;
}

function panelInfo(menu: MenuKey) {
  return menuTitles[menu === "reservar" ? "minhas" : menu];
}

export function ReservationsPage() {
  const { user, logout, updateProfile, changePassword } = useAuth();
  const toast = useToast();
  const {
    reservations,
    locations,
    rooms,
    isLoading,
    error,
    createReservation,
    updateReservation,
    deleteReservation,
    bulkDeleteReservations,
    createRoom,
    updateRoom,
    createLocation,
    updateLocation,
    deleteLocation,
  } = useReservations();

  const [activeMenu, setActiveMenu] = useState<MenuKey>("inicio");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [reservationToDelete, setReservationToDelete] = useState<Reservation | null>(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [reservationFormDefaultDate, setReservationFormDefaultDate] = useState("");
  const [isRoomFormOpen, setIsRoomFormOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [roomsTab, setRoomsTab] = useState<RoomsTab>("salas");
  const [isLocationFormOpen, setIsLocationFormOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [locationToDelete, setLocationToDelete] = useState<Location | null>(null);
  const [filterDate, setFilterDate] = useState("2026-05-23");
  const [searchTimeRange, setSearchTimeRange] = useState("10:00-11:00");
  const [searchMinCapacity, setSearchMinCapacity] = useState("");
  const [hasActiveRoomSearch, setHasActiveRoomSearch] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isAdmin = user?.role === "admin";
  const userPermissions = useMemo(() => new Set(user?.permissions ?? []), [user?.permissions]);
  const visibleNavItems = useMemo(
    () => navItems.filter((item) => (!item.adminOnly || isAdmin) && (isAdmin || userPermissions.has(item.permission))),
    [isAdmin, userPermissions],
  );

  function canAccessMenu(menu: MenuKey) {
    const item = navItems.find((navItem) => navItem.key === menu);
    if (!item) {
      return true;
    }
    return (!item.adminOnly || isAdmin) && (isAdmin || userPermissions.has(item.permission));
  }

  const availableRooms = useMemo(() => rooms.filter((room) => room.available).length, [rooms]);
  const myReservations = useMemo(
    () => reservations.filter((reservation) => !user?.id || reservation.userId === user.id),
    [reservations, user?.id],
  );
  const reservationsByDate = useMemo(() => groupReservationsByDate(reservations), [reservations]);
  const dateReservations = reservationsByDate[filterDate] ?? [];
  const todayKey = useMemo(() => todayDateKey(), []);
  const todayReservations = useMemo(
    () => sortReservationsByStartTime(reservationsByDate[todayKey] ?? []),
    [reservationsByDate, todayKey],
  );
  const reservationDateKeys = useMemo(
    () => new Set(Object.keys(reservationsByDate)),
    [reservationsByDate],
  );
  const calendarDays = useMemo(() => getCalendarDays(filterDate, reservationDateKeys), [filterDate, reservationDateKeys]);
  const roomReservationCounts = useMemo(() => countBy(reservations, (reservation) => reservation.roomId), [reservations]);
  const featuredRooms = useMemo(
    () =>
      [...rooms]
        .sort((first, second) => {
          const reservationDifference = (roomReservationCounts[second.id] ?? 0) - (roomReservationCounts[first.id] ?? 0);
          return reservationDifference || first.name.localeCompare(second.name);
        })
        .slice(0, 4),
    [roomReservationCounts, rooms],
  );
  const roomUsage = useMemo(() => sortedEntries(countBy(reservations, (reservation) => reservation.roomName)), [reservations]);
  const locationUsage = useMemo(
    () => sortedEntries(countBy(reservations, (reservation) => reservation.locationName)),
    [reservations],
  );
  const roomCountByLocation = useMemo(() => countBy(rooms, (room) => room.locationId), [rooms]);
  const reservationCountByLocation = useMemo(() => countBy(reservations, (reservation) => reservation.locationId), [reservations]);
  const searchedRooms = useMemo(() => {
    const minimumCapacity = Number(searchMinCapacity || 0);
    const { start, end } = splitTimeRange(searchTimeRange);
    const requestedStart = toLocalDateTime(filterDate, start);
    const requestedEnd = toLocalDateTime(filterDate, end);

    return rooms.filter((room) => {
      if (minimumCapacity > 0 && room.capacity < minimumCapacity) {
        return false;
      }

      return !reservations.some((reservation) => {
        if (reservation.roomId !== room.id) {
          return false;
        }

        const existingStart = new Date(reservation.startTime);
        const existingEnd = new Date(reservation.endTime);
        return requestedStart < existingEnd && requestedEnd > existingStart;
      });
    });
  }, [filterDate, reservations, rooms, searchMinCapacity, searchTimeRange]);

  useEffect(() => {
    if (!canAccessMenu(activeMenu)) {
      setActiveMenu("inicio");
    }
  }, [activeMenu, isAdmin, userPermissions]);

  useEffect(() => {
    if (error) {
      toast.error("Falha na Booking API", error);
    }
  }, [error, toast]);

  function toggleSelection(id: string) {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function updateFilterDate(date: string, showCalendar = false) {
    setFilterDate(date);
    setSelectedIds([]);
    if (showCalendar) {
      setActiveMenu("calendario");
    }
  }

  function openTodayReservations() {
    updateFilterDate(todayKey, true);
    setIsNotificationOpen(false);
  }

  function changeCalendarMonth(offset: number) {
    const current = dateFromKey(filterDate);
    const nextMonth = new Date(current.getFullYear(), current.getMonth() + offset, 1, 12);
    updateFilterDate(formatDateKey(nextMonth), true);
  }

  function openCreateForm(defaultDate = "") {
    setEditingReservation(null);
    setReservationFormDefaultDate(defaultDate);
    setIsFormOpen(true);
  }

  function openEditForm(reservation: Reservation) {
    setEditingReservation(reservation);
    setReservationFormDefaultDate("");
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingReservation(null);
    setReservationFormDefaultDate("");
  }

  function openAddRoomForm() {
    setEditingRoom(null);
    setIsRoomFormOpen(true);
  }

  function openEditRoomForm(room: Room) {
    setEditingRoom(room);
    setIsRoomFormOpen(true);
  }

  function closeRoomForm() {
    setIsRoomFormOpen(false);
    setEditingRoom(null);
  }

  function openAddLocationForm() {
    setEditingLocation(null);
    setIsLocationFormOpen(true);
  }

  function openEditLocationForm(location: Location) {
    setEditingLocation(location);
    setIsLocationFormOpen(true);
  }

  function closeLocationForm() {
    setIsLocationFormOpen(false);
    setEditingLocation(null);
  }

  function handleMenuClick(menu: MenuKey) {
    if (!canAccessMenu(menu)) {
      setActiveMenu("inicio");
      setIsMobileMenuOpen(false);
      return;
    }

    setSelectedIds([]);
    setIsMobileMenuOpen(false);
    if (menu === "reservar") {
      setActiveMenu("minhas");
      openCreateForm();
      return;
    }
    setHasActiveRoomSearch(false);
    setActiveMenu(menu);
  }

  function handleRoomSearch() {
    setHasActiveRoomSearch(true);
    setSelectedIds([]);
    setActiveMenu("salas");
  }

  async function handleSubmitReservation(payload: ReservationPayload) {
    if (editingReservation) {
      await updateReservation(editingReservation.id, payload);
      return;
    }
    await createReservation(payload);
  }

  async function handleSubmitRoom(payload: RoomPayload) {
    if (editingRoom) {
      await updateRoom(editingRoom.id, payload);
      return;
    }
    await createRoom(payload);
  }

  async function handleSubmitLocation(payload: LocationPayload) {
    if (editingLocation) {
      await updateLocation(editingLocation.id, payload);
      return;
    }
    await createLocation(payload);
  }

  async function confirmSingleDelete() {
    if (!reservationToDelete) {
      return;
    }
    try {
      await deleteReservation(reservationToDelete.id);
      setSelectedIds((current) => current.filter((id) => id !== reservationToDelete.id));
      toast.success("Reserva excluida", "A reserva foi removida com sucesso.");
      setReservationToDelete(null);
    } catch (deleteError) {
      toast.error("Reserva nao excluida", deleteError instanceof Error ? deleteError.message : "Nao foi possivel excluir a reserva.");
    }
  }

  async function confirmBulkDelete() {
    try {
      await bulkDeleteReservations(selectedIds);
      toast.success("Reservas excluidas", `${selectedIds.length} reserva${selectedIds.length === 1 ? "" : "s"} removida${selectedIds.length === 1 ? "" : "s"}.`);
      setSelectedIds([]);
      setIsBulkDeleteOpen(false);
    } catch (deleteError) {
      toast.error("Exclusao em lote falhou", deleteError instanceof Error ? deleteError.message : "Nao foi possivel excluir as reservas selecionadas.");
    }
  }

  async function confirmLocationDelete() {
    if (!locationToDelete) {
      return;
    }

    try {
      await deleteLocation(locationToDelete.id);
      toast.success("Unidade excluida", "A unidade foi removida com sucesso.");
      setLocationToDelete(null);
    } catch (deleteError) {
      toast.error("Unidade nao excluida", deleteError instanceof Error ? deleteError.message : "Nao foi possivel excluir a unidade.");
      setLocationToDelete(null);
    }
  }

  function renderReservationsPanel(items: Reservation[], menu: MenuKey) {
    const info = panelInfo(menu);
    return (
      <section className="reservations-panel">
        <div className="panel-title-row">
          <div>
            <span className="section-eyebrow">{info.eyebrow}</span>
            <h3>{info.title}</h3>
            <p className="panel-description">{info.description}</p>
          </div>
          <button
            className="primary-button compact"
            type="button"
            onClick={() => openCreateForm(menu === "calendario" ? filterDate : "")}
          >
            <Plus size={17} />
            {menu === "calendario" ? "Reservar nessa data" : "Nova reserva"}
          </button>
        </div>

        <BulkDeleteBar selectedCount={selectedIds.length} onClear={() => setSelectedIds([])} onDelete={() => setIsBulkDeleteOpen(true)} />

        {isLoading ? (
          <div className="loading-area">
            <LoadingSpinner />
          </div>
        ) : (
          <ReservationList
            reservations={items}
            selectedIds={selectedIds}
            onToggleSelection={toggleSelection}
            onDelete={setReservationToDelete}
            onEdit={openEditForm}
          />
        )}
      </section>
    );
  }

  function renderHero() {
    return (
      <section className="hero-panel">
        <img
          alt="Sala de reuniao corporativa"
          src="https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=1400&q=85"
        />
        <div className="hero-overlay" />
        <div className="hero-content">
          <h2>Encontre a sala ideal para sua reuniao</h2>
          <p>Verifique a disponibilidade e faca sua reserva em poucos passos.</p>

          <div className="search-card">
            <label>
              Data
              <span>
                <CalendarDays size={19} />
                <input
                  type="date"
                  value={filterDate}
                  onChange={(event) => updateFilterDate(event.currentTarget.value)}
                  onInput={(event) => updateFilterDate(event.currentTarget.value)}
                />
              </span>
            </label>
            <label>
              Horario
              <span>
                <Clock3 size={19} />
                <select value={searchTimeRange} onChange={(event) => setSearchTimeRange(event.target.value)}>
                  <option value="10:00-11:00">10:00 - 11:00</option>
                  <option value="14:00-15:30">14:00 - 15:30</option>
                  <option value="16:00-17:00">16:00 - 17:00</option>
                </select>
              </span>
            </label>
            <label>
              Capacidade
              <span>
                <Users size={19} />
                <select value={searchMinCapacity} onChange={(event) => setSearchMinCapacity(event.target.value)}>
                  <option value="">Qualquer</option>
                  <option value="6">6+ pessoas</option>
                  <option value="10">10+ pessoas</option>
                  <option value="12">12+ pessoas</option>
                </select>
              </span>
            </label>
            <button className="primary-button search-button" type="button" onClick={handleRoomSearch}>
              <Search size={18} />
              Buscar Salas
            </button>
          </div>
        </div>
      </section>
    );
  }

  function renderStats() {
    return (
      <section className="stats-grid" aria-label="Indicadores">
        <article className="stat-card blue">
          <CalendarCheck size={23} />
          <strong>{reservations.length}</strong>
          <span>Reservas este mes</span>
          <small>{myReservations.length} minhas reservas</small>
        </article>
        <article className="stat-card green">
          <CheckCircle2 size={23} />
          <strong>{availableRooms}</strong>
          <span>Salas disponiveis</span>
          <small>Agora</small>
        </article>
        <article className="stat-card violet">
          <Clock3 size={23} />
          <strong>{dateReservations.length}</strong>
          <span>Reservas na data</span>
          <small>Proxima: {nextReservationTime(reservations)}</small>
        </article>
        <article className="stat-card amber">
          <Star size={23} />
          <strong>4.8</strong>
          <span>Avaliacao media</span>
          <small>Baseado em 128 avaliacoes</small>
        </article>
      </section>
    );
  }

  function renderRoomsPanel() {
    const info = panelInfo("salas");
    const roomsToShow = hasActiveRoomSearch ? searchedRooms : rooms;
    const { start, end } = splitTimeRange(searchTimeRange);
    const isUnitsTab = roomsTab === "unidades";

    return (
      <section className="reservations-panel">
        <div className="panel-title-row">
          <div>
            <span className="section-eyebrow">{info.eyebrow}</span>
            <h3>{isUnitsTab ? "Unidades / Filiais" : info.title}</h3>
            <p className="panel-description">
              {isUnitsTab
                ? "Cadastre e gerencie as unidades que aparecem como Local / Filial nos formularios de sala e reserva."
                : info.description}
            </p>
          </div>
          <button className="primary-button compact" type="button" onClick={isUnitsTab ? openAddLocationForm : openAddRoomForm}>
            <Plus size={17} />
            {isUnitsTab ? "Adicionar unidade" : "Adicionar sala"}
          </button>
        </div>

        <div className="section-tabs" role="tablist" aria-label="Gerenciamento de salas e unidades">
          <button className={roomsTab === "salas" ? "active" : ""} type="button" onClick={() => setRoomsTab("salas")}>
            Salas
          </button>
          <button className={roomsTab === "unidades" ? "active" : ""} type="button" onClick={() => setRoomsTab("unidades")}>
            Unidades
          </button>
        </div>

        {isUnitsTab ? (
          <>
            <div className="unit-grid">
              {locations.map((location) => {
                const roomCount = roomCountByLocation[location.id] ?? 0;
                const reservationCount = reservationCountByLocation[location.id] ?? 0;

                return (
                  <article className="unit-card" key={location.id}>
                    <div className="unit-card-icon">
                      <Building2 size={22} />
                    </div>
                    <div>
                      <h4>{location.name}</h4>
                      <p>
                        <MapPin size={14} />
                        {location.address}
                      </p>
                    </div>
                    <div className="unit-metrics">
                      <span>{roomCount} sala{roomCount === 1 ? "" : "s"}</span>
                      <span>{reservationCount} reserva{reservationCount === 1 ? "" : "s"}</span>
                    </div>
                    <div className="room-card-actions">
                      <button className="secondary-button compact" type="button" onClick={() => openEditLocationForm(location)}>
                        <Pencil size={16} />
                        Editar
                      </button>
                      <button
                        className="danger-button compact"
                        type="button"
                        disabled={roomCount > 0}
                        title={roomCount > 0 ? "Remova ou mova as salas antes de excluir esta unidade" : undefined}
                        onClick={() => setLocationToDelete(location)}
                      >
                        <Trash2 size={16} />
                        Excluir
                      </button>
                    </div>
                    {roomCount > 0 && <small className="unit-lock">Unidade em uso por salas cadastradas.</small>}
                  </article>
                );
              })}
            </div>
            {locations.length === 0 && <p className="empty-state">Nenhuma unidade cadastrada.</p>}
          </>
        ) : (
          <>
            {hasActiveRoomSearch && (
              <div className="search-summary">
                <span>{formatLongDate(filterDate)}</span>
                <span>{start} - {end}</span>
                <span>{searchMinCapacity ? `${searchMinCapacity}+ pessoas` : "Qualquer capacidade"}</span>
                <strong>{roomsToShow.length} sala{roomsToShow.length === 1 ? "" : "s"} encontrada{roomsToShow.length === 1 ? "" : "s"}</strong>
              </div>
            )}
            <div className="room-grid">
              {roomsToShow.map((room) => (
                <article className="room-card" key={room.id}>
                  <img alt={room.name} src={room.imageUrl} />
                  <div>
                    <h4>{room.name}</h4>
                    <p>
                      <MapPin size={14} />
                      {room.locationName}
                    </p>
                    <p>
                      <Users size={14} />
                      {room.capacity} pessoas
                    </p>
                    <small className={room.available ? "available" : "busy"}>{room.available ? "Disponivel" : `Em uso ate ${room.availableUntil}`}</small>
                    <div className="room-card-actions">
                      <button className="secondary-button compact" type="button" onClick={() => openEditRoomForm(room)}>
                        <Pencil size={16} />
                        Editar
                      </button>
                      <button className="primary-button compact" type="button" onClick={() => openCreateForm(filterDate)}>
                        <CalendarPlus size={16} />
                        Reservar
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            {roomsToShow.length === 0 && (
              <p className="empty-state">Nenhuma sala atende data, horario e capacidade selecionados.</p>
            )}
          </>
        )}
      </section>
    );
  }

  function renderCalendarPanel() {
    const info = panelInfo("calendario");
    return (
      <>
        <section className="reservations-panel">
          <div className="panel-title-row">
            <div>
              <span className="section-eyebrow">{info.eyebrow}</span>
              <h3>{info.title}</h3>
              <p className="panel-description">{info.description}</p>
            </div>
            <label className="inline-date-filter">
              Data
              <input
                type="date"
                value={filterDate}
                onChange={(event) => updateFilterDate(event.currentTarget.value)}
                onInput={(event) => updateFilterDate(event.currentTarget.value)}
              />
            </label>
          </div>
          <div className="calendar-summary">
            <strong>{formatLongDate(filterDate)}</strong>
            <span>{dateReservations.length} reserva{dateReservations.length === 1 ? "" : "s"} encontrada{dateReservations.length === 1 ? "" : "s"}</span>
            <span>Dias marcados no calendario possuem reservas cadastradas.</span>
          </div>
          <div className="calendar-picker">
            <div className="calendar-picker-header">
              <strong>{formatCalendarMonth(filterDate)}</strong>
              <div>
                <button className="icon-button" type="button" onClick={() => changeCalendarMonth(-1)} aria-label="Mes anterior">
                  <ChevronLeft size={17} />
                </button>
                <button className="icon-button" type="button" onClick={() => changeCalendarMonth(1)} aria-label="Proximo mes">
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>
            <div className="mini-calendar week">
              {["D", "S", "T", "Q", "Q", "S", "S"].map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>
            <div className="mini-calendar calendar-picker-grid">
              {calendarDays.map((item) => (
                <button
                  key={item.dateKey}
                  className={`${item.muted ? "muted" : ""} ${item.active ? "active" : ""} ${item.marked ? "marked" : ""}`}
                  type="button"
                  aria-current={item.active ? "date" : undefined}
                  aria-label={`${item.day}${item.marked ? ", com reservas" : ""}`}
                  onClick={() => updateFilterDate(item.dateKey, true)}
                >
                  {item.day}
                </button>
              ))}
            </div>
          </div>
        </section>
        {renderReservationsPanel(dateReservations, "calendario")}
      </>
    );
  }

  function renderReportsPanel() {
    const info = panelInfo("relatorios");
    const topRoom = roomUsage[0]?.[0] ?? "Sem dados";
    const topLocation = locationUsage[0]?.[0] ?? "Sem dados";
    return (
      <section className="reservations-panel">
        <div className="panel-title-row">
          <div>
            <span className="section-eyebrow">{info.eyebrow}</span>
            <h3>{info.title}</h3>
            <p className="panel-description">{info.description}</p>
          </div>
        </div>
        <div className="report-grid">
          <article className="report-card">
            <BarChart3 size={22} />
            <strong>{reservations.length}</strong>
            <span>Total de reservas</span>
          </article>
          <article className="report-card">
            <Building2 size={22} />
            <strong>{topRoom}</strong>
            <span>Sala mais usada</span>
          </article>
          <article className="report-card">
            <MapPin size={22} />
            <strong>{topLocation}</strong>
            <span>Local mais movimentado</span>
          </article>
          <article className="report-card">
            <CheckCircle2 size={22} />
            <strong>{availableRooms}/{rooms.length}</strong>
            <span>Salas disponiveis</span>
          </article>
        </div>
      </section>
    );
  }

  function renderSettingsPanel() {
    const info = panelInfo("configuracoes");
    return (
      <section className="reservations-panel">
        <div className="panel-title-row">
          <div>
            <span className="section-eyebrow">{info.eyebrow}</span>
            <h3>{info.title}</h3>
            <p className="panel-description">{info.description}</p>
          </div>
        </div>
        <div className="settings-layout">
          {user && <ProfileSettingsPanel user={user} onUpdateProfile={updateProfile} onChangePassword={changePassword} />}

          <div className="settings-grid">
            <article className="settings-card">
              <div className="settings-card-icon">
                <Bell size={20} />
              </div>
              <div>
                <span>Notificacoes</span>
                <strong>Ativas no painel</strong>
                <p>Alertas visuais para reservas, conflitos e sessoes expiradas.</p>
              </div>
              <small className="settings-status active">Ativo</small>
            </article>
            <article className="settings-card">
              <div className="settings-card-icon">
                <Building2 size={20} />
              </div>
              <div>
                <span>Auth Service</span>
                <strong>{authApiUrl}</strong>
                <p>Servico responsavel por login, cadastro e emissao do JWT.</p>
              </div>
              <small className="settings-status active">Online</small>
            </article>
            <article className="settings-card">
              <div className="settings-card-icon">
                <CalendarCheck size={20} />
              </div>
              <div>
                <span>Booking API</span>
                <strong>{bookingApiUrl}</strong>
                <p>Servico responsavel por salas, locais e reservas.</p>
              </div>
              <small className="settings-status active">Online</small>
            </article>
            <article className="settings-card">
              <div className="settings-card-icon">
                <Settings size={20} />
              </div>
              <div>
                <span>Autenticacao</span>
                <strong>JWT via localStorage</strong>
                <p>Token enviado automaticamente para a Booking API pelo interceptor Axios.</p>
              </div>
              <small className="settings-status neutral">Teste</small>
            </article>
          </div>

          <div className="settings-actions">
            <button className="primary-button" type="button" onClick={() => openCreateForm()}>
              <CalendarPlus size={18} />
              Nova reserva
            </button>
            <button className="secondary-button" type="button" onClick={() => setActiveMenu("salas")}>
              <Users size={18} />
              Gerenciar salas
            </button>
            <button className="secondary-button" type="button" onClick={logout}>
              <LogOut size={18} />
              Sair da conta
            </button>
          </div>

          {user && isAdmin && <UserManagementPanel currentUser={user} />}
        </div>
      </section>
    );
  }

  function renderMainContent() {
    if (activeMenu === "salas") {
      return renderRoomsPanel();
    }
    if (activeMenu === "calendario") {
      return renderCalendarPanel();
    }
    if (activeMenu === "relatorios") {
      return renderReportsPanel();
    }
    if (activeMenu === "configuracoes") {
      return renderSettingsPanel();
    }
    if (activeMenu === "minhas") {
      return renderReservationsPanel(myReservations, "minhas");
    }
    return (
      <>
        {renderHero()}
        {renderStats()}
        {renderReservationsPanel(reservations, "inicio")}
      </>
    );
  }

  return (
    <div className="dashboard-shell">
      <div
        className={`mobile-sidebar-overlay ${isMobileMenuOpen ? "open" : ""}`}
        aria-hidden="true"
        onClick={() => setIsMobileMenuOpen(false)}
      />
      <aside className={`sidebar ${isMobileMenuOpen ? "open" : ""}`}>
        <div className="sidebar-mobile-header">
          <img className="mobile-drawer-logo" src={bananaLogo} alt="Logo" />
          <button className="icon-button" type="button" onClick={() => setIsMobileMenuOpen(false)} aria-label="Fechar menu">
            <X size={20} />
          </button>
        </div>
        <nav className="sidebar-nav" aria-label="Navegacao principal">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.key === activeMenu || (item.key === "reservar" && isFormOpen && !editingReservation);
            return (
              <button key={item.key} className={isActive ? "active" : ""} type="button" onClick={() => handleMenuClick(item.key)}>
                <Icon size={21} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="support-box">
          <div className="support-icon">
            <Headphones size={19} />
          </div>
          <h4>Precisa de ajuda?</h4>
          <p>Nossa equipe esta pronta para te apoiar.</p>
          <button type="button">Abrir Suporte</button>
        </div>

      </aside>

      <main className="dashboard-main">
        <header className="topbar">
          <div className="topbar-heading">
            <button
              className="hamburger-button"
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Abrir menu"
              aria-expanded={isMobileMenuOpen}
            >
              <Menu size={22} />
            </button>
            <img className="topbar-logo" src={bananaLogo} alt="Logo" />
          </div>

          <div className="topbar-actions">
            <div className="notification-wrapper">
              <button
                className={`notification-button ${todayReservations.length > 0 ? "has-notifications" : ""}`}
                type="button"
                aria-label={`Notificacoes: ${todayReservations.length} reserva${todayReservations.length === 1 ? "" : "s"} hoje`}
                aria-expanded={isNotificationOpen}
                aria-haspopup="dialog"
                onClick={() => setIsNotificationOpen((current) => !current)}
              >
                <Bell size={23} />
                {todayReservations.length > 0 && <span className="notification-count">{todayReservations.length}</span>}
              </button>

              {isNotificationOpen && (
                <section className="notification-popover" aria-label="Notificacoes de reservas">
                  <div className="notification-popover-header">
                    <div>
                      <span>Notificacoes</span>
                      <strong>Reservas de hoje</strong>
                    </div>
                    <button className="link-button" type="button" onClick={openTodayReservations}>
                      Ver calendario
                    </button>
                  </div>

                  <p className="notification-date">{formatLongDate(todayKey)}</p>

                  {todayReservations.length > 0 ? (
                    <div className="notification-list">
                      {todayReservations.map((reservation) => (
                        <button className="notification-item" type="button" key={reservation.id} onClick={openTodayReservations}>
                          <span className="notification-time">{formatReservationTimeRange(reservation)}</span>
                          <strong>{reservation.title}</strong>
                          <small>
                            {reservation.roomName} • {reservation.locationName} • Responsavel: {reservation.responsibleName}
                          </small>
                          <span className={`notification-status ${reservation.status}`}>
                            {reservation.status === "expired" ? "Vencida" : reservation.status === "confirmed" ? "Confirmada" : "Pendente"}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="notification-empty">
                      <CalendarCheck size={22} />
                      <strong>Nenhuma reserva hoje</strong>
                      <span>Quando existir reserva para este dia, ela aparece aqui automaticamente.</span>
                    </div>
                  )}
                </section>
              )}
            </div>
            <div className="profile-chip">
              {user?.avatarUrl ? (
                <img alt="Foto do perfil" src={user.avatarUrl} />
              ) : (
                <span className="profile-chip-fallback">{firstName(user?.name).slice(0, 1)}</span>
              )}
              <div>
                <strong>{user?.name ?? "Usuario Teste"}</strong>
                <span>Teste</span>
              </div>
              <ChevronDown size={17} />
            </div>
            <button className="icon-button" type="button" onClick={logout} aria-label="Sair">
              <LogOut size={19} />
            </button>
          </div>
        </header>

        <div className="dashboard-content">
          <section className="content-grid">
            <div className="left-column">{renderMainContent()}</div>

            <aside className="right-column">
              <section className="side-panel">
                <div className="panel-title-row compact-title">
                  <h3>Salas em Destaque</h3>
                  {canAccessMenu("salas") && (
                    <button
                      className="link-button"
                      type="button"
                      onClick={() => {
                        setHasActiveRoomSearch(false);
                        setActiveMenu("salas");
                      }}
                    >
                      Ver todas
                    </button>
                  )}
                </div>
                <div className="featured-room-list">
                  {featuredRooms.map((room: Room) => (
                    <article className="featured-room" key={room.id}>
                      <img alt={room.name} src={room.imageUrl} />
                      <div>
                        <h4>{room.name}</h4>
                        <p>
                          <Users size={13} />
                          {room.capacity} pessoas
                        </p>
                        <p>
                          <CalendarCheck size={13} />
                          {reservationCountLabel(roomReservationCounts[room.id] ?? 0)}
                        </p>
                        <small className={room.available ? "available" : "busy"}>
                          <span />
                          {room.available ? "Disponivel" : `Em uso ate ${room.availableUntil}`}
                        </small>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <section className="side-panel">
                <div className="calendar-header">
                  <h3>Calendario</h3>
                <div>
                    <button className="icon-button" type="button" onClick={() => changeCalendarMonth(-1)} aria-label="Mes anterior">
                      <ChevronLeft size={17} />
                    </button>
                    <button className="icon-button" type="button" onClick={() => changeCalendarMonth(1)} aria-label="Proximo mes">
                      <ChevronRight size={17} />
                    </button>
                  </div>
                </div>
                <strong className="calendar-month">{formatCalendarMonth(filterDate)}</strong>
                <div className="mini-calendar week">
                  {["D", "S", "T", "Q", "Q", "S", "S"].map((day) => (
                    <span key={day}>{day}</span>
                  ))}
                </div>
                <div className="mini-calendar">
                  {calendarDays.map((item) => (
                    <button
                      key={item.dateKey}
                      className={`${item.muted ? "muted" : ""} ${item.active ? "active" : ""} ${item.marked ? "marked" : ""}`}
                      type="button"
                      aria-current={item.active ? "date" : undefined}
                      aria-label={`${item.day}${item.marked ? ", com reservas" : ""}`}
                      onClick={() => updateFilterDate(item.dateKey, true)}
                    >
                      {item.day}
                    </button>
                  ))}
                </div>
              </section>
            </aside>
          </section>
        </div>
      </main>

      <ReservationForm
        isOpen={isFormOpen}
        locations={locations}
        rooms={rooms}
        initialReservation={editingReservation}
        defaultDate={reservationFormDefaultDate}
        defaultResponsibleName={user?.name ?? "Usuario Teste"}
        onClose={closeForm}
        onSubmit={handleSubmitReservation}
      />

      <RoomForm
        isOpen={isRoomFormOpen}
        locations={locations}
        initialRoom={editingRoom}
        onClose={closeRoomForm}
        onSubmit={handleSubmitRoom}
      />

      <LocationForm
        isOpen={isLocationFormOpen}
        initialLocation={editingLocation}
        onClose={closeLocationForm}
        onSubmit={handleSubmitLocation}
      />

      <DeleteConfirmModal
        isOpen={Boolean(reservationToDelete)}
        itemLabel={reservationToDelete?.title ?? "esta reserva"}
        onCancel={() => setReservationToDelete(null)}
        onConfirm={() => void confirmSingleDelete()}
      />

      <ConfirmModal
        isOpen={isBulkDeleteOpen}
        title="Excluir reservas selecionadas"
        message={`Confirma a exclusao de ${selectedIds.length} reserva${selectedIds.length > 1 ? "s" : ""}?`}
        confirmLabel="Excluir selecionadas"
        onCancel={() => setIsBulkDeleteOpen(false)}
        onConfirm={() => void confirmBulkDelete()}
      />

      <ConfirmModal
        isOpen={Boolean(locationToDelete)}
        title="Excluir unidade"
        message={`Confirma a exclusao da unidade ${locationToDelete?.name ?? ""}?`}
        confirmLabel="Excluir unidade"
        onCancel={() => setLocationToDelete(null)}
        onConfirm={() => void confirmLocationDelete()}
      />
    </div>
  );
}
