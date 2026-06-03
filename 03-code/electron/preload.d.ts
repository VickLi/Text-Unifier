import type { MergeResult } from '../src/types';

export interface ElectronAPI {
  /** V4.0: 链式重叠合并 */
  mergeFiles(paths: string[], threshold?: number): Promise<MergeResult>;
  /** 编码探测 */
  detectEncoding(filePath: string): Promise<string>;
  /** V4.0: 导出文件（连续文本 + 默认文件名，取消返回空串） */
  exportFile(mergedText: string, defaultName: string): Promise<{ savedPath: string }>;
  /** 文件选择对话框 */
  selectFiles(): Promise<{ name: string; path: string; size: number }[]>;
  /** V3.2.3: 从 File 对象获取文件系统路径 */
  getPathForFile(file: File): string;
  /** 读取单文件内容（DiffViewer 用） */
  readFileContent(filePath: string): Promise<{ content: string; encoding: string }>;
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
