import type { CleanOptions, FormatOptions, ConversionMode } from '../types';

export const DEFAULT_CLEAN_OPTIONS: CleanOptions = {
  conversionMode: 'none' as ConversionMode,
  toHalfWidth: false,
  stripArtifacts: true,
  // removeLineEndNumbers 已在 V3.3 RQ-07 中移除
  filterKeywords: '',
  filterMaxLength: 0,
};

export const DEFAULT_FORMAT_OPTIONS: FormatOptions = {
  enableChapterFormat: true,
  enableSmartLineBreak: true,
  enableIndent: true,
  removeAdjacentDup: true,
  enableParagraphSplit: false,
};

// V3.2 新增默认值
export const DEFAULT_V3_2_STATE = {
  activeMode: 'merge' as const,
  isEditing: false,
  undoStack: [] as any[],
  undoPointer: -1,
  isDragOverlayVisible: false,
  isDragRejecting: false,
  diffAlignment: [] as any[],
  diffLeftFileName: null as string | null,
  diffRightFileName: null as string | null,
};

// V3.3 新增默认值
export const DEFAULT_V3_3_STATE = {
  isFullWidthConverted: false,
  isTraditionalConverted: false,
  minimapItems: [] as { color: 'green' | 'red' | 'orange'; tooltip: string }[],
  keywordSearchIndex: 0,
  highlightedLineIndex: null as number | null,
  modifiedParagraphIds: new Set<string>(),
};
