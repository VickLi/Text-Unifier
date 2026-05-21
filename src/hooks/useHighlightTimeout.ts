import { useEffect, useRef } from 'react';

/**
 * V3.3 高亮消退 Hook
 *
 * 当 highlightedLineIndex 变更时，启动 3 秒计时器，到期后重置为 null
 * 使用 ref 确保回调引用稳定，避免不必要的 effect 重新执行
 */
export function useHighlightTimeout(
  highlightedLineIndex: number | null,
  onClear: () => void,
  durationMs: number = 3000
) {
  const onClearRef = useRef(onClear);
  onClearRef.current = onClear;

  useEffect(() => {
    if (highlightedLineIndex === null) return;
    const timer = setTimeout(() => onClearRef.current(), durationMs);
    return () => clearTimeout(timer);
  }, [highlightedLineIndex, durationMs]);
}
