import React, { useCallback, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useStore } from '../store/useStore';
import { SortableFileItem } from './SortableFileItem';

/**
 * 可拖拽排序文件列表组件（RQ-01）
 *
 * 使用 @dnd-kit 实现拖拽排序
 * 支持鼠标拖拽和键盘排序
 */
export const FileSortList: React.FC = () => {
  const sortedFileList = useStore((s) => s.sortedFileList);
  const status = useStore((s) => s.status);
  const reorderFiles = useStore((s) => s.reorderFiles);
  const triggerReanalysis = useStore((s) => s.triggerReanalysis);
  const setActiveDragFileId = useStore((s) => s.setActiveDragFileId);
  const removeFile = useStore((s) => s.removeFile);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDisabled = status === 'loading';

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px 的移动距离才激活拖拽，防止误触
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      setActiveDragFileId(String(event.active.id));
    },
    [setActiveDragFileId]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDragFileId(null);
      const { active, over } = event;

      if (!over) return;

      if (active.id !== over.id) {
        const oldIndex = sortedFileList.findIndex((f) => f.id === active.id);
        const newIndex = sortedFileList.findIndex((f) => f.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          reorderFiles(oldIndex, newIndex);
          // BUG-026: 拖拽排序后自动触发重新分析
          triggerReanalysis();
        }
      }
    },
    [sortedFileList, reorderFiles, setActiveDragFileId, triggerReanalysis]
  );

  const handleDragCancel = useCallback(() => {
    setActiveDragFileId(null);
  }, [setActiveDragFileId]);

  const handleRemoveFile = useCallback(
    (path: string) => {
      removeFile(path);
    },
    [removeFile]
  );

  const handleAddFileClick = useCallback(() => {
    if (isDisabled) return;
    fileInputRef.current?.click();
  }, [isDisabled]);

  const totalFiles = sortedFileList.length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">
          文件列表 ({totalFiles})
        </h3>
        <span className="text-xs text-gray-400">
          拖拽调整顺序，第一项为主文件
        </span>
      </div>

      {/* 文件排序列表 */}
      {totalFiles > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext
            items={sortedFileList.map((f) => f.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-1.5">
              {sortedFileList.map((file, index) => (
                <SortableFileItem
                  key={file.id}
                  file={file}
                  isMainFile={index === 0}
                  totalFiles={totalFiles}
                  onRemove={handleRemoveFile}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="flex flex-col items-center justify-center py-6 text-gray-400">
          <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="text-xs">暂无文件，请点击下方按钮添加</p>
        </div>
      )}

      {/* 添加文件按钮 */}
      <button
        onClick={handleAddFileClick}
        disabled={isDisabled}
        className={`
          w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 border-dashed
          text-sm font-medium transition-all duration-150
          ${isDisabled
            ? 'border-gray-200 text-gray-300 cursor-not-allowed'
            : 'border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50'
          }
        `}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        添加 .txt 文件
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".txt"
        multiple
        className="hidden"
        onChange={(e) => {
          // 文件选择由 App.tsx 的 handleFilesSelected 处理
          // 这里通过自定义事件传递文件数据
          if (e.target.files && e.target.files.length > 0) {
            const event = new CustomEvent('sortable-files-selected', {
              detail: Array.from(e.target.files),
            });
            window.dispatchEvent(event);
          }
          e.target.value = '';
        }}
        disabled={isDisabled}
      />
    </div>
  );
};
