import { create } from 'zustand';
import type {
  DuplicateGroup,
  PreviewParagraph,
  FileEntry,
  SortableFile,
  AppStatus,
  SelectAllState,
  TriState,
  AppMode,
  Snapshot,
  DiffAlignment,
  ConnectionPoint,
  MergeResult,
  SearchResult,
  ToastMessage,
} from '../types';
import { DEFAULT_V3_2_STATE, DEFAULT_V3_3_STATE, DEFAULT_V4_0_STATE } from './defaults';

import { toSimplified, toTraditional } from '../utils/cjkConv';

// ==========================================
// 辅助函数
// ==========================================

// computeContentHash removed in V4.0 (no longer needed)
function detectEncoding(_path: string): string {
  // 前端无法检测编码，统一返回 UTF-8
  // 后端实际检测后通过 FileMeta 返回
  return 'UTF-8';
}

/** V3.3: 全角→半角字符转换（纯 TS，无依赖） */
function toHalfWidth(text: string): string {
  return text.replace(/[\uFF01-\uFF5E]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0xFEE0)
  ).replace(/\u3000/g, ' '); // 全角空格→半角空格
}

/** V3.3: 半角→全角字符转换（反向恢复） */
function toFullWidth(text: string): string {
  return text.replace(/[\u0021-\u007E]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) + 0xFEE0)
  ).replace(/ /g, '\u3000'); // 半角空格→全角空格
}

// ==========================================
// Store 接口定义（V4.0：连续文本 + 连接点模型）
// ==========================================

interface AppState {
  // ═══════════════════════════════════════════
  // V1.0 已有字段
  // ═══════════════════════════════════════════

  /** 应用状态 */
  status: AppStatus;
  errorMessage: string | null;

  /** 原始文件列表（用户添加的原始顺序） */
  fileList: FileEntry[];

  /** 重复组列表（左侧面板 — V4.0 保留用于兼容，数据来自 connectionPoints） */
  duplicateGroups: DuplicateGroup[];

  /** 后端返回的原始预览段落（只读 — V4.0 保留兼容） */
  originalPreview: PreviewParagraph[];

  /** 悬停状态 */
  hoveredParagraphId: string | null;
  hoveredSourceFiles: string[];
  hoverPosition: { x: number; y: number } | null;

  // ═══════════════════════════════════════════
  // V2.0 新增字段 — RQ-01 文件排序
  // ═══════════════════════════════════════════

  /** 用户排序后的可拖拽文件列表 */
  sortedFileList: SortableFile[];

  /** 当前拖拽中的文件 ID */
  activeDragFileId: string | null;

  // ═══════════════════════════════════════════
  // V2.0 新增字段 — RQ-02 段落勾选（V4.0 保留兼容）
  // ═══════════════════════════════════════════

  /** 当前工作预览段落列表（可被排版修改） */
  previewParagraphs: PreviewParagraph[];

  /** 段落勾选状态映射：paragraphId → isChecked */
  paragraphCheckedMap: Map<string, boolean>;

  /** Shift 多选：上次点击的段落 ID */
  lastClickedParagraphId: string | null;

  // ═══════════════════════════════════════════
  // V4.0 新增字段 — 连续文本 + 连接点模型
  // ═══════════════════════════════════════════

  /** 合并后的完整连续文本 */
  mergedText: string;
  /** 连接点列表 */
  connectionPoints: ConnectionPoint[];
  /** 连接点合并/保留状态 */
  connectionStates: Record<string, boolean>;
  /** 重叠阈值 */
  overlapThreshold: number;
  /** 是否正在分析 */
  isAnalyzing: boolean;
  /** 分析错误 */
  analyzeError: string | null;

  // ═══════════════════════════════════════════
  // V4.0 新增字段 — 搜索替换
  // ═══════════════════════════════════════════

  searchKeyword: string;
  replaceText: string;
  caseSensitive: boolean;
  searchResults: SearchResult[];
  currentMatchIndex: number;
  isSearching: boolean;

  // ═══════════════════════════════════════════
  // V3.2 新增字段 — 模式切换
  // ═══════════════════════════════════════════

  activeMode: AppMode;
  setActiveMode: (mode: AppMode) => void;

  // ═══════════════════════════════════════════
  // V3.2 新增字段 — 预览编辑（V4.0 保留）
  // ═══════════════════════════════════════════

  isEditing: boolean;
  toggleEditing: () => void;

  // ═══════════════════════════════════════════
  // V3.2 新增字段 — 撤回栈（V4.0：快照内容改为 mergedText 模型）
  // ═══════════════════════════════════════════

  undoStack: Snapshot[];
  undoPointer: number;
  pushSnapshot: (reason?: string) => void;
  undo: () => void;
  redo: () => void;
  clearUndoStack: () => void;

  // ═══════════════════════════════════════════
  // V4.0 新增字段 — 导出恢复
  // ═══════════════════════════════════════════

