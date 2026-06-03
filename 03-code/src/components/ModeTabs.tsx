import React from 'react';
import type { AppMode } from '../types';
import { useStore } from '../store/useStore';

/**
 * 模式切换条（V3.2 RQ-05）
 * V4.0: 按 Feature Flag 动态过滤可用模式
 */
export const ModeTabs: React.FC = () => {
  const activeMode = useStore((s) => s.activeMode);
  const setActiveMode = useStore((s) => s.setActiveMode);
  const sortedFileList = useStore((s) => s.sortedFileList);
  const modes: { key: AppMode; label: string; icon: string }[] = [
    { key: 'merge', label: '合并去重', icon: '🔗' },
    { key: 'compare', label: '文档对比', icon: '📋' },
  ];

  if (modes.length === 0) return null;

  return (
    <div className="flex shrink-0 border-b border-gray-200 bg-white px-6">
      {modes.map((m) => (
        <button
          key={m.key}
          onClick={() => {
            if (m.key === 'compare' && sortedFileList.length > 2) {
              useStore.getState().showToast('文档对比仅支持 2 个文件，请先移除多余文件', 'error');
              return;
            }
            setActiveMode(m.key);
          }}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeMode === m.key
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          {m.icon} {m.label}
        </button>
      ))}
    </div>
  );
};
