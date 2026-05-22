import React, { useCallback, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useStore } from '../store/useStore';
import { SortableChip } from './SortableChip';
import { getFilePath } from '../utils/ipc';

interface FileChipBarProps {
  onFilesSelected: (files: { name: string; path: string; size: number }[]) => void;
}

/**
 * 浮动文件标签栏（V3.2 RQ-01）
 * 替代垂直 FileSortList，横向芯片展示
 */
export const FileChipBar: React.FC<FileChipBarProps> = ({ onFilesSelected }) => {
  const sortedFileList = useStore((s) => s.sortedFileList);
  const reorderFiles = useStore((s) => s.reorderFiles);
  const runMerge = useStore((s) => s.runMerge);
  const removeFile = useStore((s) => s.removeFile);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 12 } }), // BUG-V3.2-004: 12px 防止误触
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIdx = sortedFileList.findIndex((f) => f.id === active.id);
      const newIdx = sortedFileList.findIndex((f) => f.id === over.id);
      if (oldIdx !== -1 && newIdx !== -1) {
        reorderFiles(oldIdx, newIdx);
        runMerge();
      }
    },
    [sortedFileList, reorderFiles, runMerge]
  );

  const handleRemove = useCallback(
    (path: string) => { removeFile(path); },
    [removeFile]
  );

  return (
    <div className="flex items-center gap-1.5 px-6 py-1.5 bg-white border-b border-gray-200 overflow-x-auto shrink-0">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sortedFileList.map((f) => f.id)} strategy={horizontalListSortingStrategy}>
          {sortedFileList.map((file, idx) => (
            <SortableChip
              key={file.id}
              file={file}
              isMain={idx === 0}
              totalFiles={sortedFileList.length}
              onRemove={handleRemove}
            />
          ))}
        </SortableContext>
      </DndContext>
      <button
        onClick={() => fileInputRef.current?.click()}
        className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-xs font-medium border border-dashed border-gray-300 text-gray-400 hover:text-blue-500 hover:border-blue-300 hover:bg-blue-50 transition-all shrink-0"
        title="添加 .txt 文件"
        aria-label="添加 .txt 文件"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files).map((f) => ({
              name: f.name,
              path: getFilePath(f),
              size: f.size,
            }));
            onFilesSelected(files);
          }
          e.target.value = '';
        }}
      />
    </div>
  );
};
