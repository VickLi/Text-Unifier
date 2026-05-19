import { contextBridge, ipcRenderer, webUtils } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  scanFiles: (paths: string[]) => ipcRenderer.invoke('scan-files', paths),
  exportFile: (paragraphs: string[]) => ipcRenderer.invoke('export-file', paragraphs),
  selectFiles: () => ipcRenderer.invoke('select-files'),
  detectEncoding: (filePath: string) => ipcRenderer.invoke('detect-encoding', filePath),
  /**
   * 获取拖放文件的真实路径（Electron 28+ 推荐方式）
   * 解决 File.path 异步填充导致的取值为空问题 (BUG-V3.2.2-001)
   */
  getPathForFile: (file: File) => webUtils.getPathForFile(file),
});
