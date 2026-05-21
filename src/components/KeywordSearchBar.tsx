import React from 'react';

interface KeywordSearchBarProps {
  /** 逗号分隔的关键词 */
  keywords: string;
  /** 是否有匹配行（控制按钮 disabled） */
  hasMatch: boolean;
  /** 搜索下一个回调 */
  onSearchNext: () => void;
  /** 一键删除回调 */
  onDeleteAll: () => void;
}

/**
 * V3.3 关键词搜索栏（RQ-06）
 *
 * 在过滤关键词输入框下方显示两个操作按钮：
 *  - 🔍 搜索下一个：从当前位置查找下一个匹配行，滚动并高亮
 *  - 🗑 一键删除：删除预览中所有包含关键词的行
 */
export const KeywordSearchBar: React.FC<KeywordSearchBarProps> = ({
  keywords,
  hasMatch,
  onSearchNext,
  onDeleteAll,
}) => {
  const hasKeywords = keywords.split(',').map((k) => k.trim()).filter(Boolean).length > 0;

  if (!hasKeywords) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-gray-400">输入关键词后可用搜索/删除</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={onSearchNext}
        disabled={!hasMatch}
        className={`
          flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors
          ${hasMatch
            ? 'bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100'
            : 'bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed'
          }
        `}
        title={hasMatch ? '查找下一个匹配行' : '无匹配行'}
      >
        <span>🔍</span>
        <span>搜索下一条</span>
      </button>
      <button
        onClick={onDeleteAll}
        disabled={!hasMatch}
        className={`
          flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors
          ${hasMatch
            ? 'bg-red-50 border border-red-200 text-red-600 hover:bg-red-100'
            : 'bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed'
          }
        `}
        title={hasMatch ? '删除所有包含关键词的行' : '无匹配行'}
      >
        <span>🗑</span>
        <span>一键删除</span>
      </button>
    </div>
  );
};
