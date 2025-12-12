// types/electron.d.ts
// TypeScript declarations for Electron API exposed to renderer process

export interface IElectronAPI {
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  platform: 'darwin' | 'win32' | 'linux' | 'aix' | 'freebsd' | 'openbsd' | 'sunos';
  showSaveDialog: (options?: any) => Promise<{ canceled: boolean; filePath?: string }>;
  showOpenDialog: (options?: any) => Promise<{ canceled: boolean; filePaths?: string[] }>;
  saveFileToTemp: (fileData: ArrayBuffer, fileName: string) => Promise<{ success: boolean; filePath?: string; error?: string }>;
}

export interface ImageInfo {
  width: number;
  height: number;
  mode: string;
  format: string;
}

export interface ImageResponse {
  success: boolean;
  message?: string;
  error?: string;
  info?: ImageInfo;
  preview?: string;
  base64?: string;
  path?: string;
  files?: string[];
  count?: number;
}

export interface IImageAPI {
  // File Operations
  loadFile: (filePath: string) => Promise<ImageResponse>;
  loadBase64: (base64: string) => Promise<ImageResponse>;
  saveFile: (outputPath: string, quality?: number) => Promise<ImageResponse>;
  getBase64: (format?: string) => Promise<ImageResponse>;
  getInfo: () => Promise<ImageResponse>;
  batchLoad: (folderPath: string) => Promise<ImageResponse>;
  reset: () => Promise<ImageResponse>;

  // Basic Transforms
  thumbnail: (maxWidth?: number, maxHeight?: number) => Promise<ImageResponse>;
  resize: (width: number, height: number, keepAspect?: boolean) => Promise<ImageResponse>;
  rotate: (angle: number, expand?: boolean, fillColor?: number[]) => Promise<ImageResponse>;
  crop: (left: number, top: number, right: number, bottom: number) => Promise<ImageResponse>;
  cropCenter: (width: number, height: number) => Promise<ImageResponse>;
  flip: (direction: 'horizontal' | 'vertical') => Promise<ImageResponse>;

  // Color Adjustments
  grayscale: () => Promise<ImageResponse>;
  brightness: (factor: number) => Promise<ImageResponse>;
  contrast: (factor: number) => Promise<ImageResponse>;
  saturation: (factor: number) => Promise<ImageResponse>;
  whiteBalance: (method?: string) => Promise<ImageResponse>;
  colorTemperature: (temperature: number) => Promise<ImageResponse>;
  hueShift: (degrees: number) => Promise<ImageResponse>;
  autoContrast: (cutoff?: number) => Promise<ImageResponse>;
  equalize: () => Promise<ImageResponse>;
  invert: () => Promise<ImageResponse>;
  sepia: (intensity?: number) => Promise<ImageResponse>;

  // Filters & Effects
  blur: (radius?: number, blurType?: 'gaussian' | 'box') => Promise<ImageResponse>;
  sharpen: (factor?: number) => Promise<ImageResponse>;
  edgeDetect: (method?: string) => Promise<ImageResponse>;
  emboss: () => Promise<ImageResponse>;
  pixelate: (pixelSize?: number) => Promise<ImageResponse>;
  vignette: (strength?: number) => Promise<ImageResponse>;
  artEffect: (effectType: 'poster' | 'sketch' | 'oil_paint' | 'cartoon') => Promise<ImageResponse>;
  addBorder: (borderWidth?: number, color?: number[]) => Promise<ImageResponse>;
}

declare global {
  interface Window {
    electron: IElectronAPI;
    imageAPI: IImageAPI;
  }
}