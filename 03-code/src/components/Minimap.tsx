import React, { useCallback, useRef, useEffect, useState } from 'react';
import type { MinimapItem } from '../types';

interface MinimapProps {
  items: MinimapItem[];
  onItemClick: (ratio: number) => void;
}

const COLOR_MAP: Record<string, string> = {
  green: 'bg-green-400 hover:bg-green-600',
  orange: 'bg-orange-400 hover:bg-orange-600',
  red: 'bg-red-400 hover:bg-red-600',
};

/**
 * V4.0 Minimap — 等比例压缩全文（N ≈ 容器高度/3）
 * - 绿色 = 普通文本区
 * - 橙色 = 连接点区域
 * - hover 显示行号 tooltip
 */
export const Minimap: React.FC<MinimapProps> = ({ items, onItemClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [N, setN] = useState(1);
  const [hoverIdx, setHoverIdx] = useState(-1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      setN(Math.max(1, Math.floor(el.clientHeight / 3)));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleClick = useCallback(
    (idx: number) => onItemClick(idx / Math.max(1, N - 1)),
    [N, onItemClick]
  );

  const visible = items.slice(0, N);

  return (
    <div
      ref={containerRef}
      className="relative shrink-0 w-[30px] ml-1 bg-gray-100 rounded-r h-full"
      role="complementary"
      aria-label="文档缩略图"
    >
      <div className="flex flex-col py-px h-full" style={{ gap: '1px' }}>
        {visible.map((item, idx) => (
          <div
            key={idx}
            className={`h-[2px] w-full rounded-full cursor-pointer transition-colors shrink-0 ${
              COLOR_MAP[item.color] || COLOR_MAP.green
            } ${hoverIdx === idx ? 'ring-1 ring-blue-400 scale-y-[2]' : ''}`}
            onClick={() => handleClick(idx)}
            onMouseEnter={() => setHoverIdx(idx)}
            onMouseLeave={() => setHoverIdx(-1)}
            title={item.tooltip}
            role="button"
            tabIndex={-1}
            aria-label={`跳转到 ${item.tooltip}`}
          />
        ))}
      </div>
    </div>
  );
};

