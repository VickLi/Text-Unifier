import React, { useState, useCallback } from 'react';
import { useStore } from '../store/useStore';

/**
 * V4.0 导出按钮组件
 *
 * 导出 mergedText（排除连接标记）为 UTF-8 BOM .txt 文件
 * 使用 store.exportMergedText 统一处理快照 + IPC 调用
 */
export const ExportButton: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const mergedText = useStore((s) => s.mergedText);
  const status = useStore((s) => s.status);
  const exportMergedText = useStore((s) => s.exportMergedText);
  const sortedFileList = useStore((s) => s.sortedFileList);

  const canExport = status === 'ready' && mergedText.trim().length > 0 && !isExporting;

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const handleExport = async () => {
    if (!canExport) return;
    setIsExporting(true);
    try {
      await exportMergedText();
    } catch {
      // 错误由 store.showToast 统一处理
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <button
        onClick={handleExport}
        disabled={!canExport}
        className={`
          inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
          transition-all duration-150
          ${
            canExport
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md active:scale-[0.98]'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }
        `}
      >
        {isExporting ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            导出中...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            导出合并文档 (.txt)
          </>
        )}
      </button>

      {/* Toast 通知 */}
      {toast && (
        <div
          className={`fixed bottom-16 right-6 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all duration-300 ${
            toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? (
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span className="break-all">{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 opacity-70 hover:opacity-100" aria-label="关闭通知">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
