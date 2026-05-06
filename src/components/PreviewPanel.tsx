import React, { useCallback, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { computeExcludedCount, computeSelectAllState } from '../store/useStore';
import { PreviewParagraph } from './PreviewParagraph';
import { Tooltip } from './Tooltip';
import { useShiftSelect } from '../hooks/useShiftSelect';

/**
 * 预览面板组件（V3.2 增强版：可编辑 + 撤回栈）
 */
export const PreviewPanel: React.FC = () => {
  const previewParagraphs = useStore((s) => s.previewParagraphs);
  const paragraphCheckedMap = useStore((s) => s.paragraphCheckedMap);
  const hoveredParagraphId = useStore((s) => s.hoveredParagraphId);
  const hoveredSourceFiles = useStore((s) => s.hoveredSourceFiles);
  const hoverPosition = useStore((s) => s.hoverPosition);
  const status = useStore((s) => s.status);
  const isEditing = useStore((s) => s.isEditing);
  const toggleEditing = useStore((s) => s.toggleEditing);
  const selectAllParagraphs = useStore((s) => s.selectAllParagraphs);
  const deselectAllParagraphs = useStore((s) => s.deselectAllParagraphs);
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const undoStack = useStore((s) => s.undoStack);
  const undoPointer = useStore((s) => s.undoPointer);

  const { handleParagraphCheck } = useShiftSelect();

  const canUndo = undoPointer > 0;
  const canRedo = undoPointer < undoStack.length - 1;

  const excludedCount = computeExcludedCount(previewParagraphs, paragraphCheckedMap);
  const selectAllState = computeSelectAllState(previewParagraphs, paragraphCheckedMap);

  // V3.2: 键盘快捷键 Ctrl+Z / Ctrl+Y
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);

  const handleSelectAllToggle = useCallback(() => {
    if (selectAllState === 'all') deselectAllParagraphs();
    else selectAllParagraphs();
  }, [selectAllState, selectAllParagraphs, deselectAllParagraphs]);

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
        <svg className="w-10 h-10 mb-3 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        <p className="text-sm">正在分析文件...</p>
      </div>
    );
  }

  if (previewParagraphs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
        <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
          />
        </svg>
        <p className="text-sm">最终文档预览</p>
        <p className="text-xs mt-1">添加并分析文件后将在此显示合并结果</p>
      </div>
    );
  }

  // 全部排除的空状态
  if (excludedCount === previewParagraphs.length) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-sm font-medium text-gray-700">最终文档预览</h3>
          <span className="text-xs text-gray-400">
            {previewParagraphs.length} 段 · 全部已排除
          </span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
          <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm">所有段落已被排除</p>
          <p className="text-xs mt-1">导出的文件将为空</p>
          <button
            onClick={selectAllParagraphs}
            className="mt-4 text-sm text-blue-500 hover:text-blue-700 underline"
          >
            全部恢复
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* V3.2 增强工具栏：编辑切换 + 撤回栈 */}
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
          {/* 撤回/重做按钮 */}
          <button onClick={undo} disabled={!canUndo} className={`text-xs px-2 py-0.5 rounded ${canUndo ? 'text-gray-600 hover:bg-gray-100' : 'text-gray-300 cursor-not-allowed'}`}>↶ 撤回</button>
          <button onClick={redo} disabled={!canRedo} className={`text-xs px-2 py-0.5 rounded ${canRedo ? 'text-gray-600 hover:bg-gray-100' : 'text-gray-300 cursor-not-allowed'}`}>↷ 重做</button>
          {undoStack.length > 0 && <span className="text-xs text-gray-400">{undoPointer + 1}/{undoStack.length}</span>}
          <button onClick={handleSelectAllToggle} className="text-xs text-blue-500 hover:text-blue-700">
            {selectAllState === 'all' ? '取消全选' : '全选'}
          </button>
          <span className="text-xs text-gray-400">{previewParagraphs.length - excludedCount} 段 · 已排除 {excludedCount} 段</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto space-y-1">
        {previewParagraphs.map((para) => (
          <PreviewParagraph
            key={para.id}
            paragraph={para}
            isChecked={(paragraphCheckedMap.get(para.id) ?? true) !== false}
            onCheckToggle={handleParagraphCheck}
          />
        ))}
      </div>
      <Tooltip visible={hoveredParagraphId !== null} content={hoveredSourceFiles} position={hoverPosition} />
    </div>
  );
};
