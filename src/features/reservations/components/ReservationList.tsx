import type { Reservation } from "../../../shared/types/api";
import { ReservationCard } from "./ReservationCard";

interface ReservationListProps {
  reservations: Reservation[];
  selectedIds: string[];
  onToggleSelection: (id: string) => void;
  onDelete: (reservation: Reservation) => void;
  onEdit: (reservation: Reservation) => void;
}

export function ReservationList({
  reservations,
  selectedIds,
  onToggleSelection,
  onDelete,
  onEdit,
}: ReservationListProps) {
  if (reservations.length === 0) {
    return <p className="empty-state">Nenhuma reserva encontrada para os filtros atuais.</p>;
  }

  return (
    <div className="reservation-list">
      {reservations.map((reservation) => (
        <ReservationCard
          key={reservation.id}
          reservation={reservation}
          selected={selectedIds.includes(reservation.id)}
          onToggleSelection={onToggleSelection}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}
