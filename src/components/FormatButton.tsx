import React from 'react';
import { useStore } from '../store/useStore';

/**
 * 文档排版/还原按钮组件（RQ-03）
 *
 * 提供「文档排版」和「还原」两个按钮
 * 排版仅影响已勾选的段落
 */
export const FormatButton: React.FC = () => {
  const status = useStore((s) => s.status);
  const isFormatting = useStore((s) => s.isFormatting);
  const canRevert = useStore((s) => s.canRevert);
  const previewParagraphs = useStore((s) => s.previewParagraphs);
  const paragraphCheckedMap = useStore((s) => s.paragraphCheckedMap);
  const formatDocumentAction = useStore((s) => s.formatDocumentAction);
  const revertFormatting = useStore((s) => s.revertFormatting);

  // BUG-029: 内联计算已排除段落数，减少外部依赖
  const excludedCount = previewParagraphs.filter(
    (p) => (paragraphCheckedMap.get(p.id) ?? true) === false
  ).length;
  const hasCheckedParagraphs = previewParagraphs.some(
    (p) => (paragraphCheckedMap.get(p.id) ?? true) !== false
  );
  const canFormat = status === 'ready' && !isFormatting && hasCheckedParagraphs;
  const canRevertEnabled = status === 'ready' && canRevert && !isFormatting;

  return (
    <div className="flex items-center gap-2">
      {/* 文档排版按钮 */}
      <button
        onClick={formatDocumentAction}
        disabled={!canFormat}
        className={`
          inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
          transition-all duration-150
          ${canFormat
            ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm hover:shadow-md active:scale-[0.98]'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }
        `}
        aria-label="执行文档排版，去除段落内硬回车"
      >
        {isFormatting ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            排版中...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 10h16M4 14h16M4 18h16"
              />
            </svg>
            文档排版
          </>
        )}
      </button>

      {/* 还原按钮 */}
      <button
        onClick={revertFormatting}
        disabled={!canRevertEnabled}
        className={`
          inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
          transition-all duration-150
          ${canRevertEnabled
            ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-sm hover:shadow-md active:scale-[0.98]'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }
        `}
        aria-label="还原至排版前的状态"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
          />
        </svg>
        还原
      </button>

      {/* 已排除计数 */}
      {excludedCount > 0 && (
        <span className="text-xs text-gray-400 ml-1">
          已排除 {excludedCount} 段
        </span>
      )}
    </div>
  );
};
