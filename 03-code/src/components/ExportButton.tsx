import React, { useState, useCallback } from 'react';
import { useStore } from '../store/useStore';

/**
 * V4.0 导出按钮组件（连续文本导出）
 */
export const ExportButton: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const mergedText = useStore((s) => s.mergedText);
  const isAnalyzing = useStore((s) => s.isAnalyzing);
  const exportMergedText = useStore((s) => s.exportMergedText);

  const hasContent = !!mergedText.trim();
  const canExport = hasContent && !isExporting && !isAnalyzing;

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const handleExport = async () => {
    if (!canExport) return;
    setIsExporting(true);
    try {
      await exportMergedText();
      showToast('success', '导出成功！');
    } catch (error) {
      if (String(error).includes('取消')) return;
      showToast('error', `导出失败: ${error}`);
    } finally { setIsExporting(false); }
  };

  return (
    <>
      <button onClick={handleExport} disabled={!canExport}
        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          canExport ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`} aria-label="导出合并文档">
        ⏎ 导出
      </button>
      {toast && (
        <div className={`fixed top-4 right-4 z-60 px-4 py-2 rounded-lg shadow text-sm text-white ${
          toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        }`}>{toast.message}</div>
      )}
    </>
  );
};
