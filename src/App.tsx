import React, { useCallback, useRef } from 'react';
import { useStore } from './store/useStore';
import { scanFiles } from './utils/ipc';
import { FileChipBar } from './components/FileChipBar';
import { DragOverlay, useGlobalDragDrop } from './components/DragOverlay';
import { ModeTabs } from './components/ModeTabs';
import { DuplicateList } from './components/DuplicateList';
import { PreviewPanel } from './components/PreviewPanel';
import { ExportButton } from './components/ExportButton';
import { SidePanel } from './components/SidePanel';
import { DiffViewer } from './components/DiffViewer';

const SCAN_TIMEOUT_MS = 60000;

const App: React.FC = () => {
  const fileList = useStore((s) => s.fileList);
  const sortedFileList = useStore((s) => s.sortedFileList);
  const status = useStore((s) => s.status);
  const errorMessage = useStore((s) => s.errorMessage);
  const activeMode = useStore((s) => s.activeMode);
  const setStatus = useStore((s) => s.setStatus);
  const setError = useStore((s) => s.setError);
  const setAnalysisResult = useStore((s) => s.setAnalysisResult);
  const addFiles = useStore((s) => s.addFiles);
  const resetSession = useStore((s) => s.resetSession);
  const clearUndoStack = useStore((s) => s.clearUndoStack);
  const loadingRef = useRef(false);

  /** 处理文件选择 */
  const handleFilesSelected = useCallback(
    async (files: { name: string; path: string; size: number }[]) => {
      if (loadingRef.current) return;
      loadingRef.current = true;

      const existingPaths = sortedFileList.map((f) => f.path);
      const newPaths = files.map((f) => f.path);
      const allPaths = [...existingPaths, ...newPaths];

      addFiles(files);
      clearUndoStack();

      setStatus('loading');
      setError(null);

      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('分析超时（60秒），请检查文件大小或重试')), SCAN_TIMEOUT_MS)
        );
        const reportPromise = scanFiles(allPaths);
        const report = await Promise.race([reportPromise, timeoutPromise]);

        setAnalysisResult(
          report.duplicateGroups,
          report.previewParagraphs
        );
      } catch (error) {
        setError(`分析失败: ${error}`);
        setStatus('error');
      } finally {
        loadingRef.current = false;
      }
    },
    [sortedFileList, addFiles, setStatus, setError, setAnalysisResult, clearUndoStack]
  );

  // V3.2 全窗口拖拽
  useGlobalDragDrop(handleFilesSelected);

  const handleReset = useCallback(() => {
    resetSession();
  }, [resetSession]);

  return (
    <div className="h-screen flex flex-col bg-gray-50" role="application" aria-label="文档终版确定器">
      {/* 标题栏 */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-gray-900">
            文档终版确定器
          </h1>
          <span className="text-xs text-white bg-blue-500 px-2 py-0.5 rounded">
            Text Unifier v3.2.1
          </span>
        </div>
        <div className="flex items-center gap-3">
          {status === 'ready' && (
            <button
              onClick={handleReset}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="重新开始，清空当前分析结果"
            >
              重新开始
            </button>
          )}
          <ExportButton />
        </div>
      </header>

      {/* 模式切换条（V3.2） */}
      <ModeTabs />

      {/* 错误提示 */}
      {errorMessage && (
        <div
          className="bg-red-50 border-b border-red-200 px-6 py-2 flex items-center gap-2"
          role="alert"
          aria-live="assertive"
        >
          <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm text-red-700">{errorMessage}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600" aria-label="关闭错误提示">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* 全窗口拖拽遮罩（V3.2 RQ-02） */}
      <DragOverlay />

      {/* V3.2 文件标签栏（替代原文件上传区） */}
      <FileChipBar onFilesSelected={handleFilesSelected} />

      {/* 主内容区 */}
      {activeMode === 'merge' ? (
        <main className="flex-1 flex gap-0 min-h-0 px-6 pb-4" role="main">
          {/* 左侧：重复段落列表（收缩至 280px） */}
          <section className="w-[280px] shrink-0 bg-white border border-gray-200 rounded-xl p-4 overflow-y-auto mr-4" aria-label="重复段落列表">
            <DuplicateList />
          </section>

          {/* 中间：预览面板（V3.2 主位化 min-w-[55%]） */}
          <section className="flex-1 min-w-[55%] bg-white border border-gray-200 rounded-xl p-4 overflow-hidden mr-4" aria-label="最终文档预览">
            <PreviewPanel />
          </section>

          {/* 右侧工具面板 */}
          {status === 'ready' && <SidePanel />}
        </main>
      ) : (
        /* V3.2 文档对比模式 */
        <main className="flex-1 flex min-h-0 px-6 pb-4" role="main">
          <DiffViewer />
        </main>
      )}

      {/* 状态栏 */}
      <footer className="bg-white border-t border-gray-200 px-6 py-2 flex items-center justify-between shrink-0" role="status" aria-live="polite">
        <span className="text-xs text-gray-400">
          {status === 'idle' && '就绪 — 请添加 .txt 文件开始分析'}
          {status === 'loading' && '正在分析文件中...'}
          {status === 'ready' && `分析完成 — ${fileList.length} 个文件`}
          {status === 'error' && '分析出错，请重试'}
        </span>
        <span className="text-xs text-gray-400">
          纯本地处理 · 数据不会上传
        </span>
      </footer>
    </div>
  );
};

export default App;
