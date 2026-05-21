import React from 'react';

interface ToggleButtonProps {
  /** 正向标签（如「全角→半角」） */
  labelForward: string;
  /** 反向标签（如「半角→全角」） */
  labelBackward: string;
  /** 是否已切换至反向状态 */
  isToggled: boolean;
  /** 点击回调 */
  onToggle: () => void;
  /** 是否禁用 */
  disabled?: boolean;
}

/**
 * V3.3 双向切换按钮（RQ-05）
 *
 * 纯按钮组件，状态由父组件（CleanPanel + Zustand Store）管理。
 *  - 未切换：蓝色 bg-blue-500
 *  - 已切换：灰色 bg-gray-500
 *  - 禁用：半透明 + 不可点击
 */
export const ToggleButton: React.FC<ToggleButtonProps> = ({
  labelForward,
  labelBackward,
  isToggled,
  onToggle,
  disabled = false,
}) => {
  const label = isToggled ? labelBackward : labelForward;

  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`
        px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
        ${disabled
          ? 'bg-gray-300 text-gray-400 cursor-not-allowed'
          : isToggled
            ? 'bg-gray-500 text-white hover:bg-gray-600'
            : 'bg-blue-500 text-white hover:bg-blue-600'
        }
      `}
    >
      {label}
    </button>
  );
};
