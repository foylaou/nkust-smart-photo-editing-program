import { Save, RotateCcw, X } from 'lucide-react';

interface FileOperationsPanelProps {
  onSave: () => void;
  onReset: () => void;
  onClear: () => void;
  hasImage: boolean;
}

export default function FileOperationsPanel({ onSave, onReset, onClear, hasImage }: FileOperationsPanelProps) {
  return (
    <div className="p-4 space-y-3">
      <h3 className="text-sm font-semibold text-gray-300 mb-3">文件操作</h3>

      <button
        onClick={onSave}
        disabled={!hasImage}
        className="w-full flex items-center gap-2 px-4 py-2 bg-[#5865f2] hover:bg-[#4752c4] disabled:bg-[#2b2d31] disabled:text-gray-600 text-white rounded transition-colors"
      >
        <Save size={18} />
        <span>保存圖片</span>
      </button>

      <button
        onClick={onReset}
        disabled={!hasImage}
        className="w-full flex items-center gap-2 px-4 py-2 bg-[#3d4046] hover:bg-[#4a4d54] disabled:bg-[#2b2d31] disabled:text-gray-600 text-white rounded transition-colors"
      >
        <RotateCcw size={18} />
        <span>復原原圖</span>
      </button>

      <button
        onClick={onClear}
        disabled={!hasImage}
        className="w-full flex items-center gap-2 px-4 py-2 bg-[#ed4245] hover:bg-[#c03537] disabled:bg-[#2b2d31] disabled:text-gray-600 text-white rounded transition-colors"
      >
        <X size={18} />
        <span>清除圖片</span>
      </button>
    </div>
  );
}
