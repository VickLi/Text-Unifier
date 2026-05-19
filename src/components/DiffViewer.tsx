import React, { useRef, useCallback, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { alignParagraphs } from '../utils/diffUtils';

/**
 * 文档对比双栏视图（V3.2 RQ-05）
 * LCS 段落对齐 + 颜色标记 + 同步滚动
 */
export const DiffViewer: React.FC = () => {
  const fileList = useStore((s) => s.fileList);
  const diffAlignment = useStore((s) => s.diffAlignment);
  const diffLeftFileName = useStore((s) => s.diffLeftFileName);
  const diffRightFileName = useStore((s) => s.diffRightFileName);
  const setDiffResult = useStore((s) => s.setDiffResult);

  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const syncing = useRef(false);

  // BUG-V3.2-002: 组件卸载标志防止异步后 setState
  // BUG-V3.2-003: 复用完整归一化逻辑减少误匹配
  useEffect(() => {
    let aborted = false;
    if (fileList.length !== 2) { setDiffResult([], '', ''); return; }
    const normalize = (text: string) => {
      // 执行完整的前端归一化：统一换行、压缩空白、过滤控制字符
      let t = text.replace(/\r\n|\r/g, '\n').trim();
      t = t.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
      const paragraphs = t.split('\n\n').map((p) => {
        let line = p.trim();
        line = line.replace(/[ \t]+/g, ' ');
        line = line.replace(/\u{FEFF}/gu, '');
        return line;
      }).filter(Boolean);
      return paragraphs;
    };

    const loadAndCompare = async () => {
      try {
        const { detectEncoding } = await import('../utils/ipc');
        const textA = await detectEncoding(fileList[0].path);
        if (aborted) return;
        const textB = await detectEncoding(fileList[1].path);
        if (aborted) return;
        const pa = normalize(textA);
        const pb = normalize(textB);
        const alignment = alignParagraphs(pa, pb);
        if (!aborted) setDiffResult(alignment, fileList[0].name, fileList[1].name);
      } catch {
        if (!aborted) setDiffResult([], '', '');
      }
    };
    loadAndCompare();
    return () => { aborted = true; };
  }, [fileList]);

  const onLeftScroll = useCallback(() => {
    if (syncing.current || !leftRef.current || !rightRef.current) return;
    syncing.current = true;
    rightRef.current.scrollTop = leftRef.current.scrollTop;
    requestAnimationFrame(() => { syncing.current = false; });
  }, []);

  const onRightScroll = useCallback(() => {
    if (syncing.current || !leftRef.current || !rightRef.current) return;
    syncing.current = true;
    leftRef.current.scrollTop = rightRef.current.scrollTop;
    requestAnimationFrame(() => { syncing.current = false; });
  }, []);

  const stats = {
    matched: diffAlignment.filter((a) => a.type === 'match').length,
    leftOnly: diffAlignment.filter((a) => a.type === 'leftOnly').length,
    rightOnly: diffAlignment.filter((a) => a.type === 'rightOnly').length,
    diffCount: diffAlignment.filter((a) => a.type === 'diff').length,
  };

  if (fileList.length !== 2) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <p className="text-sm">对比模式需要恰好 2 个文件</p>
      </div>
    );
  }

  // 每个面板独立着色：只为自己有内容的行着色，对方独有的行显示空白
  const leftColor = (type: string) => {
    switch (type) {
      case 'match': return 'bg-green-50 border-l-4 border-green-400';
      case 'leftOnly': return 'bg-red-50 border-l-4 border-red-400';
      case 'diff': return 'bg-gray-100 border-l-4 border-gray-400';
      default: return ''; // rightOnly → 左栏空白
    }
  };
  const rightColor = (type: string) => {
    switch (type) {
      case 'match': return 'bg-green-50 border-l-4 border-green-400';
      case 'rightOnly': return 'bg-blue-50 border-l-4 border-blue-400';
      case 'diff': return 'bg-gray-100 border-l-4 border-gray-400';
      default: return ''; // leftOnly → 右栏空白
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* 标题栏 */}
      <div className="flex border-b border-gray-200 shrink-0">
        <div className="flex-1 px-4 py-2 text-sm font-medium text-red-700 truncate border-r border-gray-200">{diffLeftFileName || '左栏'}</div>
        <div className="flex-1 px-4 py-2 text-sm font-medium text-blue-700 truncate">{diffRightFileName || '右栏'}</div>
      </div>

      {/* 双栏主体 */}
      <div className="flex-1 flex min-h-0">
        <div ref={leftRef} onScroll={onLeftScroll} className="flex-1 overflow-y-auto border-r border-gray-200">
          {diffAlignment.map((item, idx) => (
            <div key={idx} className={`px-4 py-2 text-sm ${leftColor(item.type)}`}>
              <p className="whitespace-pre-wrap break-words">{item.leftText || ''}</p>
            </div>
          ))}
        </div>
        <div ref={rightRef} onScroll={onRightScroll} className="flex-1 overflow-y-auto">
          {diffAlignment.map((item, idx) => (
            <div key={idx} className={`px-4 py-2 text-sm ${rightColor(item.type)}`}>
              {item.type === 'diff' && item.diffTokens ? (
                <p className="whitespace-pre-wrap break-words">
                  {item.diffTokens.map((tok, ti) => (
                    <span key={ti} className={tok.isDiff ? 'bg-red-200 text-red-800 rounded px-0.5' : ''}>{tok.text}</span>
                  ))}
                </p>
              ) : (
                <p className="whitespace-pre-wrap break-words">{item.rightText || ''}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 统计栏 */}
      <div className="flex items-center gap-4 px-4 py-1.5 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 shrink-0">
        <span>✅ 相同 <strong className="text-gray-700">{stats.matched}</strong></span>
        <span>🔴 左独有 <strong className="text-red-600">{stats.leftOnly}</strong></span>
        <span>🔵 右独有 <strong className="text-blue-600">{stats.rightOnly}</strong></span>
        <span>⚪ 差异 <strong className="text-gray-600">{stats.diffCount}</strong></span>
      </div>
    </div>
  );
};
