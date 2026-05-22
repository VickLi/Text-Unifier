import React, { useState, useCallback } from 'react';
import { useStore } from '../store/useStore';

/**
 * V4.0 合并设置面板
 *
 * 重叠阈值配置（默认 50，范围 10~500，步长 10）。
 * 入口：标题栏 [≡] 菜单 →「合并设置」或连接点面板顶部齿轮图标 ⚙
 */
export const MergeSettings: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const overlapThreshold = useStore((s) => s.overlapThreshold);
  const setOverlapThreshold = useStore((s) => s.setOverlapThreshold);
  const sortedFileList = useStore((s) => s.sortedFileList);
  const [localValue, setLocalValue] = useState(overlapThreshold);

  const handleApply = useCallback(() => {
    setOverlapThreshold(localValue);
    onClose();
  }, [localValue, setOverlapThreshold, onClose]);

  const handleReset = useCallback(() => {
    setLocalValue(50);
    setOverlapThreshold(50);
    onClose();
  }, [setOverlapThreshold, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl p-6 w-[360px] max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800">合并设置</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
        </div>

        {/* 重叠阈值 */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            重叠阈值
            <span className="text-xs text-gray-400 ml-1">（字符数）</span>
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={10}
              max={500}
              step={10}
              value={localValue}
              onChange={(e) => setLocalValue(Number(e.target.value))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <span className="text-sm font-mono font-medium text-gray-700 w-12 text-right">
              {localValue}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1.5">
            相邻文件重叠 ≥ {localValue} 字时自动合并，&lt; {localValue} 字时标记为待确认
          </p>
        </div>

        {/* 当前文件信息 */}
        <div className="mb-5 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500">
            当前文件数：<span className="font-medium text-gray-700">{sortedFileList.length}</span>
          </p>
          {sortedFileList.length > 0 && (
            <p className="text-xs text-gray-400 mt-1 truncate">
              {sortedFileList.map((f) => f.name).join(', ')}
            </p>
          )}
        </div>

        {/* 按钮 */}
        <div className="flex gap-2">
          <button
            onClick={handleApply}
            className="flex-1 px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
          >
            应用并重新合并
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200 transition-colors"
          >
            重置默认
          </button>
        </div>
      </div>
    </div>
  );
};
