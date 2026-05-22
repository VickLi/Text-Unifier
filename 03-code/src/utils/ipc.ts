/**
 * V4.0 IPC 通信层（Electron contextBridge）
 *
 * V4.0 变更：
 *  - scanFiles → mergeFiles（链式重叠合并）
 *  - exportFile 入参改为 string（连续文本）
 *  - 删除 scanPreprocessedTexts（CJK 纯前端）
 */

import type { MergeResult } from '../types';

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
      await new Promise(r => setTimeout(r, RETRY_BASE_MS * Math.pow(2, attempt)));
    }
  }
  throw new Error('IPC 重试耗尽');
}

/** V4.0: 链式重叠合并 */
export async function mergeFiles(paths: string[], threshold?: number): Promise<MergeResult> {
  return withRetry(() => getAPI().mergeFiles(paths, threshold ?? 50));
}

/** 编码探测 */
export async function detectEncoding(filePath: string): Promise<string> {
  return withRetry(() => getAPI().detectEncoding(filePath));
}

/** V4.0: 导出连续文本（排除连接标记由前端完成） */
export async function exportFile(mergedText: string, defaultName: string): Promise<{ savedPath: string }> {
  return withRetry(() => getAPI().exportFile(mergedText, defaultName));
}

/** 文件选择对话框 */
export async function selectTxtFiles(): Promise<{ name: string; path: string; size: number }[]> {
  return withRetry(() => getAPI().selectFiles());
}

/** V4.0: 读取文件文本内容（编码探测 + 解码） */
export async function readFileText(filePath: string): Promise<string> {
  return withRetry(() => getAPI().readFileText(filePath));
}

/** 获取拖放文件路径（三层降级） */
export function getFilePath(file: File): string {
  try {
    const api = getAPI();
    if (typeof api.getPathForFile === 'function') {
      const path = api.getPathForFile(file);
      if (path && typeof path === 'string' && path.length > 0) return path;
    }
  } catch { /* 降级 */ }
  const legacyPath = (file as any).path;
  if (legacyPath && typeof legacyPath === 'string' && legacyPath.length > 0) return legacyPath;
  return file.name;
}
