import React, { useCallback, useRef } from 'react';
import { useStore } from '../store/useStore';
import { ParagraphIndicator } from './ParagraphIndicator';
import type { PreviewParagraph as PreviewParagraphType } from '../types';

interface PreviewParagraphProps {
  paragraph: PreviewParagraphType;
  /** 段落索引（用于 data-para-index 和 Minimap 跳转） */
  index: number;
  /** 是否已勾选 */
  isChecked: boolean;
  /** 是否被工具修改过（V3.3 RQ-08） */
  isModified: boolean;
  /** 切换勾选回调 */
  onCheckToggle: (paragraphId: string, shiftKey: boolean) => void;
  /** 搜索高亮行号（V3.3 RQ-06） */
  highlightedLineIndex?: number | null;
}

/**
 * V3.3 预览段落组件
 *
 * V3.3 增强：
 *  - ParagraphIndicator 彩色指示器（绿/红/橙 3px 竖线）
 *  - 已删除段落不再隐藏，显示删除线 + 灰色 + 低透明度
 *  - 工具修改标识 + 橙色指示器
 *  - data-para-index 属性（Minimap 跳转用）
 */
export const PreviewParagraph: React.FC<PreviewParagraphProps> = React.memo(
  ({ paragraph, index, isChecked, isModified, onCheckToggle, highlightedLineIndex }) => {
    const setHoveredParagraph = useStore((s) => s.setHoveredParagraph);
    const hoveredParagraphId = useStore((s) => s.hoveredParagraphId);
    const rafRef = useRef<number | null>(null);

    const isHovered = hoveredParagraphId === paragraph.id;
    const isFromMultipleFiles = paragraph.sourceFiles.length > 1;
    const isDeleted = !isChecked;

    // V3.3 RQ-04: 段落状态判定（优先级：deleted > modified > normal）
    const paragraphState = isDeleted ? 'deleted' : isModified ? 'modified' : 'normal';

    const handleCheckboxChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
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
        data-para-index={index}
        className={`
          relative flex items-start gap-3 px-4 py-3 rounded-lg transition-all duration-150
          ${isHovered
            ? 'bg-blue-50 ring-2 ring-blue-200'
            : isFromMultipleFiles
              ? 'hover:bg-yellow-50 hover:ring-1 hover:ring-yellow-200'
              : 'hover:bg-gray-50'
          }
          ${isDeleted ? '' : ''}
        `}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* V3.3 RQ-04: 段落状态指示器（3px 彩色竖线） */}
        <ParagraphIndicator state={paragraphState} />

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

        {/* 段落内容 — V3.3 RQ-04: 已删除段落 line-through + 灰色 */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm leading-relaxed whitespace-pre-wrap break-words
            ${isDeleted
              ? 'text-gray-400 line-through opacity-50'
              : highlightedLineIndex !== null
                ? 'bg-yellow-200'
                : 'text-gray-800'
            }`}>
            {paragraph.text}
          </p>
          {isFromMultipleFiles && !isDeleted && (
            <span className="inline-flex items-center px-1 py-0.5 rounded text-[10px] font-medium bg-yellow-100 text-yellow-700 mt-1">
              重复
            </span>
          )}
        </div>

        {/* 已排除 / 已修改徽章 */}
        {isDeleted && (
          <span className="absolute top-1 right-1 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-600">
            已排除
          </span>
        )}
        {!isDeleted && isModified && (
          <span className="absolute top-1 right-1 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-100 text-orange-600">
            已修改
          </span>
        )}
      </div>
    );
  }
);

PreviewParagraph.displayName = 'PreviewParagraph';
