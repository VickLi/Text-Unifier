import React, { useCallback, useRef } from 'react';
import { useStore } from '../store/useStore';
import type { PreviewParagraph as PreviewParagraphType } from '../types';

interface PreviewParagraphProps {
  paragraph: PreviewParagraphType;
  /** 是否已勾选 */
  isChecked: boolean;
  /** 切换勾选回调 */
  onCheckToggle: (paragraphId: string, shiftKey: boolean) => void;
}

/**
 * 预览段落组件（V2.0 新增 Checkbox）
 *
 * 每个段落左侧显示 Checkbox
 * 取消勾选时段落淡化显示（opacity-30 grayscale）
 * 支持 Shift 多选
 */
export const PreviewParagraph: React.FC<PreviewParagraphProps> = React.memo(
  ({ paragraph, isChecked, onCheckToggle }) => {
    const setHoveredParagraph = useStore((s) => s.setHoveredParagraph);
    const hoveredParagraphId = useStore((s) => s.hoveredParagraphId);
    const rafRef = useRef<number | null>(null);

    const isHovered = hoveredParagraphId === paragraph.id;
    const isFromMultipleFiles = paragraph.sourceFiles.length > 1;

    const handleCheckboxChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        // BUG-V2.0-002: 安全获取 shiftKey，支持鼠标点击和键盘触发
        const nativeEvent = e.nativeEvent;
        const isShiftKey = nativeEvent instanceof MouseEvent
          ? nativeEvent.shiftKey
          : false;
        onCheckToggle(paragraph.id, isShiftKey);
      },
      [paragraph.id, onCheckToggle]
    );

    const handleMouseEnter = useCallback(
      (e: React.MouseEvent) => {
        setHoveredParagraph(paragraph.id, paragraph.sourceFiles, {
          x: e.clientX,
          y: e.clientY,
        });
      },
      [paragraph.id, paragraph.sourceFiles, setHoveredParagraph]
    );

    const handleMouseMove = useCallback(
      (e: React.MouseEvent) => {
        if (hoveredParagraphId !== paragraph.id) return;
        if (rafRef.current !== null) return;

        rafRef.current = window.requestAnimationFrame(() => {
          rafRef.current = null;
          setHoveredParagraph(paragraph.id, paragraph.sourceFiles, {
            x: e.clientX,
            y: e.clientY,
          });
        });
      },
      [paragraph.id, paragraph.sourceFiles, hoveredParagraphId, setHoveredParagraph]
    );

    const handleMouseLeave = useCallback(() => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      setHoveredParagraph(null);
    }, [setHoveredParagraph]);

    return (
      <div
        className={`
          relative group flex items-start gap-3 px-4 py-3 rounded-lg transition-all duration-150
          ${isHovered
            ? 'bg-blue-50 ring-2 ring-blue-200'
            : isFromMultipleFiles
              ? 'hover:bg-yellow-50 hover:ring-1 hover:ring-yellow-200'
              : 'hover:bg-gray-50'
          }
          ${!isChecked ? 'opacity-30 grayscale' : ''}
        `}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Checkbox */}
        <div className="pt-0.5 shrink-0">
          <input
            type="checkbox"
            checked={isChecked}
            onChange={handleCheckboxChange}
            className="h-4 w-4 rounded border-gray-300 text-blue-500 focus:ring-blue-400 cursor-pointer"
            aria-label={`切换段落勾选状态: ${paragraph.text.slice(0, 30)}...`}
          />
        </div>

        {/* 段落内容 */}
        <div className="flex-1 min-w-0">
          <p className="text-sm leading-relaxed text-gray-800 whitespace-pre-wrap break-words">
            {paragraph.text}
          </p>
          {isFromMultipleFiles && (
            <span className="inline-flex items-center px-1 py-0.5 rounded text-[10px] font-medium bg-yellow-100 text-yellow-700 mt-1">
              重复
            </span>
          )}
        </div>

        {/* 已排除徽章 */}
        {!isChecked && (
          <span className="absolute top-1 right-1 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-200 text-gray-500">
            已排除
          </span>
        )}
      </div>
    );
  }
);

PreviewParagraph.displayName = 'PreviewParagraph';
