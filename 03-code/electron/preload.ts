import { contextBridge, ipcRenderer, webUtils } from 'electron';

/**
 * V4.0 Preload — 暴露 4 个 IPC 通道 + 1 个同步工具 + 3 个菜单事件
 */
contextBridge.exposeInMainWorld('electronAPI', {
  mergeFiles: (paths: string[], threshold?: number) =>
    ipcRenderer.invoke('merge-files', paths, threshold ?? 50),
  detectEncoding: (filePath: string) =>
    ipcRenderer.invoke('detect-encoding', filePath),
  exportFile: (mergedText: string, defaultName: string) =>
    ipcRenderer.invoke('export-file', mergedText, defaultName),
  selectFiles: () =>
    ipcRenderer.invoke('select-files'),
  readFileText: (filePath: string) =>
    ipcRenderer.invoke('read-file-text', filePath),
  getPathForFile: (file: File) =>
    webUtils.getPathForFile(file),

  // 菜单事件监听
  onMenuNew: (callback: () => void) => {
    ipcRenderer.on('menu-new', callback);
  },
  onMenuAbout: (callback: () => void) => {
    ipcRenderer.on('menu-about', callback);
  },
  onMenuExit: (callback: () => void) => {
    ipcRenderer.on('menu-exit', callback);
  },
  removeMenuListeners: () => {
    ipcRenderer.removeAllListeners('menu-new');
    ipcRenderer.removeAllListeners('menu-about');
    ipcRenderer.removeAllListeners('menu-exit');
  },
});
