import { app, BrowserWindow, ipcMain, Menu, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn, ChildProcess } from 'child_process';
import { existsSync, writeFileSync, mkdirSync } from 'fs';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null;
let pythonProcess: ChildProcess | null = null;

// Check if running in development mode
const isDev = !app.isPackaged;

// Find Python executable
function findPython(backendDir: string): string {
    // Priority 1: Virtual environment in backend directory
    const venvPython = path.join(backendDir, '.venv', 'bin', 'python3');
    console.log('Checking for venv Python at:', venvPython);
    if (existsSync(venvPython)) {
        console.log('✓ Found Python in backend/.venv at:', venvPython);
        return venvPython;
    }

    // Priority 2: Virtual environment in project root (one level up from backend)
    const projectRoot = path.join(backendDir, '..');
    const rootVenvPython = path.join(projectRoot, '.venv', 'bin', 'python3');
    console.log('Checking for venv Python at:', rootVenvPython);
    if (existsSync(rootVenvPython)) {
        console.log('✓ Found Python in project root .venv at:', rootVenvPython);
        return rootVenvPython;
    }

    // Priority 3: Alternative venv names
    const altVenvPaths = [
        path.join(backendDir, 'venv', 'bin', 'python3'),
        path.join(projectRoot, 'venv', 'bin', 'python3'),
    ];

    for (const venvPath of altVenvPaths) {
        console.log('Checking for venv Python at:', venvPath);
        if (existsSync(venvPath)) {
            console.log('✓ Found Python in venv at:', venvPath);
            return venvPath;
        }
    }

    // Priority 4: Common system locations
    console.warn('⚠ No virtual environment found, falling back to system Python');
    const possiblePaths = [
        '/usr/local/bin/python3',
        '/usr/bin/python3',
        '/opt/homebrew/bin/python3',
        'python3', // Fallback to PATH
    ];

    for (const pythonPath of possiblePaths) {
        if (pythonPath === 'python3') {
            return pythonPath; // Let system try to find it
        }
        if (existsSync(pythonPath)) {
            console.log('Found system Python at:', pythonPath);
            return pythonPath;
        }
    }

    console.warn('Python3 not found in common locations, using "python3" from PATH');
    return 'python3';
}

// Python Backend Management
function startPythonBackend() {
    if (isDev) {
        // --- DEVELOPMENT MODE ---
        const backendDir = path.join(__dirname, '..', '..', 'backend');
        const backendPath = path.join(backendDir, 'ipc_server.py');
        console.log('Starting Python backend in DEV mode:', backendPath);

        if (!existsSync(backendPath)) {
            console.error('Backend script not found at:', backendPath);
            return;
        }

        const pythonExecutable = findPython(backendDir);
        console.log(`Using Python interpreter: ${pythonExecutable}`);

        pythonProcess = spawn(pythonExecutable, [backendPath], {
            stdio: ['pipe', 'pipe', 'pipe'],
            cwd: backendDir,
        });
    } else {
        // --- PRODUCTION MODE ---
        const backendPath = path.join(process.resourcesPath, 'backend', 'ipc_server');
        console.log('Starting Python backend in PROD mode:', backendPath);

        if (!existsSync(backendPath)) {
            console.error('Packaged backend executable not found at:', backendPath);
            return;
        }
        
        // In production, run the PyInstaller-built executable directly
        pythonProcess = spawn(backendPath, [], {
            stdio: ['pipe', 'pipe', 'pipe'],
        });
    }

    // --- COMMON PROCESS HANDLING ---
    if (!pythonProcess) {
        console.error('Failed to spawn backend process.');
        return;
    }

    console.log('Backend process spawned with PID:', pythonProcess.pid);

    setupPythonResponseHandler();

    pythonProcess.stderr?.on('data', (data) => {
        console.error(`Backend stderr: ${data}`);
    });

    pythonProcess.on('error', (error) => {
        console.error('Failed to start backend process:', error);
    });

    pythonProcess.on('exit', (code, signal) => {
        console.log(`Backend process exited with code ${code}, signal ${signal}`);
        pythonProcess = null;
    });

    setTimeout(() => {
        if (pythonProcess?.pid) {
            console.log('Backend started successfully.');
        } else {
            console.error('Backend failed to start in a timely manner.');
        }
    }, 1500);
}

// Queue to handle pending requests
let requestQueue: Array<{
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
    timer: NodeJS.Timeout;
}> = [];

// Set up response handler once
function setupPythonResponseHandler() {
    if (!pythonProcess || !pythonProcess.stdout) return;

    pythonProcess.stdout.on('data', (data: Buffer) => {
        const lines = data.toString().trim().split('\n');

        for (const line of lines) {
            if (!line) continue;

            // Skip non-JSON lines (logs, errors, etc.)
            if (!line.startsWith('{')) {
                console.log('Python output:', line);
                continue;
            }

            try {
                const response = JSON.parse(line);
                const pending = requestQueue.shift();
                if (pending) {
                    clearTimeout(pending.timer);
                    pending.resolve(response);
                }
            } catch (error) {
                console.error('Failed to parse Python response:', error, 'Line:', line);
                const pending = requestQueue.shift();
                if (pending) {
                    clearTimeout(pending.timer);
                    pending.reject(error);
                }
            }
        }
    });
}

