import React from 'react';
import { useStore } from '../store/useStore';

/**
 * 排版增强面板组件（V3.1 RQ-03 增强版）
 * 控制智能换行、段落缩进、相邻行去重、长段落拆分
 */
export const FormatPanel: React.FC = () => {
  const formatOptions = useStore((s) => s.formatOptions);
  const setFormatOptions = useStore((s) => s.setFormatOptions);
  const isFormatting = useStore((s) => s.isFormatting);
  const canRevert = useStore((s) => s.canRevert);
  const previewParagraphs = useStore((s) => s.previewParagraphs);
  const paragraphCheckedMap = useStore((s) => s.paragraphCheckedMap);
  const applyProcessing = useStore((s) => s.applyProcessing);
  const revertFormatting = useStore((s) => s.revertFormatting);

  const hasCheckedParagraphs = previewParagraphs.some(
    (p) => (paragraphCheckedMap.get(p.id) ?? true) !== false
  );
  const canFormat = !isFormatting && hasCheckedParagraphs;

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-700">排版增强</h4>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={formatOptions.enableSmartLineBreak}
          onChange={(e) => setFormatOptions({ enableSmartLineBreak: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300 text-blue-500"
        />
        <span className="text-xs text-gray-600">智能换行（章节感知）</span>
      </label>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={formatOptions.enableIndent}
          onChange={(e) => setFormatOptions({ enableIndent: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300 text-blue-500"
        />
        <span className="text-xs text-gray-600">段落缩进（全角空格）</span>
      </label>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={formatOptions.removeAdjacentDup}
          onChange={(e) => setFormatOptions({ removeAdjacentDup: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300 text-blue-500"
        />
        <span className="text-xs text-gray-600">相邻重复行去重</span>
      </label>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={formatOptions.enableParagraphSplit}
          onChange={(e) => setFormatOptions({ enableParagraphSplit: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300 text-blue-500"
        />
        <span className="text-xs text-gray-600">长段落智能拆分</span>
      </label>

      <div className="flex gap-2 pt-1">
        <button
          onClick={applyProcessing}
          disabled={!canFormat}
          className={`flex-1 text-xs px-3 py-2 rounded-lg font-medium transition-all ${
            canFormat
              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isFormatting ? '处理中...' : '应用处理'}
        </button>

        <button
          onClick={revertFormatting}
          disabled={!canRevert || isFormatting}
          className={`text-xs px-3 py-2 rounded-lg font-medium transition-all ${
            canRevert && !isFormatting
              ? 'bg-orange-500 text-white hover:bg-orange-600'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          还原
        </button>
      </div>
    </div>
  );
};
