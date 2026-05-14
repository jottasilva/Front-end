import { AlertTriangle, X } from "lucide-react";

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel: string;
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmModal({
  title,
  message,
  confirmLabel,
  isOpen,
  onCancel,
  onConfirm,
}: ConfirmModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <button className="icon-button modal-close" type="button" onClick={onCancel} aria-label="Fechar">
          <X size={18} />
        </button>
        <div className="modal-icon">
          <AlertTriangle size={22} />
        </div>
        <h2 id="confirm-title">{title}</h2>
        <p>{message}</p>
        <div className="modal-actions">
          <button className="secondary-button" type="button" onClick={onCancel}>
            Cancelar
          </button>
          <button className="danger-button" type="button" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
