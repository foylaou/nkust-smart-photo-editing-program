import { useState } from 'react';
import { Zap, Sparkles, Grid, Focus, Frame } from 'lucide-react';

interface EffectsPanelProps {
  onBlur: (radius: number, type: 'gaussian' | 'box') => void;
  onSharpen: (factor: number) => void;
  onEdgeDetect: () => void;
  onEmboss: () => void;
  onPixelate: (pixelSize: number) => void;
  onVignette: (strength: number) => void;
  onArtEffect: (type: 'poster' | 'sketch' | 'oil_paint' | 'cartoon') => void;
  onAddBorder: (width: number) => void;
  hasImage: boolean;
}

export default function EffectsPanel({
  onBlur,
  onSharpen,
  onEdgeDetect,
  onEmboss,
  onPixelate,
  onVignette,
  onArtEffect,
  onAddBorder,
  hasImage
}: EffectsPanelProps) {
  const [blurRadius, setBlurRadius] = useState(2);
  const [blurType, setBlurType] = useState<'gaussian' | 'box'>('gaussian');
  const [sharpenFactor, setSharpenFactor] = useState(1.0);
  const [pixelSize, setPixelSize] = useState(10);
  const [vignetteStrength, setVignetteStrength] = useState(0.5);
  const [borderWidth, setBorderWidth] = useState(10);

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-sm font-semibold text-gray-300">濾鏡效果</h3>

      <div className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-400 flex items-center gap-1.5">
              <Focus size={14} />
              <span>模糊</span>
            </label>
            <span className="text-xs text-gray-500">{blurRadius}</span>
          </div>
          <input
            type="range"
            min="1"
            max="20"
            step="1"
            value={blurRadius}
            onChange={(e) => setBlurRadius(Number(e.target.value))}
            disabled={!hasImage}
            className="w-full"
          />
          <select
            value={blurType}
            onChange={(e) => setBlurType(e.target.value as 'gaussian' | 'box')}
            disabled={!hasImage}
            className="w-full px-3 py-1.5 bg-[#1e1f22] text-white rounded text-sm"
          >
            <option value="gaussian">高斯模糊</option>
            <option value="box">方框模糊</option>
          </select>
          <button
            onClick={() => onBlur(blurRadius, blurType)}
            disabled={!hasImage}
            className="w-full px-3 py-1.5 bg-[#3d4046] hover:bg-[#4a4d54] disabled:bg-[#2b2d31] disabled:text-gray-600 text-white rounded text-sm transition-colors"
          >
            應用模糊
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-400 flex items-center gap-1.5">
              <Zap size={14} />
              <span>銳化</span>
            </label>
            <span className="text-xs text-gray-500">{sharpenFactor.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="3"
            step="0.1"
            value={sharpenFactor}
            onChange={(e) => setSharpenFactor(Number(e.target.value))}
            disabled={!hasImage}
            className="w-full"
          />
          <button
            onClick={() => onSharpen(sharpenFactor)}
            disabled={!hasImage}
            className="w-full px-3 py-1.5 bg-[#3d4046] hover:bg-[#4a4d54] disabled:bg-[#2b2d31] disabled:text-gray-600 text-white rounded text-sm transition-colors"
          >
            應用銳化
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-400 flex items-center gap-1.5">
              <Grid size={14} />
              <span>馬賽克</span>
            </label>
            <span className="text-xs text-gray-500">{pixelSize}px</span>
          </div>
          <input
            type="range"
            min="2"
            max="50"
            step="1"
            value={pixelSize}
            onChange={(e) => setPixelSize(Number(e.target.value))}
            disabled={!hasImage}
            className="w-full"
          />
          <button
            onClick={() => onPixelate(pixelSize)}
            disabled={!hasImage}
            className="w-full px-3 py-1.5 bg-[#3d4046] hover:bg-[#4a4d54] disabled:bg-[#2b2d31] disabled:text-gray-600 text-white rounded text-sm transition-colors"
          >
            應用馬賽克
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-400 flex items-center gap-1.5">
              <Sparkles size={14} />
              <span>暈影</span>
            </label>
            <span className="text-xs text-gray-500">{vignetteStrength.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={vignetteStrength}
            onChange={(e) => setVignetteStrength(Number(e.target.value))}
            disabled={!hasImage}
            className="w-full"
          />
          <button
            onClick={() => onVignette(vignetteStrength)}
            disabled={!hasImage}
            className="w-full px-3 py-1.5 bg-[#3d4046] hover:bg-[#4a4d54] disabled:bg-[#2b2d31] disabled:text-gray-600 text-white rounded text-sm transition-colors"
          >
            應用暈影
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-gray-400">邊緣檢測</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onEdgeDetect}
              disabled={!hasImage}
              className="px-3 py-1.5 bg-[#3d4046] hover:bg-[#4a4d54] disabled:bg-[#2b2d31] disabled:text-gray-600 text-white rounded text-sm transition-colors"
            >
              邊緣偵測
            </button>
            <button
              onClick={onEmboss}
              disabled={!hasImage}
              className="px-3 py-1.5 bg-[#3d4046] hover:bg-[#4a4d54] disabled:bg-[#2b2d31] disabled:text-gray-600 text-white rounded text-sm transition-colors"
            >
              浮雕
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-gray-400">藝術效果</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onArtEffect('poster')}
              disabled={!hasImage}
              className="px-3 py-1.5 bg-[#3d4046] hover:bg-[#4a4d54] disabled:bg-[#2b2d31] disabled:text-gray-600 text-white rounded text-sm transition-colors"
            >
              海報風
            </button>
            <button
              onClick={() => onArtEffect('sketch')}
              disabled={!hasImage}
              className="px-3 py-1.5 bg-[#3d4046] hover:bg-[#4a4d54] disabled:bg-[#2b2d31] disabled:text-gray-600 text-white rounded text-sm transition-colors"
            >
              素描
            </button>
            <button
              onClick={() => onArtEffect('oil_paint')}
              disabled={!hasImage}
              className="px-3 py-1.5 bg-[#3d4046] hover:bg-[#4a4d54] disabled:bg-[#2b2d31] disabled:text-gray-600 text-white rounded text-sm transition-colors"
            >
              油畫
            </button>
            <button
              onClick={() => onArtEffect('cartoon')}
              disabled={!hasImage}
              className="px-3 py-1.5 bg-[#3d4046] hover:bg-[#4a4d54] disabled:bg-[#2b2d31] disabled:text-gray-600 text-white rounded text-sm transition-colors"
            >
              卡通
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-400 flex items-center gap-1.5">
              <Frame size={14} />
              <span>邊框</span>
            </label>
            <span className="text-xs text-gray-500">{borderWidth}px</span>
          </div>
          <input
            type="range"
            min="1"
            max="50"
            step="1"
            value={borderWidth}
            onChange={(e) => setBorderWidth(Number(e.target.value))}
            disabled={!hasImage}
            className="w-full"
          />
          <button
            onClick={() => onAddBorder(borderWidth)}
            disabled={!hasImage}
            className="w-full px-3 py-1.5 bg-[#3d4046] hover:bg-[#4a4d54] disabled:bg-[#2b2d31] disabled:text-gray-600 text-white rounded text-sm transition-colors"
          >
            添加邊框
          </button>
        </div>
      </div>
    </div>
  );
}
