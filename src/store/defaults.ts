import type { CleanOptions, FormatOptions, ConversionMode } from '../types';

export const DEFAULT_CLEAN_OPTIONS: CleanOptions = {
  conversionMode: 'none' as ConversionMode,
  toHalfWidth: false,
  stripArtifacts: true,
  removeLineEndNumbers: false,
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
