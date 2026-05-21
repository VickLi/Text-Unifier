/**
 * V3.3 段落状态判定工具
 *
 * 判定段落渲染状态，用于 ParagraphIndicator 和 Minimap
 * 优先级：deleted > modified > normal
 */
export type ParagraphState = 'normal' | 'deleted' | 'modified';

export function getParagraphState(
  paragraphId: string,
  checkedMap: Map<string, boolean>,
  modifiedIds: Set<string>
): ParagraphState {
  if (checkedMap.get(paragraphId) === false) return 'deleted';
  if (modifiedIds.has(paragraphId)) return 'modified';
  return 'normal';
}

/**
 * 从 previewParagraphs 派生 MinimapItem 数组
 */
export function computeMinimapItems(
  paragraphs: { id: string; text: string }[],
  checkedMap: Map<string, boolean>,
  modifiedIds: Set<string>
): { color: 'green' | 'red' | 'orange'; tooltip: string }[] {
  return paragraphs.map((p) => ({
    color:
      getParagraphState(p.id, checkedMap, modifiedIds) === 'deleted'
        ? 'red' as const
        : getParagraphState(p.id, checkedMap, modifiedIds) === 'modified'
          ? 'orange' as const
          : 'green' as const,
    tooltip: p.text.slice(0, 20),
  }));
}
