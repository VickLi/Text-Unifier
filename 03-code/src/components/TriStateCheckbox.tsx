import React from 'react';
import type { TriState } from '../types';

interface TriStateCheckboxProps {
  /** 三态值：'checked' (全部排除) / 'unchecked' (全部保留) / 'indeterminate' (部分排除) */
  state: TriState;
  /** 切换回调 */
  onChange: () => void;
  /** 可访问性标签 */
  ariaLabel?: string;
  /** 是否禁用 */
  disabled?: boolean;
}

/**
 * 三态复选框组件
 *
 * 用于重复组列表，显示三种状态：
 * - ☑ checked (全部排除)：组内所有段落均被取消勾选
 * - ☐ unchecked (全部保留)：组内所有段落均被勾选
 * - ➖ indeterminate (部分排除)：组内部分段落被勾选、部分被取消
 */
export const TriStateCheckbox: React.FC<TriStateCheckboxProps> = React.memo(
  ({ state, onChange, ariaLabel, disabled = false }) => {
    const isChecked = state === 'checked';
    const isIndeterminate = state === 'indeterminate';

    return (
      <input
        type="checkbox"
        checked={isChecked}
        ref={(input) => {
          if (input) {
            input.indeterminate = isIndeterminate;
          }
        }}
        onChange={onChange}
        disabled={disabled}
        className={`
          mt-0.5 h-4 w-4 rounded border-gray-300
          ${isChecked
            ? 'text-red-500 focus:ring-red-400'
            : isIndeterminate
              ? 'text-amber-500 focus:ring-amber-400'
              : 'text-blue-500 focus:ring-blue-400'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        aria-label={ariaLabel ?? `三态复选框，当前状态: ${state}`}
      />
    );
  }
);

TriStateCheckbox.displayName = 'TriStateCheckbox';
