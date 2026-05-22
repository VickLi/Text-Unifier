import React from 'react';
import { useStore } from '../store/useStore';
import { ConnectionPointItem } from './ConnectionPointItem';

/**
 * V4.0 连接点列表
 *
 * 替代 V3.3 的 DuplicateList。
 * 展示每对相邻文件的重叠信息 + ToggleSwitch。
 * 搜索时被搜索结果列表覆盖。
 */
export const ConnectionPointList: React.FC = () => {
  const connectionPoints = useStore((s) => s.connectionPoints);
  const connectionStates = useStore((s) => s.connectionStates);
  const toggleConnectionMerge = useStore((s) => s.toggleConnectionMerge);
  const searchResults = useStore((s) => s.searchResults);
  const isSearching = useStore((s) => s.isSearching);
  const mergedText = useStore((s) => s.mergedText);
  const currentMatchIndex = useStore((s) => s.currentMatchIndex);

  const hasContent = !!mergedText;

  // 搜索模式：显示搜索结果
  if (isSearching && searchResults.length > 0) {
    return (
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">搜索结果 ({searchResults.length})</h3>
        <div className="space-y-1.5">
          {searchResults.map((r) => (
            <div
              key={r.index}
              className={`border rounded-lg p-2 cursor-pointer transition-colors ${
                r.index === currentMatchIndex
                  ? 'border-orange-400 bg-orange-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => {
                const el = document.getElementById(`match-${r.position}`);
                el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
            >
              <div className="text-[11px] text-gray-500">
                <span className="text-orange-500 font-medium">{r.matchText}</span>
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5 truncate">
                ...{r.contextBefore}<mark className="bg-yellow-200 text-gray-800">{r.matchText}</mark>{r.contextAfter}...
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!hasContent) return null;

  if (connectionPoints.length === 0) {
    const fileCount = useStore.getState().sortedFileList.length;
    const message = fileCount >= 2
      ? '✨ 所有文件连接处无重叠'
      : '仅一个文件，无需合并';
    return (
      <div className="text-center py-8">
        <span className="text-2xl">✨</span>
        <p className="text-xs text-gray-400 mt-2">{message}</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-sm font-medium text-gray-700 mb-3">
        连接点 ({connectionPoints.length})
      </h3>
      <div className="space-y-2">
        {connectionPoints.map((cp) => (
          <ConnectionPointItem
            key={cp.id}
            cp={cp}
            isMerged={connectionStates[cp.id] ?? cp.isAutoMerged}
            onToggle={toggleConnectionMerge}
          />
        ))}
      </div>
    </div>
  );
};
