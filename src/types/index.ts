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

/** 文件元数据 */
export interface FileMeta {
  fileName: string;
  fileSize: number;
  modified: number;
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

/** 内容清洗选项（Phase 1） */
export interface CleanOptions {
  conversionMode: ConversionMode;
  toHalfWidth: boolean;
  stripArtifacts: boolean;
  removeLineEndNumbers: boolean;
  filterKeywords: string;
  filterMaxLength: number;
}

/** 排版增强选项（Phase 4） */
export interface FormatOptions {
  enableChapterFormat: boolean;
  enableSmartLineBreak: boolean;
  enableIndent: boolean;
  removeAdjacentDup: boolean;
  enableParagraphSplit: boolean;
}

/** 章节信息 */
export interface ChapterInfo {
  title: string;
  order: number | null;
  startIndex: number;
  paragraphCount: number;
}

// ═══════════════════════════════════════════
// V3.2 新增类型
// ═══════════════════════════════════════════

/** 应用模式 */
export type AppMode = 'merge' | 'compare';

/** 撤销快照 */
export interface Snapshot {
  id: string;
  paragraphs: PreviewParagraph[];
  checkedMap: Record<string, boolean>;
  reason?: string;
  timestamp: number;
}

/** 文档对比对齐项 */
export interface DiffAlignment {
  type: 'match' | 'leftOnly' | 'rightOnly' | 'diff';
  leftText?: string;
  rightText?: string;
  diffTokens?: DiffToken[];
}

/** 逐词差异标记 */
export interface DiffToken {
  text: string;
  isDiff: boolean;
}
