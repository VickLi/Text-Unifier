import React, { useCallback, useRef, useState } from 'react';

interface UploadButtonProps {
  onFilesSelected: (files: { name: string; path: string; size: number }[]) => void;
}

/**
 * 紧凑上传按钮（V3.2 RQ-02 替代大面积拖拽区）
 */
export const UploadButton: React.FC<UploadButtonProps> = ({ onFilesSelected }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isHover, setIsHover] = useState(false);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const files = Array.from(e.target.files).map((f) => ({
          name: f.name,
          path: (f as any).path || f.name,
          size: f.size,
        }));
        onFilesSelected(files);
      }
      e.target.value = '';
    },
    [onFilesSelected]
  );

  return (
    <>
      <button
        onClick={handleClick}
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-dashed transition-all ${
          isHover
            ? 'border-blue-400 bg-blue-50 text-blue-600'
            : 'border-gray-300 text-gray-500 hover:border-gray-400'
        }`}
        aria-label="添加 .txt 文件"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        添加 .txt 文件
      </button>
      <input ref={fileInputRef} type="file" accept=".txt" multiple className="hidden" onChange={handleChange} />
    </>
  );
};
