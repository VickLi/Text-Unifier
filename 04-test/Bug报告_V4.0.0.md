# Text Unifier V4.0.0 Bug 报告

> **测试阶段**: 代码审查 + 静态分析
> **测试日期**: 2026-05-22
> **Bug 总数**: 6（P0: 4, P1: 2, P2: 0）
> **Bug 修复阈值**: 严重/高危(P0) 100% 修复，中危(P1) ≤2 个

---

## P0-严重（必须修复）

### BUG-V4.0-001: `exportMergedText` 中 `defaultName` 变量未定义

| 属性 | 值 |
| :--- | :--- |
| **严重级别** | 🔴 P0-严重 |
| **模块** | Store - 导出 |
| **源文件** | `src/store/useStore.ts:408` |
| **根因** | `exportFile(mergedText, defaultName)` 使用了未声明的变量 `defaultName` |
| **影响** | 导出功能调用时 JavaScript 抛出 `ReferenceError: defaultName is not defined`，导出完全不可用 |
| **修复方案** | 根据 PRD J5，默认文件名应为 `{第一个文件名}_merged.txt`，从 `sortedFileList` 构造 |

### BUG-V4.0-002: `revertToExport` 末尾语法错误

| 属性 | 值 |
| :--- | :--- |
| **严重级别** | 🔴 P0-严重 |
| **模块** | Store - 导出 |
| **源文件** | `src/store/useStore.ts:445-447` |
| **根因** | `revertToExport` 方法末尾存在多余的 `}` 闭合括号，且引用了未定义的 `err` 变量（`err` 属于前面的 `catch` 作用域，但在 `revertToExport` 函数体中不存在） |
| **影响** | 整个 `useStore.ts` 文件在 `revertToExport` 后语法错误，应用无法编译 |
| **修复方案** | 删除多余的 `}` 和冗余的错误 toast 代码行 |

### BUG-V4.0-003: DiffViewer 使用 `detectEncoding` 返回编码名而非文件内容

| 属性 | 值 |
| :--- | :--- |
| **严重级别** | 🔴 P0-严重 |
| **模块** | I - 文档对比 |
| **源文件** | `src/components/DiffViewer.tsx:43-44` |
| **根因** | `detectEncoding()` 函数返回编码名称字符串（如 `"UTF-8"`），而非文件的实际文本内容。DiffViewer 错误地将其作为文件内容传递给 `normalize()` 进行段落对齐 |
| **影响** | 文档对比模式完全不可用 — 比较的是编码名而非实际文件内容，两个文件都会显示单个段落 "UTF-8"，导致对比结果完全错误 |
| **修复方案** | 添加新的 IPC 调用或使用 `mergeFiles` 的编码探测能力来读取文件内容；或创建 `readFileContent` 工具函数 |

### BUG-V4.0-004: PreviewPanel 搜索高亮未渲染

| 属性 | 值 |
| :--- | :--- |
| **严重级别** | 🔴 P0-严重 |
| **模块** | M - 搜索替换 |
| **源文件** | `src/components/PreviewPanel.tsx` |
| **根因** | `displayText` 变量在第 120 行声明但从未在 textarea 中使用。textarea 的 `value` 直接绑定 `mergedText`，没有将搜索匹配项用 `<mark>` 包裹。由于 textarea 不支持 HTML 渲染，搜索高亮（PRD M2 要求黄色底色标记、橙色焦点标记）完全无法显示 |
| **影响** | 搜索功能虽然能找到匹配项，但预览区没有任何视觉高亮反馈，用户无法直观看到匹配位置。替换功能"当前焦点"无法指示。违反 PRD M2、M6 |
| **修复方案** | 将 textarea 替换为 contentEditable div，使用 React 渲染 `<mark>` 标签实现高亮 |

---

## P1-中危（必须修复，限制 ≤2 个）

### BUG-V4.0-005: `exportMergedText` catch 块后 `revertToExport` 残留错误代码

| 属性 | 值 |
| :--- | :--- |
| **严重级别** | 🟡 P1-中危 |
| **模块** | Store - 导出 |
| **源文件** | `src/store/useStore.ts:445` |
| **根因** | `revertToExport` 函数末尾残留了一行 `get().addToast(\`导出失败: ${err}\`, 'error')`，该代码本应是 `exportMergedText` 的 `catch` 块内容，被错误地残留在此处。其中 `err` 变量超出作用域 |
| **影响** | `revertToExport` 调用时会尝试引用未定义变量 `err`，导致运行时错误 |
| **修复方案** | 删除该行残留代码 |

### BUG-V4.0-006: 连接点列表空状态逻辑错误

| 属性 | 值 |
| :--- | :--- |
| **严重级别** | 🟡 P1-中危 |
| **模块** | C - 连接点列表 |
| **源文件** | `src/components/ConnectionPointList.tsx:60-65` |
| **根因** | 当 `connectionPoints.length === 0` 时，固定显示「仅一个文件，无需合并」，但实际可能是多个文件但完全无重叠（PRD C8 要求显示「✨ 所有文件连接处无重叠」） |
| **影响** | 用户添加多个无重叠文件时收到错误提示信息，违反 PRD C8 |
| **修复方案** | 根据 `sortedFileList.length` 判断：≥2 时显示「无重叠」，=1 时显示「仅一个文件」 |
