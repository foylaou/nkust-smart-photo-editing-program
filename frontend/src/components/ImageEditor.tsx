import { useState } from 'react';
import type {ImageInfo} from '../types/electron';
import ImagePreview from './ImagePreview';
import FileOperationsPanel from './FileOperationsPanel';
import TransformPanel from './TransformPanel';
import ColorAdjustPanel from './ColorAdjustPanel';
import EffectsPanel from './EffectsPanel';

export default function ImageEditor() {
  const [imageData, setImageData] = useState<string | null>(null);
  const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'transform' | 'color' | 'effects'>('transform');

  const handleFileSelect = async (file: File | any) => {
    setLoading(true);
    try {
      console.log('📁 開始處理文件:', file.name || '未知');

      // 方式 1: 嘗試直接獲取文件路徑 (拖放或 Electron dialog)
      let filePath = (file as any).path;

      if (filePath) {
        console.log('✓ 方式 1: 使用文件路徑:', filePath);

        const result = await window.imageAPI.loadFile(filePath);

        if (result.success && result.preview && result.info) {
          const cleanBase64 = result.preview.replace(/\s/g, '');
          setImageData(cleanBase64);
          setImageInfo(result.info);
          console.log('✓ 圖片載入成功:', result.info);
        } else {
          alert('載入圖片失敗: ' + (result.error || '未知錯誤'));
        }
      } else {
        // 方式 2: 沒有路徑，將文件保存到臨時位置
        console.log('⚠ 無法獲取文件路徑，使用臨時文件方案');

        if (!(file instanceof File)) {
          alert('無效的文件對象');
          setLoading(false);
          return;
        }

        // 讀取文件內容為 ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        console.log('✓ 文件已讀取:', arrayBuffer.byteLength, 'bytes');

        // 保存到臨時位置
        const tempResult = await window.electron.saveFileToTemp(arrayBuffer, file.name);

        if (!tempResult.success || !tempResult.filePath) {
          alert('保存臨時文件失敗: ' + (tempResult.error || '未知錯誤'));
          setLoading(false);
          return;
        }

        console.log('✓ 臨時文件已創建:', tempResult.filePath);

        // 使用臨時文件路徑載入
        const result = await window.imageAPI.loadFile(tempResult.filePath);

        if (result.success && result.preview && result.info) {
          const cleanBase64 = result.preview.replace(/\s/g, '');
          setImageData(cleanBase64);
          setImageInfo(result.info);
          console.log('✓ 圖片載入成功:', result.info);
        } else {
          alert('載入圖片失敗: ' + (result.error || '未知錯誤'));
        }
      }
    } catch (error) {
      console.error('❌ 載入圖片錯誤:', error);
      alert('載入圖片時發生錯誤: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const processImage = async (action: () => Promise<any>) => {
    setLoading(true);
    try {
      const result = await action();

      if (result.success && result.preview && result.info) {
        // Clean base64 data - remove any whitespace/newlines
        const cleanBase64 = result.preview.replace(/\s/g, '');
        setImageData(cleanBase64);
        setImageInfo(result.info);
        console.log('Image processed:', result.info);
      } else {
        alert('處理失敗: ' + (result.error || '未知錯誤'));
      }
    } catch (error) {
      console.error('Error processing image:', error);
      alert('處理圖片時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!imageData) return;

    try {
      // Show save dialog
      const result = await window.electron.showSaveDialog({
        defaultPath: 'output.png'
      });

      if (result.canceled || !result.filePath) {
        return;
      }

      setLoading(true);

      // Save the file
      const saveResult = await window.imageAPI.saveFile(result.filePath, 95);

      if (saveResult.success) {
        alert('保存成功: ' + saveResult.path);
      } else {
        alert('保存失敗: ' + (saveResult.error || '未知錯誤'));
      }
    } catch (error) {
      console.error('Error saving image:', error);
      alert('保存圖片時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    processImage(() => window.imageAPI.reset());
  };

  const handleClear = () => {
    // 清除前端狀態
    setImageData(null);
    setImageInfo(null);
    console.log('✓ 圖片已清除');
  };

  return (
    <div className="h-screen flex bg-[#36393f]">
      <div className="w-80 bg-[#2b2d31] border-r border-[#1e1f22] overflow-y-auto">
        <div className="p-4 border-b border-[#1e1f22]">
          <h1 className="text-xl font-bold text-white">圖片處理工具</h1>
        </div>

        <FileOperationsPanel
          onSave={handleSave}
          onReset={handleReset}
          onClear={handleClear}
          hasImage={!!imageData}
        />

        <div className="border-t border-[#1e1f22]">
          <div className="flex border-b border-[#1e1f22]">
            <button
              onClick={() => setActiveTab('transform')}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'transform'
                  ? 'bg-[#3d4046] text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              變換
            </button>
            <button
              onClick={() => setActiveTab('color')}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'color'
                  ? 'bg-[#3d4046] text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              顏色
            </button>
            <button
              onClick={() => setActiveTab('effects')}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'effects'
                  ? 'bg-[#3d4046] text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              效果
            </button>
          </div>

          <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
            {activeTab === 'transform' && (
              <TransformPanel
                onRotate={(angle) => processImage(() => window.imageAPI.rotate(angle, true))}
                onFlip={(direction) => processImage(() => window.imageAPI.flip(direction))}
                onResize={(w, h, keep) => processImage(() => window.imageAPI.resize(w, h, keep))}
                onCropCenter={(w, h) => processImage(() => window.imageAPI.cropCenter(w, h))}
                hasImage={!!imageData}
              />
            )}

            {activeTab === 'color' && (
              <ColorAdjustPanel
                onBrightness={(factor) => processImage(() => window.imageAPI.brightness(factor))}
                onContrast={(factor) => processImage(() => window.imageAPI.contrast(factor))}
                onSaturation={(factor) => processImage(() => window.imageAPI.saturation(factor))}
                onHueShift={(degrees) => processImage(() => window.imageAPI.hueShift(degrees))}
                onColorTemp={(temp) => processImage(() => window.imageAPI.colorTemperature(temp))}
                onGrayscale={() => processImage(() => window.imageAPI.grayscale())}
                onInvert={() => processImage(() => window.imageAPI.invert())}
                onSepia={(intensity) => processImage(() => window.imageAPI.sepia(intensity))}
                onAutoContrast={() => processImage(() => window.imageAPI.autoContrast())}
                onEqualize={() => processImage(() => window.imageAPI.equalize())}
                hasImage={!!imageData}
              />
            )}

            {activeTab === 'effects' && (
              <EffectsPanel
                onBlur={(radius, type) => processImage(() => window.imageAPI.blur(radius, type))}
                onSharpen={(factor) => processImage(() => window.imageAPI.sharpen(factor))}
                onEdgeDetect={() => processImage(() => window.imageAPI.edgeDetect())}
                onEmboss={() => processImage(() => window.imageAPI.emboss())}
                onPixelate={(size) => processImage(() => window.imageAPI.pixelate(size))}
                onVignette={(strength) => processImage(() => window.imageAPI.vignette(strength))}
                onArtEffect={(type) => processImage(() => window.imageAPI.artEffect(type))}
                onAddBorder={(width) => processImage(() => window.imageAPI.addBorder(width))}
                hasImage={!!imageData}
              />
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 p-4">
        <ImagePreview
          imageData={imageData}
          imageInfo={imageInfo}
          onFileSelect={handleFileSelect}
          loading={loading}
        />
      </div>
    </div>
  );
}