function sendToPython(request: any): Promise<any> {
    return new Promise((resolve, reject) => {
        if (!pythonProcess || !pythonProcess.stdin || !pythonProcess.stdout) {
            console.error('Python process not available');
            reject(new Error('Python process not available'));
            return;
        }

        // Timeout after 30 seconds
        const timer = setTimeout(() => {
            const index = requestQueue.findIndex(r => r.resolve === resolve);
            if (index !== -1) {
                requestQueue.splice(index, 1);
            }
            reject(new Error('Request timeout'));
        }, 30000);

        // Add to queue
        requestQueue.push({ resolve, reject, timer });

        const requestStr = JSON.stringify(request) + '\n';
        console.log('Sending to Python:', request.action);

        // Send request
        try {
            pythonProcess.stdin.write(requestStr, (error) => {
                if (error) {
                    console.error('Failed to write to Python:', error);
                    const index = requestQueue.findIndex(r => r.resolve === resolve);
                    if (index !== -1) {
                        clearTimeout(requestQueue[index].timer);
                        requestQueue.splice(index, 1);
                    }
                    reject(error);
                }
            });
        } catch (error) {
            console.error('Exception while writing to Python:', error);
            const index = requestQueue.findIndex(r => r.resolve === resolve);
            if (index !== -1) {
                clearTimeout(requestQueue[index].timer);
                requestQueue.splice(index, 1);
            }
            reject(error);
        }
    });
}

function stopPythonBackend() {
    // Reject all pending requests
    requestQueue.forEach(({ reject, timer }) => {
        clearTimeout(timer);
        reject(new Error('Python process shutting down'));
    });
    requestQueue = [];

    if (pythonProcess) {
        pythonProcess.kill();
        pythonProcess = null;
    }
}

