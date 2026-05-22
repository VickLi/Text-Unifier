import React, { useCallback, useRef, useState } from 'react';
import { useStore } from './store/useStore';
import { FileChipBar } from './components/FileChipBar';
import { DragOverlay, useGlobalDragDrop } from './components/DragOverlay';
import { ModeTabs } from './components/ModeTabs';
import { ConnectionPointList } from './components/ConnectionPointList';
import { PreviewPanel } from './components/PreviewPanel';
import { CleanPanel } from './components/CleanPanel';
import { ExportButton } from './components/ExportButton';
import { DiffViewer } from './components/DiffViewer';
import { MergeSettings } from './components/MergeSettings';

/** 可拖拽调整宽度的面板容器 */
const ResizablePanel: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [width, setWidth] = useState(280);
  const dragging = useRef(false);

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    const startX = e.clientX;
    const startWidth = width;
    const onMouseMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      const delta = ev.clientX - startX;
      const newWidth = Math.min(500, Math.max(200, startWidth + delta));
      setWidth(newWidth);
    };
    const onMouseUp = () => {
      dragging.current = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div className="flex shrink-0 mr-4" style={{ width }}>
      <div className="flex-1 min-w-0">{children}</div>
      <div
        className="w-1.5 cursor-col-resize hover:bg-blue-300 active:bg-blue-400 rounded transition-colors shrink-0"
        onMouseDown={onMouseDown}
      />
    </div>
  );
};

const App: React.FC = () => {
  const sortedFileList = useStore((s) => s.sortedFileList);
  const mergedText = useStore((s) => s.mergedText);
  const isAnalyzing = useStore((s) => s.isAnalyzing);
  const analyzeError = useStore((s) => s.analyzeError);
  const activeMode = useStore((s) => s.activeMode);
  const undoStack = useStore((s) => s.undoStack);
  const undoPointer = useStore((s) => s.undoPointer);
  const addFiles = useStore((s) => s.addFiles);
  const runMerge = useStore((s) => s.runMerge);
  const clearUndoStack = useStore((s) => s.clearUndoStack);
  const toastMessages = useStore((s) => s.toastMessages);
  const removeToast = useStore((s) => s.removeToast);
  const loadingRef = useRef(false);
  const [showMergeSettings, setShowMergeSettings] = useState(false);

  /** 处理文件选择 → 触发合并 */
  const handleFilesSelected = useCallback(
    async (files: { name: string; path: string; size: number }[]) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      addFiles(files);
      clearUndoStack();
      // 等待状态更新后触发合并
      setTimeout(async () => {
        await runMerge();
        loadingRef.current = false;
      }, 50);
    },
    [addFiles, runMerge, clearUndoStack]
  );

  useGlobalDragDrop(handleFilesSelected);

  const hasContent = !!mergedText;

  return (
    <div className="h-screen flex flex-col bg-gray-50" role="application" aria-label="文档终版确定器">
      {/* 标题栏 */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-gray-900">文档终版确定器</h1>
          <span className="text-xs text-white bg-blue-500 px-2 py-0.5 rounded">Text Unifier v4.0</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowMergeSettings(true)}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            title="合并设置"
            aria-label="合并设置"
          >≡</button>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton />
        </div>
      </header>

      {/* 模式切换 */}
      <ModeTabs />

      {/* 全窗口拖拽遮罩 */}
      <DragOverlay />

      {/* 文件芯片栏 */}
      <FileChipBar onFilesSelected={handleFilesSelected} />

      {/* 错误提示 */}
      {analyzeError && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-1.5 text-sm text-red-600" role="alert">
          {analyzeError}
        </div>
      )}

      {/* 主内容区 */}
      {activeMode === 'merge' ? (
        <main className="flex-1 flex gap-0 min-h-0 px-6 pb-4">
          {/* 左侧：连接点列表（可拖拽调整宽度 200~500px） */}
          <ResizablePanel>
            <section className="h-full bg-white border border-gray-200 rounded-xl p-4 overflow-y-auto" aria-label="连接点列表">
              <ConnectionPointList />
            </section>
          </ResizablePanel>

          {/* 中间：预览面板 */}
          <section className="flex-1 min-w-[55%] bg-white border border-gray-200 rounded-xl overflow-hidden mr-4" aria-label="最终文档预览">
            <PreviewPanel />
          </section>

          {/* 右侧：内容清洗 */}
          {hasContent && (
            <section className="w-[260px] shrink-0 bg-white border border-gray-200 rounded-xl p-4 overflow-y-auto" aria-label="内容清洗">
              <CleanPanel />
            </section>
          )}
        </main>
      ) : (
        <main className="flex-1 flex min-h-0 px-6 pb-4">
          <DiffViewer />
        </main>
      )}

      {/* 状态栏 */}
      <footer className="bg-white border-t border-gray-200 px-6 py-2 flex items-center justify-between shrink-0 text-xs text-gray-400">
        <span>
          {isAnalyzing ? '⏳ 正在合并...' :
           hasContent ? `✅ ${mergedText.length.toLocaleString()} 字 | ${sortedFileList.length} 个文件` :
           '就绪 — 请添加 .txt 文件'}
        </span>
        <span>
          {undoStack.length > 0 && `撤回栈 ${undoPointer + 1}/${undoStack.length}`}
        </span>
        <span>纯本地处理 · 数据不会上传</span>
      </footer>

      {/* Toast 容器 */}
      {toastMessages.length > 0 && (
        <div className="fixed top-4 right-4 z-60 space-y-2">
          {toastMessages.map(t => (
            <div key={t.id} className={`px-4 py-2 rounded-lg shadow-lg text-sm text-white ${
              t.type === 'success' ? 'bg-green-500' : t.type === 'error' ? 'bg-red-500' : 'bg-gray-700'
            }`}>
              <span>{t.message}</span>
              <button onClick={() => removeToast(t.id)} className="ml-2 opacity-70 hover:opacity-100">✕</button>
            </div>
          ))}
        </div>
      )}

      {/* 合并设置弹窗 */}
      {showMergeSettings && (
        <MergeSettings onClose={() => setShowMergeSettings(false)} />
      )}
    </div>
  );
};

export default App;
