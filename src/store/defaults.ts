import type { CleanOptions, ConversionMode } from '../types';

/**
 * V4.0 精简版默认清洗选项（仅保留繁简 + 全半角转换）
 */
export const DEFAULT_CLEAN_OPTIONS: CleanOptions = {
  conversionMode: 'none' as ConversionMode,
  toHalfWidth: false,
};

// V3.2 新增默认值（V4.0 保留）
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

// V3.3 新增默认值（V4.0 精简：移除关键词搜索字段）
export const DEFAULT_V3_3_STATE = {
  isFullWidthConverted: false,
  isTraditionalConverted: false,
  minimapItems: [] as { color: 'green' | 'red' | 'orange'; tooltip: string }[],
  modifiedParagraphIds: new Set<string>(),
};
