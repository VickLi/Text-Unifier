import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

// 加载 napi-rs 原生模块
let nativeModule: any;
try {
  const possiblePaths: string[] = [];
  if (process.resourcesPath) possiblePaths.push(path.join(process.resourcesPath, 'native/index.js'));
  possiblePaths.push(path.join(__dirname, '../../../native/index.js'));
  possiblePaths.push(path.join(__dirname, '../native/index.js'));
  possiblePaths.push(path.join(__dirname, '../../native/index.js'));
  if (app?.getAppPath) possiblePaths.push(path.join(app.getAppPath(), 'native/index.js'));

  let lastError: Error | null = null;
  for (const p of possiblePaths) {
    try {
      if (fs.existsSync(p)) { nativeModule = require(p); if (nativeModule) break; }
    } catch (e: any) { lastError = e; }
  }
  if (!nativeModule) {
    console.error('所有路径尝试均失败');
    if (lastError) console.error('最后错误:', lastError);
  }
} catch (e) { console.error('核心引擎加载失败:', e); }

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200, height: 800, minWidth: 900, minHeight: 600,
    title: '文档终版确定器 - Text Unifier V4.0',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url.startsWith('file://')) event.preventDefault();
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:1420');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => mainWindow?.show());
  mainWindow.setMenuBarVisibility(false);
}

// ═══════════════════════════════════════════
// V4.0 IPC Handlers（4 个通道）
// ═══════════════════════════════════════════

/** merge-files: 链式重叠合并 */
ipcMain.handle('merge-files', async (_event, paths: string[], threshold?: number) => {
  if (!nativeModule) throw new Error('核心引擎未初始化');
  const validPaths = paths.filter((p: string) => {
    try { return fs.existsSync(p) && p.toLowerCase().endsWith('.txt'); }
    catch { return false; }
  });
  if (validPaths.length === 0) throw new Error('没有有效的 .txt 文件');
  return nativeModule.mergeFiles(validPaths, threshold ?? 50);
});

/** detect-encoding: 编码探测 */
ipcMain.handle('detect-encoding', async (_event, filePath: string) => {
  if (!nativeModule) throw new Error('核心引擎未初始化');
  return nativeModule.detectEncoding(filePath);
});

/** export-file: 导出连续文本 */
ipcMain.handle('export-file', async (_event, mergedText: string, defaultName: string) => {
  if (!mainWindow) throw new Error('窗口未初始化');
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName || 'merged.txt',
    filters: [{ name: 'Text Files', extensions: ['txt'] }],
  });
  if (canceled || !filePath) return { savedPath: '' };
  // UTF-8 BOM + CRLF
  const content = '\uFEFF' + mergedText.replace(/\n/g, '\r\n');
  fs.writeFileSync(filePath, content, 'utf-8');
  return { savedPath: filePath };
});

/** read-file-text: 读取文件文本内容（编码探测 + 解码） */
ipcMain.handle('read-file-text', async (_event, filePath: string) => {
  if (!nativeModule) throw new Error('核心引擎未初始化');
  return nativeModule.readFileText(filePath);
});

/** select-files: 文件选择对话框 */
ipcMain.handle('select-files', async () => {
  if (!mainWindow) throw new Error('窗口未初始化');
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    filters: [{ name: 'Text Files', extensions: ['txt'] }],
    properties: ['openFile', 'multiSelections'],
  });
  if (canceled) return [];
  return filePaths.map((fp: string) => {
    const stats = fs.statSync(fp);
    return { name: path.basename(fp), path: fp, size: stats.size };
  });
});

// ═══════════════════════════════════════════
// 应用生命周期
// ═══════════════════════════════════════════

app.whenReady().then(() => {
  if (!nativeModule) {
    dialog.showErrorBox('启动失败', '核心引擎加载失败，请重新安装应用。');
    app.quit();
    return;
  }
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
