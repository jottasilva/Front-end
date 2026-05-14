import { ConfirmModal } from "../../../shared/components/ConfirmModal";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  itemLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmModal({ isOpen, itemLabel, onCancel, onConfirm }: DeleteConfirmModalProps) {
  return (
    <ConfirmModal
      isOpen={isOpen}
      title="Excluir reserva"
      message={`Confirma a exclusao de ${itemLabel}? Essa acao nao pode ser desfeita.`}
      confirmLabel="Excluir"
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
