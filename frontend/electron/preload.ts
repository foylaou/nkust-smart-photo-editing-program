import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
    minimize: () => ipcRenderer.send('window-minimize'),
    maximize: () => ipcRenderer.send('window-maximize'),
    close: () => ipcRenderer.send('window-close'),
    platform: process.platform,
    showSaveDialog: (options: any) => ipcRenderer.invoke('dialog:save', options),
    showOpenDialog: (options: any) => ipcRenderer.invoke('dialog:open', options),
    // 輔助函數：將文件保存到臨時位置並返回路徑
    saveFileToTemp: (fileData: ArrayBuffer, fileName: string) =>
        ipcRenderer.invoke('file:save-temp', { fileData, fileName }),
});

// Expose Image Processing API
contextBridge.exposeInMainWorld('imageAPI', {
    // File Operations
    loadFile: (filePath: string) =>
        ipcRenderer.invoke('image:load-file', { filePath }),
    loadBase64: (base64: string) =>
        ipcRenderer.invoke('image:load-base64', { base64 }),
    saveFile: (outputPath: string, quality?: number) =>
        ipcRenderer.invoke('image:save-file', { outputPath, quality }),
    getBase64: (format?: string) =>
        ipcRenderer.invoke('image:get-base64', { format }),
    getInfo: () =>
        ipcRenderer.invoke('image:get-info'),
    batchLoad: (folderPath: string) =>
        ipcRenderer.invoke('image:batch-load', { folderPath }),
    reset: () =>
        ipcRenderer.invoke('image:reset'),

    // Basic Transforms
    thumbnail: (maxWidth?: number, maxHeight?: number) =>
        ipcRenderer.invoke('image:thumbnail', { maxWidth, maxHeight }),
    resize: (width: number, height: number, keepAspect?: boolean) =>
        ipcRenderer.invoke('image:resize', { width, height, keepAspect }),
    rotate: (angle: number, expand?: boolean, fillColor?: number[]) =>
        ipcRenderer.invoke('image:rotate', { angle, expand, fillColor }),
    crop: (left: number, top: number, right: number, bottom: number) =>
        ipcRenderer.invoke('image:crop', { left, top, right, bottom }),
    cropCenter: (width: number, height: number) =>
        ipcRenderer.invoke('image:crop-center', { width, height }),
    flip: (direction: 'horizontal' | 'vertical') =>
        ipcRenderer.invoke('image:flip', { direction }),

    // Color Adjustments
    grayscale: () =>
        ipcRenderer.invoke('image:grayscale'),
    brightness: (factor: number) =>
        ipcRenderer.invoke('image:brightness', { factor }),
    contrast: (factor: number) =>
        ipcRenderer.invoke('image:contrast', { factor }),
    saturation: (factor: number) =>
        ipcRenderer.invoke('image:saturation', { factor }),
    whiteBalance: (method?: string) =>
        ipcRenderer.invoke('image:white-balance', { method }),
    colorTemperature: (temperature: number) =>
        ipcRenderer.invoke('image:color-temperature', { temperature }),
    hueShift: (degrees: number) =>
        ipcRenderer.invoke('image:hue-shift', { degrees }),
    autoContrast: (cutoff?: number) =>
        ipcRenderer.invoke('image:auto-contrast', { cutoff }),
    equalize: () =>
        ipcRenderer.invoke('image:equalize'),
    invert: () =>
        ipcRenderer.invoke('image:invert'),
    sepia: (intensity?: number) =>
        ipcRenderer.invoke('image:sepia', { intensity }),

    // Filters & Effects
    blur: (radius?: number, blurType?: 'gaussian' | 'box') =>
        ipcRenderer.invoke('image:blur', { radius, blurType }),
    sharpen: (factor?: number) =>
        ipcRenderer.invoke('image:sharpen', { factor }),
    edgeDetect: (method?: string) =>
        ipcRenderer.invoke('image:edge-detect', { method }),
    emboss: () =>
        ipcRenderer.invoke('image:emboss'),
    pixelate: (pixelSize?: number) =>
        ipcRenderer.invoke('image:pixelate', { pixelSize }),
    vignette: (strength?: number) =>
        ipcRenderer.invoke('image:vignette', { strength }),
    artEffect: (effectType: 'poster' | 'sketch' | 'oil_paint' | 'cartoon') =>
        ipcRenderer.invoke('image:art-effect', { effectType }),
    addBorder: (borderWidth?: number, color?: number[]) =>
        ipcRenderer.invoke('image:add-border', { borderWidth, color }),
});