/**
 * V3.2 文档对比工具：LCS 段落对齐 + Levenshtein 相似度 + 逐词 Diff
 * 纯前端实现，运行于 Renderer Process
 */

import type { DiffAlignment, DiffToken } from '../types';

// ═══════════════════════════════════════════
// LCS 最长公共子序列
// ═══════════════════════════════════════════

interface LCSMatch {
  leftIdx: number;
  rightIdx: number;
}

export function computeLCS(a: string[], b: string[]): LCSMatch[] {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // 回溯
  const result: LCSMatch[] = [];
  let i = m, j = n;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      result.unshift({ leftIdx: i - 1, rightIdx: j - 1 });
      i--; j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }
  return result;
}

// ═══════════════════════════════════════════
// Levenshtein 编辑距离
// ═══════════════════════════════════════════

export function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[] = Array.from({ length: n + 1 }, (_, i) => i);

  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = dp[j];
      dp[j] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(dp[j], dp[j - 1], prev);
      prev = temp;
    }
  }
  return dp[n];
}

// ═══════════════════════════════════════════
// 段落对齐主函数
// ═══════════════════════════════════════════

export function alignParagraphs(left: string[], right: string[]): DiffAlignment[] {
  const lcs = computeLCS(left, right);
  const alignment: DiffAlignment[] = [];
  let li = 0, ri = 0;

  for (const match of lcs) {
    while (li < match.leftIdx) {
      alignment.push({ type: 'leftOnly', leftText: left[li] });
      li++;
    }
    while (ri < match.rightIdx) {
      alignment.push({ type: 'rightOnly', rightText: right[ri] });
      ri++;
    }
    alignment.push({ type: 'match', leftText: left[li], rightText: right[ri] });
    li++; ri++;
  }

  while (li < left.length) {
    alignment.push({ type: 'leftOnly', leftText: left[li] });
    li++;
  }
  while (ri < right.length) {
    alignment.push({ type: 'rightOnly', rightText: right[ri] });
    ri++;
  }

  return mergeSimilarToDiff(alignment);
}

/** 相邻 leftOnly+rightOnly → diff（相似度 > 0.6） */
function mergeSimilarToDiff(aligned: DiffAlignment[]): DiffAlignment[] {
  const result: DiffAlignment[] = [];
  let i = 0;
  while (i < aligned.length) {
    if (aligned[i].type === 'leftOnly' && aligned[i + 1]?.type === 'rightOnly') {
      const lt = aligned[i].leftText!;
      const rt = aligned[i + 1].rightText!;
      const maxLen = Math.max(lt.length, rt.length);
      const similarity = maxLen > 0 ? 1 - levenshtein(lt, rt) / maxLen : 1;
      if (similarity > 0.6) {
        result.push({
          type: 'diff',
          leftText: lt,
          rightText: rt,
          diffTokens: wordDiff(lt, rt),
        });
        i += 2;
        continue;
      }
    }
    result.push(aligned[i]);
    i++;
  }
  return result;
}

// ═══════════════════════════════════════════
// 逐词差异比较
// ═══════════════════════════════════════════

export function wordDiff(a: string, b: string): DiffToken[] {
  const wordsA = tokenize(a);
  const wordsB = tokenize(b);
  const lcs = computeLCS(wordsA, wordsB);
  const result: DiffToken[] = [];
  let ai = 0, bi = 0;

  for (const match of lcs) {
    while (ai < match.leftIdx) {
      result.push({ text: wordsA[ai], isDiff: true });
      ai++;
    }
    while (bi < match.rightIdx) {
      result.push({ text: wordsB[bi], isDiff: true });
      bi++;
    }
    result.push({ text: wordsA[ai], isDiff: false });
    ai++; bi++;
  }
  while (ai < wordsA.length) { result.push({ text: wordsA[ai], isDiff: true }); ai++; }
  return result;
}

/** 按中文标点/空白/英文单词边界分词 */
// BUG-V3.2-005: 中文按字符级别分词以显示精细差异
function tokenize(text: string): string[] {
  const tokens: string[] = [];
  let current = '';
  for (const ch of text) {
    if (/[\s，。！？、；：""''（）《》【】\u3000]/.test(ch)) {
      if (current) { tokens.push(current); current = ''; }
      tokens.push(ch);
    } else if (/[\u4e00-\u9fff\u3400-\u4dbf]/.test(ch)) {
      // 中文字符按字拆分（提高 diff 粒度）
      if (current && !/[\u4e00-\u9fff]/.test(current[0])) {
        tokens.push(current); current = '';
      }
      tokens.push(ch);
    } else {
      current += ch;
    }
  }
  if (current) tokens.push(current);
  return tokens;
}
