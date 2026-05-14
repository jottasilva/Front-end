import { FormEvent, useEffect, useMemo, useState } from "react";
import { CalendarPlus, X } from "lucide-react";
import { useToast } from "../../../shared/contexts/ToastContext";
import type { Location, Reservation, ReservationPayload, Room } from "../../../shared/types/api";

interface ReservationFormProps {
  isOpen: boolean;
  locations: Location[];
  rooms: Room[];
  initialReservation: Reservation | null;
  defaultDate?: string;
  defaultResponsibleName: string;
  onClose: () => void;
  onSubmit: (payload: ReservationPayload) => Promise<void>;
}

function padDatePart(value: number) {
  return String(value).padStart(2, "0");
}

function toDateInput(value?: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const year = date.getFullYear();
  const month = padDatePart(date.getMonth() + 1);
  const day = padDatePart(date.getDate());
  return `${year}-${month}-${day}`;
}

function toTimeInput(value?: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const hours = padDatePart(date.getHours());
  const minutes = padDatePart(date.getMinutes());
  return `${hours}:${minutes}`;
}

export function ReservationForm({
  isOpen,
  locations,
  rooms,
  initialReservation,
  defaultDate,
  defaultResponsibleName,
  onClose,
  onSubmit,
}: ReservationFormProps) {
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [locationId, setLocationId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [responsibleName, setResponsibleName] = useState("");
  const [description, setDescription] = useState("");
  const [coffeeService, setCoffeeService] = useState(false);
  const [attendeesCount, setAttendeesCount] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredRooms = useMemo(
    () => rooms.filter((room) => !locationId || room.locationId === locationId),
    [locationId, rooms],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setTitle(initialReservation?.title ?? "");
    setLocationId(initialReservation?.locationId ?? "");
    setRoomId(initialReservation?.roomId ?? "");
    setDate(initialReservation ? toDateInput(initialReservation.startTime) : defaultDate ?? "");
    setStartTime(toTimeInput(initialReservation?.startTime));
    setEndTime(toTimeInput(initialReservation?.endTime));
    setResponsibleName(initialReservation?.responsibleName ?? defaultResponsibleName);
    setDescription(initialReservation?.description ?? "");
    setCoffeeService(initialReservation?.coffeeService ?? false);
    setAttendeesCount(initialReservation?.attendeesCount ?? 1);
  }, [defaultDate, defaultResponsibleName, initialReservation, isOpen]);

  useEffect(() => {
    if (locationId && roomId && !filteredRooms.some((room) => room.id === roomId)) {
      setRoomId("");
    }
  }, [filteredRooms, locationId, roomId]);

  if (!isOpen) {
    return null;
  }

  const minimumDate = toDateInput(new Date().toISOString());

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title || !locationId || !roomId || !date || !startTime || !endTime || !responsibleName) {
      toast.warning("Campos obrigatorios", "Preencha os campos obrigatorios antes de salvar.");
      return;
    }

    const startDate = new Date(`${date}T${startTime}:00`);
    const endDate = new Date(`${date}T${endTime}:00`);

    if (startDate <= new Date()) {
      toast.warning("Data invalida", "A reserva deve iniciar em uma data e horario futuros.");
      return;
    }

    if (endDate <= startDate) {
      toast.warning("Horario invalido", "O horario de fim deve ser maior que o horario de inicio.");
      return;
    }

    if (coffeeService && attendeesCount < 1) {
      toast.warning("Cafe solicitado", "Informe a quantidade de pessoas para o cafe.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        roomId,
        responsibleName,
        title,
        description,
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        coffeeService,
        attendeesCount,
      });
      toast.success(initialReservation ? "Reserva atualizada" : "Reserva criada", "Os dados da reserva foram salvos com sucesso.");
      onClose();
    } catch (submitError) {
      toast.error("Reserva nao salva", submitError instanceof Error ? submitError.message : "Nao foi possivel salvar a reserva.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop reservation-form-backdrop" role="presentation">
      <section className="reservation-form-panel" role="dialog" aria-modal="true" aria-labelledby="reservation-form-title">
        <div className="panel-header">
          <div>
            <span className="section-eyebrow">Reserva</span>
            <h2 id="reservation-form-title">{initialReservation ? "Editar reserva" : "Nova reserva"}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Fechar formulario">
            <X size={20} />
          </button>
        </div>

        <form className="reservation-form" onSubmit={handleSubmit}>
          <label>
            Titulo
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Reuniao de Planejamento" />
          </label>

          <div className="form-grid">
            <label>
              Local / Filial
              <select value={locationId} onChange={(event) => setLocationId(event.target.value)}>
                <option value="">Selecione</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Sala
              <select value={roomId} onChange={(event) => setRoomId(event.target.value)}>
                <option value="">Selecione</option>
                {filteredRooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name} ({room.capacity} pessoas)
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="form-grid three">
            <label>
              Data
              <input type="date" min={minimumDate} value={date} onChange={(event) => setDate(event.target.value)} />
            </label>
            <label>
              Inicio
              <input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} />
            </label>
            <label>
              Fim
              <input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} />
            </label>
          </div>

          <label>
            Responsavel
            <input
              value={responsibleName}
              onChange={(event) => setResponsibleName(event.target.value)}
              placeholder="Usuário Teste"
            />
          </label>

          <label>
            Descricao
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Assuntos, observacoes e contexto da reuniao"
              rows={3}
            />
          </label>

          <div className="coffee-row">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={coffeeService}
                onChange={(event) => setCoffeeService(event.target.checked)}
              />
              Solicitar cafe
            </label>
            <label>
              Quantidade de pessoas
              <input
                type="number"
                min={1}
                disabled={!coffeeService}
                value={attendeesCount}
                onChange={(event) => setAttendeesCount(Number(event.target.value))}
              />
            </label>
          </div>

          <div className="panel-actions">
            <button className="secondary-button" type="button" onClick={onClose}>
              Cancelar
            </button>
            <button className="primary-button" type="submit" disabled={isSubmitting}>
              <CalendarPlus size={18} />
              {isSubmitting ? "Salvando..." : "Salvar reserva"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