  lastExportSnapshot: Snapshot | null;
  /** 导出合并文本 */
  exportMergedText: () => Promise<void>;
  /** 恢复至最近一次导出前快照 */
  revertToExport: () => void;

  // ═══════════════════════════════════════════
  // V3.2 新增字段 — 拖拽遮罩
  // ═══════════════════════════════════════════

  isDragOverlayVisible: boolean;
  isDragRejecting: boolean;
  setDragOverlay: (visible: boolean, rejecting?: boolean) => void;

  // ═══════════════════════════════════════════
  // V3.2 新增字段 — 文档对比
  // ═══════════════════════════════════════════

  diffAlignment: DiffAlignment[];
  diffLeftFileName: string | null;
  diffRightFileName: string | null;
  setDiffResult: (alignment: DiffAlignment[], leftFile: string, rightFile: string) => void;

  // ═══════════════════════════════════════════
  // V3.3 新增字段 — RQ-05 双向切换（V4.0：改为操作 mergedText）
  // ═══════════════════════════════════════════

  isFullWidthConverted: boolean;
  isTraditionalConverted: boolean;
  /** 繁简转换防抖锁 */
  isConverting: boolean;
  toggleFullWidth: () => void;
  toggleTraditional: () => Promise<void>;

  // ═══════════════════════════════════════════
  // V4.0 新增字段 — UI 状态
  // ═══════════════════════════════════════════

  connectionListWidth: number;
  toastMessages: ToastMessage[];
  showToast: (text: string, type?: ToastMessage['type']) => void;
  removeToast: (id: string) => void;

  // ═══════════════════════════════════════════
  // V1.0 Actions
  // ═══════════════════════════════════════════

  setStatus: (status: AppStatus) => void;
  setError: (message: string | null) => void;
  addFiles: (files: FileEntry[]) => void;
  removeFile: (path: string) => void;
  clearFiles: () => void;
  /** V4.0 兼容保留：设置分析结果 */
  setAnalysisResult: (
    duplicateGroups: DuplicateGroup[],
    previewParagraphs: PreviewParagraph[],
    filesMetadata?: { fileName: string; fileSize: number; encoding: string }[]
  ) => void;
  /** V4.0：设置合并结果（链式重叠合并） */
  setMergeResult: (result: MergeResult) => void;
  /** 每个文件的归一化后完整内容 */
  fileContents: string[];
  setHoveredParagraph: (
    id: string | null,
    sourceFiles?: string[],
    position?: { x: number; y: number }
  ) => void;
  resetSession: () => void;

  // ═══════════════════════════════════════════
  // V2.0 Actions
  // ═══════════════════════════════════════════

  reorderFiles: (fromIndex: number, toIndex: number) => void;
  setActiveDragFileId: (id: string | null) => void;
  syncFileListToSorted: () => void;
  toggleParagraphCheck: (paragraphId: string) => void;
  batchToggleParagraphCheck: (paragraphIds: string[]) => void;
  toggleGroupCheckV2: (groupId: string) => void;
  selectAllParagraphs: () => void;
  deselectAllParagraphs: () => void;
  setLastClickedParagraphId: (id: string | null) => void;
  triggerReanalysis: () => Promise<void>;

  // ═══════════════════════════════════════════
  // V4.0 Actions — 合并引擎
  // ═══════════════════════════════════════════

  /** 调用 IPC merge-files → 分析 + 合并 */
  runMerge: () => Promise<void>;
  /** 切换连接点合并/保留状态 */
  toggleConnectionMerge: (cpId: string) => void;
  /** 更新重叠阈值 → 触发重新合并 */
  setOverlapThreshold: (t: number) => void;

  // ═══════════════════════════════════════════
  // V4.0 Actions — 搜索替换
  // ═══════════════════════════════════════════

  setSearchKeyword: (kw: string) => void;
  setReplaceText: (rt: string) => void;
  performSearch: (keyword: string) => void;
  replaceOne: () => void;
  replaceAll: () => void;
  clearSearch: () => void;

  // ═══════════════════════════════════════════
  // V4.0 Actions — Minimap（等比例压缩 + 点击跳转）
  // ═══════════════════════════════════════════

  minimapItemCount: number;
  minimapItems: { color: 'green' | 'red' | 'orange'; tooltip: string }[];
  updateMinimap: () => void;
  scrollToRatio: (ratio: number) => void;
}

// ==========================================
// Store 实现
// ==========================================

