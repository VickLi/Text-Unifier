import React from 'react';
import type { ParagraphState } from '../utils/paragraphState';

interface ParagraphIndicatorProps {
  /** 段落状态 */
  state: ParagraphState;
}

/**
 * V3.3 段落状态指示器（RQ-04 / RQ-08）
 *
 * 每个段落左侧 3px 宽的彩色竖线：
 *  - 绿色 → 正常段落
 *  - 红色 → 已删除段落（取消勾选）
 *  - 橙色 → 被工具修改过的段落
 */
export const ParagraphIndicator: React.FC<ParagraphIndicatorProps> = React.memo(
  ({ state }) => {
    const borderClass = {
      normal: 'border-l-green-500',
      deleted: 'border-l-red-400',
      modified: 'border-l-orange-400',
    }[state];

    return (
      <div
        className={`shrink-0 w-0 border-l-[3px] ${borderClass} self-stretch`}
        aria-hidden="true"
      />
    );
  }
);

ParagraphIndicator.displayName = 'ParagraphIndicator';
