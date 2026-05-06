import React from 'react';
import type { DuplicateGroup, TriState } from '../types';
import { TriStateCheckbox } from './TriStateCheckbox';

interface DuplicateItemProps {
  group: DuplicateGroup;
  /** 三态值 */
  triState: TriState;
  onToggle: () => void;
}

/**
 * 重复组列表项（V2.0 三态联动版）
 *
 * 显示重复组信息，使用三态复选框与预览段落勾选状态联动
 */
export const DuplicateItem: React.FC<DuplicateItemProps> = React.memo(
  ({ group, triState, onToggle }) => {
    const isExcluded = triState === 'checked';
    const isIndeterminate = triState === 'indeterminate';

    return (
      <div
        className={`
          rounded-lg border p-3 transition-all duration-150
          ${isExcluded
            ? 'border-red-200 bg-red-50'
            : isIndeterminate
              ? 'border-amber-200 bg-amber-50'
              : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
          }
        `}
      >
        <label className="flex items-start gap-3 cursor-pointer">
          <TriStateCheckbox
            state={triState}
            onChange={onToggle}
            ariaLabel={`重复组: ${group.snippet}, 状态: ${triState}`}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {isExcluded ? (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                  已排除
                </span>
              ) : isIndeterminate ? (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">
                  部分排除
                </span>
              ) : (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
                  重复
                </span>
              )}
              <span className="text-xs text-gray-500">
                {group.occurrenceCount} 个文件
              </span>
            </div>
            <p
              className={`text-sm leading-relaxed line-clamp-2 ${
                isExcluded ? 'text-gray-400 line-through' : 'text-gray-800'
              }`}
            >
              {group.snippet}
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {group.sources.map((source, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600"
                >
                  {source.fileName}:{source.startLine}
                </span>
              ))}
            </div>
          </div>
        </label>
      </div>
    );
  }
);

DuplicateItem.displayName = 'DuplicateItem';