export const useStore = create<AppState>((set, get) => ({
  // ═══════════════════════════════════════════
  // 初始状态
  // ═══════════════════════════════════════════

  status: 'idle',
  errorMessage: null,
  fileList: [],
  duplicateGroups: [],
  originalPreview: [],
  hoveredParagraphId: null,
  hoveredSourceFiles: [],
  hoverPosition: null,

  // V2.0 新增字段
  sortedFileList: [],
  activeDragFileId: null,
  previewParagraphs: [],
  paragraphCheckedMap: new Map<string, boolean>(),
  lastClickedParagraphId: null,

  // V4.0 新增字段 — 连续文本模型
  ...DEFAULT_V4_0_STATE,

  // V4.0 Minimap
  minimapItemCount: 0,
  minimapItems: [],

  // V3.2 新增字段
  ...DEFAULT_V3_2_STATE,

  // V3.3 新增字段
  ...DEFAULT_V3_3_STATE,

  // ═══════════════════════════════════════════
  // V1.0 Actions
  // ═══════════════════════════════════════════

  setStatus: (status) => set({ status }),

  setError: (message) =>
    set({ errorMessage: message, status: message ? 'error' : 'idle' }),

  addFiles: (files) => {
    const state = get();
    const existingPaths = new Set(state.sortedFileList.map((f) => f.path));
    const newUnique = files.filter((f) => {
      if (existingPaths.has(f.path)) {
        get().showToast(`文件已存在: ${f.name}`, 'error');
        return false;
      }
      return true;
    });
    if (newUnique.length === 0) return;
    set((s) => {
      const newFileList = [...s.fileList, ...newUnique];
      const newSortableFiles: SortableFile[] = [
        ...s.sortedFileList,
        ...newUnique.map((f) => ({
          id: f.path,
          name: f.name,
          path: f.path,
          size: f.size,
          encoding: detectEncoding(f.path),
        })),
      ];
      return {
        fileList: newFileList,
        sortedFileList: newSortableFiles,
      };
    });
  },

  removeFile: (path) =>
    set((state) => {
      const removedName = path.split(/[/\\]/).pop() || '';
      const newFileList = state.fileList.filter((f) => f.path !== path);
      const newSortedList = state.sortedFileList.filter((f) => f.path !== path);
      const shouldReset = newFileList.length === 0;

      // BUG-19/20 修复：删除文件后清除 V4.0 状态，剩余文件触发重新合并
      if (shouldReset) {
        return {
          fileList: [], sortedFileList: [], duplicateGroups: [],
          originalPreview: [], previewParagraphs: [], paragraphCheckedMap: new Map(),
          mergedText: '', connectionPoints: [], connectionStates: {},
          fileContents: [],
          status: 'idle', minimapItems: [], minimapItemCount: 0,
        };
      }

      // V3.3 RQ-03: 删除文件后自动刷新重复组
      let newGroups = state.duplicateGroups;
      if (state.duplicateGroups.length > 0) {
        newGroups = state.duplicateGroups
          .map((group) => {
            const newSources = group.sources.filter((s) => s.fileName !== removedName);
            const uniqueFiles = new Set(newSources.map((s) => s.fileName));
            return { ...group, sources: newSources, occurrenceCount: uniqueFiles.size };
          })
          .filter((g) => g.occurrenceCount > 1);
      }

      let newPreview = state.previewParagraphs;
      if (state.previewParagraphs.length > 0) {
        newPreview = state.previewParagraphs.filter(
          (p) => p.sourceFiles.some((sf) => sf !== removedName)
        );
      }

      // 剩余文件 > 0 时触发重新合并
      if (newSortedList.length > 0) {
        setTimeout(() => get().runMerge(), 0);
      }

      return {
        fileList: newFileList, sortedFileList: newSortedList,
        duplicateGroups: newGroups, originalPreview: state.originalPreview,
        previewParagraphs: newPreview,
        paragraphCheckedMap: state.paragraphCheckedMap,
        searchKeyword: '', replaceText: '', searchResults: [], currentMatchIndex: -1, isSearching: false,
        status: 'loading',
      };
    }),

  clearFiles: () => set({ fileList: [], sortedFileList: [] }),

  setAnalysisResult: (duplicateGroups, previewParagraphs) =>
    set((state) => {
      // 尝试从旧的 paragraphCheckedMap 恢复勾选状态
      const newCheckedMap = new Map<string, boolean>();
      for (const newPara of previewParagraphs) {
        const oldPara = state.previewParagraphs.find(
          (p) => p.contentHash === newPara.contentHash
        );
        if (oldPara) {
          const oldState = state.paragraphCheckedMap.get(oldPara.id);
          newCheckedMap.set(newPara.id, oldState ?? true);
        } else {
          newCheckedMap.set(newPara.id, true);
        }
      }

      return {
        duplicateGroups,
        originalPreview: previewParagraphs,
        previewParagraphs,
        paragraphCheckedMap: newCheckedMap,
        lastClickedParagraphId: null,
        status: 'ready',
        errorMessage: null,
      };
    }),

  setHoveredParagraph: (id, sourceFiles, position) =>
    set({
      hoveredParagraphId: id,
      hoveredSourceFiles: sourceFiles ?? [],
      hoverPosition: position ?? null,
    }),

  resetSession: () =>
    set({
      status: 'idle',
      errorMessage: null,
      fileList: [],
      sortedFileList: [],
      duplicateGroups: [],
      originalPreview: [],
      previewParagraphs: [],
      paragraphCheckedMap: new Map<string, boolean>(),
      lastClickedParagraphId: null,
      hoveredParagraphId: null,
      hoveredSourceFiles: [],
      hoverPosition: null,
      activeDragFileId: null,
      ...DEFAULT_V3_2_STATE,
      ...DEFAULT_V3_3_STATE,
      ...DEFAULT_V4_0_STATE,
      minimapItems: [],
      minimapItemCount: 0,
    }),

  // ═══════════════════════════════════════════
  // V2.0 Actions — RQ-01
  // ═══════════════════════════════════════════

  reorderFiles: (fromIndex, toIndex) =>
    set((state) => {
      const newList = [...state.sortedFileList];
      const [moved] = newList.splice(fromIndex, 1);
      newList.splice(toIndex, 0, moved);
      return { sortedFileList: newList };
    }),

  setActiveDragFileId: (id) => set({ activeDragFileId: id }),

  syncFileListToSorted: () =>
    set((state) => {
      const newSorted: SortableFile[] = state.fileList.map((f) => ({
        id: f.path,
        name: f.name,
        path: f.path,
        size: f.size,
        encoding: detectEncoding(f.path),
      }));
      return { sortedFileList: newSorted };
    }),

  // ═══════════════════════════════════════════
  // V2.0 Actions — RQ-02
  // ═══════════════════════════════════════════

  toggleParagraphCheck: (paragraphId) =>
    set((state) => {
      const newMap = new Map(state.paragraphCheckedMap);
      const current = newMap.get(paragraphId) ?? true;
      newMap.set(paragraphId, !current);
      return {
        paragraphCheckedMap: newMap,
        lastClickedParagraphId: paragraphId,
      };
    }),

  batchToggleParagraphCheck: (paragraphIds) =>
    set((state) => {
      const newMap = new Map(state.paragraphCheckedMap);
      // 以这批段落中第一个的状态为基准
      const firstId = paragraphIds[0];
      if (!firstId) return state;
      const firstState = newMap.get(firstId) ?? true;
      const targetState = !firstState;
      for (const id of paragraphIds) {
        newMap.set(id, targetState);
      }
      return {
        paragraphCheckedMap: newMap,
        lastClickedParagraphId: paragraphIds[paragraphIds.length - 1],
      };
    }),

  toggleGroupCheckV2: (groupId) =>
    set((state) => {
      const group = state.duplicateGroups.find((g) => g.id === groupId);
      if (!group) return state;

      // 获取该 group 关联的所有段落
      const relatedIds = state.previewParagraphs
        .filter((p) => p.contentHash === group.contentHash)
        .map((p) => p.id);

      // 判断当前组状态
      const currentState = computeGroupState(group.contentHash, state);
      const newChecked = new Map(state.paragraphCheckedMap);

      // 三态切换逻辑：
      // 'unchecked' | 'indeterminate' → 全部取消（设为 false）
      // 'checked' → 全部恢复（设为 true）
      const targetValue = currentState === 'checked';
      for (const id of relatedIds) {
        newChecked.set(id, targetValue);
      }

      return { paragraphCheckedMap: newChecked };
    }),

  selectAllParagraphs: () =>
    set((state) => {
      const newMap = new Map(state.paragraphCheckedMap);
      for (const p of state.previewParagraphs) {
        newMap.set(p.id, true);
      }
      return { paragraphCheckedMap: newMap };
    }),

  deselectAllParagraphs: () =>
    set((state) => {
      const newMap = new Map(state.paragraphCheckedMap);
      for (const p of state.previewParagraphs) {
        newMap.set(p.id, false);
      }
      return { paragraphCheckedMap: newMap };
    }),

  setLastClickedParagraphId: (id) => set({ lastClickedParagraphId: id }),

  // ═══════════════════════════════════════════
  // V2.0 Actions — RQ-03

  /** 触发文件重新分析（拖拽排序后调用） */
  triggerReanalysis: async () => {
    const state = get();
    if (state.sortedFileList.length === 0) return;
    const paths = state.sortedFileList.map((f) => f.path);
    set({ status: 'loading', errorMessage: null, isAnalyzing: true });
    try {
      const { mergeFiles } = await import('../utils/ipc');
      const result = await mergeFiles(paths, state.overlapThreshold);
      get().setMergeResult(result);
    } catch (error) {
      set({ status: 'error', errorMessage: `重新分析失败: ${error}`, isAnalyzing: false });
    }
  },
  // ═══════════════════════════════════════════
  // V3.2 Actions
  // ═══════════════════════════════════════════

  setActiveMode: (mode) =>
    set((state) => {
      if (state.activeMode === mode) return state;
      return {
        activeMode: mode,
        undoStack: [],
        undoPointer: -1,
        isEditing: false,
        diffAlignment: [],
        diffLeftFileName: null,
        diffRightFileName: null,
      };
    }),

  toggleEditing: () => set((state) => ({ isEditing: !state.isEditing })),

  pushSnapshot: (reason) =>
    set((state) => {
      const snapshot: Snapshot = {
        id: crypto.randomUUID(),
        mergedText: state.mergedText,
        connectionStates: { ...state.connectionStates },
        modifiedFlags: [],
        reason: reason || '未命名操作',
        timestamp: Date.now(),
      };
      let newStack = state.undoStack.slice(0, state.undoPointer + 1);
      newStack.push(snapshot);
      if (newStack.length > 5) newStack.shift();
      return { undoStack: newStack, undoPointer: newStack.length - 1 };
    }),

  undo: () =>
    set((state) => {
      // BUG-14 修复：undoPointer < 0（初始值-1），不是 <= 0
      if (state.undoPointer < 0) return state;
      const newPointer = state.undoPointer - 1;
      const snap = state.undoStack[state.undoPointer];
      if (!snap) return state;
      return {
        undoPointer: newPointer,
        mergedText: snap.mergedText ?? state.mergedText,
        connectionStates: snap.connectionStates ?? state.connectionStates,
      };
    }),

  redo: () =>
    set((state) => {
      if (state.undoPointer >= state.undoStack.length - 1) return state;
      const newPointer = state.undoPointer + 1;
      const snap = state.undoStack[newPointer];
      if (!snap) return state;
      return {
        undoPointer: newPointer,
        mergedText: snap.mergedText ?? state.mergedText,
        connectionStates: snap.connectionStates ?? state.connectionStates,
      };
    }),

  clearUndoStack: () => set({ undoStack: [], undoPointer: -1 }),

  setDragOverlay: (visible, rejecting) =>
    set({ isDragOverlayVisible: visible, isDragRejecting: rejecting ?? false }),

  setDiffResult: (alignment, leftFile, rightFile) =>
    set({
      diffAlignment: alignment,
      diffLeftFileName: leftFile,
      diffRightFileName: rightFile,
    }),

  // ═══════════════════════════════════════════
  // V3.3 Actions — RQ-05 双向切换（V4.0：改为操作 mergedText 字符串）
  // ═══════════════════════════════════════════

  toggleFullWidth: () =>
    set((state) => {
      if (!state.mergedText) return state;
      const newConverted = !state.isFullWidthConverted;
      const resultText = newConverted ? toHalfWidth(state.mergedText) : toFullWidth(state.mergedText);
      return {
        isFullWidthConverted: newConverted,
        mergedText: resultText,
      };
    }),

  toggleTraditional: async () => {
    const state = get();
    if (state.isConverting || !state.mergedText) return;
    set({ isConverting: true });
    try {
      const newConverted = !state.isTraditionalConverted;
      const resultText = newConverted ? toSimplified(state.mergedText) : toTraditional(state.mergedText);
      get().pushSnapshot(newConverted ? '繁→简' : '简→繁');
      set({
        isTraditionalConverted: newConverted,
        mergedText: resultText,
        isConverting: false,
      });
    } catch {
      set({ isConverting: false });
    }
  },

  // ═══════════════════════════════════════════
  // V4.0 Actions — 合并引擎
  // ═══════════════════════════════════════════

  /**
   * runMerge — 调用 IPC merge-files 执行链式重叠合并
   * 读取 sortedFileList 中的路径，按用户排序顺序传给 Rust 引擎
   */
  runMerge: async () => {
    const state = get();
    if (state.sortedFileList.length === 0) return;
    if (state.isAnalyzing) return;

    set({ isAnalyzing: true, analyzeError: null, status: 'loading' });
    try {
      const paths = state.sortedFileList.map((f) => f.path);
      const { mergeFiles } = await import('../utils/ipc');
      const result = await mergeFiles(paths, state.overlapThreshold);
      get().setMergeResult(result);
    } catch (error: any) {
      set({ analyzeError: String(error), status: 'error', isAnalyzing: false });
    }
  },

  /**
   * setMergeResult — 设置合并结果并构建 connectionStates
   */
  setMergeResult: (result) =>
    set((state) => {
      const newStates: Record<string, boolean> = {};
      for (const cp of result.connectionPoints) {
        newStates[cp.id] = cp.isAutoMerged;
      }
      return {
        mergedText: result.mergedText,
        connectionPoints: result.connectionPoints,
        connectionStates: newStates,
        fileContents: result.fileContents,
        isAnalyzing: false,
        analyzeError: null,
        status: 'ready',
        // 同步更新 fileList 以反映 filesMetadata
        fileList: state.fileList.map((f) => {
          const meta = result.filesMetadata.find((m) => m.fileName === f.name);
          return meta ? { ...f, size: meta.fileSize } : f;
        }),
        // 更新 sortedFileList 的编码信息
        sortedFileList: state.sortedFileList.map((sf) => {
          const meta = result.filesMetadata.find((m) => {
            const sfName = sf.path.split(/[/\\]/).pop() || '';
            return m.fileName === sfName;
          });
          return meta ? { ...sf, encoding: meta.encoding } : sf;
        }),
      };
    }),

  /**
   * toggleConnectionMerge — 切换连接点的合并/保留状态
   * 即时更新预览区文本（重新构建 mergedText），debounced 500ms 入栈
   */
  toggleConnectionMerge: (cpId) =>
    set((state) => {
      const newStates = { ...state.connectionStates };
      newStates[cpId] = !(newStates[cpId] ?? true);

      console.log('[toggleConnectionMerge] cpId:', cpId, 'newState:', newStates[cpId]);
      console.log('[toggleConnectionMerge] fileContents:', state.fileContents);
      console.log('[toggleConnectionMerge] connectionPoints:', state.connectionPoints.map(cp => ({ id: cp.id, overlap: cp.overlapLength, auto: cp.isAutoMerged })));
      console.log('[toggleConnectionMerge] connectionStates (before):', state.connectionStates);

      // 根据 fileContents 和连接状态重建 mergedText
      if (!state.fileContents || state.fileContents.length === 0) {
        console.warn('[toggleConnectionMerge] fileContents empty, cannot rebuild');
        return { connectionStates: newStates };
      }

      let rebuilt = state.fileContents[0];
      for (let i = 1; i < state.fileContents.length; i++) {
        const cp = state.connectionPoints[i - 1];
        if (!cp) { rebuilt += '\n' + state.fileContents[i]; continue; }
        const isMerged = newStates[cp.id] ?? cp.isAutoMerged;
        if (isMerged && cp.overlapLength > 0) {
          // 合并态且有重叠：在 rebuilt 中找到重叠文本位置，原地插入剩余内容
          const overlapText = state.fileContents[i].slice(0, cp.overlapLength);
          const insertPos = rebuilt.indexOf(overlapText);
          if (insertPos >= 0) {
            const afterOverlap = insertPos + overlapText.length;
            const unique = state.fileContents[i].slice(cp.overlapLength);
            console.log(`[toggleConnectionMerge] file[${i}] merged: insert unique at pos ${afterOverlap}`);
            rebuilt = rebuilt.slice(0, afterOverlap) + unique + rebuilt.slice(afterOverlap);
          } else {
            // 兜底：追加到末尾
            console.log(`[toggleConnectionMerge] file[${i}] overlap text not found, appending`);
            rebuilt += '\n' + state.fileContents[i];
          }
        } else {
          // 保留态 / 无重叠：完整追加（带 \n 分隔）
          console.log(`[toggleConnectionMerge] file[${i}] ${isMerged ? 'merged(overlap=0)' : 'cut'}: appending with \\n`);
          rebuilt += '\n' + state.fileContents[i];
        }
      }

      console.log('[toggleConnectionMerge] rebuilt mergedText:', JSON.stringify(rebuilt));
      return { connectionStates: newStates, mergedText: rebuilt };
    }),

  /**
   * setOverlapThreshold — 更新重叠阈值，持久化并触发重新合并
   */
  setOverlapThreshold: (t) => {
    const clamped = Math.max(10, Math.min(500, Math.round(t / 10) * 10));
    set({ overlapThreshold: clamped });
    // 如果已有文件，自动触发重新合并
    const state = get();
    if (state.sortedFileList.length > 1) {
      state.runMerge();
    }
  },

  // ═══════════════════════════════════════════
  // V4.0 Actions — 导出
  // ═══════════════════════════════════════════

  /**
   * exportMergedText — 导出 mergedText（排除连接标记）为 .txt 文件
   * 导出前记录快照，支持 revertToExport 恢复
   */
  exportMergedText: async () => {
    const state = get();
    if (!state.mergedText || state.mergedText.trim().length === 0) {
      get().showToast('没有可导出的内容', 'error');
      return;
    }
    // 记录导出前快照
    const snapshot: Snapshot = {
      id: crypto.randomUUID(),
      mergedText: state.mergedText,
      connectionStates: { ...state.connectionStates },
      modifiedFlags: [],
      reason: '导出前',
      timestamp: Date.now(),
    };
    set({ lastExportSnapshot: snapshot });

    try {
      const { exportFile } = await import('../utils/ipc');
      // 排除连接标记（以 ┈┈ 开头的行）
      const cleanText = state.mergedText
        .split('\n')
        .filter((line) => !line.trimStart().startsWith('┈┈'))
        .join('\n');
      const defaultName = (state.sortedFileList[0]?.name || 'merged').replace(/\.txt$/i, '') + '_merged.txt';
      const result = await exportFile(cleanText, defaultName);
      if (!result.savedPath) {
        return; // 用户取消了保存对话框，无提示
      }
      get().showToast('导出成功！', 'success');
    } catch (error: any) {
      get().showToast(`导出失败: ${error}`, 'error');
    }
  },

  /**
   * revertToExport — 恢复至最近一次导出前的快照
   */
  revertToExport: () =>
    set((state) => {
      if (!state.lastExportSnapshot) return state;
      return {
        mergedText: state.lastExportSnapshot.mergedText,
        connectionStates: { ...state.lastExportSnapshot.connectionStates },
      };
    }),

  // ═══════════════════════════════════════════
  // V4.0 Actions — 搜索替换
  // ═══════════════════════════════════════════

  setSearchKeyword: (kw) => set({ searchKeyword: kw }),
  setReplaceText: (rt) => set({ replaceText: rt }),

  performSearch: (keyword) => {
    const state = get();
    if (!keyword || !state.mergedText) {
      set({ searchResults: [], currentMatchIndex: -1, isSearching: false });
      return;
    }
    // BUG-21 修复：requestIdleCallback 分片 + 限 50 结果
    const doSearch = () => {
      const currentState = get();
      if (currentState.searchKeyword !== keyword) return;
      const results: SearchResult[] = [];
      const flags = currentState.caseSensitive ? 'g' : 'gi';
      const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      let regex: RegExp;
      try { regex = new RegExp(escaped, flags); } catch { return; }
      const text = currentState.mergedText;
      const ctxLen = 10;
      let match: RegExpExecArray | null;
      let count = 0;
      while ((match = regex.exec(text)) !== null && count < 50) {
        const pos = match.index;
        results.push({
          position: pos, index: count, matchText: match[0],
          contextBefore: text.slice(Math.max(0, pos - ctxLen), pos),
          contextAfter: text.slice(pos + match[0].length, Math.min(text.length, pos + match[0].length + ctxLen)),
        });
        count++;
      }
      set({ searchResults: results, currentMatchIndex: results.length > 0 ? 0 : -1, isSearching: true });
    };
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(doSearch, { timeout: 500 });
    } else {
      setTimeout(doSearch, 10);
    }
  },

  replaceOne: () =>
    set((state) => {
      if (state.currentMatchIndex < 0 || state.searchResults.length === 0) return state;
      const match = state.searchResults[state.currentMatchIndex];
      if (!match) return state;
      const before = state.mergedText.slice(0, match.position);
      const after = state.mergedText.slice(match.position + match.matchText.length);
      const newText = before + state.replaceText + after;
      // BUG-11 修复：快照逻辑内联到同一 set 回调，避免嵌套 set 竞态
      const snapshot: Snapshot = {
        id: crypto.randomUUID(),
        mergedText: state.mergedText,
        connectionStates: { ...state.connectionStates },
        modifiedFlags: [],
        reason: '替换一处',
        timestamp: Date.now(),
      };
      let newStack = state.undoStack.slice(0, state.undoPointer + 1);
      newStack.push(snapshot);
      if (newStack.length > 5) newStack.shift();
      // 调整后续匹配项位置
      const delta = state.replaceText.length - match.matchText.length;
      const nextResults = state.searchResults
        .filter((_, i) => i !== state.currentMatchIndex)
        .map((r) => (r.position > match.position ? { ...r, position: r.position + delta } : r));
      const nextIdx = nextResults.length > 0 ? Math.min(state.currentMatchIndex, nextResults.length - 1) : -1;
      const wasLast = nextResults.length === 0;
      return {
        mergedText: newText,
        undoStack: newStack,
        undoPointer: newStack.length - 1,
        searchResults: nextResults,
        currentMatchIndex: nextIdx,
        isSearching: !wasLast,
        ...(wasLast ? { searchKeyword: '', replaceText: '' } : {}),
      };
    }),

  replaceAll: () =>
    set((state) => {
      if (!state.searchKeyword || state.searchResults.length === 0) return state;
      const flags = state.caseSensitive ? 'g' : 'gi';
      const escaped = state.searchKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, flags);
      const count = state.searchResults.length;
      const newText = state.mergedText.replace(regex, state.replaceText);
      // BUG-11 修复：快照逻辑内联到同一 set 回调
      const snapshot: Snapshot = {
        id: crypto.randomUUID(),
        mergedText: state.mergedText,
        connectionStates: { ...state.connectionStates },
        modifiedFlags: [],
        reason: `全部替换 ${count} 处`,
        timestamp: Date.now(),
      };
      let newStack = state.undoStack.slice(0, state.undoPointer + 1);
      newStack.push(snapshot);
      if (newStack.length > 5) newStack.shift();
      return {
        mergedText: newText,
        undoStack: newStack,
        undoPointer: newStack.length - 1,
        searchResults: [],
        currentMatchIndex: -1,
        isSearching: false,
        searchKeyword: '',
        replaceText: '',
      };
    }),

  clearSearch: () =>
    set({
      searchKeyword: '',
      replaceText: '',
      searchResults: [],
      currentMatchIndex: -1,
      isSearching: false,
    }),

  // ═══════════════════════════════════════════
  // V4.0 Actions — Toast 消息
  // ═══════════════════════════════════════════

  showToast: (text, type = 'info') =>
    set((state) => {
      const toast: ToastMessage = {
        id: crypto.randomUUID(),
        text,
        type,
        timestamp: Date.now(),
      };
      const newMessages = [...state.toastMessages, toast].slice(-5); // 最多保留5条
      // 3秒后自动移除
      setTimeout(() => get().removeToast(toast.id), 3000);
      return { toastMessages: newMessages };
    }),

  removeToast: (id) =>
    set((state) => ({
      toastMessages: state.toastMessages.filter((t) => t.id !== id),
    })),

  // ═══════════════════════════════════════════
  // V4.0 Actions — Minimap（等比例压缩 + 点击跳转）
  // ═══════════════════════════════════════════

  /**
   * updateMinimap — 根据预览区容器高度动态计算 N ≈ height/3，更新色条
   */
  updateMinimap: () => {
    const state = get();
    if (!state.mergedText) {
      set({ minimapItems: [], minimapItemCount: 0 });
      return;
    }
    const container = document.querySelector('[data-preview-container]');
    const h = container ? (container as HTMLElement).clientHeight : 600;
    const N = Math.max(1, Math.floor(h / 3));
    const totalLines = state.mergedText.split('\n').length;
    const linesPerChunk = Math.ceil(totalLines / N);

    // 预先计算每行字符偏移，用于判断连接点位置
    const lines = state.mergedText.split('\n');
    const lineOffsets: number[] = [0];
    for (let i = 0; i < lines.length; i++) {
      lineOffsets.push(lineOffsets[i] + lines[i].length + 1); // +1 for \n
    }

    const items: { color: 'green' | 'red' | 'orange'; tooltip: string }[] = [];
    for (let i = 0; i < N; i++) {
      const startLine = i * linesPerChunk;
      const endLine = Math.min(startLine + linesPerChunk, totalLines);
      const startChar = lineOffsets[Math.min(startLine, lineOffsets.length - 1)];
      const endChar = lineOffsets[Math.min(endLine, lineOffsets.length - 1)];

      // 判断是否有连接点落入此 chunk
      const hasCP = state.connectionPoints.some(
        (cp) => cp.position >= startChar && cp.position < endChar
      );
      const color: 'green' | 'orange' = hasCP ? 'orange' : 'green';

      items.push({
        color,
        tooltip: hasCP
          ? `${startLine + 1}–${endLine}行 · 连接点`
          : `${startLine + 1}–${endLine}行`,
      });
    }
    set({ minimapItems: items, minimapItemCount: N });
  },

  /**
   * scrollToRatio — Minimap 点击 → 按比例跳转
   * scrollTop = 全文总高度 × ratio
   */
  scrollToRatio: (ratio: number) => {
    const el = document.querySelector('[data-preview-container]');
    if (!el) return;
    const target = el.scrollHeight * Math.max(0, Math.min(1, ratio));
    el.scrollTo({ top: target, behavior: 'smooth' });
  },
}));

