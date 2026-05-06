import React, { useCallback, useRef, useState } from 'react';
import { useStore } from '../store/useStore';

interface FileDropZoneProps {
  onFilesSelected: (files: { name: string; path: string; size: number }[]) => void;
}

export const FileDropZone: React.FC<FileDropZoneProps> = ({ onFilesSelected }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileList = useStore((s) => s.fileList);
  const status = useStore((s) => s.status);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  // 修复 BUG-010：前端文件验证（扩展名 + 大小 + MIME 类型）
  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

  const validateFile = useCallback((file: File): string | null => {
    // 检查扩展名
    if (!file.name.toLowerCase().endsWith('.txt')) {
      return `"${file.name}" 不是 .txt 文件，已跳过。`;
    }
    // 检查文件大小（修复 BUG-010）
    if (file.size > MAX_FILE_SIZE) {
      return `"${file.name}" 超过 100MB 大小限制（当前: ${(file.size / 1024 / 1024).toFixed(1)}MB），已跳过。`;
    }
    // 检查 MIME 类型（防止伪装 .txt 的二进制文件）
    if (file.type && file.type !== 'text/plain' && !file.type.startsWith('text/')) {
      return `"${file.name}" 不是纯文本文件（MIME: ${file.type}），已跳过。`;
    }
    return null;
  }, []);

  const processFiles = useCallback(
    (fileList: FileList | File[]) => {
      const validFiles: { name: string; path: string; size: number }[] = [];
      const errors: string[] = [];

      for (const file of Array.from(fileList)) {
        const error = validateFile(file);
        if (error) {
          errors.push(error);
          continue;
        }
        // 在 Tauri 中，File 对象有 path 属性
        const filePath = (file as any).path;
        if (!filePath) {
          errors.push(`无法获取 "${file.name}" 的文件路径。`);
          continue;
        }
        validFiles.push({
          name: file.name,
          path: filePath,
          size: file.size,
        });
      }

      // 批量显示错误（前面已通过 alert 展示）
      if (errors.length > 0) {
        errors.forEach((err) => alert(err));
      }

      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      }
    },
    [onFilesSelected, validateFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files);
      }
    },
    [processFiles]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        processFiles(e.target.files);
      }
      // 重置 input 以允许重复选择相同文件
      e.target.value = '';
    },
    [processFiles]
  );

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const isDisabled = status === 'loading';

  return (
    <div className="px-6 py-4">
      <div
        className={`
          relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer
          transition-all duration-200
          ${isDragging
            ? 'border-blue-500 bg-blue-50 shadow-lg'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
          }
          ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={isDisabled ? undefined : handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt"
          multiple
          className="hidden"
          onChange={handleFileInputChange}
          disabled={isDisabled}
        />

        <div className="flex flex-col items-center gap-2">
          <svg
            className={`w-10 h-10 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <div>
            <p className="text-sm font-medium text-gray-700">
              {isDragging ? '松开鼠标导入文件' : '拖拽或点击上传 .txt 文件'}
            </p>
            <p className="text-xs text-gray-500 mt-1">仅支持 .txt 格式，可多选</p>
          </div>
        </div>
      </div>

      {/* 已添加文件列表 */}
      {fileList.length > 0 && (
        <div className="mt-3">
          <p className="text-xs text-gray-500 mb-1">
            已添加文件: {fileList.length} 个
          </p>
          <div className="flex flex-wrap gap-2">
            {fileList.map((file) => (
              <span
                key={file.path}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-200"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                {file.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
