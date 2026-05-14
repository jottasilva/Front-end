import { FormEvent, useEffect, useState } from "react";
import { Building2, X } from "lucide-react";
import { useToast } from "../../../shared/contexts/ToastContext";
import type { Location, Room, RoomPayload } from "../../../shared/types/api";

interface RoomFormProps {
  isOpen: boolean;
  locations: Location[];
  initialRoom: Room | null;
  onClose: () => void;
  onSubmit: (payload: RoomPayload) => Promise<void>;
}

const defaultImageUrl = "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=640&q=80";

export function RoomForm({ isOpen, locations, initialRoom, onClose, onSubmit }: RoomFormProps) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [locationId, setLocationId] = useState("");
  const [capacity, setCapacity] = useState(8);
  const [imageUrl, setImageUrl] = useState(defaultImageUrl);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setName(initialRoom?.name ?? "");
    setLocationId(initialRoom?.locationId ?? locations[0]?.id ?? "");
    setCapacity(initialRoom?.capacity ?? 8);
    setImageUrl(initialRoom?.imageUrl || defaultImageUrl);
  }, [initialRoom, isOpen, locations]);

  if (!isOpen) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name || !locationId || capacity < 1 || !imageUrl) {
      toast.warning("Campos obrigatorios", "Preencha nome, local, capacidade e imagem da sala.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({ name, locationId, capacity, imageUrl });
      toast.success(initialRoom ? "Sala atualizada" : "Sala adicionada", "Os dados da sala foram salvos.");
      onClose();
    } catch (submitError) {
      toast.error("Sala nao salva", submitError instanceof Error ? submitError.message : "Nao foi possivel salvar a sala.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop reservation-form-backdrop" role="presentation">
      <section className="reservation-form-panel" role="dialog" aria-modal="true" aria-labelledby="room-form-title">
        <div className="panel-header">
          <div>
            <span className="section-eyebrow">Sala</span>
            <h2 id="room-form-title">{initialRoom ? "Editar sala" : "Adicionar sala"}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Fechar formulario de sala">
            <X size={20} />
          </button>
        </div>

        <form className="reservation-form" onSubmit={handleSubmit}>
          <label>
            Nome da sala
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Sala Executiva" />
          </label>

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
            Capacidade
            <input type="number" min={1} value={capacity} onChange={(event) => setCapacity(Number(event.target.value))} />
          </label>

          <label>
            URL da imagem
            <input value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder={defaultImageUrl} />
          </label>

          <div className="panel-actions">
            <button className="secondary-button" type="button" onClick={onClose}>
              Cancelar
            </button>
            <button className="primary-button" type="submit" disabled={isSubmitting}>
              <Building2 size={18} />
              {isSubmitting ? "Salvando..." : "Salvar sala"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
