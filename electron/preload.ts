import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // V3.0 已有
  scanFiles: (paths: string[]) => ipcRenderer.invoke('scan-files', paths),
  formatDocument: (text: string) => ipcRenderer.invoke('format-document', text),
  exportFile: (paragraphs: string[]) => ipcRenderer.invoke('export-file', paragraphs),
  selectFiles: () => ipcRenderer.invoke('select-files'),

  // V3.1 新增
  detectEncoding: (filePath: string) => ipcRenderer.invoke('detect-encoding', filePath),
  scanPreprocessedTexts: (texts: string[], fileNames: string[], fileSizes: number[]) =>
    ipcRenderer.invoke('scan-preprocessed-texts', texts, fileNames, fileSizes),
});
