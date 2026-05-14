import { CalendarDays, Clock, Coffee, MapPin, Pencil, Trash2 } from "lucide-react";
import type { Reservation } from "../../../shared/types/api";

const appTimeZone = "America/Sao_Paulo";

interface ReservationCardProps {
  reservation: Reservation;
  selected: boolean;
  onToggleSelection: (id: string) => void;
  onDelete: (reservation: Reservation) => void;
  onEdit: (reservation: Reservation) => void;
}

function formatDay(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", timeZone: appTimeZone }).format(new Date(value));
}

function formatMonth(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: appTimeZone }).format(new Date(value)).replace(".", "");
}

function formatTimeRange(start: string, end: string) {
  const formatter = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: appTimeZone });
  return `${formatter.format(new Date(start))} - ${formatter.format(new Date(end))}`;
}

export function ReservationCard({
  reservation,
  selected,
  onToggleSelection,
  onDelete,
  onEdit,
}: ReservationCardProps) {
  const statusLabel = reservation.status === "confirmed" ? "Confirmada" : "Pendente";

  return (
    <article className="reservation-card">
      <label className="row-checkbox" aria-label={`Selecionar ${reservation.title}`}>
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelection(reservation.id)}
        />
      </label>

      <div className="reservation-date">
        <span>{formatMonth(reservation.startTime)}</span>
        <strong>{formatDay(reservation.startTime)}</strong>
      </div>

      <div className="reservation-main">
        <h4>{reservation.title}</h4>
        <p>
          <Clock size={14} />
          <span>{formatTimeRange(reservation.startTime, reservation.endTime)}</span>
          <span className="dot" />
          <MapPin size={14} />
          <span>{reservation.roomName}</span>
          {reservation.coffeeService && (
            <span className="coffee-badge" title="Cafe solicitado" aria-label="Cafe solicitado">
              <Coffee size={14} />
            </span>
          )}
        </p>
        <small>{reservation.locationName} - Responsavel: {reservation.responsibleName}</small>
        {reservation.description && <span className="reservation-description">{reservation.description}</span>}
      </div>

      <div className="reservation-actions">
        <span className={`status-pill ${reservation.status}`}>{statusLabel}</span>
        <button className="icon-button" type="button" onClick={() => onEdit(reservation)} aria-label="Editar reserva">
          <Pencil size={17} />
        </button>
        <button className="icon-button danger-icon" type="button" onClick={() => onDelete(reservation)} aria-label="Excluir reserva">
          <Trash2 size={17} />
        </button>
      </div>
    </article>
  );
}
