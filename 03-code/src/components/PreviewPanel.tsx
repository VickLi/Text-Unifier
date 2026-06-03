import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useStore } from '../store/useStore';
import { Minimap } from './Minimap';

/**
 * V4.0 预览面板 — 连续文本模型
 *
 * 核心变更（vs V3.3）：
 *  - 从段落列表改为连续文本 textarea
 *  - 连接标记（ConnectionMarker）在文本中内嵌显示
 *  - 搜索高亮通过 overlay 实现
 *  - 保留撤回栈 + Minimap
 */
export const PreviewPanel: React.FC = () => {
  const mergedText = useStore((s) => s.mergedText);
  const status = useStore((s) => s.status);
  const isAnalyzing = useStore((s) => s.isAnalyzing);
  const isEditing = useStore((s) => s.isEditing);
  const toggleEditing = useStore((s) => s.toggleEditing);
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const undoStack = useStore((s) => s.undoStack);
  const undoPointer = useStore((s) => s.undoPointer);
  const pushSnapshot = useStore((s) => s.pushSnapshot);
  const exportMergedText = useStore((s) => s.exportMergedText);
  const searchResults = useStore((s) => s.searchResults);
  const isSearching = useStore((s) => s.isSearching);
  const minimapItems = useStore((s) => s.minimapItems);
  const updateMinimap = useStore((s) => s.updateMinimap);
  const scrollToRatio = useStore((s) => s.scrollToRatio);
  const featureFlags = useStore((s) => s.featureFlags);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const [localText, setLocalText] = useState(mergedText);

  // 同步外部 mergedText 变更到本地 + 更新 Minimap
  useEffect(() => {
    setLocalText(mergedText);
    updateMinimap();
  }, [mergedText, updateMinimap]);

  // 键盘快捷键（Ctrl+Z/Y 受 undoRedo flag 控制，Ctrl+S 受 exportFeature flag 控制）
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        if (!featureFlags.undoRedo) return;
        e.preventDefault(); undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        if (!featureFlags.undoRedo) return;
        e.preventDefault(); redo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        if (!featureFlags.exportFeature) return;
        e.preventDefault(); exportMergedText();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo, exportMergedText, featureFlags.undoRedo, featureFlags.exportFeature]);

  const canUndo = undoPointer > 0;
  const canRedo = undoPointer < undoStack.length - 1;

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalText(e.target.value);
  }, []);

  // blur 时入栈 + 同步到 store
  const handleBlur = useCallback(() => {
    if (localText !== mergedText) {
      pushSnapshot('手动编辑');
      // 直接更新 store 中的 mergedText
      useStore.setState({ mergedText: localText });
    }
  }, [localText, mergedText, pushSnapshot]);

  // 渲染文本区域（BUG-1修复：使用 \n 实际换行；BUG-5修复：不显示连接标记列表）
  const renderContent = () => {
    if (!mergedText) return null;

    if (isEditing) {
      return (
        <textarea
          ref={textareaRef}
          value={localText}
          onChange={handleTextChange}
          onBlur={handleBlur}
          className="w-full h-full min-h-[300px] p-4 text-sm font-sans leading-relaxed resize-none border-0 outline-none focus:ring-0"
          placeholder="在此编辑合并后的文本..."
          spellCheck={false}
        />
      );
    }

    // 阅读模式：渲染纯文本（用 <br/> 保证换行；BUG-1 修复）
    const lines = mergedText.split('\n');
    return (
      <div className="w-full h-full overflow-y-auto p-4" data-preview-container>
        <pre ref={preRef} className="text-sm font-sans leading-relaxed whitespace-pre-wrap break-words m-0">
          {lines.map((line, i) => {
            const isMark = line.trimStart().startsWith('┈┈');
            const match = isSearching ? searchResults.find(r =>
              r.position <= (mergedText.split('\n').slice(0, i).join('\n').length + i) + line.length &&
              r.position >= (mergedText.split('\n').slice(0, i).join('\n').length + i)
            ) : null;
            return (
              <span key={i} id={match ? `match-${match.position}` : undefined}
                className={isMark ? 'text-gray-400 italic select-none' : ''}>
                {line}
                {'\n'}
              </span>
            );
          })}
        </pre>
      </div>
    );
  };

  if (status === 'loading' || isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
        <svg className="w-10 h-10 mb-3 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="text-sm">正在分析文件...</p>
      </div>
    );
  }

  if (!mergedText) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
        <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
        </svg>
        <p className="text-sm">最终文档预览</p>
        <p className="text-xs mt-1">添加并分析文件后将在此显示合并结果</p>
      </div>
    );
  }

  const lineCount = mergedText.split('\n').length;
  const charCount = mergedText.length;

  return (
    <div className="h-full flex flex-col">
      {/* 工具栏 */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-700">最终文档预览</h3>
          <button
            onClick={toggleEditing}
            className={`text-xs px-2 py-0.5 rounded border transition-colors ${
              isEditing
                ? 'bg-blue-50 border-blue-300 text-blue-600'
                : 'border-gray-200 text-gray-400 hover:border-gray-300'
            }`}
          >
            {isEditing ? '📖 阅读' : '✏️ 编辑'}
          </button>
        </div>
        <div className="flex items-center gap-2">
          {featureFlags.undoRedo && (
            <>
              <button onClick={undo} disabled={!canUndo}
                className={`text-xs px-2 py-0.5 rounded ${canUndo ? 'text-gray-600 hover:bg-gray-100' : 'text-gray-300 cursor-not-allowed'}`}>↶ 撤回</button>
              <button onClick={redo} disabled={!canRedo}
                className={`text-xs px-2 py-0.5 rounded ${canRedo ? 'text-gray-600 hover:bg-gray-100' : 'text-gray-300 cursor-not-allowed'}`}>↷ 重做</button>
              {undoStack.length > 0 && <span className="text-xs text-gray-400">{undoPointer + 1}/{undoStack.length}</span>}
            </>
          )}
          <span className="text-xs text-gray-400">{lineCount} 行 · {charCount.toLocaleString()} 字符</span>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex min-h-0">
        <div className="flex-1 overflow-hidden border border-gray-200 rounded-lg">
          {renderContent()}
        </div>
        {/* V4.0 Minimap：等比例压缩 N=容器高/3，ratio 跳转 */}
        {minimapItems.length > 0 && (
          <Minimap
            items={minimapItems}
            onItemClick={scrollToRatio}
          />
        )}
      </div>
    </div>
  );
};

