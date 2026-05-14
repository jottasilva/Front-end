import { FormEvent, useEffect, useState } from "react";
import { Building2, X } from "lucide-react";
import { useToast } from "../../../shared/contexts/ToastContext";
import type { Location, LocationPayload } from "../../../shared/types/api";

interface LocationFormProps {
  isOpen: boolean;
  initialLocation: Location | null;
  onClose: () => void;
  onSubmit: (payload: LocationPayload) => Promise<void>;
}

export function LocationForm({ isOpen, initialLocation, onClose, onSubmit }: LocationFormProps) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setName(initialLocation?.name ?? "");
    setAddress(initialLocation?.address ?? "");
  }, [initialLocation, isOpen]);

  if (!isOpen) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim() || !address.trim()) {
      toast.warning("Campos obrigatorios", "Preencha nome e endereco da unidade.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), address: address.trim() });
      toast.success(initialLocation ? "Unidade atualizada" : "Unidade adicionada", "Os dados da unidade foram salvos.");
      onClose();
    } catch (submitError) {
      toast.error("Unidade nao salva", submitError instanceof Error ? submitError.message : "Nao foi possivel salvar a unidade.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop reservation-form-backdrop" role="presentation">
      <section className="reservation-form-panel" role="dialog" aria-modal="true" aria-labelledby="location-form-title">
        <div className="panel-header">
          <div>
            <span className="section-eyebrow">Unidade / Filial</span>
            <h2 id="location-form-title">{initialLocation ? "Editar unidade" : "Adicionar unidade"}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Fechar formulario de unidade">
            <X size={20} />
          </button>
        </div>

        <form className="reservation-form" onSubmit={handleSubmit}>
          <label>
            Nome da unidade
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Filial Pinheiros" />
          </label>

          <label>
            Endereco
            <input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Rua dos Pinheiros, 540" />
          </label>

          <div className="panel-actions">
            <button className="secondary-button" type="button" onClick={onClose}>
              Cancelar
            </button>
            <button className="primary-button" type="submit" disabled={isSubmitting}>
              <Building2 size={18} />
              {isSubmitting ? "Salvando..." : "Salvar unidade"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
