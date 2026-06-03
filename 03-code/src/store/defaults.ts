import type { CleanOptions, ConversionMode, FeatureFlags } from '../types';

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
};

// V4.0 新增默认值（链式重叠合并 + 搜索替换模型）
export const DEFAULT_V4_0_STATE = {
  /** 合并后的完整连续文本 */
  mergedText: '',
  /** 连接点列表 */
  connectionPoints: [] as import('../types').ConnectionPoint[],
  /** 连接点合并/保留状态：cpId → boolean（true=合并） */
  connectionStates: {} as Record<string, boolean>,
  /** 重叠阈值（默认50，范围10~500） */
  overlapThreshold: 50,
  /** 是否正在分析 */
  isAnalyzing: false,
  /** 分析错误信息 */
  analyzeError: null as string | null,

  /** 搜索关键词 */
  searchKeyword: '',
  /** 替换文本 */
  replaceText: '',
  /** 是否区分大小写 */
  caseSensitive: false,
  /** 搜索结果列表 */
  searchResults: [] as import('../types').SearchResult[],
  /** 当前焦点匹配项索引 */
  currentMatchIndex: -1,
  /** 是否处于搜索模式 */
  isSearching: false,

  /** 最近一次导出前的快照（用于 revertToExport） */
  lastExportSnapshot: null as import('../types').Snapshot | null,
  /** 繁简转换防抖锁 */
  isConverting: false,
  /** 每个文件的归一化后完整内容 */
  fileContents: [] as string[],
  /** 连接点列表面板宽度（px） */
  connectionListWidth: 280,
  /** Toast 消息队列 */
  toastMessages: [] as import('../types').ToastMessage[],
};

// V4.0 Feature Flag 默认值（全部初始 false，按阶段逐步启用）
export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  diffViewer: true,
  cleaning: false,
  searchReplace: false,
  undoRedo: false,
  exportFeature: true,
  mergeCore: true,
};
