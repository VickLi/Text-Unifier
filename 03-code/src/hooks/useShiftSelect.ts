import { useCallback } from 'react';
import { useStore } from '../store/useStore';

/**
 * Shift 多选 Hook（RQ-02）
 *
 * 处理段落 Checkbox 的 Shift 多选逻辑：
 * - 单击段落 Checkbox → 切换单个段落勾选状态
 * - Shift + 单击段落 Checkbox → 从上一次点击到当前点击之间的所有段落批量切换
 */
export function useShiftSelect() {
  const lastClickedParagraphId = useStore((s) => s.lastClickedParagraphId);
  const previewParagraphs = useStore((s) => s.previewParagraphs);
  const toggleParagraphCheck = useStore((s) => s.toggleParagraphCheck);
  const batchToggleParagraphCheck = useStore((s) => s.batchToggleParagraphCheck);
  const setLastClickedParagraphId = useStore((s) => s.setLastClickedParagraphId);

  const handleParagraphCheck = useCallback(
    (paragraphId: string, shiftKey: boolean) => {
      if (shiftKey && lastClickedParagraphId !== null) {
        // Shift + 单击：批量选择范围
        const currentIndex = previewParagraphs.findIndex(
          (p) => p.id === paragraphId
        );
        const lastIndex = previewParagraphs.findIndex(
          (p) => p.id === lastClickedParagraphId
        );

        if (currentIndex !== -1 && lastIndex !== -1) {
          const start = Math.min(currentIndex, lastIndex);
          const end = Math.max(currentIndex, lastIndex);
          const idsInRange = previewParagraphs
            .slice(start, end + 1)
            .map((p) => p.id);

          batchToggleParagraphCheck(idsInRange);
        }
      } else {
        // 单击：切换单个
        toggleParagraphCheck(paragraphId);
      }
    },
    [
      lastClickedParagraphId,
      previewParagraphs,
      toggleParagraphCheck,
      batchToggleParagraphCheck,
    ]
  );

  return {
    handleParagraphCheck,
    setLastClickedParagraphId,
  };
}
