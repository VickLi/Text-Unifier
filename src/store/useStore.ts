import { create } from 'zustand';
import type {
  DuplicateGroup,
  PreviewParagraph,
  FileEntry,
  SortableFile,
  AppStatus,
  SelectAllState,
  TriState,
  CleanOptions,
  AppMode,
  Snapshot,
  DiffAlignment,
  MinimapItem,
} from '../types';
import { DEFAULT_CLEAN_OPTIONS, DEFAULT_V3_2_STATE, DEFAULT_V3_3_STATE } from './defaults';

import { toSimplified, toTraditional } from '../utils/cjkConv';

// ==========================================
// 辅助函数
// ==========================================

/** BUG-028: 计算文本的 SHA-256 哈希（使用 Web Crypto API） */
async function computeContentHash(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/** 文件名转编码标签 */
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
// Store 接口定义（V2.0 完整版）
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

  /** 重复组列表（左侧面板） */
  duplicateGroups: DuplicateGroup[];

  /** 后端返回的原始预览段落（只读） */
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
  // V2.0 新增字段 — RQ-02 段落勾选
  // ═══════════════════════════════════════════

  /** 当前工作预览段落列表（可被排版修改） */
  previewParagraphs: PreviewParagraph[];

  /** 段落勾选状态映射：paragraphId → isChecked */
  paragraphCheckedMap: Map<string, boolean>;

  /** Shift 多选：上次点击的段落 ID */
  lastClickedParagraphId: string | null;

  // ═══════════════════════════════════════════
  // V1.0 Actions
  // ═══════════════════════════════════════════

  setStatus: (status: AppStatus) => void;
  setError: (message: string | null) => void;
  addFiles: (files: FileEntry[]) => void;
  removeFile: (path: string) => void;
  clearFiles: () => void;
  // BUG-V3.1.2-002: napi-rs 自动转换 file_name→fileName, file_size→fileSize
  setAnalysisResult: (
    duplicateGroups: DuplicateGroup[],
    previewParagraphs: PreviewParagraph[],
    filesMetadata?: { fileName: string; fileSize: number; modified: number }[]
  ) => void;
  setHoveredParagraph: (
    id: string | null,
    sourceFiles?: string[],
    position?: { x: number; y: number }
  ) => void;
  resetSession: () => void;

  // ═══════════════════════════════════════════
  // V2.0 新增 Actions — RQ-01
  // ═══════════════════════════════════════════

  /** 拖拽排序文件 */
  reorderFiles: (fromIndex: number, toIndex: number) => void;

  /** 设置拖拽中的文件 ID */
  setActiveDragFileId: (id: string | null) => void;

  /** 将 fileList 同步为 sortedFileList */
  syncFileListToSorted: () => void;

  // ═══════════════════════════════════════════
  // V2.0 新增 Actions — RQ-02
  // ═══════════════════════════════════════════

  /** 切换单个段落勾选状态 */
  toggleParagraphCheck: (paragraphId: string) => void;

  /** 批量切换一组段落的勾选状态（Shift 多选） */
  batchToggleParagraphCheck: (paragraphIds: string[]) => void;

  /** 切换重复组勾选（V2.0 三态联动版） */
  toggleGroupCheckV2: (groupId: string) => void;

  /** 全选所有段落 */
  selectAllParagraphs: () => void;

  /** 取消全选所有段落 */
  deselectAllParagraphs: () => void;

  /** 更新 Shift 多选的锚点 */
  setLastClickedParagraphId: (id: string | null) => void;

  // ═══════════════════════════════════════════
  // V2.0.1 新增 Actions — BUG-026
  // ═══════════════════════════════════════════

  /** 触发文件重新分析（拖拽排序后调用，BUG-026 修复） */
  triggerReanalysis: () => Promise<void>;

  // ═══════════════════════════════════════════
  // V3.2 新增字段 — 模式切换
  // ═══════════════════════════════════════════

  activeMode: AppMode;
  setActiveMode: (mode: AppMode) => void;

  // ═══════════════════════════════════════════
  // V3.2 新增字段 — 预览编辑
  // ═══════════════════════════════════════════

  isEditing: boolean;
  toggleEditing: () => void;

  // ═══════════════════════════════════════════
  // V3.2 新增字段 — 撤回栈
  // ═══════════════════════════════════════════

  undoStack: Snapshot[];
  undoPointer: number;
  pushSnapshot: (reason?: string) => void;
  undo: () => void;
  redo: () => void;
  clearUndoStack: () => void;

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
  // V3.3 新增字段 — RQ-05 双向切换
  // ═══════════════════════════════════════════

  isFullWidthConverted: boolean;
  isTraditionalConverted: boolean;
  toggleFullWidth: () => void;
  toggleTraditional: () => void;

  // ═══════════════════════════════════════════
  // V3.3 新增字段 — RQ-04 预览条
  // ═══════════════════════════════════════════

  minimapItems: MinimapItem[];
  _updateMinimap: () => void;

  // ═══════════════════════════════════════════
  // V3.3 新增字段 — RQ-08 段落修改跟踪
  // ═══════════════════════════════════════════

  modifiedParagraphIds: Set<string>;
  _markModifiedParagraphs: (before: PreviewParagraph[], after: PreviewParagraph[]) => void;

  // ═══════════════════════════════════════════
  // V3.3 新增 Actions
  // ═══════════════════════════════════════════

  jumpToParagraph: (index: number) => void;
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

  addFiles: (files) =>
    set((state) => {
      const newFileList = [...state.fileList, ...files];
      // 同步更新 sortedFileList
      const newSortableFiles: SortableFile[] = [
        ...state.sortedFileList,
        ...files.map((f) => ({
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
    }),

  removeFile: (path) =>
    set((state) => {
      const removedName = path.split(/[/\\]/).pop() || '';
      const newFileList = state.fileList.filter((f) => f.path !== path);
      const newSortedList = state.sortedFileList.filter((f) => f.path !== path);
      const shouldReset = newFileList.length === 0;

      // V3.3 RQ-03: 删除文件后自动刷新重复组
      let newGroups = state.duplicateGroups;
      if (!shouldReset && state.duplicateGroups.length > 0) {
        newGroups = state.duplicateGroups
          .map((group) => {
            const newSources = group.sources.filter((s) => s.fileName !== removedName);
            const uniqueFiles = new Set(newSources.map((s) => s.fileName));
            return { ...group, sources: newSources, occurrenceCount: uniqueFiles.size };
          })
          .filter((g) => g.occurrenceCount > 1);
      }

      // V3.3.1 BUG-003 修复：同步更新 previewParagraphs
      let newPreview = state.previewParagraphs;
      if (!shouldReset && state.previewParagraphs.length > 0) {
        newPreview = state.previewParagraphs.filter(
          (p) => p.sourceFiles.some((sf) => sf !== removedName)
        );
        if (newPreview.length === 0) {
          return {
            fileList: newFileList,
            sortedFileList: newSortedList,
            duplicateGroups: [],
            originalPreview: [],
            previewParagraphs: [],
            paragraphCheckedMap: new Map(),
            status: 'idle',
            modifiedParagraphIds: new Set(),
          };
        }
      }

      return {
        fileList: newFileList,
        sortedFileList: newSortedList,
        duplicateGroups: shouldReset ? [] : newGroups,
        originalPreview: shouldReset ? [] : state.originalPreview,
        previewParagraphs: shouldReset ? [] : newPreview,
        paragraphCheckedMap: shouldReset ? new Map() : state.paragraphCheckedMap,
        status: shouldReset ? 'idle' : state.status,
        modifiedParagraphIds: new Set<string>(),
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
    // 使用 sortedFileList 中的排序后的路径
    const paths = state.sortedFileList.map((f) => f.path);
    set({ status: 'loading', errorMessage: null });
    try {
      const { scanFiles: scanFilesIpc } = await import('../utils/ipc');
      const report = await scanFilesIpc(paths);
      set((inner) => {
        // 保留旧勾选状态
        const newCheckedMap = new Map<string, boolean>();
        for (const newPara of report.previewParagraphs) {
          const oldPara = inner.previewParagraphs.find(
            (p) => p.contentHash === newPara.contentHash
          );
          if (oldPara) {
            const oldState = inner.paragraphCheckedMap.get(oldPara.id);
            newCheckedMap.set(newPara.id, oldState ?? true);
          } else {
            newCheckedMap.set(newPara.id, true);
          }
        }
        return {
          duplicateGroups: report.duplicateGroups,
          originalPreview: report.previewParagraphs,
          previewParagraphs: report.previewParagraphs,
          paragraphCheckedMap: newCheckedMap,
          status: 'ready',
        };
      });
    } catch (error) {
      set({ status: 'error', errorMessage: `重新分析失败: ${error}` });
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
        paragraphs: structuredClone(state.previewParagraphs),
        checkedMap: Object.fromEntries(state.paragraphCheckedMap),
        reason: reason || '未命名操作',
        timestamp: Date.now(),
      };
      let newStack = state.undoStack.slice(0, state.undoPointer + 1);
      newStack.push(snapshot);
      if (newStack.length > 5) newStack.shift();
      return { undoStack: newStack, undoPointer: newStack.length - 1 };
    }),

  // BUG-V3.2-001: checkedMap 防御性空值检查
  undo: () =>
    set((state) => {
      if (state.undoPointer <= 0) return state;
      const newPointer = state.undoPointer - 1;
      const snap = state.undoStack[newPointer];
      if (!snap) return state;
      const checkedEntries = snap.checkedMap ? Object.entries(snap.checkedMap) : [];
      return {
        undoPointer: newPointer,
        previewParagraphs: structuredClone(snap.paragraphs ?? state.previewParagraphs),
        paragraphCheckedMap: new Map(checkedEntries),
      };
    }),

  redo: () =>
    set((state) => {
      if (state.undoPointer >= state.undoStack.length - 1) return state;
      const newPointer = state.undoPointer + 1;
      const snap = state.undoStack[newPointer];
      if (!snap) return state;
      const checkedEntries = snap.checkedMap ? Object.entries(snap.checkedMap) : [];
      return {
        undoPointer: newPointer,
        previewParagraphs: structuredClone(snap.paragraphs ?? state.previewParagraphs),
        paragraphCheckedMap: new Map(checkedEntries),
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
  // V3.3 Actions — RQ-05 双向切换
  // ═══════════════════════════════════════════

  toggleFullWidth: () =>
    set((state) => {
      const newConverted = !state.isFullWidthConverted;
      const checkedParas = state.previewParagraphs.filter(
        (p) => state.paragraphCheckedMap.get(p.id) !== false
      );
      const text = checkedParas.map((p) => p.text).join('\n\n');
      // 双向切换：使用纯 TS 字符替换（不需要 napi）
      const resultText = newConverted ? toHalfWidth(text) : toFullWidth(text);
      const formattedTexts = resultText.split('\n\n');
      const newParagraphs = state.previewParagraphs.map((p) => {
        const idx = checkedParas.findIndex((cp) => cp.id === p.id);
        if (idx >= 0 && idx < formattedTexts.length) return { ...p, text: formattedTexts[idx] };
        return p;
      });
      const modifiedIds = new Set(state.modifiedParagraphIds);
      newParagraphs.forEach((np) => {
        const orig = state.previewParagraphs.find((p) => p.id === np.id);
        if (orig && orig.text !== np.text) modifiedIds.add(np.id);
      });
      return {
        isFullWidthConverted: newConverted,
        previewParagraphs: newParagraphs,
        modifiedParagraphIds: modifiedIds,
      };
    }),

  toggleTraditional: () =>
    set((state) => {
      const newConverted = !state.isTraditionalConverted;
      const checkedParas = state.previewParagraphs.filter(
        (p) => state.paragraphCheckedMap.get(p.id) !== false
      );
      if (checkedParas.length === 0) return { isTraditionalConverted: newConverted };

      // V3.3.1 BUG-001 修复：实际执行繁简文本转换
      const text = checkedParas.map((p) => p.text).join('\n\n');
      const resultText = newConverted ? toSimplified(text) : toTraditional(text);
      const formattedTexts = resultText.split('\n\n');

      const newParagraphs = state.previewParagraphs.map((p) => {
        const idx = checkedParas.findIndex((cp) => cp.id === p.id);
        if (idx >= 0 && idx < formattedTexts.length && p.text !== formattedTexts[idx]) {
          return { ...p, text: formattedTexts[idx] };
        }
        return p;
      });

      const modifiedIds = new Set(state.modifiedParagraphIds);
      newParagraphs.forEach((np) => {
        const orig = state.previewParagraphs.find((p) => p.id === np.id);
        if (orig && orig.text !== np.text) modifiedIds.add(np.id);
      });

      state.pushSnapshot(newConverted ? '繁→简' : '简→繁');
      return {
        isTraditionalConverted: newConverted,
        previewParagraphs: newParagraphs,
        modifiedParagraphIds: modifiedIds,
      };
    }),

  // ═══════════════════════════════════════════
  // V3.3 Actions — RQ-04 预览条
  // ═══════════════════════════════════════════

  _updateMinimap: () =>
    set((state) => ({
      minimapItems: state.previewParagraphs.map((p) => ({
        color:
          state.paragraphCheckedMap.get(p.id) === false
            ? ('red' as const)
            : state.modifiedParagraphIds.has(p.id)
              ? ('orange' as const)
              : ('green' as const),
        tooltip: p.text.slice(0, 20),
      })),
    })),

  // ═══════════════════════════════════════════
  // V3.3 Actions — RQ-08 段落修改跟踪
  // ═══════════════════════════════════════════

  _markModifiedParagraphs: (before, after) =>
    set((state) => {
      const modifiedIds = new Set(state.modifiedParagraphIds);
      after.forEach((np) => {
        const orig = before.find((p) => p.id === np.id);
        if (orig && orig.text !== np.text) modifiedIds.add(np.id);
      });
      return { modifiedParagraphIds: modifiedIds };
    }),

  // ═══════════════════════════════════════════
  // V3.3 Actions — Misc
  // ═══════════════════════════════════════════

  jumpToParagraph: (index: number) => {
    const el = document.querySelector(`[data-para-index="${index}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
