import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useStore } from '../store/useStore';
import { Minimap } from './Minimap';
import { ConnectionMarker } from './ConnectionMarker';
import { Tooltip } from './Tooltip';

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

  const minimapItems = useStore((s) => s.minimapItems);
  const updateMinimap = useStore((s) => s.updateMinimap);
  const scrollToRatio = useStore((s) => s.scrollToRatio);
  const fileContents = useStore((s) => s.fileContents);
  const connectionPoints = useStore((s) => s.connectionPoints);
  const connectionStatesStore = useStore((s) => s.connectionStates);
  const toggleConnectionMerge = useStore((s) => s.toggleConnectionMerge);

  const sortedFileList = useStore((s) => s.sortedFileList);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const [localText, setLocalText] = useState(mergedText);

  // 悬停来源 Tooltip 状态
  const [hoverInfo, setHoverInfo] = useState<{ visible: boolean; content: string[]; position: { x: number; y: number } | null }>({
    visible: false, content: [], position: null,
  });
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleHoverStart = useCallback((e: React.MouseEvent, text: string) => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      setHoverInfo({ visible: true, content: [text], position: { x: e.clientX, y: e.clientY } });
    }, 300);
  }, []);

  const handleHoverEnd = useCallback(() => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setHoverInfo({ visible: false, content: [], position: null });
  }, []);

  // 同步外部 mergedText 变更到本地 + 更新 Minimap
  useEffect(() => {
    setLocalText(mergedText);
    updateMinimap();
  }, [mergedText, updateMinimap]);

  // 键盘快捷键（Ctrl+Z/Y 撤回/重做，Ctrl+S 导出）
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault(); undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault(); redo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault(); exportMergedText();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo, exportMergedText]);

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
  /** 构建带连接标记的渲染内容（与 toggleConnectionMerge 算法一致） */
  const renderWithMarkers = () => {
    if (!fileContents || fileContents.length === 0) {
      return <pre ref={preRef} className="text-sm font-sans leading-relaxed whitespace-pre-wrap break-words m-0">{mergedText}</pre>;
    }

    // 用 same 算法构建文本：先组装字符串，再从中找到每个连接点位置
    let fullText = fileContents[0];
    const markerPositions: { cpId: string; charPos: number }[] = [];

    for (let i = 1; i < fileContents.length; i++) {
      const cp = connectionPoints[i - 1];
      if (!cp) { fullText += '\n' + fileContents[i]; continue; }

      const isMerged = connectionStatesStore[cp.id] ?? cp.isAutoMerged;

      if (isMerged && cp.overlapLength > 0) {
        // 在 fullText 中找到重叠文本位置，原地插入
        const overlapText = fileContents[i].slice(0, cp.overlapLength);
        const insertPos = fullText.indexOf(overlapText);
        if (insertPos >= 0) {
          const afterOverlap = insertPos + overlapText.length;
          markerPositions.push({ cpId: cp.id, charPos: afterOverlap });
          const unique = fileContents[i].slice(cp.overlapLength);
          fullText = fullText.slice(0, afterOverlap) + unique + fullText.slice(afterOverlap);
        } else {
          fullText += '\n' + fileContents[i];
        }
      } else {
        markerPositions.push({ cpId: cp.id, charPos: fullText.length });
        fullText += '\n' + fileContents[i];
      }
    }

    // 按 charPos 从大到小排序，以便从右向左插入标记（避免位置偏移）
    markerPositions.sort((a, b) => b.charPos - a.charPos);

    // 在 fullText 的对应位置插入标记占位符，然后分割渲染
    const parts: React.ReactNode[] = [];
    // 从文本中提取片段，在标记位置插入 ConnectionMarker
    const sortedMarkers = connectionPoints.map(cp => ({
      cp,
      charPos: markerPositions.find(m => m.cpId === cp.id)?.charPos ?? -1,
      isMerged: connectionStatesStore[cp.id] ?? cp.isAutoMerged,
    })).filter(m => m.charPos >= 0).sort((a, b) => a.charPos - b.charPos);

    // 构建每个文本片段对应的源文件名列表
    const segmentSources: string[] = [];
    segmentSources.push(sortedFileList[0]?.name || fileContents[0].slice(0, 20));
    for (let i = 0; i < sortedMarkers.length; i++) {
      const nextFileIdx = i + 1;
      segmentSources.push(sortedFileList[nextFileIdx]?.name || `文件 ${nextFileIdx + 1}`);
    }

    let segIdx = 0;
    let cursor = 0;
    for (const m of sortedMarkers) {
      if (m.charPos > cursor) {
        const text = fullText.slice(cursor, m.charPos);
        const source = segmentSources[segIdx] || '未知来源';
        parts.push(
          <span
            key={`t-${cursor}`}
            onMouseEnter={(e) => handleHoverStart(e, `来源：${source}`)}
            onMouseLeave={handleHoverEnd}
          >
            {text}
          </span>
        );
        segIdx++;
      }
      parts.push(
        <ConnectionMarker key={m.cp.id} cp={m.cp} isMerged={m.isMerged} onToggle={toggleConnectionMerge} />
      );
      cursor = m.charPos;
    }
    if (cursor < fullText.length) {
      const text = fullText.slice(cursor);
      const source = segmentSources[segIdx] || '未知来源';
      parts.push(
        <span
          key={`t-end`}
          onMouseEnter={(e) => handleHoverStart(e, `来源：${source}`)}
          onMouseLeave={handleHoverEnd}
        >
          {text}
        </span>
      );
    }

    return (
      <pre ref={preRef} className="text-sm font-sans leading-relaxed whitespace-pre-wrap break-words m-0">
        {parts}
      </pre>
    );
  };

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

    // 阅读模式：渲染带连接标记的文本
    return (
      <div className="w-full h-full overflow-y-auto p-4" data-preview-container>
        {renderWithMarkers()}
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
          <button onClick={undo} disabled={!canUndo}
            className={`text-xs px-2 py-0.5 rounded ${canUndo ? 'text-gray-600 hover:bg-gray-100' : 'text-gray-300 cursor-not-allowed'}`}>↶ 撤回</button>
          <button onClick={redo} disabled={!canRedo}
            className={`text-xs px-2 py-0.5 rounded ${canRedo ? 'text-gray-600 hover:bg-gray-100' : 'text-gray-300 cursor-not-allowed'}`}>↷ 重做</button>
          {undoStack.length > 0 && <span className="text-xs text-gray-400">{undoPointer + 1}/{undoStack.length}</span>}
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
      {/* 悬停来源 Tooltip */}
      <Tooltip visible={hoverInfo.visible} content={hoverInfo.content} position={hoverInfo.position} />
    </div>
  );
};

