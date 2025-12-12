import { useState } from 'react';
import { Sun, Contrast, Droplet, Palette, Thermometer } from 'lucide-react';

interface ColorAdjustPanelProps {
  onBrightness: (factor: number) => void;
  onContrast: (factor: number) => void;
  onSaturation: (factor: number) => void;
  onHueShift: (degrees: number) => void;
  onColorTemp: (temperature: number) => void;
  onGrayscale: () => void;
  onInvert: () => void;
  onSepia: (intensity: number) => void;
  onAutoContrast: () => void;
  onEqualize: () => void;
  hasImage: boolean;
}

export default function ColorAdjustPanel({
  onBrightness,
  onContrast,
  onSaturation,
  onHueShift,
  onColorTemp,
  onGrayscale,
  onInvert,
  onSepia,
  onAutoContrast,
  onEqualize,
  hasImage
}: ColorAdjustPanelProps) {
  const [brightness, setBrightness] = useState(1.0);
  const [contrast, setContrast] = useState(1.0);
  const [saturation, setSaturation] = useState(1.0);
  const [hueShift, setHueShift] = useState(0);
  const [colorTemp, setColorTemp] = useState(6500);
  const [sepiaIntensity, setSepiaIntensity] = useState(1.0);

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-sm font-semibold text-gray-300">顏色調整</h3>

      <div className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-400 flex items-center gap-1.5">
              <Sun size={14} />
              <span>亮度</span>
            </label>
            <span className="text-xs text-gray-500">{brightness.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={brightness}
            onChange={(e) => setBrightness(Number(e.target.value))}
            disabled={!hasImage}
            className="w-full"
          />
          <button
            onClick={() => onBrightness(brightness)}
            disabled={!hasImage}
            className="w-full px-3 py-1.5 bg-[#3d4046] hover:bg-[#4a4d54] disabled:bg-[#2b2d31] disabled:text-gray-600 text-white rounded text-sm transition-colors"
          >
            應用
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-400 flex items-center gap-1.5">
              <Contrast size={14} />
              <span>對比度</span>
            </label>
            <span className="text-xs text-gray-500">{contrast.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={contrast}
            onChange={(e) => setContrast(Number(e.target.value))}
            disabled={!hasImage}
            className="w-full"
          />
          <button
            onClick={() => onContrast(contrast)}
            disabled={!hasImage}
            className="w-full px-3 py-1.5 bg-[#3d4046] hover:bg-[#4a4d54] disabled:bg-[#2b2d31] disabled:text-gray-600 text-white rounded text-sm transition-colors"
          >
            應用
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-400 flex items-center gap-1.5">
              <Droplet size={14} />
              <span>飽和度</span>
            </label>
            <span className="text-xs text-gray-500">{saturation.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={saturation}
            onChange={(e) => setSaturation(Number(e.target.value))}
            disabled={!hasImage}
            className="w-full"
          />
          <button
            onClick={() => onSaturation(saturation)}
            disabled={!hasImage}
            className="w-full px-3 py-1.5 bg-[#3d4046] hover:bg-[#4a4d54] disabled:bg-[#2b2d31] disabled:text-gray-600 text-white rounded text-sm transition-colors"
          >
            應用
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-400 flex items-center gap-1.5">
              <Palette size={14} />
              <span>色相偏移</span>
            </label>
            <span className="text-xs text-gray-500">{hueShift}°</span>
          </div>
          <input
            type="range"
            min="0"
            max="360"
            step="10"
            value={hueShift}
            onChange={(e) => setHueShift(Number(e.target.value))}
            disabled={!hasImage}
            className="w-full"
          />
          <button
            onClick={() => onHueShift(hueShift)}
            disabled={!hasImage}
            className="w-full px-3 py-1.5 bg-[#3d4046] hover:bg-[#4a4d54] disabled:bg-[#2b2d31] disabled:text-gray-600 text-white rounded text-sm transition-colors"
          >
            應用
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-400 flex items-center gap-1.5">
              <Thermometer size={14} />
              <span>色溫</span>
            </label>
            <span className="text-xs text-gray-500">{colorTemp}K</span>
          </div>
          <input
            type="range"
            min="2000"
            max="10000"
            step="100"
            value={colorTemp}
            onChange={(e) => setColorTemp(Number(e.target.value))}
            disabled={!hasImage}
            className="w-full"
          />
          <button
            onClick={() => onColorTemp(colorTemp)}
            disabled={!hasImage}
            className="w-full px-3 py-1.5 bg-[#3d4046] hover:bg-[#4a4d54] disabled:bg-[#2b2d31] disabled:text-gray-600 text-white rounded text-sm transition-colors"
          >
            應用
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-gray-400">特殊效果</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onGrayscale}
              disabled={!hasImage}
              className="px-3 py-1.5 bg-[#3d4046] hover:bg-[#4a4d54] disabled:bg-[#2b2d31] disabled:text-gray-600 text-white rounded text-sm transition-colors"
            >
              灰階
            </button>
            <button
              onClick={onInvert}
              disabled={!hasImage}
              className="px-3 py-1.5 bg-[#3d4046] hover:bg-[#4a4d54] disabled:bg-[#2b2d31] disabled:text-gray-600 text-white rounded text-sm transition-colors"
            >
              負片
            </button>
            <button
              onClick={onAutoContrast}
              disabled={!hasImage}
              className="px-3 py-1.5 bg-[#3d4046] hover:bg-[#4a4d54] disabled:bg-[#2b2d31] disabled:text-gray-600 text-white rounded text-sm transition-colors"
            >
              自動對比
            </button>
            <button
              onClick={onEqualize}
              disabled={!hasImage}
              className="px-3 py-1.5 bg-[#3d4046] hover:bg-[#4a4d54] disabled:bg-[#2b2d31] disabled:text-gray-600 text-white rounded text-sm transition-colors"
            >
              直方圖等化
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-400">懷舊色調</label>
            <span className="text-xs text-gray-500">{sepiaIntensity.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={sepiaIntensity}
            onChange={(e) => setSepiaIntensity(Number(e.target.value))}
            disabled={!hasImage}
            className="w-full"
          />
          <button
            onClick={() => onSepia(sepiaIntensity)}
            disabled={!hasImage}
            className="w-full px-3 py-1.5 bg-[#3d4046] hover:bg-[#4a4d54] disabled:bg-[#2b2d31] disabled:text-gray-600 text-white rounded text-sm transition-colors"
          >
            應用懷舊效果
          </button>
        </div>
      </div>
    </div>
  );
}
