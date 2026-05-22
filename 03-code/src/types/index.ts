// ═══════════════════════════════════════════
// V4.0 类型定义（连续文本 + 连接点模型）
// ═══════════════════════════════════════════

/** 合并结果（Rust napi 返回） */
export interface MergeResult {
  mergedText: string;
  connectionPoints: ConnectionPoint[];
  totalChars: number;
  filesMetadata: FileMeta[];
  skippedFiles: string[];
  encodingWarnings: string[];
}

/** 连接点 */
export interface ConnectionPoint {
  id: string;
  fileA: string;
  fileB: string;
  overlapLength: number;
  overlapSnippet: string;
  isAutoMerged: boolean;
  position: number;
}

/** 文件元数据 */
export interface FileMeta {
  fileName: string;
  fileSize: number;
  encoding: string;
}

/** 文件信息 */
export interface FileEntry {
  name: string;
  path: string;
  size: number;
}

/** 可拖拽排序文件项 */
export interface SortableFile {
  id: string;
  name: string;
  path: string;
  size: number;
  encoding: string;
}

/** 搜索匹配结果 */
export interface SearchResult {
  index: number;
  position: number;
  contextBefore: string;
  contextAfter: string;
  matchText: string;
}

/** 应用模式 */
export type AppMode = 'merge' | 'compare';

/** 撤销快照（V4.0：连续文本模型） */
export interface Snapshot {
  id: string;
  mergedText: string;
  connectionStates: Record<string, boolean>;
  modifiedFlags: string[];
  reason?: string;
  timestamp: number;
}

/** 文档对比对齐项 */
export interface DiffAlignment {
  type: 'match' | 'leftOnly' | 'rightOnly' | 'diff' | 'bothOnly';
  leftText?: string;
  rightText?: string;
  diffTokens?: DiffToken[];
}

/** 逐词差异标记 */
export interface DiffToken {
  text: string;
  isDiff: boolean;
}

/** Minimap 色条项 */
export interface MinimapItem {
  color: 'green' | 'red' | 'orange';
  tooltip: string;
}

/** Toast 消息 */
export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}
