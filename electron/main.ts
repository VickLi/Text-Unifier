import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

// 加载 napi-rs 编译的原生模块
let nativeModule: any;
try {
  nativeModule = require(path.join(__dirname, '../native/index.js'));
} catch (e) {
  console.error('核心引擎加载失败:', e);
}

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: '文档终版确定器 - Text Unifier',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // V3.2.3: 阻止文件拖放导致的页面导航
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url.startsWith('file://')) {
      event.preventDefault();
    }
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:1420');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.setMenuBarVisibility(false);
}

// ═══════════════════════════════════════════
// IPC 处理器
// ═══════════════════════════════════════════

/** 扫描并分析文件（完整路径，兼容旧路径） */
ipcMain.handle('scan-files', async (_event, paths: string[]) => {
  if (!nativeModule) throw new Error('核心引擎未初始化');
  const validPaths = paths.filter(p => {
    try { return fs.existsSync(p) && p.toLowerCase().endsWith('.txt'); }
    catch { return false; }
  });
  if (validPaths.length === 0) throw new Error('没有有效的 .txt 文件');
  return nativeModule.scanFiles(validPaths);
});

/** V3.1 编码探测 */
ipcMain.handle('detect-encoding', async (_event, filePath: string) => {
  if (!nativeModule) throw new Error('核心引擎未初始化');
  return nativeModule.detectEncoding(filePath);
});

/** 导出文件（打开保存对话框 + 写入） */
ipcMain.handle('export-file', async (_event, paragraphs: string[]) => {
  if (!mainWindow) throw new Error('窗口未初始化');

  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    defaultPath: 'Merged_Document.txt',
    filters: [{ name: 'Text Files', extensions: ['txt'] }],
  });

  if (canceled || !filePath) {
    throw new Error('用户取消了保存');
  }

  const content = paragraphs.join('\n\n');
  fs.writeFileSync(filePath, content, 'utf-8');

  return { saved_path: filePath };
});

/** 选择 .txt 文件对话框 */
ipcMain.handle('select-files', async () => {
  if (!mainWindow) throw new Error('窗口未初始化');

  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    filters: [{ name: 'Text Files', extensions: ['txt'] }],
    properties: ['openFile', 'multiSelections'],
  });

  if (canceled) return [];

  return filePaths.map(fp => {
    const stats = fs.statSync(fp);
    return {
      name: path.basename(fp),
      path: fp,
      size: stats.size,
    };
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
