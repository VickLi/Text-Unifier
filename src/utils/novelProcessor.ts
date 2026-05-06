/**
 * 小说文本清洗引擎（V3.1 新增）
 *
 * 移植自 novel-processor（MIT）的核心算法
 * 所有函数为纯函数，运行于 Renderer Process
 */

import {
  CHAPTER_TITLE,
  SENTENCE_END,
  AD_PATTERNS,
  LINE_END_NUMBERS,
} from './regexPatterns';

// ═══════════════════════════════════════════
// 繁简转换（js-opencc 封装）
// ═══════════════════════════════════════════

export type ConversionMode = 'none' | 't2s' | 's2t';

/**
 * 繁简转换
 * 注意：js-opencc 为异步加载，此处为接口定义
 * 实际调用时需确保 opencc 已加载
 */
export async function convertText(text: string, mode: ConversionMode): Promise<string> {
  if (mode === 'none' || !text) return text;
  try {
    const OpenCC = await import('js-opencc');
    const ctx = (OpenCC as any).ChineseConverter || OpenCC;
    if (mode === 't2s') {
      return typeof ctx.TW2CN === 'function' ? ctx.TW2CN(text) : text;
    } else {
      return typeof ctx.CN2TW === 'function' ? ctx.CN2TW(text) : text;
    }
  } catch {
    console.warn('js-opencc 加载失败，跳过繁简转换');
    return text;
  }
}

// ═══════════════════════════════════════════
// 全角→半角
// ═══════════════════════════════════════════

/** 全角数字/字母 → 半角 */
export function toHalfWidth(text: string): string {
  return text.replace(/[\uFF01-\uFF5E]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0xFEE0)
  );
}

// ═══════════════════════════════════════════
// 垃圾内容过滤
// ═══════════════════════════════════════════

/** 清除小说广告水印/分隔符 */
export function stripNovelArtifacts(text: string): string {
  let result = text;
  for (const pattern of AD_PATTERNS) {
    result = result.replace(pattern, '');
  }
  // BUG-V3.1-005: 清理因替换产生的多余空行和空白段落
  // 连续 2+ 换行归一为 2 个换行；再替换单独的换行+空白+换行为单个换行
  result = result
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\n\s*\n/g, '\n\n');
  return result.trim();
}

// ═══════════════════════════════════════════
// 行尾数字清除
// ═══════════════════════════════════════════

/** 清除行尾页码数字（仅清除长度 > minLen 的行） */
export function removeLineEndNumbers(text: string, minLen: number = 10): string {
  return text
    .split('\n')
    .map((line) => {
      if (line.length > minLen) {
        return line.replace(LINE_END_NUMBERS, '').trimEnd();
      }
      return line;
    })
    .join('\n');
}

// ═══════════════════════════════════════════
// 章节识别与格式化
// ═══════════════════════════════════════════

/** 识别并格式化章节标题行 */
export function formatChapterTitles(text: string): string {
  return text
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();
      if (CHAPTER_TITLE.test(trimmed)) {
        return `\n${trimmed}\n`;
      }
      return line;
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');
}

/** 将内联章节标题拆分为独立行 */
export function splitInlineChapterTitles(text: string): string {
  return text.replace(
    /(第[〇零一二三四五六七八九十百千万\d]+[章节回卷部])/g,
    '\n$1\n'
  );
}

// ═══════════════════════════════════════════
// 章节序号提取
// ═══════════════════════════════════════════

const CN_NUM_MAP: Record<string, number> = {
  '〇': 0, '零': 0, '一': 1, '二': 2, '三': 3, '四': 4,
  '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
};

const ROMAN_MAP: Record<string, number> = {
  I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000,
};

/** 中文数字 → 阿拉伯数字 */
export function chineseNumeralToNumber(cn: string): number {
  let result = 0;
  let temp = 0;
  for (const ch of cn) {
    const val = CN_NUM_MAP[ch];
    if (val === undefined) continue;
    if (val === 10) {
      result += temp === 0 ? 10 : temp * 10;
      temp = 0;
    } else {
      temp += val;
    }
  }
  result += temp;
  return result;
}

/** 罗马数字 → 阿拉伯数字 */
export function romanToInt(roman: string): number {
  let result = 0;
  let prev = 0;
  for (let i = roman.length - 1; i >= 0; i--) {
    const curr = ROMAN_MAP[roman[i]] || 0;
    if (curr < prev) result -= curr;
    else result += curr;
    prev = curr;
  }
  return result;
}

/** 提取章节序号 */
export function extractChapterOrder(title: string): number | null {
  // 中文数字："第十二章" → 12
  const cnMatch = title.match(/^第([〇零一二三四五六七八九十百千万]+)\s*[章节回卷部]/);
  if (cnMatch) return chineseNumeralToNumber(cnMatch[1]);

  // 阿拉伯数字："第12章" → 12
  const arMatch = title.match(/^第(\d+)\s*[章节回卷部]/);
  if (arMatch) return parseInt(arMatch[1], 10);

  // 英文："Chapter 5" 或 "Chapter5" → 5 (BUG-V3.1-007)
  const enMatch = title.match(/^Chapter\s*(\d+)/i);
  if (enMatch) return parseInt(enMatch[1], 10);

  // 罗马数字："Chapter V" 或 "ChapterV" → 5 (BUG-V3.1-007)
  const romMatch = title.match(/^Chapter\s*([IVXLCDM]+)/i);
  if (romMatch) return romanToInt(romMatch[1].toUpperCase());

  // Fallback: 任意数字
  const numMatch = title.match(/\d+/);
  if (numMatch) return parseInt(numMatch[0], 10);

  return null;
}

