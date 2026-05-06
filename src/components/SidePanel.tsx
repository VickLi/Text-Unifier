import React from 'react';
import { CleanPanel } from './CleanPanel';
import { ChapterPanel } from './ChapterPanel';
import { FormatPanel } from './FormatPanel';

/**
 * 右侧工具面板容器（V3.1 新增）
 * 容纳 CleanPanel、ChapterPanel、FormatPanel 三个子面板
 */
export const SidePanel: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<'clean' | 'chapter' | 'format'>('clean');

  const tabs = [
    { key: 'clean' as const, label: '清洗' },
    { key: 'chapter' as const, label: '章节' },
    { key: 'format' as const, label: '排版' },
  ];

  return (
    <div className="w-[280px] shrink-0 bg-white border border-gray-200 rounded-xl p-4 overflow-y-auto">
      {/* Tab 切换 */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-0.5">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 text-xs font-medium px-2 py-1.5 rounded-md transition-all ${
              activeTab === tab.key
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 面板内容 */}
      {activeTab === 'clean' && <CleanPanel />}
      {activeTab === 'chapter' && <ChapterPanel />}
      {activeTab === 'format' && <FormatPanel />}
    </div>
  );
};
