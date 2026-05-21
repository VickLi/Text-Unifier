import React, { useCallback } from 'react';
import type { MinimapItem } from '../types';
import { Tooltip } from './Tooltip';

interface MinimapProps {
  /** 色条列表 */
  items: MinimapItem[];
  /** 点击跳转回调 */
  onItemClick: (index: number) => void;
  /** 当前可视段落范围 [startIdx, endIdx] */
  visibleRange: [number, number];
}

/**
 * V3.3 Minimap 缩略图（RQ-04）
 *
 * 预览区右侧 30px 宽的细长柱状图
 * 每一段对应一个 2px 高色条 + 1px 间距
 * 颜色与段落状态指示器一致（绿/红/橙）
 */
export const Minimap: React.FC<MinimapProps> = ({ items, onItemClick, visibleRange }) => {
  const [tooltipContent, setTooltipContent] = React.useState<string[]>([]);
  const [tooltipPos, setTooltipPos] = React.useState<{ x: number; y: number } | null>(null);

  const handleMouseEnter = useCallback((e: React.MouseEvent, idx: number) => {
    setTooltipContent([items[idx]?.tooltip || '']);
    setTooltipPos({ x: e.clientX, y: e.clientY });
  }, [items]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setTooltipPos({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTooltipContent([]);
    setTooltipPos(null);
  }, []);

  return (
    <div className="relative shrink-0 w-[30px] ml-1 overflow-hidden bg-gray-100 rounded-r">
      <div className="flex flex-col py-1" style={{ gap: '1px' }}>
        {items.map((item, idx) => {
          const isVisible = idx >= visibleRange[0] && idx <= visibleRange[1];
          const bgClass = {
            green: isVisible ? 'bg-green-500' : 'bg-green-300',
            red: isVisible ? 'bg-red-400' : 'bg-red-200',
            orange: isVisible ? 'bg-orange-400' : 'bg-orange-200',
          }[item.color];

          return (
            <div
              key={idx}
              className={`h-[2px] w-full rounded-full cursor-pointer transition-colors hover:brightness-125 ${bgClass}`}
              onClick={() => onItemClick(idx)}
              onMouseEnter={(e) => handleMouseEnter(e, idx)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              role="button"
              tabIndex={-1}
              aria-label={`跳转到第 ${idx + 1} 段: ${item.tooltip}`}
            />
          );
        })}
      </div>
      <Tooltip visible={tooltipPos !== null} content={tooltipContent} position={tooltipPos} />
    </div>
  );
};
