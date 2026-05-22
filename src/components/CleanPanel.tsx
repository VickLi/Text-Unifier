import React, { useCallback } from 'react';
import { useStore } from '../store/useStore';
import { ToggleButton } from './ToggleButton';

/**
 * V4.0 内容清洗面板（精简版）
 *
 * V4.0 变更：
 *  - 仅保留繁简转换 + 全角↔半角转换 两个 ToggleButton
 *  - 移除：广告/水印过滤、关键词搜索、章节工具、排版增强
 */
export const CleanPanel: React.FC = () => {
  const isFullWidthConverted = useStore((s) => s.isFullWidthConverted);
  const isTraditionalConverted = useStore((s) => s.isTraditionalConverted);
  const toggleFullWidth = useStore((s) => s.toggleFullWidth);
  const toggleTraditional = useStore((s) => s.toggleTraditional);
  const pushSnapshot = useStore((s) => s.pushSnapshot);
  const previewParagraphs = useStore((s) => s.previewParagraphs);

  const hasContent = previewParagraphs.length > 0;

  const handleFullWidthToggle = useCallback(() => {
    pushSnapshot(isFullWidthConverted ? '半角→全角' : '全角→半角');
    toggleFullWidth();
  }, [isFullWidthConverted, pushSnapshot, toggleFullWidth]);

  const handleTraditionalToggle = useCallback(() => {
    toggleTraditional();
  }, [toggleTraditional]);

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-700">内容清洗</h4>

      {/* 繁简转换 ToggleButton */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">繁简转换</label>
        <ToggleButton
          labelForward="繁→简"
          labelBackward="简→繁"
          isToggled={isTraditionalConverted}
          onToggle={handleTraditionalToggle}
          disabled={!hasContent}
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
    </div>
  );
};
