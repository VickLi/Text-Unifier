import React, { useRef, useEffect, useState } from 'react';

interface TooltipProps {
  visible: boolean;
  content: string[];
  position: { x: number; y: number } | null;
}

// 修复 BUG-016：使用 useRef + getBoundingClientRect 动态计算位置，防止溢出视口
export const Tooltip: React.FC<TooltipProps> = ({ visible, content, position }) => {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [adjustedPos, setAdjustedPos] = useState<{ left: number; top: number }>({ left: 0, top: 0 });

  useEffect(() => {
    if (!visible || !position || !tooltipRef.current) return;

    const tooltip = tooltipRef.current;
    const rect = tooltip.getBoundingClientRect();
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    // 优先在鼠标右侧显示，空间不足则靠左
    let left = position.x + 16;
    if (left + rect.width > viewportW - 8) {
      left = position.x - rect.width - 8;
    }

    // 垂直居中显示，空间不足则靠底
    let top = position.y - rect.height / 2;
    if (top < 4) top = 4;
    if (top + rect.height > viewportH - 4) {
      top = viewportH - rect.height - 4;
    }

    setAdjustedPos({ left, top });
  }, [visible, position]);

  if (!visible || !position) return null;

  return (
    <div
      ref={tooltipRef}
      className="fixed z-50 pointer-events-none"
      style={{ left: adjustedPos.left, top: adjustedPos.top }}
    >
      <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl max-w-[220px]">
        <p className="font-medium mb-0.5">来源：</p>
        {content.map((file, idx) => (
          <p key={idx} className="text-gray-200 truncate">
            {idx + 1}. {file}
          </p>
        ))}
        {content.length === 0 && (
          <p className="text-gray-400">原始内容</p>
        )}
      </div>
    </div>
  );
};
