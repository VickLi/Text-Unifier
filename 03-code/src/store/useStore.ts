/**
 * V4.0 Zustand Store（连续文本 + 连接点模型）
 *
 * V4.0 核心变更：
 *  - 数据模型从段落列表+勾选 → 连续文本+连接点
 *  - 新增：mergeFiles IPC、搜索替换、合并设置
 *  - 删除：段落勾选、重复组、排版增强、章节工具
 */

import { create } from 'zustand';
import type {
  MergeResult, ConnectionPoint, FileEntry, SortableFile,
  AppMode, Snapshot, DiffAlignment, SearchResult, ToastMessage,
} from '../types';
import { toSimplified, toTraditional } from '../utils/cjkConv';

function toHalfWidth(text: string): string {
  return text.replace(/[\uFF01-\uFF5E]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0xFEE0)
  ).replace(/\u3000/g, ' ');
}

function toFullWidth(text: string): string {
  return text.replace(/[\u0021-\u007E]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) + 0xFEE0)
  ).replace(/ /g, '\u3000');
}

// ═══════════════════════════════════════════
// Store 接口
// ═══════════════════════════════════════════

interface AppState {
  // === 模式 ===
  activeMode: AppMode;
  setActiveMode: (mode: AppMode) => void;

  // === 文件管理 ===
  sortedFileList: SortableFile[];
  addFiles: (files: FileEntry[]) => void;
  removeFile: (path: string) => void;
  clearFiles: () => void;
  reorderFiles: (from: number, to: number) => void;

  // === 合并结果 ===
  mergedText: string;
  connectionPoints: ConnectionPoint[];
  connectionStates: Record<string, boolean>;
  isAnalyzing: boolean;
  analyzeError: string | null;
  overlapThreshold: number;

  runMerge: () => Promise<void>;
  setMergeResult: (result: MergeResult) => void;
  setOverlapThreshold: (t: number) => void;
  toggleConnectionMerge: (cpId: string) => void;

  // === 搜索替换 ===
  searchKeyword: string;
  replaceText: string;
  caseSensitive: boolean;
  searchResults: SearchResult[];
  currentMatchIndex: number;
  isSearching: boolean;

  performSearch: (keyword: string) => void;
  replaceOne: () => void;
  replaceAll: () => void;
  clearSearch: () => void;

  // === 清洗状态 ===
  isFullWidthConverted: boolean;
  isTraditionalConverted: boolean;
  isConverting: boolean;
  toggleFullWidth: () => Promise<void>;
  toggleTraditional: () => Promise<void>;

  // === 撤回栈 ===
  undoStack: Snapshot[];
  undoPointer: number;
  pushSnapshot: (reason?: string) => void;
  undo: () => void;
  redo: () => void;
  clearUndoStack: () => void;

  // === 文本修改追踪 ===
  modifiedFlags: Set<string>;
  setModifiedFlags: (flags: string[]) => void;

  // === 对比 ===
  diffAlignment: DiffAlignment[];
  diffLeftFileName: string | null;
  diffRightFileName: string | null;
  setDiffResult: (alignment: DiffAlignment[], left: string, right: string) => void;

  // === UI 状态 ===
  isDragOverlayVisible: boolean;
  isDragRejecting: boolean;
  setDragOverlay: (visible: boolean, rejecting?: boolean) => void;
  toastMessages: ToastMessage[];
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;

  // === 导出 ===
  lastExportSnapshot: Snapshot | null;
  exportMergedText: () => Promise<void>;
  revertToExport: () => void;
}

// ═══════════════════════════════════════════
// Store 实现
// ═══════════════════════════════════════════

