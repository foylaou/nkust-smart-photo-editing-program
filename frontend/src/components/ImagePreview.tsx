import { useState } from 'react';
import type {ImageInfo} from '../types/electron';
import { Upload, Info } from 'lucide-react';

interface ImagePreviewProps {
  imageData: string | null;
  imageInfo: ImageInfo | null;
  onFileSelect: (file: File) => void;
  loading: boolean;
}

export default function ImagePreview({ imageData, imageInfo, onFileSelect, loading }: ImagePreviewProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));

    if (imageFile) {
      onFileSelect(imageFile);
    }
  };

  const handleClick = async () => {
    // 使用 Electron dialog 而非 HTML input
    const result = await window.electron.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: '圖片文件', extensions: ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'] }
      ]
    });

    if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
      const filePath = result.filePaths[0];
      // 創建一個假的 File 對象，但包含真實路徑
      const fakeFile = { path: filePath } as any;
      onFileSelect(fakeFile);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#2b2d31] rounded-lg overflow-hidden">
      <div className="p-4 border-b border-[#1e1f22]">
        <h2 className="text-lg font-semibold text-white">圖片預覽</h2>
      </div>

      <div
        className={`flex-1 flex items-center justify-center p-4 relative ${
          isDragging ? 'bg-[#3d4046]' : ''
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {loading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-[#5865f2] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-400">處理中...</p>
          </div>
        ) : imageData ? (
          <div className="flex flex-col items-center gap-4 w-full h-full">
            <div className="flex-1 flex items-center justify-center overflow-auto w-full">
              <img
                src={`data:image/${imageInfo?.format?.toLowerCase() || 'png'};base64,${imageData}`}
                alt="Preview"
                className="max-w-full max-h-full object-contain"
                onError={(e) => {
                  console.error('Image load error:', e);
                  console.log('Image format:', imageInfo?.format);
                  console.log('Base64 length:', imageData.length);
                  console.log('Base64 preview:', imageData.substring(0, 100));
                }}
              />
            </div>

            {imageInfo && (
              <div className="flex gap-4 text-sm text-gray-400 bg-[#1e1f22] px-4 py-2 rounded">
                <span className="flex items-center gap-2">
                  <Info size={16} />
                  {imageInfo.width} x {imageInfo.height}
                </span>
                <span>{imageInfo.mode}</span>
                <span>{imageInfo.format}</span>
              </div>
            )}
          </div>
        ) : (
          <div
            className="flex flex-col items-center gap-4 cursor-pointer text-gray-400 hover:text-gray-300 transition-colors"
            onClick={handleClick}
          >
            <Upload size={64} strokeWidth={1.5} />
            <div className="text-center">
              <p className="text-lg font-medium">拖放圖片到這里</p>
              <p className="text-sm">或點擊選擇文件</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
