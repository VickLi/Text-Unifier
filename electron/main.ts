import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

// 加载 napi-rs 编译的原生模块
let nativeModule: any;
try {
  const possiblePaths: string[] = [];

  // 方案 1: process.resourcesPath（asar 打包后）
  if (process.resourcesPath) {
    possiblePaths.push(path.join(process.resourcesPath, 'native/index.js'));
  }

  // 方案 2: 相对于 __dirname（开发环境 / 未打包）
  possiblePaths.push(path.join(__dirname, '../../../native/index.js'));
  possiblePaths.push(path.join(__dirname, '../native/index.js'));
  possiblePaths.push(path.join(__dirname, '../../native/index.js'));

  // 方案 3: 相对于应用根目录
  if (app && app.getAppPath) {
    possiblePaths.push(path.join(app.getAppPath(), 'native/index.js'));
  }

  let lastError: Error | null = null;
  for (const p of possiblePaths) {
    try {
      if (fs.existsSync(p)) {
        nativeModule = require(p);
        if (nativeModule) break;
      }
    } catch (e: any) {
      lastError = e;
    }
  }

  if (!nativeModule) {
    console.error('所有路径尝试均失败:');
    for (const p of possiblePaths) {
      console.error(`  ${p}: ${fs.existsSync(p) ? '存在但加载失败' : '不存在'}`);
    }
    if (lastError) console.error('最后错误:', lastError);
  }
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
      preload: path.join(__dirname, 'preload.cjs'),
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
    const msg = '核心引擎加载失败，请重新安装应用。\n\n' +
                '可能的原因：\n' +
                '1. native/text-unifier-core.win32-x64-msvc.node 文件缺失或损坏\n' +
                '2. Node.js 与 Electron 版本不兼容\n' +
                '3. 缺少 Visual C++ 运行库\n\n' +
                '请查看控制台输出获取详细错误信息。';
    dialog.showErrorBox('启动失败', msg);
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
