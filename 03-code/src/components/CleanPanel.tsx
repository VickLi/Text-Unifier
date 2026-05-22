import React, { useCallback, useState } from 'react';
import { useStore } from '../store/useStore';
import { ToggleButton } from './ToggleButton';

/**
 * V4.0 CleanPanel（精简版 + SearchReplace）
 *
 * 从上到下：
 *   ToggleButton（全角↔半角）
 *   ToggleButton（繁→简）
 *   ── 分隔线 ──
 *   SearchReplace（搜索替换）
 */
export const CleanPanel: React.FC = () => {
  const isFullWidthConverted = useStore((s) => s.isFullWidthConverted);
  const isTraditionalConverted = useStore((s) => s.isTraditionalConverted);
  const toggleFullWidth = useStore((s) => s.toggleFullWidth);
  const toggleTraditional = useStore((s) => s.toggleTraditional);
  const mergedText = useStore((s) => s.mergedText);

  // 搜索替换本地状态
  const caseSensitive = useStore((s) => s.caseSensitive);
  const searchResults = useStore((s) => s.searchResults);
  const currentMatchIndex = useStore((s) => s.currentMatchIndex);
  const isSearching = useStore((s) => s.isSearching);
  const performSearch = useStore((s) => s.performSearch);
  const replaceOne = useStore((s) => s.replaceOne);
  const replaceAll = useStore((s) => s.replaceAll);
  const clearSearch = useStore((s) => s.clearSearch);

  const [localKeyword, setLocalKeyword] = useState('');
  const [localReplace, setLocalReplace] = useState('');

  // 同步本地状态到 Store（解决 P2-001）
  const syncKeyword = useCallback((val: string) => {
    setLocalKeyword(val);
    useStore.setState({ searchKeyword: val });
  }, []);

  const syncReplace = useCallback((val: string) => {
    setLocalReplace(val);
    useStore.setState({ replaceText: val });
  }, []);

  const hasContent = !!mergedText;

  const handleFullWidthToggle = useCallback(() => {
    toggleFullWidth();
  }, [toggleFullWidth]);

  const handleSearch = useCallback(() => {
    performSearch(localKeyword);
  }, [localKeyword, performSearch]);

  const handleClearSearch = useCallback(() => {
    setLocalKeyword('');
    setLocalReplace('');
    clearSearch();
  }, [clearSearch]);

  // Ctrl+H 唤起搜索
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault();
        document.getElementById('search-input')?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-700">内容清洗</h4>

      {/* 全角↔半角 ToggleButton */}
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

      {/* 繁简转换 ToggleButton */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">繁简转换</label>
        <ToggleButton
          labelForward="繁→简"
          labelBackward="简→繁"
          isToggled={isTraditionalConverted}
          onToggle={toggleTraditional}
          disabled={!hasContent}
        />
      </div>

      {/* 分隔线 */}
      <hr className="border-gray-200" />

      {/* 搜索替换区 */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">搜索替换 (Ctrl+H)</label>
        <div className="flex gap-1 mb-1">
          <input
            id="search-input"
            type="text"
            value={localKeyword}
            onChange={(e) => syncKeyword(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
            placeholder="搜索关键词"
            className="flex-1 text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-400"
          />
          {isSearching && (
            <button onClick={handleClearSearch} className="text-xs text-gray-400 hover:text-gray-600 px-1">✕</button>
          )}
          <button onClick={handleSearch} className="text-xs bg-blue-500 text-white rounded px-2 py-1 hover:bg-blue-600">搜索</button>
        </div>

        <input
          type="text"
          value={localReplace}
          onChange={(e) => syncReplace(e.target.value)}
          placeholder="替换为"
          className="w-full text-xs border border-gray-300 rounded px-2 py-1 mb-1 focus:ring-1 focus:ring-blue-400"
        />

        <div className="flex items-center gap-2 mb-1">
          <label className="flex items-center gap-1 text-xs text-gray-500">
            <input type="checkbox" checked={caseSensitive}
              onChange={(e) => useStore.setState({ caseSensitive: e.target.checked })}
              className="h-3 w-3 rounded" />
            区分大小写
          </label>
          {searchResults.length > 0 && (
            <span className="text-xs text-gray-400 ml-auto">
              第 {currentMatchIndex + 1}/{searchResults.length} 个
            </span>
          )}
        </div>

        {searchResults.length > 0 && (
          <div className="flex gap-1">
            <button onClick={() => {
              useStore.setState({ replaceText: localReplace });
              replaceOne();
            }} className="flex-1 text-xs bg-orange-500 text-white rounded px-2 py-1 hover:bg-orange-600">替换</button>
            <button onClick={() => {
              useStore.setState({ replaceText: localReplace });
              replaceAll();
            }} className="flex-1 text-xs bg-red-500 text-white rounded px-2 py-1 hover:bg-red-600">全部替换</button>
          </div>
        )}
      </div>
    </div>
  );
};
