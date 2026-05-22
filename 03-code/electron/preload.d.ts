import type { MergeResult } from '../src/types';

export interface ElectronAPI {
  /** V4.0: 链式重叠合并 */
  mergeFiles(paths: string[], threshold?: number): Promise<MergeResult>;
  /** 编码探测 */
  detectEncoding(filePath: string): Promise<string>;
  /** V4.0: 导出连续文本 */
  exportFile(mergedText: string, defaultName: string): Promise<{ savedPath: string }>;
  /** 文件选择对话框 */
  selectFiles(): Promise<{ name: string; path: string; size: number }[]>;
  /** V4.0: 读取文件文本内容（编码探测 + 解码） */
  readFileText(filePath: string): Promise<string>;
  /** 从 File 对象获取文件系统路径 (Electron 28+ webUtils) */
  getPathForFile(file: File): string;
  /** 菜单事件监听 */
  onMenuNew(callback: () => void): void;
  onMenuAbout(callback: () => void): void;
  onMenuExit(callback: () => void): void;
  removeMenuListeners(): void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
