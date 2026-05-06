import React, { useCallback } from 'react';
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
import { UploadButton } from './UploadButton';

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
  const triggerReanalysis = useStore((s) => s.triggerReanalysis);
  const removeFile = useStore((s) => s.removeFile);

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
        triggerReanalysis();
      }
    },
    [sortedFileList, reorderFiles, triggerReanalysis]
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
      <UploadButton onFilesSelected={onFilesSelected} />
    </div>
  );
};
