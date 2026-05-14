import React, { useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store/useStore';

/**
 * 全窗口拖拽遮罩（V3.2 RQ-02）
 * 使用计数器防止子元素 dragleave 误触发
 */
export const DragOverlay: React.FC = () => {
  const isDragOverlayVisible = useStore((s) => s.isDragOverlayVisible);
  const isDragRejecting = useStore((s) => s.isDragRejecting);

  if (!isDragOverlayVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div
        className={`absolute inset-0 transition-colors ${
          isDragRejecting ? 'bg-red-500/20' : 'bg-blue-500/20'
        } backdrop-blur-sm`}
      />
      <div
        className={`relative z-10 flex flex-col items-center gap-4 px-12 py-16 rounded-2xl border-2 border-dashed ${
          isDragRejecting
            ? 'bg-red-50/90 border-red-300 text-red-600'
            : 'bg-white/90 border-blue-300 text-blue-600'
        } shadow-2xl`}
      >
        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <div className="text-center">
          <p className="text-lg font-semibold">
            {isDragRejecting ? '仅支持 .txt 文件' : '释放到此添加 TXT 文件'}
          </p>
          <p className="text-sm mt-1 opacity-70">
            {isDragRejecting ? '请移除非 .txt 文件后重试' : '仅支持 .txt 格式，可多选'}
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * 全局拖拽事件监听 Hook
 */
export function useGlobalDragDrop(
  onFilesDrop: (files: { name: string; path: string; size: number }[]) => void
) {
  const dragCounterRef = useRef(0);
  const setDragOverlay = useStore((s) => s.setDragOverlay);

  const handleDragEnter = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current++;
      // 检查是否拖入的是文件（而非文本/链接等）
      const isFileDrag = Array.from(e.dataTransfer?.types || []).includes('Files');
      if (!isFileDrag) return;
      // 注意: OS 文件拖入时 dataTransfer.files 在 dragenter 中为空（浏览器安全限制）
      // 因此无法在此处精确判断是否为 .txt，实际过滤在 drop 事件中执行
      setDragOverlay(true, false);
    },
    [setDragOverlay]
  );

  const handleDragLeave = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current--;
      if (dragCounterRef.current <= 0) {
        dragCounterRef.current = 0;
        setDragOverlay(false, false);
      }
    },
    [setDragOverlay]
  );

  const handleDragOver = useCallback(
    (e: DragEvent) => {
      // 必须 preventDefault() 才能使 drop 事件触发
      e.preventDefault();
    },
    []
  );

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current = 0;
      setDragOverlay(false, false);

      if (!e.dataTransfer?.files || e.dataTransfer.files.length === 0) return;

      const validFiles = Array.from(e.dataTransfer.files)
        .filter((f) => f.name.toLowerCase().endsWith('.txt'))
        .map((f) => ({
          name: f.name,
          path: (f as any).path || f.name,
          size: f.size,
        }));

      if (validFiles.length > 0) {
        onFilesDrop(validFiles);
      }
    },
    [onFilesDrop, setDragOverlay]
  );

  useEffect(() => {
    document.addEventListener('dragenter', handleDragEnter);
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('drop', handleDrop);
    return () => {
      document.removeEventListener('dragenter', handleDragEnter);
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('dragleave', handleDragLeave);
      document.removeEventListener('drop', handleDrop);
    };
  }, [handleDragEnter, handleDragOver, handleDragLeave, handleDrop]);
}
