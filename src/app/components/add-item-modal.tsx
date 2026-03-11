import { X } from 'lucide-react';

interface AddItemModalProps {
  itemName: string;
  onAdd: () => void;
  onModify: () => void;
  onClose: () => void;
}

export function AddItemModal({ itemName, onAdd, onModify, onClose }: AddItemModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">{itemName}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <button
            onClick={onAdd}
            className="w-full bg-gray-900 text-white py-4 rounded-xl font-medium hover:bg-gray-800 transition-colors"
          >
            Add
          </button>
          <button
            onClick={onModify}
            className="w-full border-2 border-gray-900 text-gray-900 py-4 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            Modify, then Add
          </button>
        </div>
      </div>
    </div>
  );
}
