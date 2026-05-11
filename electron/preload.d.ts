import type { AnalysisReport, FormatResult } from '../src/types';

export interface ElectronAPI {
  scanFiles(paths: string[]): Promise<AnalysisReport>;
  detectEncoding(filePath: string): Promise<string>;
  scanPreprocessedTexts(texts: string[], fileNames: string[], fileSizes: number[]): Promise<AnalysisReport>;
  formatDocument(text: string): Promise<FormatResult>;
  exportFile(paragraphs: string[]): Promise<{ savedPath: string }>;
  selectFiles(): Promise<{ name: string; path: string; size: number }[]>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
