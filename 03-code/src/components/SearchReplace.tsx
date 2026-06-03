import React, { useCallback, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';

/**
 * V4.0 搜索替换组件（PRD M1-M8）
 *
 * 功能：
 *  - Ctrl+H 唤起搜索框
 *  - 关键词高亮（黄色=匹配，橙色=当前焦点）
 *  - 逐个替换 / 全部替换
 *  - 替换入撤回栈
 *  - 搜索结果覆盖连接点列表
 */
export const SearchReplace: React.FC = () => {
  const searchKeyword = useStore((s) => s.searchKeyword);
  const replaceText = useStore((s) => s.replaceText);
  const caseSensitive = useStore((s) => s.caseSensitive);
  const searchResults = useStore((s) => s.searchResults);
  const currentMatchIndex = useStore((s) => s.currentMatchIndex);
  const isSearching = useStore((s) => s.isSearching);
  const mergedText = useStore((s) => s.mergedText);
  const setSearchKeyword = useStore((s) => s.setSearchKeyword);
  const setReplaceText = useStore((s) => s.setReplaceText);
  const performSearch = useStore((s) => s.performSearch);
  const replaceOne = useStore((s) => s.replaceOne);
  const replaceAll = useStore((s) => s.replaceAll);
  const clearSearch = useStore((s) => s.clearSearch);

  const inputRef = useRef<HTMLInputElement>(null);

  // Ctrl+H 唤起搜索框
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // 实时搜索（debounced 500ms）+ BUG-8 修复：空关键词立即关闭，短关键词不搜
  useEffect(() => {
    if (!mergedText) return;
    if (!searchKeyword || searchKeyword.trim() === '') {
      clearSearch();
      return;
    }
    // 单字不搜（减少卡顿）
    if (searchKeyword.length < 2) return;
    const timer = setTimeout(() => {
      performSearch(searchKeyword);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchKeyword, caseSensitive, mergedText, performSearch, clearSearch]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (e.shiftKey) {
          // Shift+Enter: 上一个匹配
          const state = useStore.getState();
          if (state.currentMatchIndex > 0) {
            useStore.setState({ currentMatchIndex: state.currentMatchIndex - 1 });
          }
        } else {
          // Enter: 下一个匹配
          const state = useStore.getState();
          if (state.currentMatchIndex < state.searchResults.length - 1) {
            useStore.setState({ currentMatchIndex: state.currentMatchIndex + 1 });
          }
        }
      }
      if (e.key === 'Escape') {
        clearSearch();
      }
    },
    [clearSearch]
  );

  const hasContent = !!mergedText;

  if (!hasContent) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-gray-700">搜索替换</h4>

      {/* 搜索输入 */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="搜索关键词 (Ctrl+H)..."
          className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
        />
        {searchKeyword && (
          <button
            onClick={clearSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
          >
            ✕
          </button>
        )}
      </div>

      {/* 替换输入（搜索激活时显示） */}
      {isSearching && (
        <>
          <input
            type="text"
            value={replaceText}
            onChange={(e) => setReplaceText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="替换为..."
            className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-400 focus:border-green-400"
          />

          {/* 搜索状态 */}
          <div className="text-xs text-gray-400">
            {searchResults.length > 0
              ? `${currentMatchIndex + 1} / ${searchResults.length} 个匹配`
              : '无匹配结果'}
          </div>

          {/* 替换按钮 */}
          <div className="flex gap-2">
            <button
              onClick={replaceOne}
              disabled={searchResults.length === 0}
              className="flex-1 px-2 py-1.5 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:text-gray-500 transition-colors"
            >
              替换一处
            </button>
            <button
              onClick={replaceAll}
              disabled={searchResults.length === 0}
              className="flex-1 px-2 py-1.5 text-xs bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:text-gray-500 transition-colors"
            >
              全部替换
            </button>
          </div>
        </>
      )}
    </div>
  );
};
