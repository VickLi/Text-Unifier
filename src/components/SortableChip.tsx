import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { SortableFile } from '../types';

interface SortableChipProps {
  file: SortableFile;
  isMain: boolean;
  totalFiles: number;
  onRemove: (path: string) => void;
}

export const SortableChip: React.FC<SortableChipProps> = React.memo(
  ({ file, isMain, totalFiles, onRemove }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: file.id,
      disabled: totalFiles <= 1,
    });

    const style: React.CSSProperties = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    const formatSize = (bytes: number): string => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs whitespace-nowrap border transition-colors ${
          isDragging
            ? 'border-blue-300 bg-blue-50 shadow-md z-10'
            : isMain
              ? 'border-blue-400 bg-blue-50 ring-1 ring-blue-300'
              : 'bg-white border-gray-200 hover:border-gray-300'
        }`}
      >
        <span
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
          {...attributes}
          {...listeners}
          aria-label={`拖拽 ${file.name}`}
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" /></svg>
        </span>
        <svg className="w-3 h-3 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span className="max-w-[120px] truncate text-gray-700 font-medium">{file.name}</span>
        <span className="text-gray-400">{formatSize(file.size)}</span>
        {isMain && <span className="text-amber-600 font-bold">★</span>}
        <button
          onClick={() => onRemove(file.path)}
          className="ml-0.5 text-gray-400 hover:text-red-500 transition-colors"
          aria-label={`删除 ${file.name}`}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
    );
  }
);

SortableChip.displayName = 'SortableChip';
