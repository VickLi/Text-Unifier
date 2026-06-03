/** 来源信息：记录段落来自哪个文件的哪一行 */
export interface SourceInfo {
  fileName: string;
  startLine: number;
}

/** 重复组：一组相同的段落 */
export interface DuplicateGroup {
  id: string;
  contentHash: string;
  snippet: string;
  sources: SourceInfo[];
  occurrenceCount: number;
}

/** 预览段落：用于右侧预览区的单个段落 */
export interface PreviewParagraph {
  id: string;
  text: string;
  contentHash: string;
  sourceFiles: string[];
  isOriginal: boolean;
}

/** 分析报告：扫描文件后的完整结果 */
export interface AnalysisReport {
  duplicateGroups: DuplicateGroup[];
  previewParagraphs: PreviewParagraph[];
  totalFiles: number;
  /** 文件元数据列表 */
  filesMetadata: FileMeta[];
}

/** 文件元数据（V4.0：新增 encoding 字段） */
export interface FileMeta {
  fileName: string;
  fileSize: number;
  encoding: string;
}

/** 导出结果 */
// BUG-V3.1.2-001: napi-rs #[napi(object)] converts saved_path → savedPath
export interface ExportResult {
  savedPath: string;
}

/** 文件信息 */
export interface FileEntry {
  name: string;
  path: string;
  size: number;
}

/** 可拖拽排序文件项 */
export interface SortableFile {
  /** 唯一标识（使用文件路径） */
  id: string;
  name: string;
  path: string;
  size: number;
  /** 检测到的编码 */
  encoding: string;
}

/** 三态复选框状态 */
export type TriState = 'checked' | 'unchecked' | 'indeterminate';

/** 全选按钮状态 */
export type SelectAllState = 'all' | 'partial' | 'none';

/** 应用状态枚举 */
export type AppStatus = 'idle' | 'loading' | 'ready' | 'error';

// ═══════════════════════════════════════════
// V3.1 新增类型
// ═══════════════════════════════════════════

/** 繁简转换模式 */
export type ConversionMode = 'none' | 't2s' | 's2t';

/** 内容清洗选项（V4.0 精简版：仅保留繁简 + 全半角转换） */
export interface CleanOptions {
  conversionMode: ConversionMode;
  toHalfWidth: boolean;
}

// ═══════════════════════════════════════════
// V3.2 新增类型
// ═══════════════════════════════════════════

/** 应用模式 */
export type AppMode = 'merge' | 'compare';

/**
 * 撤销快照（V4.0：改用 mergedText + connectionStates + modifiedFlags 模型）
 */
export interface Snapshot {
  id: string;
  /** V4.0：合并后的完整连续文本 */
  mergedText: string;
  /** V4.0：连接点合并/保留状态 */
  connectionStates: Record<string, boolean>;
  /** V4.0：修改标记集合（序列化为 string[]） */
  modifiedFlags: string[];
  reason?: string;
  timestamp: number;
}

/** 文档对比对齐项 */
export interface DiffAlignment {
  type: 'match' | 'leftOnly' | 'rightOnly' | 'bothOnly' | 'diff';
  leftText?: string;
  rightText?: string;
  diffTokens?: DiffToken[];
}

/** 逐词差异标记 */
export interface DiffToken {
  text: string;
  isDiff: boolean;
}

// ═══════════════════════════════════════════
// V3.3 新增类型
// ═══════════════════════════════════════════

/** Minimap 色条项 */
export interface MinimapItem {
  color: 'green' | 'red' | 'orange';
  tooltip: string;
}

// ═══════════════════════════════════════════
// V4.0 新增类型 — 链式重叠合并模型
// ═══════════════════════════════════════════

/** 连接点：相邻文件间的重叠信息 */
export interface ConnectionPoint {
  /** 连接点唯一标识（cp_0, cp_1, ...） */
  id: string;
  /** 前一个文件名 */
  fileA: string;
  /** 后一个文件名 */
  fileB: string;
  /** 重叠字符数 */
  overlapLength: number;
  /** 重叠文本截断（前50字符） */
  overlapSnippet: string;
  /** 是否自动合并（重叠 ≥ 阈值） */
  isAutoMerged: boolean;
  /** 连接点在 mergedText 中的字符偏移 */
  position: number;
}

/** 合并结果：Rust merge_files 返回 */
export interface MergeResult {
  /** 合并后的完整连续文本 */
  mergedText: string;
  /** 连接点列表 */
  connectionPoints: ConnectionPoint[];
  /** 总字符数 */
  totalChars: number;
  /** 各文件元数据 */
  filesMetadata: FileMeta[];
  /** 被完全包含而跳过的文件名列表 */
  skippedFiles: string[];
  /** 编码探测警告 */
  encodingWarnings: string[];
  /** 每个文件的归一化后完整内容（用于前端动态重建 mergedText） */
  fileContents: string[];
}

/** 搜索结果项 */
export interface SearchResult {
  /** 匹配项在 mergedText 中的字符偏移 */
  position: number;
  /** 匹配项在搜索结果中的序号 */
  index: number;
  /** 匹配文本 */
  matchText: string;
  /** 前15字上下文 */
  contextBefore: string;
  /** 后15字上下文 */
  contextAfter: string;
}

/** Toast 消息 */
export interface ToastMessage {
  id: string;
  text: string;
  type: 'info' | 'success' | 'error';
  timestamp: number;
}

// V4.0 Feature Flag 已移除（v4.0-full-stable）
