import type { AnalysisReport } from '../src/types';

export interface ElectronAPI {
  scanFiles(paths: string[]): Promise<AnalysisReport>;
  detectEncoding(filePath: string): Promise<string>;
  exportFile(paragraphs: string[]): Promise<{ savedPath: string }>;
  selectFiles(): Promise<{ name: string; path: string; size: number }[]>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
