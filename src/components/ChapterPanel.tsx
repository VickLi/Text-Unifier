import React from 'react';
import { useStore } from '../store/useStore';

/**
 * 章节工具面板组件（V3.1 RQ-05/RQ-06）
 * 控制章节识别格式化、章节分割、章节重排
 */
export const ChapterPanel: React.FC = () => {
  const formatOptions = useStore((s) => s.formatOptions);
  const setFormatOptions = useStore((s) => s.setFormatOptions);
  const chapterList = useStore((s) => s.chapterList);
  const splitChapters = useStore((s) => s.splitChapters);
  const reorderChapters = useStore((s) => s.reorderChapters);
  const previewParagraphs = useStore((s) => s.previewParagraphs);
  const status = useStore((s) => s.status);

  const hasContent = previewParagraphs.length > 0 && status === 'ready';

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-700">章节工具</h4>

      {/* 章节格式化 */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={formatOptions.enableChapterFormat}
          onChange={(e) => setFormatOptions({ enableChapterFormat: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300 text-blue-500"
        />
        <span className="text-xs text-gray-600">识别并格式化章节标题</span>
      </label>

      {/* 章节分割 - 独立操作 */}
      <button
        onClick={splitChapters}
        disabled={!hasContent}
        className={`w-full text-xs px-3 py-1.5 rounded-lg border transition-colors ${
          hasContent
            ? 'border-blue-300 text-blue-600 hover:bg-blue-50'
            : 'border-gray-200 text-gray-300 cursor-not-allowed'
        }`}
      >
        章节分割（独立操作）
      </button>

      {/* 章节重排 - 独立操作 */}
      <button
        onClick={reorderChapters}
        disabled={!hasContent}
        className={`w-full text-xs px-3 py-1.5 rounded-lg border transition-colors ${
          hasContent
            ? 'border-amber-300 text-amber-600 hover:bg-amber-50'
            : 'border-gray-200 text-gray-300 cursor-not-allowed'
        }`}
      >
        章节重排（独立操作）
      </button>

      {/* 章节计数 */}
      {chapterList.length > 0 && (
        <p className="text-xs text-green-600">
          已识别 {chapterList.length} 个章节
        </p>
      )}
    </div>
  );
};
