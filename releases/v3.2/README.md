# Text Unifier V3.2

| 项目 | 内容 |
| :--- | :--- |
| **版本号** | V3.2 |
| **构建日期** | 2026-05-13 |
| **基线版本** | V3.1（含小说文本清洗引擎） |
| **变更类型** | UI 重构 + 预览编辑 + 撤回栈 + 文档对比 |

## V3.2 新增功能

| 需求 | 功能 | 实现方式 |
| :--- | :--- | :--- |
| RQ-01 | 文件列表收缩为横向浮动标签 (Chip Bar) | `FileChipBar.tsx`, `SortableChip.tsx` |
| RQ-02 | 上传改为按钮 + 全窗口拖拽遮罩 | `UploadButton.tsx`, `DragOverlay.tsx` |
| RQ-03 | 预览可编辑 + 5 步撤回栈 | `PreviewPanel.tsx`, `useStore.ts` |
| RQ-04 | 预览区主位化 (min-w-55%) + 溯源 | `App.tsx` 布局调整 |
| RQ-05 | 文档对比模式 (LCS + 双栏 + Diff) | `DiffViewer.tsx`, `diffUtils.ts` |

**Rust/IPC/Electron 零改动**：全部为纯前端 TypeScript 实现。

## 文件清单

```
releases/v3.2/
├── README.md                        # 本文件
└── text-unifier-src-v3.2.zip        # 完整源代码包

src/
├── components/
│   ├── ModeTabs.tsx       🆕 模式切换条
│   ├── DragOverlay.tsx    🆕 全窗口拖拽遮罩 + Hook
│   ├── UploadButton.tsx   🆕 紧凑上传按钮
│   ├── FileChipBar.tsx    🆕 横向文件标签栏
│   ├── SortableChip.tsx   🆕 可拖拽芯片
│   ├── DiffViewer.tsx     🆕 文档对比双栏视图
│   ├── PreviewPanel.tsx   ✏️ 增强（编辑 + 撤回）
│   └── ...其余零改动
├── store/
│   ├── useStore.ts        ✏️ 扩展（V3.2 状态/Actions）
│   └── defaults.ts        ✏️ 扩展（V3.2 默认值）
├── types/index.ts         ✏️ 扩展（Snapshots/DiffAlignment）
└── utils/
    ├── diffUtils.ts       🆕 LCS + Levenshtein + wordDiff
    └── ...其余零改动
```

## 验证结果

| 检查项 | 结果 |
| :--- | :---: |
| Rust 测试 | ✅ 零改动 |
| TypeScript | **零错误 ✅** |
| Vite 构建 | **成功 ✅** |
