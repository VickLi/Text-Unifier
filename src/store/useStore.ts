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
  FormatOptions,
  ChapterInfo,
  AppMode,
  Snapshot,
  DiffAlignment,
} from '../types';
import { DEFAULT_CLEAN_OPTIONS, DEFAULT_FORMAT_OPTIONS, DEFAULT_V3_2_STATE } from './defaults';

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
  // V2.0 新增字段 — RQ-03 文档排版
  // ═══════════════════════════════════════════

  /** 排版前快照（用于还原） */
  formatSnapshot: PreviewParagraph[] | null;

  /** 是否正在执行处理 */
  isFormatting: boolean;

  /** 是否有可还原的快照 */
  canRevert: boolean;

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
  // V2.0 新增 Actions — RQ-03
  // ═══════════════════════════════════════════

  /** 还原至排版前状态 */
  revertFormatting: () => void;

  // ═══════════════════════════════════════════
  // V2.0.1 新增 Actions — BUG-026
  // ═══════════════════════════════════════════

  /** 触发文件重新分析（拖拽排序后调用，BUG-026 修复） */
  triggerReanalysis: () => Promise<void>;

  // ═══════════════════════════════════════════
  // V3.1 新增 Actions — 内容清洗与排版增强

  // ═══════════════════════════════════════════

  cleanOptions: CleanOptions;
  formatOptions: FormatOptions;
  chapterList: ChapterInfo[];

  setCleanOptions: (opts: Partial<CleanOptions>) => void;
  setFormatOptions: (opts: Partial<FormatOptions>) => void;

  /** 执行全处理流水线（替代旧 formatDocument） */
  applyProcessing: () => Promise<void>;
  /** 仅执行章节分割 */
  splitChapters: () => Promise<void>;
  /** 仅执行章节重排 */
  reorderChapters: () => Promise<void>;

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
  formatSnapshot: null,
  isFormatting: false,
  canRevert: false,

  // V3.1 新增字段
  cleanOptions: { ...DEFAULT_CLEAN_OPTIONS },
  formatOptions: { ...DEFAULT_FORMAT_OPTIONS },
  chapterList: [],

  // V3.2 新增字段
  ...DEFAULT_V3_2_STATE,

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
      const newFileList = state.fileList.filter((f) => f.path !== path);
      const newSortedList = state.sortedFileList.filter((f) => f.path !== path);
      // BUG-V2.0-001: 文件移除后如果列表为空，同时清除分析结果防止显示过期数据
      const shouldReset = newFileList.length === 0;
      return {
        fileList: newFileList,
        sortedFileList: newSortedList,
        duplicateGroups: shouldReset ? [] : state.duplicateGroups,
        originalPreview: shouldReset ? [] : state.originalPreview,
        previewParagraphs: shouldReset ? [] : state.previewParagraphs,
        paragraphCheckedMap: shouldReset ? new Map() : state.paragraphCheckedMap,
        status: shouldReset ? 'idle' : state.status,
        formatSnapshot: shouldReset ? null : state.formatSnapshot,
        canRevert: shouldReset ? false : state.canRevert,
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
        formatSnapshot: null,
        canRevert: false,
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
      formatSnapshot: null,
      canRevert: false,
      isFormatting: false,
      lastClickedParagraphId: null,
      hoveredParagraphId: null,
      hoveredSourceFiles: [],
      hoverPosition: null,
      activeDragFileId: null,
      cleanOptions: { ...DEFAULT_CLEAN_OPTIONS },
      formatOptions: { ...DEFAULT_FORMAT_OPTIONS },
      chapterList: [],
      ...DEFAULT_V3_2_STATE,
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
          formatSnapshot: null,
          canRevert: false,
          status: 'ready',
        };
      });
    } catch (error) {
      set({ status: 'error', errorMessage: `重新分析失败: ${error}` });
    }
  },
  // ═══════════════════════════════════════════

  revertFormatting: () =>
    set((state) => {
      if (!state.formatSnapshot) return state;
      // BUG-025: 基于快照重建 Map，完全丢弃 fmt_* 残留
      const restoredCheckedMap = new Map<string, boolean>();
      for (const p of state.formatSnapshot) {
        // 从当前 paragraphCheckedMap 中查找该段落的勾选状态
        const currentState = state.paragraphCheckedMap.get(p.id);
        // 如果在当前 map 中存在，保留；否则默认 true
        restoredCheckedMap.set(p.id, currentState ?? true);
      }
      return {
        previewParagraphs: state.formatSnapshot,
        formatSnapshot: null,
        canRevert: false,
        paragraphCheckedMap: restoredCheckedMap,
      };
    }),

  // ═══════════════════════════════════════════
  // V3.1 Actions — 内容清洗与排版增强
  // ═══════════════════════════════════════════

  setCleanOptions: (opts) =>
    set((state) => ({
      cleanOptions: { ...state.cleanOptions, ...opts },
    })),

  setFormatOptions: (opts) =>
    set((state) => ({
      formatOptions: { ...state.formatOptions, ...opts },
    })),

  applyProcessing: async () => {
    const state = get();
    if (state.isFormatting) return;

    const snapshot = state.previewParagraphs.map((p) => ({ ...p }));
    set({ formatSnapshot: snapshot, isFormatting: true, canRevert: false });

    try {
      const { mergeLinesSmart, formatChapterTitles, removeAdjacentDuplicateLines, addParagraphIndent, splitCNParagraph, filterLines } = await import('../utils/novelProcessor');

      let processedText = state.previewParagraphs
        .filter((p) => (state.paragraphCheckedMap.get(p.id) ?? true) !== false)
        .map((p) => p.text)
        .join('\n\n');

      const co = state.cleanOptions;
      const fo = state.formatOptions;

      // 内容筛选
      if (co.filterKeywords) {
        const keywords = co.filterKeywords.split(',').map((k) => k.trim()).filter(Boolean);
        if (keywords.length > 0) {
          processedText = filterLines(processedText, keywords, co.filterMaxLength);
        }
      }

      // 章节格式化
      if (fo.enableChapterFormat) {
        processedText = formatChapterTitles(processedText);
      }

      // 智能换行
      if (fo.enableSmartLineBreak) {
        processedText = mergeLinesSmart(processedText, { preserveChapterTitles: true });
      }

      // 相邻行去重
      if (fo.removeAdjacentDup) {
        const lines = processedText.split('\n');
        processedText = removeAdjacentDuplicateLines(lines).join('\n');
      }

      // 段落缩进
      if (fo.enableIndent) {
        processedText = addParagraphIndent(processedText);
      }

      // 长段落拆分
      if (fo.enableParagraphSplit) {
        processedText = splitCNParagraph(processedText);
      }

      // 重建段落列表
      // BUG-V3.1-002: 处理段落数变化（合并减少/拆分增加）
      const formattedTexts = processedText.split('\n\n').filter((t) => t.trim());
      const newParagraphs: PreviewParagraph[] = [];
      let fmtIdx = 0;
      const checkedIds: string[] = [];

      for (const originalPara of state.previewParagraphs) {
        const isChecked = (state.paragraphCheckedMap.get(originalPara.id) ?? true) !== false;
        if (isChecked) {
          checkedIds.push(originalPara.id);
          if (fmtIdx < formattedTexts.length) {
            const hash = await computeContentHash(formattedTexts[fmtIdx]);
            newParagraphs.push({ ...originalPara, text: formattedTexts[fmtIdx], contentHash: hash });
            fmtIdx++;
          } else {
            // 合并导致段落数减少：保留原文
            newParagraphs.push({ ...originalPara });
          }
        } else {
          newParagraphs.push({ ...originalPara });
        }
      }

      while (fmtIdx < formattedTexts.length) {
        const t = formattedTexts[fmtIdx];
        if (t.trim()) {
          const hash = await computeContentHash(t);
          newParagraphs.push({ id: `fmt_${fmtIdx}`, text: t, contentHash: hash, sourceFiles: [], isOriginal: false });
        }
        fmtIdx++;
      }

      const rebuiltMap = new Map<string, boolean>();
      for (const p of newParagraphs) {
        rebuiltMap.set(p.id, state.paragraphCheckedMap.get(p.id) ?? true);
      }

      // BUG-V3.1-003: 立即基于最新数据更新章节列表
      const chapterList: ChapterInfo[] = [];
      const allText = newParagraphs
        .filter((p) => (rebuiltMap.get(p.id) ?? true) !== false)
        .map((p) => p.text)
        .join('\n');
      const chapterLines = allText.split('\n');
      for (let i = 0; i < chapterLines.length; i++) {
        const line = chapterLines[i].trim();
        if (/^第[〇零一二三四五六七八九十百千万\d]+[章节回卷部]|^Chapter\s+[\dIVXLCDM]+/i.test(line)) {
          let order: number | null = null;
          const arMatch = line.match(/^第(\d+)\s*[章节回卷部]/);
          if (arMatch) order = parseInt(arMatch[1], 10);
          else {
            const enMatch = line.match(/^Chapter\s+(\d+)/i);
            if (enMatch) order = parseInt(enMatch[1], 10);
          }
          chapterList.push({ title: line, order, startIndex: i, paragraphCount: 0 });
        }
      }

      set({
        previewParagraphs: newParagraphs,
        paragraphCheckedMap: rebuiltMap,
        isFormatting: false,
        canRevert: true,
        chapterList,
      });
    } catch (error) {
      set({ isFormatting: false, errorMessage: `处理失败: ${error}` });
    }
  },

  // BUG-V3.1.2-003: 使用动态 import 替代 require（ESM 兼容）
  splitChapters: async () => {
    const state = get();
    const checkedParas = state.previewParagraphs.filter(
      (p) => (state.paragraphCheckedMap.get(p.id) ?? true) !== false
    );
    const text = checkedParas.map((p) => p.text).join('\n\n');
    const { splitInlineChapterTitles } = await import('../utils/novelProcessor');
    const result = splitInlineChapterTitles(text);

    const newTexts = result.split('\n\n').filter((t: string) => t.trim());
    const newParagraphs: PreviewParagraph[] = [];
    let idx = 0;
    for (const originalPara of state.previewParagraphs) {
      const isChecked = (state.paragraphCheckedMap.get(originalPara.id) ?? true) !== false;
      if (isChecked && idx < newTexts.length) {
        newParagraphs.push({ ...originalPara, text: newTexts[idx] });
        idx++;
      } else {
        newParagraphs.push({ ...originalPara });
      }
    }
    set({ previewParagraphs: newParagraphs, canRevert: true });
  },

  // BUG-V3.1.2-003: 使用动态 import 替代 require（ESM 兼容）
  reorderChapters: async () => {
    const state = get();
    const checkedParas = state.previewParagraphs.filter(
      (p) => (state.paragraphCheckedMap.get(p.id) ?? true) !== false
    );
    const text = checkedParas.map((p) => p.text).join('\n\n');

    try {
      const { reorderChaptersByTitle } = await import('../utils/novelProcessor');
      const reordered = reorderChaptersByTitle(text);

      const newTexts = reordered.split('\n\n').filter((t: string) => t.trim());
      const newParagraphs: PreviewParagraph[] = [];
      let idx = 0;
      for (const originalPara of state.previewParagraphs) {
        const isChecked = (state.paragraphCheckedMap.get(originalPara.id) ?? true) !== false;
        if (isChecked && idx < newTexts.length) {
          newParagraphs.push({ ...originalPara, text: newTexts[idx] });
          idx++;
        } else {
          newParagraphs.push({ ...originalPara });
        }
      }
      set({ previewParagraphs: newParagraphs, canRevert: true });
    } catch {
      set({ errorMessage: '章节重排失败: 未识别到有效章节标题' });
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
