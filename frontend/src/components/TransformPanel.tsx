import { useState } from 'react';
import { RotateCw, FlipHorizontal, FlipVertical, Crop, Maximize } from 'lucide-react';

interface TransformPanelProps {
  onRotate: (angle: number) => void;
  onFlip: (direction: 'horizontal' | 'vertical') => void;
  onResize: (width: number, height: number, keepAspect: boolean) => void;
  onCropCenter: (width: number, height: number) => void;
  hasImage: boolean;
}

export default function TransformPanel({
  onRotate,
  onFlip,
  onResize,
  onCropCenter,
  hasImage
}: TransformPanelProps) {
  const [angle, setAngle] = useState(90);
  const [resizeWidth, setResizeWidth] = useState(800);
  const [resizeHeight, setResizeHeight] = useState(600);
  const [keepAspect, setKeepAspect] = useState(true);
  const [cropWidth, setCropWidth] = useState(500);
  const [cropHeight, setCropHeight] = useState(500);

  return (
    <div className="p-4 space-y-6">
      <h3 className="text-sm font-semibold text-gray-300">基本變換</h3>

      <div className="space-y-5">
        {/* 旋轉 */}
        <div className="space-y-2">
          <label className="text-xs text-gray-400">旋轉角度: {angle}°</label>
          <input
            type="range"
            min="0"
            max="360"
            step="15"
            value={angle}
            onChange={(e) => setAngle(Number(e.target.value))}
            disabled={!hasImage}
            className="w-full h-2 bg-[#1e1f22] rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: hasImage
                ? `linear-gradient(to right, #5865f2 0%, #5865f2 ${(angle/360)*100}%, #1e1f22 ${(angle/360)*100}%, #1e1f22 100%)`
                : '#1e1f22'
            }}
          />
          <div className="flex gap-2">
            <input
              type="number"
              value={angle}
              onChange={(e) => setAngle(Number(e.target.value))}
              min="0"
              max="360"
              className="w-20 px-3 py-1.5 bg-[#1e1f22] text-white rounded text-sm text-center"
              disabled={!hasImage}
            />
            <button
              onClick={() => onRotate(angle)}
              disabled={!hasImage}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#3d4046] hover:bg-[#4a4d54] disabled:bg-[#2b2d31] disabled:text-gray-600 text-white rounded text-sm transition-colors"
            >
              <RotateCw size={16} />
              <span>旋轉</span>
            </button>
          </div>
        </div>

        {/* 翻轉 */}
        <div className="space-y-2">
          <label className="text-xs text-gray-400">翻轉</label>
          <div className="flex gap-2">
            <button
              onClick={() => onFlip('horizontal')}
              disabled={!hasImage}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[#3d4046] hover:bg-[#4a4d54] disabled:bg-[#2b2d31] disabled:text-gray-600 text-white rounded text-sm transition-colors"
            >
              <FlipHorizontal size={16} />
              <span>水平</span>
            </button>
            <button
              onClick={() => onFlip('vertical')}
              disabled={!hasImage}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[#3d4046] hover:bg-[#4a4d54] disabled:bg-[#2b2d31] disabled:text-gray-600 text-white rounded text-sm transition-colors"
            >
              <FlipVertical size={16} />
              <span>垂直</span>
            </button>
          </div>
        </div>

        {/* 調整尺寸 */}
        <div className="space-y-3">
          <label className="text-xs text-gray-400">調整尺寸</label>

          {/* 寬度 */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">寬度</span>
              <span className="text-xs text-gray-400">{resizeWidth} px</span>
            </div>
            <input
              type="range"
              min="100"
              max="4000"
              step="50"
              value={resizeWidth}
              onChange={(e) => setResizeWidth(Number(e.target.value))}
              disabled={!hasImage}
              className="w-full h-2 bg-[#1e1f22] rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: hasImage
                  ? `linear-gradient(to right, #5865f2 0%, #5865f2 ${((resizeWidth-100)/3900)*100}%, #1e1f22 ${((resizeWidth-100)/3900)*100}%, #1e1f22 100%)`
                  : '#1e1f22'
              }}
            />
            <input
              type="number"
              value={resizeWidth}
              onChange={(e) => setResizeWidth(Number(e.target.value))}
              min="100"
              max="4000"
              className="w-full px-3 py-1.5 bg-[#1e1f22] text-white rounded text-sm text-center"
              disabled={!hasImage}
            />
          </div>

          {/* 高度 */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">高度</span>
              <span className="text-xs text-gray-400">{resizeHeight} px</span>
            </div>
            <input
              type="range"
              min="100"
              max="4000"
              step="50"
              value={resizeHeight}
              onChange={(e) => setResizeHeight(Number(e.target.value))}
              disabled={!hasImage}
              className="w-full h-2 bg-[#1e1f22] rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: hasImage
                  ? `linear-gradient(to right, #5865f2 0%, #5865f2 ${((resizeHeight-100)/3900)*100}%, #1e1f22 ${((resizeHeight-100)/3900)*100}%, #1e1f22 100%)`
                  : '#1e1f22'
              }}
            />
            <input
              type="number"
              value={resizeHeight}
              onChange={(e) => setResizeHeight(Number(e.target.value))}
              min="100"
              max="4000"
              className="w-full px-3 py-1.5 bg-[#1e1f22] text-white rounded text-sm text-center"
              disabled={!hasImage}
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              checked={keepAspect}
              onChange={(e) => setKeepAspect(e.target.checked)}
              disabled={!hasImage}
              className="rounded cursor-pointer"
            />
            <span>保持比例</span>
          </label>

          <button
            onClick={() => onResize(resizeWidth, resizeHeight, keepAspect)}
            disabled={!hasImage}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-[#5865f2] hover:bg-[#4752c4] disabled:bg-[#2b2d31] disabled:text-gray-600 text-white rounded text-sm transition-colors"
          >
            <Maximize size={16} />
            <span>應用調整</span>
          </button>
        </div>

        {/* 中心裁切 */}
        <div className="space-y-3">
          <label className="text-xs text-gray-400">中心裁切</label>

          {/* 寬度 */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">寬度</span>
              <span className="text-xs text-gray-400">{cropWidth} px</span>
            </div>
            <input
              type="range"
              min="100"
              max="2000"
              step="50"
              value={cropWidth}
              onChange={(e) => setCropWidth(Number(e.target.value))}
              disabled={!hasImage}
              className="w-full h-2 bg-[#1e1f22] rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: hasImage
                  ? `linear-gradient(to right, #5865f2 0%, #5865f2 ${((cropWidth-100)/1900)*100}%, #1e1f22 ${((cropWidth-100)/1900)*100}%, #1e1f22 100%)`
                  : '#1e1f22'
              }}
            />
            <input
              type="number"
              value={cropWidth}
              onChange={(e) => setCropWidth(Number(e.target.value))}
              min="100"
              max="2000"
              className="w-full px-3 py-1.5 bg-[#1e1f22] text-white rounded text-sm text-center"
              disabled={!hasImage}
            />
          </div>

          {/* 高度 */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">高度</span>
              <span className="text-xs text-gray-400">{cropHeight} px</span>
            </div>
            <input
              type="range"
              min="100"
              max="2000"
              step="50"
              value={cropHeight}
              onChange={(e) => setCropHeight(Number(e.target.value))}
              disabled={!hasImage}
              className="w-full h-2 bg-[#1e1f22] rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: hasImage
                  ? `linear-gradient(to right, #5865f2 0%, #5865f2 ${((cropHeight-100)/1900)*100}%, #1e1f22 ${((cropHeight-100)/1900)*100}%, #1e1f22 100%)`
                  : '#1e1f22'
              }}
            />
            <input
              type="number"
              value={cropHeight}
              onChange={(e) => setCropHeight(Number(e.target.value))}
              min="100"
              max="2000"
              className="w-full px-3 py-1.5 bg-[#1e1f22] text-white rounded text-sm text-center"
              disabled={!hasImage}
            />
          </div>

          <button
            onClick={() => onCropCenter(cropWidth, cropHeight)}
            disabled={!hasImage}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-[#5865f2] hover:bg-[#4752c4] disabled:bg-[#2b2d31] disabled:text-gray-600 text-white rounded text-sm transition-colors"
          >
            <Crop size={16} />
            <span>應用裁切</span>
          </button>
        </div>
      </div>
    </div>
  );
}
