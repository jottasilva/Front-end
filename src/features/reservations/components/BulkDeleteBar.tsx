import { Trash2, X } from "lucide-react";

interface BulkDeleteBarProps {
  selectedCount: number;
  onClear: () => void;
  onDelete: () => void;
}

export function BulkDeleteBar({ selectedCount, onClear, onDelete }: BulkDeleteBarProps) {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="bulk-delete-bar">
      <strong>{selectedCount} selecionada{selectedCount > 1 ? "s" : ""}</strong>
      <div>
        <button className="ghost-button" type="button" onClick={onClear}>
          <X size={16} />
          Limpar
        </button>
        <button className="danger-button compact" type="button" onClick={onDelete}>
          <Trash2 size={16} />
          Excluir em lote
        </button>
      </div>
    </div>
  );
}
