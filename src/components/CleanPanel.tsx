import React, { useCallback, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { ToggleButton } from './ToggleButton';
import { KeywordSearchBar } from './KeywordSearchBar';

/**
 * V3.3 内容清洗面板（重构版）
 *
 * V3.3 变更：
 *  - 繁简转换：select 下拉框 → ToggleButton「繁→简」⇄「简→繁」
 *  - 全角↔半角：Checkbox → ToggleButton「全角→半角」⇄「半角→全角」
 *  - RQ-07：移除「清除行尾页码」
 *  - RQ-06：新增 KeywordSearchBar（搜索下一个 + 一键删除）
 *  - Ctrl+F 聚焦关键词搜索框 / F3 搜索下一个
 */
export const CleanPanel: React.FC = () => {
  const cleanOptions = useStore((s) => s.cleanOptions);
  const setCleanOptions = useStore((s) => s.setCleanOptions);
  const isFullWidthConverted = useStore((s) => s.isFullWidthConverted);
  const isTraditionalConverted = useStore((s) => s.isTraditionalConverted);
  const toggleFullWidth = useStore((s) => s.toggleFullWidth);
  const toggleTraditional = useStore((s) => s.toggleTraditional);
  const searchNextKeyword = useStore((s) => s.searchNextKeyword);
  const deleteAllKeywordMatches = useStore((s) => s.deleteAllKeywordMatches);
  const pushSnapshot = useStore((s) => s.pushSnapshot);
  const previewParagraphs = useStore((s) => s.previewParagraphs);
  const paragraphCheckedMap = useStore((s) => s.paragraphCheckedMap);
  const keywordInputRef = useRef<HTMLInputElement>(null);

  const hasContent = previewParagraphs.length > 0;

  // 检查是否有关键词匹配
  const kws = cleanOptions.filterKeywords.split(',').map((k) => k.trim()).filter(Boolean);
  const hasMatch = kws.length > 0 && (() => {
    const text = previewParagraphs
      .filter((p) => paragraphCheckedMap.get(p.id) !== false)
      .map((p) => p.text).join('\n');
    return kws.some((kw) => text.includes(kw));
  })();

  // RQ-06: Ctrl+F 聚焦搜索框 / F3 搜索下一个
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        keywordInputRef.current?.focus();
      }
      if (e.key === 'F3') {
        e.preventDefault();
        searchNextKeyword();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [searchNextKeyword]);

  const handleFullWidthToggle = useCallback(() => {
    pushSnapshot(isFullWidthConverted ? '半角→全角' : '全角→半角');
    toggleFullWidth();
  }, [isFullWidthConverted, pushSnapshot, toggleFullWidth]);

  const handleTraditionalToggle = useCallback(() => {
    toggleTraditional();
  }, [toggleTraditional]);

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-700">内容清洗</h4>

      {/* RQ-05: 繁简转换 ToggleButton（替代原 select 下拉框） */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">繁简转换</label>
        <ToggleButton
          labelForward="繁→简"
          labelBackward="简→繁"
          isToggled={isTraditionalConverted}
          onToggle={handleTraditionalToggle}
          disabled={!hasContent}
        />
      </div>

      {/* RQ-05: 全角↔半角 ToggleButton（替代原 Checkbox） */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">全角↔半角</label>
        <ToggleButton
          labelForward="全角→半角"
          labelBackward="半角→全角"
          isToggled={isFullWidthConverted}
          onToggle={handleFullWidthToggle}
          disabled={!hasContent}
        />
      </div>

      {/* 广告/水印过滤（保留） */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={cleanOptions.stripArtifacts}
          onChange={(e) => setCleanOptions({ stripArtifacts: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300 text-blue-500"
        />
        <span className="text-xs text-gray-600">广告/水印过滤</span>
      </label>

      {/* RQ-06: 内容筛选关键词 + 搜索栏 */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">过滤关键词（逗号分隔）</label>
        <input
          ref={keywordInputRef}
          type="text"
          value={cleanOptions.filterKeywords}
          onChange={(e) => setCleanOptions({ filterKeywords: e.target.value })}
          placeholder="群号,下载器,QQ群"
          className="w-full text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
        />
        <div className="mt-1.5">
          <KeywordSearchBar
            keywords={cleanOptions.filterKeywords}
            hasMatch={hasMatch}
            onSearchNext={searchNextKeyword}
            onDeleteAll={deleteAllKeywordMatches}
          />
        </div>
      </div>
    </div>
  );
};
