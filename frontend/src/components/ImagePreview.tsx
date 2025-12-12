import { useState, useRef, useEffect } from 'react';
import type {ImageInfo} from '../types/electron';
import { Upload, Info, Scissors, X, Check } from 'lucide-react';

interface ImagePreviewProps {
  imageData: string | null;
  imageInfo: ImageInfo | null;
  onFileSelect: (file: File) => void;
  loading: boolean;
  cropMode: boolean;
  onCropCancel: () => void;
  onCropConfirm: (left: number, top: number, right: number, bottom: number) => void;
}

export default function ImagePreview({
  imageData,
  imageInfo,
  onFileSelect,
  loading,
  cropMode,
  onCropCancel,
  onCropConfirm
}: ImagePreviewProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [cropStart, setCropStart] = useState<{ x: number; y: number } | null>(null);
  const [cropEnd, setCropEnd] = useState<{ x: number; y: number } | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // 裁切模式：重置裁切框
  useEffect(() => {
    if (!cropMode) {
      setCropStart(null);
      setCropEnd(null);
      setIsDrawing(false);
    }
  }, [cropMode]);

  // 裁切：開始繪製
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cropMode || !imageRef.current || !containerRef.current) return;

    const imgRect = imageRef.current.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();

    const x = e.clientX - imgRect.left;
    const y = e.clientY - imgRect.top;

    // 只在圖片區域內開始裁切
    if (x >= 0 && x <= imgRect.width && y >= 0 && y <= imgRect.height) {
      setCropStart({ x, y });
      setCropEnd({ x, y });
      setIsDrawing(true);
    }
  };

  // 裁切：繪製中
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cropMode || !isDrawing || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

    setCropEnd({ x, y });
  };

  // 裁切：結束繪製
  const handleMouseUp = () => {
    if (!cropMode) return;
    setIsDrawing(false);
  };

  // 確認裁切
  const handleCropConfirm = () => {
    if (!cropStart || !cropEnd || !imageRef.current || !imageInfo) return;

    const img = imageRef.current;
    const rect = img.getBoundingClientRect();

    // 計算實際圖片尺寸與顯示尺寸的比例
    const scaleX = imageInfo.width / rect.width;
    const scaleY = imageInfo.height / rect.height;

    // 轉換為實際像素座標
    const left = Math.round(Math.min(cropStart.x, cropEnd.x) * scaleX);
    const top = Math.round(Math.min(cropStart.y, cropEnd.y) * scaleY);
    const right = Math.round(Math.max(cropStart.x, cropEnd.x) * scaleX);
    const bottom = Math.round(Math.max(cropStart.y, cropEnd.y) * scaleY);

    // 確保裁切區域有效
    if (right - left > 10 && bottom - top > 10) {
      onCropConfirm(left, top, right, bottom);
    }
  };

  // 計算裁切框樣式
  const getCropBoxStyle = () => {
    if (!cropStart || !cropEnd) return {};

    const left = Math.min(cropStart.x, cropEnd.x);
    const top = Math.min(cropStart.y, cropEnd.y);
    const width = Math.abs(cropEnd.x - cropStart.x);
    const height = Math.abs(cropEnd.y - cropStart.y);

    return {
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`,
    };
  };

  return (
    <div className="flex-1 flex flex-col bg-[#2b2d31] rounded-lg overflow-hidden">
      <div className="p-4 border-b border-[#1e1f22] flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">圖片預覽</h2>
        {cropMode && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-sm text-[#5865f2]">
              <Scissors size={16} />
              <span>裁切模式</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onCropCancel}
                className="px-3 py-1 bg-[#3d4046] hover:bg-[#4a4d54] text-white rounded text-sm flex items-center gap-1 transition-colors"
              >
                <X size={16} />
                取消
              </button>
              <button
                onClick={handleCropConfirm}
                disabled={!cropStart || !cropEnd}
                className="px-3 py-1 bg-[#5865f2] hover:bg-[#4752c4] disabled:bg-[#2b2d31] disabled:text-gray-600 text-white rounded text-sm flex items-center gap-1 transition-colors"
              >
                <Check size={16} />
                確認裁切
              </button>
            </div>
          </div>
        )}
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
            <div
              ref={containerRef}
              className="flex-1 flex items-center justify-center overflow-auto w-full relative"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{ cursor: cropMode ? 'crosshair' : 'default' }}
            >
              <img
                ref={imageRef}
                src={`data:image/${imageInfo?.format?.toLowerCase() || 'png'};base64,${imageData}`}
                alt="Preview"
                className="max-w-full max-h-full object-contain"
                style={{ userSelect: 'none', pointerEvents: cropMode ? 'none' : 'auto' }}
                onError={(e) => {
                  console.error('Image load error:', e);
                  console.log('Image format:', imageInfo?.format);
                  console.log('Base64 length:', imageData.length);
                  console.log('Base64 preview:', imageData.substring(0, 100));
                }}
              />

              {/* 裁切框覆蓋層 */}
              {cropMode && cropStart && cropEnd && imageRef.current && (
                <div
                  className="absolute pointer-events-none"
                  style={{
                    left: imageRef.current.getBoundingClientRect().left - containerRef.current!.getBoundingClientRect().left,
                    top: imageRef.current.getBoundingClientRect().top - containerRef.current!.getBoundingClientRect().top,
                    width: imageRef.current.getBoundingClientRect().width,
                    height: imageRef.current.getBoundingClientRect().height,
                  }}
                >
                  {/* 裁切框：使用 box-shadow 遮住外部區域 */}
                  <div
                    className="absolute border-2 border-[#5865f2]"
                    style={{
                      ...getCropBoxStyle(),
                      boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                    }}
                  >
                    {/* 裁切框尺寸提示 */}
                    <div className="absolute -top-6 left-0 bg-[#5865f2] text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      {Math.abs(Math.round((cropEnd.x - cropStart.x) * (imageInfo?.width || 1) / (imageRef.current?.getBoundingClientRect().width || 1)))} x{' '}
                      {Math.abs(Math.round((cropEnd.y - cropStart.y) * (imageInfo?.height || 1) / (imageRef.current?.getBoundingClientRect().height || 1)))} px
                    </div>

                    {/* 裁切框角落控制點 */}
                    <div className="absolute -top-1 -left-1 w-3 h-3 bg-white border-2 border-[#5865f2] rounded-full"></div>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-white border-2 border-[#5865f2] rounded-full"></div>
                    <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-white border-2 border-[#5865f2] rounded-full"></div>
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border-2 border-[#5865f2] rounded-full"></div>

                    {/* 裁切框中間控制點 */}
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white border border-[#5865f2] rounded-full"></div>
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white border border-[#5865f2] rounded-full"></div>
                    <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-white border border-[#5865f2] rounded-full"></div>
                    <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-white border border-[#5865f2] rounded-full"></div>
                  </div>
                </div>
              )}
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
