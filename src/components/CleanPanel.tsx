import React from 'react';
import { useStore } from '../store/useStore';
import type { ConversionMode } from '../types';

/**
 * 内容清洗面板组件（V3.1 RQ-04/RQ-07）
 * 控制繁简转换、垃圾过滤、行尾数字清除等预处理选项
 */
export const CleanPanel: React.FC = () => {
  const cleanOptions = useStore((s) => s.cleanOptions);
  const setCleanOptions = useStore((s) => s.setCleanOptions);

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-700">内容清洗</h4>

      {/* 繁简转换 */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">繁简转换</label>
        <select
          value={cleanOptions.conversionMode}
          onChange={(e) => setCleanOptions({ conversionMode: e.target.value as ConversionMode })}
          className="w-full text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
        >
          <option value="none">不变</option>
          <option value="t2s">繁体→简体</option>
          <option value="s2t">简体→繁体</option>
        </select>
      </div>

      {/* 全角→半角 */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={cleanOptions.toHalfWidth}
          onChange={(e) => setCleanOptions({ toHalfWidth: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300 text-blue-500"
        />
        <span className="text-xs text-gray-600">全角→半角转换</span>
      </label>

      {/* 垃圾过滤 */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={cleanOptions.stripArtifacts}
          onChange={(e) => setCleanOptions({ stripArtifacts: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300 text-blue-500"
        />
        <span className="text-xs text-gray-600">广告/水印过滤</span>
      </label>

      {/* 行尾数字清除 */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={cleanOptions.removeLineEndNumbers}
          onChange={(e) => setCleanOptions({ removeLineEndNumbers: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300 text-blue-500"
        />
        <span className="text-xs text-gray-600">清除行尾页码</span>
      </label>

      {/* 内容筛选关键词 */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">过滤关键词（逗号分隔）</label>
        <input
          type="text"
          value={cleanOptions.filterKeywords}
          onChange={(e) => setCleanOptions({ filterKeywords: e.target.value })}
          placeholder="群号,下载器,QQ群"
          className="w-full text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
        />
      </div>
    </div>
  );
};
