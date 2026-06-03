import React, { useCallback } from 'react';
import { useStore } from '../store/useStore';
import { ToggleButton } from './ToggleButton';
import { SearchReplace } from './SearchReplace';

/**
 * V4.0 内容清洗面板（精简版 + 搜索替换）
 *
 * V4.0 变更：
 *  - 仅保留繁简转换 + 全角↔半角转换 两个 ToggleButton
 *  - 新增 SearchReplace 子组件（PRD M1-M8）
 *  - 移除：广告/水印过滤、关键词搜索、章节工具、排版增强
 *  - 改为操作 mergedText 字符串
 */
export const CleanPanel: React.FC = () => {
  const isFullWidthConverted = useStore((s) => s.isFullWidthConverted);
  const isTraditionalConverted = useStore((s) => s.isTraditionalConverted);
  const isConverting = useStore((s) => s.isConverting);
  const toggleFullWidth = useStore((s) => s.toggleFullWidth);
  const toggleTraditional = useStore((s) => s.toggleTraditional);
  const pushSnapshot = useStore((s) => s.pushSnapshot);
  const mergedText = useStore((s) => s.mergedText);
  const featureFlags = useStore((s) => s.featureFlags);

  const hasContent = !!mergedText;

  const handleFullWidthToggle = useCallback(() => {
    pushSnapshot(isFullWidthConverted ? '半角→全角' : '全角→半角');
    toggleFullWidth();
  }, [isFullWidthConverted, pushSnapshot, toggleFullWidth]);

  const handleTraditionalToggle = useCallback(async () => {
    await toggleTraditional();
  }, [toggleTraditional]);

  // 当两个子功能都未启用时显示占位
  if (!featureFlags.cleaning && !featureFlags.searchReplace) {
    return (
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700">内容清洗</h4>
        <div className="text-center py-6 text-gray-400">
          <p className="text-xs">清洗功能未启用</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-gray-700">内容清洗</h4>

      {/* 繁简转换 ToggleButton — cleaning flag */}
      {featureFlags.cleaning && (
        <>
          <div>
            <label className="block text-xs text-gray-500 mb-1">繁简转换</label>
            <ToggleButton
              labelForward="繁→简"
              labelBackward="简→繁"
              isToggled={isTraditionalConverted}
              onToggle={handleTraditionalToggle}
              disabled={!hasContent || isConverting}
            />
          </div>

          {/* 全角↔半角 ToggleButton */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">全角↔半角</label>
            <ToggleButton
              labelForward="全角→半角"
              labelBackward="半角→全角"
              isToggled={isFullWidthConverted}
              onToggle={handleFullWidthToggle}
              disabled={!hasContent}
            />
          </div>
        </>
      )}

      {/* 分隔线 */}
      {featureFlags.cleaning && featureFlags.searchReplace && (
        <hr className="border-gray-200" />
      )}

      {/* V4.0 搜索替换 — searchReplace flag */}
      {featureFlags.searchReplace && <SearchReplace />}
    </div>
  );
};
