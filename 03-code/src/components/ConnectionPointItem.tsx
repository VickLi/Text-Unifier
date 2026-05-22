import React, { useCallback } from 'react';
import type { ConnectionPoint } from '../types';

interface Props {
  cp: ConnectionPoint;
  isMerged: boolean;
  onToggle: (id: string) => void;
}

/**
 * V4.0 连接点条目
 *
 * 展示单个文件间重叠信息：
 *  - 状态徽章（已自动合并 / 待确认）
 *  - 重叠文本 snippet
 *  - 文件对名称
 *  - 重叠长度
 *  - ToggleSwitch（合并/保留）
 */
export const ConnectionPointItem: React.FC<Props> = React.memo(({ cp, isMerged, onToggle }) => {
  const handleToggle = useCallback(() => onToggle(cp.id), [cp.id, onToggle]);

  const statusLabel = cp.isAutoMerged ? '已自动合并' : '待确认';
  const statusColor = cp.isAutoMerged ? 'bg-gray-100 text-gray-500' : 'bg-blue-100 text-blue-600';

  return (
    <div className="border border-gray-200 rounded-lg p-2.5 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between mb-1.5">
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${statusColor}`}>
          {statusLabel}
        </span>
        {/* ToggleSwitch */}
        <button
          onClick={handleToggle}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            isMerged ? 'bg-blue-500' : 'bg-gray-300'
          }`}
          aria-label={isMerged ? '断开连接' : '合并连接'}
        >
          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
            isMerged ? 'translate-x-[18px]' : 'translate-x-[2px]'
          }`} />
        </button>
      </div>

      {/* 文件对 */}
      <div className="text-[11px] text-gray-500 mb-1">
        <span className="font-medium text-gray-700">{cp.fileA}</span>
        <span className="mx-1">↔</span>
        <span className="font-medium text-gray-700">{cp.fileB}</span>
      </div>

      {/* 重叠信息 */}
      {cp.overlapLength > 0 && (
        <div className="text-[11px] text-gray-400">
          重叠 <span className="font-medium text-gray-600">{cp.overlapLength}</span> 字
          {cp.overlapSnippet && (
            <span className="block text-[10px] text-gray-400 mt-0.5 truncate">
              "{cp.overlapSnippet}"
            </span>
          )}
        </div>
      )}

      {cp.overlapLength === 0 && (
        <div className="text-[11px] text-gray-400">无重叠</div>
      )}
    </div>
  );
});

ConnectionPointItem.displayName = 'ConnectionPointItem';
