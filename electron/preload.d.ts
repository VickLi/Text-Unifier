import type { AnalysisReport } from '../src/types';

export interface ElectronAPI {
  scanFiles(paths: string[]): Promise<AnalysisReport>;
  detectEncoding(filePath: string): Promise<string>;
  exportFile(paragraphs: string[]): Promise<{ savedPath: string }>;
  selectFiles(): Promise<{ name: string; path: string; size: number }[]>;
  /** V3.2.3: 从 File 对象获取文件系统路径 */
  getPathForFile(file: File): string;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
