import React from 'react';
import type { AppMode } from '../types';
import { useStore } from '../store/useStore';

/**
 * 模式切换条（V3.2 RQ-05）
 */
export const ModeTabs: React.FC = () => {
  const activeMode = useStore((s) => s.activeMode);
  const setActiveMode = useStore((s) => s.setActiveMode);
  const fileList = useStore((s) => s.fileList);

  const modes: { key: AppMode; label: string; icon: string }[] = [
    { key: 'merge', label: '合并去重', icon: '🔗' },
    { key: 'compare', label: '文档对比', icon: '📋' },
  ];

  return (
    <div className="flex shrink-0 border-b border-gray-200 bg-white px-6">
      {modes.map((m) => (
        <button
          key={m.key}
          onClick={() => setActiveMode(m.key)}
          disabled={m.key === 'compare' && fileList.length > 2}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeMode === m.key
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          } ${m.key === 'compare' && fileList.length > 2 ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={m.key === 'compare' && fileList.length > 2 ? '对比模式仅支持 2 个文件' : undefined}
        >
          {m.icon} {m.label}
        </button>
      ))}
    </div>
  );
};
