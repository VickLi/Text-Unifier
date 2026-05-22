import React, { useCallback, useRef, useEffect, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Minimap } from './Minimap';
import type { MinimapItem } from '../types';

/**
 * V4.0 PreviewPanel（连续文本编辑器 + 搜索高亮）
 *
 * V4.0 重构：
 *  - 从段落列表展示改为 contentEditable 连续文本
 *  - 搜索高亮：匹配项 <mark> 黄色底色，焦点项橙色底色
 *  - 连接标记信息在状态栏展示
 */
export const PreviewPanel: React.FC = () => {
  const mergedText = useStore((s) => s.mergedText);
  const connectionPoints = useStore((s) => s.connectionPoints);
  const isAnalyzing = useStore((s) => s.isAnalyzing);
  const analyzeError = useStore((s) => s.analyzeError);
  const sortedFileList = useStore((s) => s.sortedFileList);
  const searchKeyword = useStore((s) => s.searchKeyword);
  const searchResults = useStore((s) => s.searchResults);
  const currentMatchIndex = useStore((s) => s.currentMatchIndex);
  const isSearching = useStore((s) => s.isSearching);
  const caseSensitive = useStore((s) => s.caseSensitive);

  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalUpdate = useRef(false);

  // Ctrl+S 导出
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        useStore.getState().exportMergedText();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Ctrl+Z / Ctrl+Y 撤回/重做
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        const { undo } = useStore.getState();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        const { redo } = useStore.getState();
        redo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // 生成高亮 HTML
  const highlightedHtml = useMemo(() => {
    if (!mergedText) return '';
    let text = mergedText;
    if (isSearching && searchKeyword) {
      const flags = caseSensitive ? 'g' : 'gi';
      const escaped = searchKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const parts: string[] = [];
      let lastIdx = 0;
      const regex = new RegExp(escaped, flags);
      let match: RegExpExecArray | null;
      let idx = 0;
      while ((match = regex.exec(text)) !== null) {
        const isCurrent = idx === currentMatchIndex;
        parts.push(text.slice(lastIdx, match.index));
        parts.push(`<mark class="${isCurrent ? 'bg-orange-300' : 'bg-yellow-200'} rounded px-0.5">${match[0]}</mark>`);
        lastIdx = match.index + match[0].length;
        idx++;
      }
      parts.push(text.slice(lastIdx));
      return parts.join('');
    }
    // 无搜索时做基本的 HTML 转义换行
    return text.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>');
  }, [mergedText, searchKeyword, searchResults, currentMatchIndex, isSearching, caseSensitive]);

  // 同步高亮 HTML 到编辑器
  useEffect(() => {
    if (editorRef.current && highlightedHtml) {
      isInternalUpdate.current = true;
      editorRef.current.innerHTML = highlightedHtml;
      isInternalUpdate.current = false;
    }
  }, [highlightedHtml]);

  // 编辑输入处理
  const handleInput = useCallback(() => {
    if (isInternalUpdate.current) return;
    const editor = editorRef.current;
    if (!editor) return;
    const newText = editor.innerText || '';
    const oldText = useStore.getState().mergedText;
    if (newText !== oldText) {
      useStore.getState().pushSnapshot('编辑');
      useStore.setState({ mergedText: newText });
    }
  }, []);

  // 空状态
  if (!mergedText && !isAnalyzing) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <span className="text-4xl">📄</span>
          <p className="text-sm text-gray-400 mt-3">
            {sortedFileList.length === 0
              ? '拖拽 .txt 文件到此处或点击 + 按钮添加'
              : '点击上方文件芯片触发合并分析'}
          </p>
        </div>
      </div>
    );
  }

  // 加载中
  if (isAnalyzing) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-2xl mb-2">⏳</div>
          <p className="text-sm text-gray-400">正在合并文件...</p>
        </div>
      </div>
    );
  }

  // 错误
  if (analyzeError) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <span className="text-2xl">⚠️</span>
          <p className="text-sm text-red-500 mt-2">{analyzeError}</p>
        </div>
      </div>
    );
  }

  // Minimap 色条数据
  const minimapItems: MinimapItem[] = useMemo(() => {
    const items: MinimapItem[] = [];
    const lines = mergedText.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().length === 0) {
        items.push({ color: 'green', tooltip: `空行 #${i + 1}` });
      } else {
        items.push({ color: 'green', tooltip: `第 ${i + 1} 行` });
      }
    }
    return items;
  }, [mergedText]);

  return (
    <div className="h-full flex">
      {/* 文本编辑区 */}
      <div className="flex-1 flex flex-col min-w-0">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          className="flex-1 w-full overflow-auto border-0 outline-none text-sm leading-relaxed p-4 font-mono whitespace-pre-wrap break-words"
          style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
          data-placeholder="合并后的文本将显示在这里..."
        />

        {/* 连接点信息提示 */}
        {connectionPoints.length > 0 && (
          <div className="px-4 py-1.5 bg-gray-50 border-t border-gray-200 flex items-center gap-3 text-[11px] text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-gray-400"></span>
              自动合并 {connectionPoints.filter(cp => cp.isAutoMerged).length}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              待确认 {connectionPoints.filter(cp => !cp.isAutoMerged).length}
            </span>
            <span className="ml-auto">
              总 {mergedText.length.toLocaleString()} 字符
            </span>
          </div>
        )}
      </div>

      {/* Minimap 缩略图 */}
      {minimapItems.length > 0 && (
        <Minimap
          items={minimapItems}
          onItemClick={(idx) => {
            const editor = editorRef.current;
            if (!editor) return;
            editor.focus();
            const lineHeight = 22;
            editor.scrollTop = idx * lineHeight;
          }}
          visibleRange={[0, Math.max(0, minimapItems.length - 1)]}
        />
      )}
    </div>
  );
};
