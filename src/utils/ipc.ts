/**
 * IPC 通信层（V3.1：Electron contextBridge + novelProcessor）
 */

import type { AnalysisReport, FormatResult } from '../types';

const MAX_RETRIES = 3;
const RETRY_BASE_MS = 500;

function getAPI() {
  const api = (window as any).electronAPI;
  if (!api) throw new Error('electronAPI 未初始化');
  return api;
}

async function withRetry<T>(fn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try { return await fn(); }
    catch (error) {
      if (attempt === retries) throw error;
      const delay = RETRY_BASE_MS * Math.pow(2, attempt);
      console.warn(`IPC 重试 (${attempt + 1}/${retries}):`, error);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error('IPC 重试耗尽');
}

// ═══════════════════════════════════════════
// 接口 1: scanFiles — 扫描分析（兼容旧路径）
// ═══════════════════════════════════════════

/** @deprecated V3.1 推荐使用 scanPreprocessedTexts */
export async function scanFiles(paths: string[]): Promise<AnalysisReport> {
  return withRetry(() => getAPI().scanFiles(paths));
}

// ═══════════════════════════════════════════
// 接口 2: detectEncoding — 编码探测 🆕 V3.1
// ═══════════════════════════════════════════

export async function detectEncoding(filePath: string): Promise<string> {
  return withRetry(() => getAPI().detectEncoding(filePath));
}

// ═══════════════════════════════════════════
// 接口 3: scanPreprocessedTexts 🆕 V3.1
// ═══════════════════════════════════════════

export async function scanPreprocessedTexts(
  texts: string[],
  fileNames: string[],
  fileSizes: number[]
): Promise<AnalysisReport> {
  return withRetry(() => getAPI().scanPreprocessedTexts(texts, fileNames, fileSizes));
}

// ═══════════════════════════════════════════
// 接口 4: formatDocument（保留兼容）
// ═══════════════════════════════════════════

export async function formatDocument(text: string): Promise<FormatResult> {
  return withRetry(() => getAPI().formatDocument(text));
}

// ═══════════════════════════════════════════
// 接口 5: exportFile
// ═══════════════════════════════════════════

export async function exportFile(paragraphs: string[]): Promise<{ savedPath: string }> {
  return withRetry(() => getAPI().exportFile(paragraphs));
}

// ═══════════════════════════════════════════
// 接口 6: selectFiles
// ═══════════════════════════════════════════

export async function selectTxtFiles(): Promise<{ name: string; path: string; size: number }[]> {
  return withRetry(() => getAPI().selectFiles());
}

