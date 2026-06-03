import { contextBridge, ipcRenderer, webUtils } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  /** V4.0: 链式重叠合并 */
  mergeFiles: (paths: string[], threshold?: number) =>
    ipcRenderer.invoke('merge-files', paths, threshold),
  /** V4.0: 导出文件（连续文本 + 默认文件名） */
  exportFile: (mergedText: string, defaultName: string) =>
    ipcRenderer.invoke('export-file', mergedText, defaultName),
  /** 文件选择对话框 */
  selectFiles: () => ipcRenderer.invoke('select-files'),
  /** 编码探测 */
  detectEncoding: (filePath: string) => ipcRenderer.invoke('detect-encoding', filePath),
  /**
   * 获取拖放文件的真实路径（Electron 28+ 推荐方式）
   * 解决 File.path 异步填充导致的取值为空问题 (BUG-V3.2.3-001)
   */
  getPathForFile: (file: File) => webUtils.getPathForFile(file),
  /** 读取单文件内容（DiffViewer 用） */
  readFileContent: (filePath: string) => ipcRenderer.invoke('read-file-content', filePath),
  /** 菜单事件监听 */
  onMenuNew: (callback: () => void) => ipcRenderer.on('menu-new', callback),
  onMenuAbout: (callback: () => void) => ipcRenderer.on('menu-about', callback),
  onMenuExit: (callback: () => void) => ipcRenderer.on('menu-exit', callback),
  removeMenuListeners: () => {
    ipcRenderer.removeAllListeners('menu-new');
    ipcRenderer.removeAllListeners('menu-about');
    ipcRenderer.removeAllListeners('menu-exit');
  },
});