export const useStore = create<AppState>((set, get) => ({
  // === 初始状态 ===
  activeMode: 'merge',
  sortedFileList: [],
  mergedText: '',
  connectionPoints: [],
  connectionStates: {},
  isAnalyzing: false,
  analyzeError: null,
  overlapThreshold: 50,

  searchKeyword: '',
  replaceText: '',
  caseSensitive: false,
  searchResults: [],
  currentMatchIndex: -1,
  isSearching: false,

  isFullWidthConverted: false,
  isTraditionalConverted: false,
  isConverting: false,

  undoStack: [],
  undoPointer: -1,
  modifiedFlags: new Set<string>(),

  diffAlignment: [],
  diffLeftFileName: null,
  diffRightFileName: null,

  isDragOverlayVisible: false,
  isDragRejecting: false,
  toastMessages: [],
  lastExportSnapshot: null,

  // ═══════════════════════════════════
  // 模式切换
  // ═══════════════════════════════════

  setActiveMode: (mode) => set((s) => {
    if (s.activeMode === mode) return s;
    return { activeMode: mode, undoStack: [], undoPointer: -1 };
  }),

  // ═══════════════════════════════════
  // 文件管理
  // ═══════════════════════════════════

  addFiles: (files) => set((s) => {
    const existing = new Set(s.sortedFileList.map(f => f.path));
    const newFiles = files.filter(f => !existing.has(f.path));
    const newSorted: SortableFile[] = [
      ...s.sortedFileList,
      ...newFiles.map(f => ({ id: f.path, name: f.name, path: f.path, size: f.size, encoding: 'UTF-8' })),
    ];
    return { sortedFileList: newSorted };
  }),

  removeFile: (path) => set((s) => {
    const newList = s.sortedFileList.filter(f => f.path !== path);
    if (newList.length === 0) {
      return {
        sortedFileList: [], mergedText: '', connectionPoints: [],
        connectionStates: {}, analyzeError: null, undoStack: [], undoPointer: -1,
      };
    }
    return { sortedFileList: newList };
  }),

  clearFiles: () => set({
    sortedFileList: [], mergedText: '', connectionPoints: [],
    connectionStates: {}, analyzeError: null, undoStack: [], undoPointer: -1,
  }),

  reorderFiles: (from, to) => set((s) => {
    const list = [...s.sortedFileList];
    const [moved] = list.splice(from, 1);
    list.splice(to, 0, moved);
    return { sortedFileList: list };
  }),

  // ═══════════════════════════════════
  // 合并引擎
  // ═══════════════════════════════════

  runMerge: async () => {
    const { sortedFileList, overlapThreshold } = get();
    if (sortedFileList.length === 0) return;
    set({ isAnalyzing: true, analyzeError: null, undoStack: [], undoPointer: -1 });
    try {
      const { mergeFiles } = await import('../utils/ipc');
      const paths = sortedFileList.map(f => f.path);
      const result = await mergeFiles(paths, overlapThreshold);
      get().setMergeResult(result);
    } catch (err) {
      set({ isAnalyzing: false, analyzeError: `合并失败: ${err}` });
    }
  },

  setMergeResult: (result) => {
    const states: Record<string, boolean> = {};
    for (const cp of result.connectionPoints) {
      states[cp.id] = cp.isAutoMerged;
    }
    set({
      mergedText: result.mergedText,
      connectionPoints: result.connectionPoints,
      connectionStates: states,
      isAnalyzing: false,
      analyzeError: null,
    });
  },

  setOverlapThreshold: (t) => {
    set({ overlapThreshold: t });
    // 如果已有文件，触发重新合并
    const { sortedFileList } = get();
    if (sortedFileList.length > 0) {
      get().runMerge();
    }
  },

  toggleConnectionMerge: (cpId) => set((s) => {
    const newStates = { ...s.connectionStates };
    newStates[cpId] = !newStates[cpId];
    return { connectionStates: newStates };
  }),

  // ═══════════════════════════════════
  // 搜索替换
  // ═══════════════════════════════════

  performSearch: (keyword) => {
    const { mergedText, caseSensitive } = get();
    if (!keyword) { set({ searchResults: [], currentMatchIndex: -1, isSearching: true }); return; }
    const results: SearchResult[] = [];
    const flags = caseSensitive ? 'g' : 'gi';
    const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
    let match;
    while ((match = regex.exec(mergedText)) !== null) {
      const pos = match.index;
      results.push({
        index: results.length,
        position: pos,
        contextBefore: mergedText.slice(Math.max(0, pos - 15), pos),
        contextAfter: mergedText.slice(pos + match[0].length, pos + match[0].length + 15),
        matchText: match[0],
      });
    }
    set({ searchResults: results, currentMatchIndex: results.length > 0 ? 0 : -1, isSearching: true, searchKeyword: keyword });
  },

  replaceOne: () => {
    const { searchResults, currentMatchIndex, mergedText, replaceText } = get();
    if (searchResults.length === 0 || currentMatchIndex < 0) return;
    const target = searchResults[currentMatchIndex];
    const before = mergedText.slice(0, target.position);
    const after = mergedText.slice(target.position + target.matchText.length);
    const newText = before + replaceText + after;
    get().pushSnapshot('替换');
    set({ mergedText: newText });
    // 重新搜索
    get().performSearch(get().searchKeyword);
  },

  replaceAll: () => {
    const { searchResults, mergedText, replaceText, searchKeyword } = get();
    if (searchResults.length === 0) return;
    get().pushSnapshot('全部替换');
    const flags = get().caseSensitive ? 'g' : 'gi';
    const regex = new RegExp(searchKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
    const newText = mergedText.replace(regex, replaceText);
    const count = searchResults.length;
    set({ mergedText: newText, searchResults: [], currentMatchIndex: -1, isSearching: false });
    get().addToast(`已替换 ${count} 处`, 'success');
  },

  clearSearch: () => set({
    searchKeyword: '', replaceText: '', searchResults: [],
    currentMatchIndex: -1, isSearching: false,
  }),

  // ═══════════════════════════════════
  // 内容清洗
  // ═══════════════════════════════════

  toggleFullWidth: async () => {
    const { mergedText, isFullWidthConverted } = get();
    if (!mergedText) { set({ isFullWidthConverted: !isFullWidthConverted }); return; }
    get().pushSnapshot(isFullWidthConverted ? '半角→全角' : '全角→半角');
    const newText = isFullWidthConverted ? toFullWidth(mergedText) : toHalfWidth(mergedText);
    set({ mergedText: newText, isFullWidthConverted: !isFullWidthConverted });
  },

  toggleTraditional: async () => {
    const { mergedText, isTraditionalConverted, isConverting } = get();
    if (isConverting) return; // P2-004: 防止快速连点
    if (!mergedText) { set({ isTraditionalConverted: !isTraditionalConverted }); return; }
    set({ isConverting: true });
    try {
      get().pushSnapshot(isTraditionalConverted ? '简→繁' : '繁→简');
      const newText = isTraditionalConverted
        ? await toTraditional(mergedText)
        : await toSimplified(mergedText);
      set({ mergedText: newText, isTraditionalConverted: !isTraditionalConverted });
    } finally {
      set({ isConverting: false });
    }
  },

  // ═══════════════════════════════════
  // 撤回栈
  // ═══════════════════════════════════

  pushSnapshot: (reason) => set((s) => {
    const snap: Snapshot = {
      id: crypto.randomUUID(),
      mergedText: s.mergedText,
      connectionStates: { ...s.connectionStates },
      modifiedFlags: [...s.modifiedFlags],
      reason: reason || '未命名操作',
      timestamp: Date.now(),
    };
    let stack = s.undoStack.slice(0, s.undoPointer + 1);
    stack.push(snap);
    if (stack.length > 5) stack.shift();
    return { undoStack: stack, undoPointer: stack.length - 1 };
  }),

  undo: () => set((s) => {
    if (s.undoPointer <= 0) return s;
    const ptr = s.undoPointer - 1;
    const snap = s.undoStack[ptr];
    if (!snap) return s;
    return {
      undoPointer: ptr,
      mergedText: snap.mergedText,
      connectionStates: { ...snap.connectionStates },
      modifiedFlags: new Set(snap.modifiedFlags),
    };
  }),

  redo: () => set((s) => {
    if (s.undoPointer >= s.undoStack.length - 1) return s;
    const ptr = s.undoPointer + 1;
    const snap = s.undoStack[ptr];
    if (!snap) return s;
    return {
      undoPointer: ptr,
      mergedText: snap.mergedText,
      connectionStates: { ...snap.connectionStates },
      modifiedFlags: new Set(snap.modifiedFlags),
    };
  }),

  clearUndoStack: () => set({ undoStack: [], undoPointer: -1 }),

  // ═══════════════════════════════════
  // 文本修改追踪
  // ═══════════════════════════════════

  setModifiedFlags: (flags) => set({ modifiedFlags: new Set(flags) }),

  // ═══════════════════════════════════
  // 文档对比
  // ═══════════════════════════════════

  setDiffResult: (alignment, left, right) => set({
    diffAlignment: alignment, diffLeftFileName: left, diffRightFileName: right,
  }),

  // ═══════════════════════════════════
  // UI 状态
  // ═══════════════════════════════════

  setDragOverlay: (visible, rejecting) => set({
    isDragOverlayVisible: visible, isDragRejecting: rejecting ?? false,
  }),

  addToast: (message, type = 'info') => set((s) => ({
    toastMessages: [...s.toastMessages, { id: crypto.randomUUID(), message, type }],
  })),

  removeToast: (id) => set((s) => ({
    toastMessages: s.toastMessages.filter(t => t.id !== id),
  })),

  // ═══════════════════════════════════
  // 导出
  // ═══════════════════════════════════

  exportMergedText: async () => {
    const { mergedText, sortedFileList } = get();
    if (!mergedText.trim()) { get().addToast('没有可导出的内容', 'error'); return; }
    const defaultFileName = sortedFileList.length > 0
      ? sortedFileList[0].name.replace(/\.txt$/i, '') + '_merged.txt'
      : 'merged.txt';
    try {
      const { exportFile } = await import('../utils/ipc');
      const result = await exportFile(mergedText, defaultFileName);
      if (!result.savedPath) return; // 用户取消
      // 记录导出快照
      const snap: Snapshot = {
        id: crypto.randomUUID(),
        mergedText,
        connectionStates: { ...get().connectionStates },
        modifiedFlags: [...get().modifiedFlags],
        reason: '导出前快照',
        timestamp: Date.now(),
      };
      set({ lastExportSnapshot: snap });
      get().addToast('导出成功', 'success');
    } catch (err) {
      get().addToast(`导出失败: ${err}`, 'error');
    }
  },

  revertToExport: () => {
    const { lastExportSnapshot } = get();
    if (!lastExportSnapshot) {
      get().addToast('没有可恢复的导出快照', 'info');
      return;
    }
    set({
      mergedText: lastExportSnapshot.mergedText,
      connectionStates: { ...lastExportSnapshot.connectionStates },
      modifiedFlags: new Set(lastExportSnapshot.modifiedFlags),
    });
    get().addToast('已恢复到导出前状态', 'success');
  },
}));