// Suppress security warnings in development (they're expected with Vite)
if (isDev) {
    process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 800,
        // Removed frame: false and titleBarStyle: 'hidden' to use system title bar
        backgroundColor: '#1e1e1e', // Dark background
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'), // Ensure this matches your build config
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: isDev ? false : true, // 開發模式下允許本地文件訪問
        },
        title: 'Electron Python IPC Example',
    });

    // Set Content Security Policy
    // Note: 'unsafe-eval' is required for Vite HMR in development mode
    // This warning will not appear in production builds
    mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
        callback({
            responseHeaders: {
                ...details.responseHeaders,
                'Content-Security-Policy': [
                    isDev
                        ? "default-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* ws://localhost:*; connect-src 'self' http://localhost:* ws://localhost:*; img-src 'self' data:"
                        : "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:"
                ]
            }
        });
    });

    // Load the app
    if (isDev ) {
        // Development mode: load from Vite dev server
        const devServerUrl = 'http://localhost:5173';
        mainWindow.loadURL(devServerUrl);

        // Force open DevTools in development mode
        mainWindow.webContents.once('did-finish-load', () => {
            mainWindow?.webContents.openDevTools({ mode: 'detach' });
        });

        // Show error if Vite dev server is not running
        mainWindow.webContents.on('did-fail-load', () => {
            if (!mainWindow) return;
            mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`
        <html>
          <body style="font-family: sans-serif; padding: 50px; text-align: center;">
            <h1>Development Server Not Running</h1>
            <p>Please run: <code>npm run dev</code></p>
          </body>
        </html>
      `)}`);
        });
    } else {
        // Production mode: load from built files
        mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// IPC handlers for window controls - kept if needed for custom UI later, but optional
ipcMain.on('window-minimize', () => {
    if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-maximize', () => {
    if (mainWindow) {
        if (mainWindow.isMaximized()) {
            mainWindow.unmaximize();
        } else {
            mainWindow.maximize();
        }
    }
});

ipcMain.on('window-close', () => {
    if (mainWindow) mainWindow.close();
});

// Dialog handlers
ipcMain.handle('dialog:save', async (event, options) => {
    if (!mainWindow) return { canceled: true };

    const result = await dialog.showSaveDialog(mainWindow, {
        title: '保存圖片',
        defaultPath: options?.defaultPath || 'output.png',
        filters: [
            { name: 'PNG 圖片', extensions: ['png'] },
            { name: 'JPEG 圖片', extensions: ['jpg', 'jpeg'] },
            { name: '所有文件', extensions: ['*'] }
        ],
        ...options
    });

    return result;
});

ipcMain.handle('dialog:open', async (event, options) => {
    if (!mainWindow) return { canceled: true };

    const result = await dialog.showOpenDialog(mainWindow, {
        title: '選擇圖片',
        properties: ['openFile'],
        filters: [
            { name: '圖片文件', extensions: ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'] },
            { name: '所有文件', extensions: ['*'] }
        ],
        ...options
    });

    return result;
});

// 將文件保存到臨時目錄並返回路徑
ipcMain.handle('file:save-temp', async (event, { fileData, fileName }) => {
    try {
        const tempDir = path.join(os.tmpdir(), 'electron-image-editor');

        // 確保臨時目錄存在
        if (!existsSync(tempDir)) {
            mkdirSync(tempDir, { recursive: true });
        }

        // 生成唯一文件名
        const timestamp = Date.now();
        const tempFilePath = path.join(tempDir, `${timestamp}_${fileName}`);

        // 寫入文件
        writeFileSync(tempFilePath, Buffer.from(fileData));

        console.log('文件已保存到臨時位置:', tempFilePath);

        return { success: true, filePath: tempFilePath };
    } catch (error: any) {
        console.error('保存臨時文件失敗:', error);
        return { success: false, error: error.message };
    }
});

// --- Image Processing IPC Handlers ---

// File Operations
ipcMain.handle('image:load-file', async (event, { filePath }) => {
    try {
        return await sendToPython({ action: 'load_file', file_path: filePath });
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('image:load-base64', async (event, { base64 }) => {
    try {
        return await sendToPython({ action: 'load_base64', base64 });
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('image:save-file', async (event, { outputPath, quality }) => {
    try {
        return await sendToPython({ action: 'save_file', output_path: outputPath, quality });
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('image:get-base64', async (event, { format }) => {
    try {
        return await sendToPython({ action: 'get_base64', format });
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('image:get-info', async () => {
    try {
        return await sendToPython({ action: 'get_info' });
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('image:batch-load', async (event, { folderPath }) => {
    try {
        return await sendToPython({ action: 'batch_load', folder_path: folderPath });
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('image:reset', async () => {
    try {
        return await sendToPython({ action: 'reset' });
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});

// Basic Transforms
ipcMain.handle('image:thumbnail', async (event, { maxWidth, maxHeight }) => {
    try {
        return await sendToPython({ action: 'thumbnail', max_width: maxWidth, max_height: maxHeight });
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('image:resize', async (event, { width, height, keepAspect }) => {
    try {
        return await sendToPython({ action: 'resize', width, height, keep_aspect: keepAspect });
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('image:rotate', async (event, { angle, expand, fillColor }) => {
    try {
        return await sendToPython({ action: 'rotate', angle, expand, fill_color: fillColor });
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('image:crop', async (event, { left, top, right, bottom }) => {
    try {
        return await sendToPython({ action: 'crop', left, top, right, bottom });
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('image:crop-center', async (event, { width, height }) => {
    try {
        return await sendToPython({ action: 'crop_center', width, height });
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('image:flip', async (event, { direction }) => {
    try {
        return await sendToPython({ action: 'flip', direction });
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});

// Color Adjustments
ipcMain.handle('image:grayscale', async () => {
    try {
        return await sendToPython({ action: 'grayscale' });
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('image:brightness', async (event, { factor }) => {
    try {
        return await sendToPython({ action: 'brightness', factor });
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('image:contrast', async (event, { factor }) => {
    try {
        return await sendToPython({ action: 'contrast', factor });
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('image:saturation', async (event, { factor }) => {
    try {
        return await sendToPython({ action: 'saturation', factor });
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('image:white-balance', async (event, { method }) => {
    try {
        return await sendToPython({ action: 'white_balance', method });
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('image:color-temperature', async (event, { temperature }) => {
    try {
        return await sendToPython({ action: 'color_temperature', temperature });
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('image:hue-shift', async (event, { degrees }) => {
    try {
        return await sendToPython({ action: 'hue_shift', degrees });
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('image:auto-contrast', async (event, { cutoff }) => {
    try {
        return await sendToPython({ action: 'auto_contrast', cutoff });
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('image:equalize', async () => {
    try {
        return await sendToPython({ action: 'equalize' });
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('image:invert', async () => {
    try {
        return await sendToPython({ action: 'invert' });
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('image:sepia', async (event, { intensity }) => {
    try {
        return await sendToPython({ action: 'sepia', intensity });
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});

// Filters & Effects
ipcMain.handle('image:blur', async (event, { radius, blurType }) => {
    try {
        return await sendToPython({ action: 'blur', radius, blur_type: blurType });
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('image:sharpen', async (event, { factor }) => {
    try {
        return await sendToPython({ action: 'sharpen', factor });
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('image:edge-detect', async (event, { method }) => {
    try {
        return await sendToPython({ action: 'edge_detect', method });
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('image:emboss', async () => {
    try {
        return await sendToPython({ action: 'emboss' });
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('image:pixelate', async (event, { pixelSize }) => {
    try {
        return await sendToPython({ action: 'pixelate', pixel_size: pixelSize });
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('image:vignette', async (event, { strength }) => {
    try {
        return await sendToPython({ action: 'vignette', strength });
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('image:art-effect', async (event, { effectType }) => {
    try {
        return await sendToPython({ action: 'art_effect', effect_type: effectType });
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('image:add-border', async (event, { borderWidth, color }) => {
    try {
        return await sendToPython({ action: 'add_border', border_width: borderWidth, color });
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});

app.whenReady().then(() => {
    // Hide application menu
    Menu.setApplicationMenu(null);

    // Start Python backend first
    startPythonBackend();

    // Then create window
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    stopPythonBackend();
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', () => {
    stopPythonBackend();
});