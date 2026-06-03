/**
 * IPC 通信层（V4.0：链式重叠合并 + 连续文本导出）
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
      const delay = RETRY_BASE_MS * Math.pow(2, attempt);
      console.warn(`IPC 重试 (${attempt + 1}/${retries}):`, error);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error('IPC 重试耗尽');
}

// ═══════════════════════════════════════════
// 接口 1: mergeFiles — 链式重叠合并（V4.0 核心）
// ═══════════════════════════════════════════

export async function mergeFiles(paths: string[], threshold?: number): Promise<MergeResult> {
  return withRetry(() => getAPI().mergeFiles(paths, threshold ?? 50));
}

// ═══════════════════════════════════════════
// 接口 2: detectEncoding — 编码探测
// ═══════════════════════════════════════════

export async function detectEncoding(filePath: string): Promise<string> {
  return withRetry(() => getAPI().detectEncoding(filePath));
}

// ═══════════════════════════════════════════
// 接口 3: exportFile — 导出文件（V4.0：入参改为连续文本字符串）
// ═══════════════════════════════════════════

export async function exportFile(mergedText: string, defaultName: string): Promise<{ savedPath: string }> {
  return withRetry(() => getAPI().exportFile(mergedText, defaultName));
}

// ═══════════════════════════════════════════
// 接口 4: selectFiles — 文件选择对话框
// ═══════════════════════════════════════════

export async function selectTxtFiles(): Promise<{ name: string; path: string; size: number }[]> {
  return withRetry(() => getAPI().selectFiles());
}

// ═══════════════════════════════════════════
// 接口 5: readFileContent — 读取单文件内容（DiffViewer 用）
// ═══════════════════════════════════════════

export async function readFileContent(filePath: string): Promise<{ content: string; encoding: string }> {
  return withRetry(() => getAPI().readFileContent(filePath));
}

// ═══════════════════════════════════════════
// 工具: getPathForFile — 获取拖放文件路径
// ═══════════════════════════════════════════

/**
 * 从 File 对象获取文件系统路径（Electron 专用）
 * V3.2.3: 使用 webUtils.getPathForFile() 作为主方案（同步可靠）
 * File.path 作为降级方案（异步填充可能为空）
 */
export function getFilePath(file: File): string {
  // 方案 1: webUtils.getPathForFile() — Electron 28+ 推荐
  try {
    const api = getAPI();
    if (typeof api.getPathForFile === 'function') {
      const path = api.getPathForFile(file);
      if (path && typeof path === 'string' && path.length > 0) return path;
    }
  } catch {
    // 降级到方案 2
  }

  // 方案 2: File.path — 传统方式（可能在拖放事件中异步填充为空）
  const legacyPath = (file as any).path;
  if (legacyPath && typeof legacyPath === 'string' && legacyPath.length > 0) return legacyPath;

  // 方案 3: 仅返回文件名（最后兜底）
  return file.name;
}