// ==========================================
// 派生状态计算函数
// ==========================================

/**
 * 计算已排除段落数
 */
export function computeExcludedCount(
  previewParagraphs: PreviewParagraph[],
  paragraphCheckedMap: Map<string, boolean>
): number {
  return previewParagraphs.filter(
    (p) => (paragraphCheckedMap.get(p.id) ?? true) === false
  ).length;
}

/**
 * 计算全选按钮状态
 */
export function computeSelectAllState(
  previewParagraphs: PreviewParagraph[],
  paragraphCheckedMap: Map<string, boolean>
): SelectAllState {
  const total = previewParagraphs.length;
  if (total === 0) return 'none';
  const checked = previewParagraphs.filter(
    (p) => (paragraphCheckedMap.get(p.id) ?? true) !== false
  ).length;
  if (checked === total) return 'all';
  if (checked === 0) return 'none';
  return 'partial';
}

/**
 * 计算重复组的三态状态
 */
export function computeGroupState(
  groupHash: string,
  state: { previewParagraphs: PreviewParagraph[]; paragraphCheckedMap: Map<string, boolean> }
): TriState {
  const relatedIds = state.previewParagraphs
    .filter((p) => p.contentHash === groupHash)
    .map((p) => p.id);

  if (relatedIds.length === 0) return 'unchecked';

  const checkedCount = relatedIds.filter(
    (id) => (state.paragraphCheckedMap.get(id) ?? true) !== false
  ).length;

  if (checkedCount === 0) return 'checked';
  if (checkedCount === relatedIds.length) return 'unchecked';
  return 'indeterminate';
}

/**
 * 计算导出段落列表（仅 isChecked = true 的段落）
 */
export function computeExportParagraphs(
  previewParagraphs: PreviewParagraph[],
  paragraphCheckedMap: Map<string, boolean>
): PreviewParagraph[] {
  return previewParagraphs.filter(
    (p) => (paragraphCheckedMap.get(p.id) ?? true) !== false
  );
}