/** 判断是否为章节标题行 */
export function isChapterTitle(line: string): boolean {
  return CHAPTER_TITLE.test(line.trim());
}

// ═══════════════════════════════════════════
// 章节重排
// ═══════════════════════════════════════════

/** 按章节序号重排全书 */
export function reorderChaptersByTitle(text: string): string {
  const lines = text.split('\n');
  const chapters: { order: number; content: string[] }[] = [];
  let currentBlock: string[] = [];
  let preamble: string[] = [];
  let foundChapter = false;

  for (const line of lines) {
    const order = extractChapterOrder(line.trim());
    if (order !== null) {
      if (!foundChapter) {
        // BUG-V3.1-001: 第一个章节出现时，将之前累积的内容作为序言
        preamble = currentBlock.length > 0 ? [...currentBlock] : [];
        foundChapter = true;
      } else {
        // 后续章节：将上一个章节块（含标题行）存入 chapters
        if (currentBlock.length > 0) {
          const chOrder = extractChapterOrder(currentBlock[0]);
          chapters.push({
            order: chOrder ?? 9999,
            content: [...currentBlock],
          });
        }
      }
      // 新章节开始
      currentBlock = [line];
    } else {
      currentBlock.push(line);
    }
  }

  // 处理最后一个章节块
  if (currentBlock.length > 0) {
    if (foundChapter) {
      const chOrder = extractChapterOrder(currentBlock[0]);
      chapters.push({
        order: chOrder ?? 9999,
        content: [...currentBlock],
      });
    } else {
      // 全文无章节标题
      preamble = currentBlock;
    }
  }

  if (!foundChapter) {
    throw new Error('未识别到有效章节标题');
  }

  // 按序号升序排序
  chapters.sort((a, b) => a.order - b.order);

  // 拼接：序言 + 排序后的章节
  const result = [
    ...preamble,
    ...chapters.flatMap((ch) => ch.content),
  ].join('\n');

  return result.replace(/\n{3,}/g, '\n\n').trim();
}

// ═══════════════════════════════════════════
// 智能换行（章节感知合并，替代旧去硬回车）
// ═══════════════════════════════════════════

export interface MergeOptions {
  preserveChapterTitles?: boolean;
  sentenceEndThreshold?: number;  // 句尾标点后不合并的比例
}

/** 标点感知合并（章节标题感知） */
export function mergeLinesSmart(text: string, options: MergeOptions = {}): string {
  const { preserveChapterTitles = true, sentenceEndThreshold = 0.7 } = options;

  const paragraphs = text.split(/\n\s*\n/);

  const result = paragraphs.map((block) => {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length <= 1) return block;

    // 章节标题保护
    if (preserveChapterTitles) {
      const chapterLines = lines.filter((l) => isChapterTitle(l));
      if (chapterLines.length > 0) {
        return lines.join('\n');
      }
    }

    // 列表保护（>50% 行以列表标记开头）
    const listLines = lines.filter((l) => /^[-*•·]|^\d+[.、]/.test(l));
    if (listLines.length / lines.length > 0.5) {
      return lines.join('\n');
    }

    // 标点感知合并
    const sentenceEndCount = lines.filter(
      (l) => SENTENCE_END.test(l)
    ).length;

    if (sentenceEndCount / lines.length >= sentenceEndThreshold) {
      return lines.join('\n');
    }

    // 默认合并为一行
    return lines.join(' ').replace(/\s{2,}/g, ' ');
  });

  return result.join('\n\n');
}

// ═══════════════════════════════════════════
// 内容筛选
// ═══════════════════════════════════════════

/** 关键词过滤 + 长度豁免 */
export function filterLines(
  text: string,
  keywords: string[],
  maxLen: number = 0
): string {
  if (!keywords || keywords.length === 0) return text;

  return text
    .split('\n')
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) return true;  // 保留空行

      // 长度豁免：超过 maxLen 的含关键词行也保留
      if (maxLen > 0 && trimmed.length > maxLen) return true;

      // 包含任一关键词则移除
      return !keywords.some((kw) => trimmed.includes(kw));
    })
    .join('\n');
}

// ═══════════════════════════════════════════
// 相邻行去重
// ═══════════════════════════════════════════

/** 去除相邻完全重复行 */
export function removeAdjacentDuplicateLines(lines: string[]): string[] {
  return lines.filter((line, index) => {
    if (index === 0) return true;
    return line.trim() !== lines[index - 1].trim();
  });
}

// ═══════════════════════════════════════════
// 段落缩进
// ═══════════════════════════════════════════

/** 段首添加两个全角空格 */
export function addParagraphIndent(text: string): string {
  return text
    .split('\n\n')
    .map((para) => {
      const trimmed = para.trim();
      if (!trimmed) return para;
      return `　　${trimmed}`;
    })
    .join('\n\n');
}

// ═══════════════════════════════════════════
// 长段落拆分
// ═══════════════════════════════════════════

const MAX_PARAGRAPH_LENGTH = 500;  // 字符

/** 长段落智能拆分（中文标点感知） */
export function splitCNParagraph(text: string): string {
  return text
    .split('\n\n')
    .map((para) => {
      if (para.length <= MAX_PARAGRAPH_LENGTH) return para;
      // 在中文句号/问号/感叹号后拆分
      const split = para.replace(/([。！？])\s*/g, '$1\n');
      // 如果拆分后还有超长行，再按逗号拆分
      return split
        .split('\n')
        .map((line) => {
          if (line.length <= MAX_PARAGRAPH_LENGTH) return line;
          return line.replace(/([，；、])\s*/g, '$1\n');
        })
        .join('\n');
    })
    .join('\n\n');
}
