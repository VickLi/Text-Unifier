import React from 'react';
import type { ConnectionPoint } from '../types';

interface ConnectionMarkerProps {
  cp: ConnectionPoint;
  isMerged: boolean;
  onToggle: (id: string) => void;
}

/**
 * V4.0 连接标记组件
 *
 * 在预览区连续文本中插入连接标记（不可编辑区域）：
 *  - 灰色虚线 = 自动合并
 *  - 蓝色虚线 = 待确认
 *  - 提供「切断」/「连接」按钮
 */
export const ConnectionMarker: React.FC<ConnectionMarkerProps> = React.memo(
  ({ cp, isMerged, onToggle }) => {
    const handleToggle = () => onToggle(cp.id);

    const borderColor = isMerged ? 'border-gray-300' : 'border-blue-400';
    const bgColor = isMerged ? 'bg-gray-50' : 'bg-blue-50';
    const textColor = isMerged ? 'text-gray-400' : 'text-blue-500';
    const label = isMerged ? '已合并' : '待确认';

    return (
      <div
        className={`my-1 border-l-4 border-dashed ${borderColor} ${bgColor} rounded-r px-3 py-1.5 select-none`}
        contentEditable={false}
        data-connection-id={cp.id}
      >
        <div className="flex items-center justify-between gap-2">
          <span className={`text-[11px] font-medium ${textColor}`}>
            ┈┈ 连接 ({cp.fileA} ↔ {cp.fileB}, {cp.overlapLength}字) ┈┈
            <span className={`ml-1.5 px-1 py-0.5 rounded text-[10px] ${isMerged ? 'bg-gray-200 text-gray-500' : 'bg-blue-200 text-blue-600'}`}>
              {label}
            </span>
          </span>
          <button
            onClick={handleToggle}
            className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
              isMerged
                ? 'border-red-200 text-red-500 hover:bg-red-50'
                : 'border-green-200 text-green-600 hover:bg-green-50'
            }`}
          >
            {isMerged ? '切断' : '连接'}
          </button>
        </div>
      </div>
    );
  }
);

ConnectionMarker.displayName = 'ConnectionMarker';
