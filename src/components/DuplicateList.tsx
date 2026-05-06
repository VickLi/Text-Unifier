import React from 'react';
import { useStore } from '../store/useStore';
import { computeGroupState } from '../store/useStore';
import { DuplicateItem } from './DuplicateItem';

/**
 * 重复组列表（V2.0 三态联动版）
 *
 * 左侧面板显示所有跨文件重复组
 * 使用三态复选框与右侧预览段落勾选状态联动
 */
export const DuplicateList: React.FC = () => {
  const duplicateGroups = useStore((s) => s.duplicateGroups);
  const previewParagraphs = useStore((s) => s.previewParagraphs);
  const paragraphCheckedMap = useStore((s) => s.paragraphCheckedMap);
  const toggleGroupCheckV2 = useStore((s) => s.toggleGroupCheckV2);
  const status = useStore((s) => s.status);

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
        <svg className="w-10 h-10 mb-3 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="text-sm">正在分析文件...</p>
      </div>
    );
  }

  if (duplicateGroups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
        <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="text-sm">未发现重复段落</p>
        <p className="text-xs mt-1">所有段落均为唯一内容</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700">
          重复段落列表 ({duplicateGroups.length} 组)
        </h3>
        <span className="text-xs text-gray-400">
          勾选以从预览中排除
        </span>
      </div>
      {duplicateGroups.map((group) => (
        <DuplicateItem
          key={group.id}
          group={group}
          triState={computeGroupState(group.contentHash, {
            previewParagraphs,
            paragraphCheckedMap,
          })}
          onToggle={() => toggleGroupCheckV2(group.id)}
        />
      ))}
    </div>
  );
};
