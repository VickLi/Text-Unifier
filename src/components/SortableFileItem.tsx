import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { SortableFile } from '../types';

interface SortableFileItemProps {
  file: SortableFile;
  /** 是否为列表第一项（主文件） */
  isMainFile: boolean;
  /** 文件数量（仅1个时禁用拖拽） */
  totalFiles: number;
  /** 删除文件回调 */
  onRemove: (path: string) => void;
}

/**
 * 可拖拽排序文件行组件
 *
 * 包含：拖拽手柄、文件图标、文件名、文件大小、编码标签、主文件徽章
 */
export const SortableFileItem: React.FC<SortableFileItemProps> = React.memo(
  ({ file, isMainFile, totalFiles, onRemove }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: file.id, disabled: totalFiles <= 1 });

    const style: React.CSSProperties = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    /** 格式化文件大小 */
    const formatSize = (bytes: number): string => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    /** 编码标签颜色 */
    const encodingColorMap: Record<string, string> = {
      'UTF-8': 'bg-green-100 text-green-700 border-green-200',
      'UTF-8 BOM': 'bg-green-100 text-green-700 border-green-200',
      'GBK': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'GB18030': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    };

    const encodingClass = encodingColorMap[file.encoding] || 'bg-gray-100 text-gray-600 border-gray-200';

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`
          flex items-center gap-3 px-3 py-2.5 rounded-lg border
          transition-colors duration-150
          ${isDragging
            ? 'border-blue-300 bg-blue-50 shadow-md z-10'
            : 'border-gray-200 bg-white hover:border-gray-300'
          }
        `}
      >
        {/* 拖拽手柄 */}
        <button
          className={`
            flex items-center justify-center w-6 h-6 rounded
            text-gray-400 hover:text-gray-600 hover:bg-gray-100
            transition-colors cursor-grab active:cursor-grabbing
            ${totalFiles <= 1 ? 'opacity-30 cursor-not-allowed' : ''}
          `}
          {...attributes}
          {...listeners}
          aria-label={`拖拽排序 ${file.name}`}
          disabled={totalFiles <= 1}
          tabIndex={totalFiles <= 1 ? -1 : 0}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
          </svg>
        </button>

        {/* 文件图标 */}
        <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>

        {/* 文件名 */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">
            {file.name}
          </p>
          <p className="text-xs text-gray-400">
            {formatSize(file.size)}
          </p>
        </div>

        {/* 编码标签 */}
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${encodingClass}`}>
          {file.encoding}
        </span>

        {/* 主文件徽章 */}
        {isMainFile && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700 border border-amber-200">
            ★ 主文件
          </span>
        )}

        {/* 删除按钮 */}
        <button
          onClick={() => onRemove(file.path)}
          className="flex items-center justify-center w-6 h-6 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          aria-label={`删除 ${file.name}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    );
  }
);

SortableFileItem.displayName = 'SortableFileItem';
