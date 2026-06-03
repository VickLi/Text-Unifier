import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { alignParagraphs } from '../utils/diffUtils';

/**
 * V4.0 文档对比（重写版）— 统一滚动表格式对齐 + DiffMinimap
 *
 * 改进：
 *  - 左右行高度 100% 对齐（同 diffAlignment 数组，左右同索引同高）
 *  - 中间 DiffMinimap：色条 N≈h/3，颜色对应底部图例
 *  - 加载时并行读取两个文件
 */

const ROW_BG: Record<string, string> = {
  match:    'bg-green-50',
  leftOnly: 'bg-red-50',
  rightOnly:'bg-blue-50',
  bothOnly: 'bg-purple-50',
  diff:     'bg-yellow-50',
};
const MINI_COLORS: Record<string, string> = {
  match:    'bg-green-400',
  leftOnly: 'bg-red-400',
  rightOnly:'bg-blue-400',
  bothOnly: 'bg-purple-400',
  diff:     'bg-yellow-400',
};

export const DiffViewer: React.FC = () => {
  const sortedFileList = useStore((s) => s.sortedFileList);
  const diffAlignment = useStore((s) => s.diffAlignment);
  const diffLeftFileName = useStore((s) => s.diffLeftFileName);
  const diffRightFileName = useStore((s) => s.diffRightFileName);
  const setDiffResult = useStore((s) => s.setDiffResult);

  const scrollRef = useRef<HTMLDivElement>(null);
  const miniRef = useRef<HTMLDivElement>(null);
  const [miniN, setMiniN] = useState(1);

  useEffect(() => {
    let aborted = false;
    if (sortedFileList.length !== 2) { setDiffResult([], '', ''); return; }

    const normalize = (text: string): string[] =>
      text.replace(/\r\n|\r/g, '\n').trim()
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
        .split('\n\n').map(p => p.replace(/\n/g, ' ').replace(/[ \t]+/g, ' ').trim()).filter(Boolean);

    (async () => {
      try {
        const { readFileContent } = await import('../utils/ipc');
        const [ra, rb] = await Promise.all([
          readFileContent(sortedFileList[0].path),
          readFileContent(sortedFileList[1].path),
        ]);
        if (aborted) return;
        const alignment = alignParagraphs(normalize(ra.content), normalize(rb.content));
        if (!aborted) setDiffResult(alignment, sortedFileList[0].name, sortedFileList[1].name);
      } catch {
        if (!aborted) setDiffResult([], '', '');
      }
    })();
    return () => { aborted = true; };
  }, [sortedFileList, setDiffResult]);

  useEffect(() => {
    const el = miniRef.current; if (!el) return;
    const obs = new ResizeObserver(() => setMiniN(Math.max(1, Math.floor(el.clientHeight / 3))));
    obs.observe(el); return () => obs.disconnect();
  }, []);

  const minimapClick = useCallback((idx: number) => {
    const rows = scrollRef.current?.querySelectorAll<HTMLElement>('[data-dr]');
    if (!rows || rows.length === 0) return;
    const ratio = idx / Math.max(1, miniN - 1);
    const ti = Math.floor(ratio * (rows.length - 1));
    rows[Math.min(ti, rows.length - 1)]?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [miniN]);

  const stats = {
    matched: diffAlignment.filter(a => a.type === 'match').length,
    leftOnly: diffAlignment.filter(a => a.type === 'leftOnly').length,
    rightOnly: diffAlignment.filter(a => a.type === 'rightOnly').length,
    bothOnly: diffAlignment.filter(a => a.type === 'bothOnly').length,
    diffCount: diffAlignment.filter(a => a.type === 'diff').length,
  };

  if (sortedFileList.length !== 2) {
    return <div className="flex-1 flex items-center justify-center text-gray-400"><p className="text-sm">对比模式需要恰好 2 个文件</p></div>;
  }

  const leftBar = (t: string) => (
    t === 'match' ? '#4ade80' : t === 'leftOnly' ? '#f87171' : t === 'bothOnly' ? '#c084fc' : t === 'diff' ? '#facc15' : '#d1d5db'
  );
  const rightBar = (t: string) => (
    t === 'match' ? '#4ade80' : t === 'rightOnly' ? '#60a5fa' : t === 'bothOnly' ? '#c084fc' : t === 'diff' ? '#facc15' : '#d1d5db'
  );

  const miniItems = diffAlignment.slice(0, miniN);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* 标题 */}
      <div className="flex shrink-0 border-b">
        <div className="flex-1 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 truncate border-r">{diffLeftFileName || '左'}</div>
        <div className="flex-1 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 truncate">{diffRightFileName || '右'}</div>
      </div>

      {/* 主体：统滚动 + Minimap */}
      <div className="flex-1 flex min-h-0">
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {diffAlignment.map((item, idx) => (
            <div key={idx} data-dr className={`flex min-h-[28px] border-b border-gray-100 ${ROW_BG[item.type] || ''}`}>
              {/* 左单元格 */}
              <div className="flex-1 flex border-r border-gray-200">
                <div className="w-1 shrink-0" style={{backgroundColor: leftBar(item.type)}} />
                <div className="flex-1 px-3 py-0.5 text-sm whitespace-pre-wrap break-words">{item.leftText || '\u00A0'}</div>
              </div>
              {/* 右单元格 */}
              <div className="flex-1 flex">
                <div className="w-1 shrink-0" style={{backgroundColor: rightBar(item.type)}} />
                <div className="flex-1 px-3 py-0.5 text-sm whitespace-pre-wrap break-words">
                  {item.type === 'diff' && item.diffTokens
                    ? item.diffTokens.map((tok, ti) => (
                        <span key={ti} className={tok.isDiff ? 'bg-red-200 text-red-800 rounded px-0.5' : ''}>{tok.text}</span>
                      ))
                    : (item.rightText || '\u00A0')}
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* DiffMinimap */}
        <div ref={miniRef} className="shrink-0 w-[18px] bg-gray-100 border-l h-full flex flex-col py-px" style={{gap:'1px'}}>
          {miniItems.map((item, idx) => (
            <div key={idx} className={`h-[2px] w-full rounded-full cursor-pointer shrink-0 ${MINI_COLORS[item.type] || 'bg-gray-300'}`}
              onClick={() => minimapClick(idx)} title={`${item.type} @${idx}`} />
          ))}
        </div>
      </div>

      {/* 底部图例 */}
      <div className="flex items-center gap-3 px-4 py-1.5 bg-gray-50 border-t text-xs shrink-0 text-gray-500">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-green-400" />相同{stats.matched}</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-400" />左独{stats.leftOnly}</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-blue-400" />右独{stats.rightOnly}</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-purple-400" />交错{stats.bothOnly}</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-yellow-400" />差异{stats.diffCount}</span>
      </div>
    </div>
  );
};
