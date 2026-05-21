# 产品交互原型 V3.2（高保真，适配 AI 开发）

> **关联文档**: `PRD_V3.2_产品需求文档.md`
> **版本**: V3.2
> **基线版本**: V3.1 → V3.2（UI 重构 + 对比模式 + 编辑/撤回）

---

## 一、V3.2 变更总览

| 区域 | V3.1 | V3.2 | 变更类型 |
| :--- | :--- | :--- | :--- |
| Tab 栏 | 无 | **模式切换 Tab** | 新增 |
| 上传入口 | 大面积虚线拖拽框 | **紧凑按钮** | 重构 |
| 文件列表 | 垂直卡片 list (max-h-64) | **横向浮动芯片** (36px) | 重构 |
| 拖拽反馈 | 拖拽框高亮 | **全窗口 DragOverlay** | 重构 |
| 重复组面板 | 380px 固定宽度 | **280px 可拖拽宽度** | 微调 |
| 预览面板 | flex-1 / 只读 | **主位 ≥55% / 可编辑** | 重构 |
| 工具面板 | 右侧 280px 固定 | 右侧 260px 固定 | 微调 |
| 底部工具栏 | 全选/取消/还原排版/应用/导出 | + **撤回/重做按钮** | 增强 |
| 新功能 | — | **对比模式全界面** | 新增 |

---

## 二、V3.2 整体布局（合并去重模式）

```text
+-----------------------------------------------------------------------------------------+
|  [≡] 文档终版确定器 — Text Unifier v3.2                                  [ _ ][ □ ][ X ] |
+-----------------------------------------------------------------------------------------+
|  [ 🔗 合并去重 ]    [ 📋 文档对比 ]                                  [📁 添加文件]      |  ← 新增：模式 Tab + 上传按钮
+-----------------------------------------------------------------------------------------+
|  📄 全本.txt ★  📄 卷一.txt ✕  📄 卷...│ [+添加]          ← 横向芯片带横向滚动  ← RQ-01 |
+-----------------------------------------------------------------------------------------+
|  ┌─ 重复段落 (3组) ─┐  ┌─ 最终文档预览（可编辑）──────────────────┐  ┌─ 工具 ─────────┐  |
|  │                   │  │                                         │  │ [清洗|章节|排版]│  |
|  │ [☑] 组1 "方怡"    │  │ 这是第一段独有的内容。  [来源: A.txt]     │  │                │  |
|  │ [☐] 组2 "待办"    │  │                                         │  │ 繁简: [不变]   │  |
|  │ [☑] 组3 "附件"    │  │ 项目启动会议纪要      [来源: A,B]        │  │ 垃圾过滤: ON   │  |
|  │                   │  │ 1. 确认预算                              │  │                │  |
|  │                   │  │ 2. 分配任务                              │  │                │  |
|  │                   │  │                                         │  │ [应用处理]     │  |
|  │                   │  │ 被排除: …… [来源: A.txt]                 │  │                │  |
|  │                   │  │                                         │  │                │  |
|  │                   │  │ 以上内容来自多个文档的整合。 [来源: A,C]   │  │                │  |
|  │                   │  │                                         │  │                │  |
|  └───────────────────┘  └─────────────────────────────────────────┘  └────────────────┘  |
|                                                                                         |
+-----------------------------------------------------------------------------------------+
|  [☐全选][☑取消全选]  已排除 1/6 段  |  ↶ 撤回  ↷ 重做  |  ⏎ 导出                      |  ← RQ-03 |
+-----------------------------------------------------------------------------------------+
```

---

## 三、V3.2 对比模式布局

```text
+-----------------------------------------------------------------------------------------+
|  [≡] 文档终版确定器 — Text Unifier v3.2                                  [ _ ][ □ ][ X ] |
+-----------------------------------------------------------------------------------------+
|  [ 🔗 合并去重 ]    [ 📋 文档对比 ]                                  [📁 添加文件]      |
+-----------------------------------------------------------------------------------------+
|  📄 全本.txt (左)  ⇄  📄 新版.txt (右)  ★ 对比模式仅支持 2 个文件                      |
+-----------------------------------------------------------------------------------------+
|  ┌─ 左栏：全本.txt ───────────────┐  ┌─ 右栏：新版.txt ───────────────┐                |
|  │                                 │  │                                 │                |
|  │ ┃ 第1章 踏上旅途      [绿色]    │  │ ┃ 第1章 踏上旅途      [绿色]    │  ← 相同内容    |
|  │ ┃ 在一片茂密的森林...           │  │ ┃ 在一片茂密的森林...           │                |
|  │                                 │  │                                 │                |
|  │ ┃ 作者：张三          [红色]    │  │ [空]                            │  ← 左独有      |
|  │                                 │  │                                 │                |
|  │ ┃ 第2章 初遇同伴      [绿色]    │  │ ┃ 第2章 初遇同伴      [绿色]    │                |
|  │                                 │  │                                 │                |
|  │ ┃ 她轻轻地说          [灰色]    │  │ ┃ 她温柔地说          [灰色]    │  ← 相似但不同   |
|  │ ┃ [轻轻] ← 标红词              │  │ ┃ [温柔] ← 标红词              │                |
|  │                                 │  │                                 │                |
|  │                                 │  │ ┃ 新版新增章节        [蓝色]    │  ← 右独有      |
|  │                                 │  │ ┃ 这是一个新段落...            │                |
|  │                                 │  │                                 │                |
|  └─────────────────────────────────┘  └─────────────────────────────────┘                |
|                                                                                         |
+-----------------------------------------------------------------------------------------+
|  共有 85 段  |  左独有 3 段  |  右独有 5 段  |  差异 2 段                              |
+-----------------------------------------------------------------------------------------+
```

### 3.1 对比模式颜色规范

| 类型 | 背景色 | 文字色 | 说明 |
| :--- | :--- | :--- | :--- |
| 相同段落 | `bg-green-50` | `text-gray-900` | 两个文件内容完全一致 |
| 左独有 | `bg-red-50 border-l-2 border-red-400` | `text-gray-900` | 仅左侧文件有 |
| 右独有 | `bg-blue-50 border-l-2 border-blue-400` | `text-gray-900` | 仅右侧文件有 |
| 差异段落 | `bg-gray-100` | `text-gray-800` | 相似但不同，差异词标红 |
| 差异标红词 | — | `text-red-600 bg-red-100 rounded` | 具体差异字符高亮 |

---

## 四、新增/变更组件规格

### 4.1 新增组件

#### ModeTabs（模式切换条）

| 属性 | 类型 | 说明 |
| :--- | :--- | :--- |
| `activeMode` | `'merge' \| 'compare'` | 当前模式 |
| `onModeChange` | `(mode: 'merge' \| 'compare') => void` | 切换回调 |

**样式**：标题栏正下方，高度 40px，浅灰底色，选中 Tab 白色底+蓝色下划线。

---

#### FileChipBar（浮动文件标签栏）— 替代 FileSortList

| 属性 | 类型 | 说明 |
| :--- | :--- | :--- |
| `files` | `SortableFile[]` | 文件列表 |
| `onReorder` | `(from: number, to: number) => void` | 横向拖拽排序 |
| `onRemove` | `(path: string) => void` | 删除文件 |
| `onAddClick` | `() => void` | 触发添加文件对话框 |

**样式**：
- 整个 Bar 高度 36px，`overflow-x: auto` 横向滚动
- 芯片：`inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-blue-50 border border-blue-200`
- 第 1 个芯片：金色 ★ 徽章 + `border-blue-400 ring-1 ring-blue-300`
- 删除按钮：芯片末尾 `×`，`hover:text-red-500`
- 末尾「+ 添加」按钮：`ml-2 px-3 py-1 rounded-full text-xs bg-gray-100 border border-dashed border-gray-300 hover:border-blue-400`

---

#### DragOverlay（全窗口拖拽遮罩）— 替代 FileDropZone

| 属性 | 类型 | 说明 |
| :--- | :--- | :--- |
| `visible` | `boolean` | 是否显示（由全局 dragenter/dragleave 控制） |
| `isRejecting` | `boolean` | 拖入非 .txt 时变红 |

**样式**：
- `fixed inset-0 z-50 bg-blue-500/20 backdrop-blur-sm`
- 居中白色圆角卡片 (320×200px)：图标 + 标题 + 副标题
- 拒绝时：`bg-red-500/20`，卡片红色边框

**行为**：监听 `document` 级别的 `dragenter`（设置计数器）和 `dragleave`（计数器归零时隐藏），`drop` 事件触发文件处理。

---

#### UploadButton（上传按钮）

| 属性 | 类型 | 说明 |
| :--- | :--- | :--- |
| `onFilesSelected` | `(files: FileMeta[]) => void` | 文件选择回调 |
| `disabled` | `boolean` | 加载中禁用 |

**样式**：紧凑按钮，`px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600`

---

#### DiffViewer（文档对比双栏视图）

| 属性 | 类型 | 说明 |
| :--- | :--- | :--- |
| `alignment` | `DiffAlignment[]` | LCS 对齐后的段落列表 |
| `leftFileName` | `string` | 左栏文件名 |
| `rightFileName` | `string` | 右栏文件名 |

**DiffAlignment 数据结构**：
```typescript
interface DiffAlignment {
    type: 'match' | 'leftOnly' | 'rightOnly' | 'diff';
    leftParagraph?: string;
    rightParagraph?: string;
    diffTokens?: { text: string; isDiff: boolean }[]; // 仅 type='diff' 时
}
```

**行为**：左右两栏同时绑定 `scroll` 事件，`scrollTop` 互相同步。

---

#### DiffStats（对比统计栏）

| 属性 | 类型 | 说明 |
| :--- | :--- | :--- |
| `matched` | `number` | 相同段落数 |
| `leftOnly` | `number` | 左独有段落数 |
| `rightOnly` | `number` | 右独有段落数 |
| `diffCount` | `number` | 差异段落数 |

---

#### UndoRedoButtons（撤回重做按钮）

| 属性 | 类型 | 说明 |
| :--- | :--- | :--- |
| `canUndo` | `boolean` | 是否可撤回 |
| `canRedo` | `boolean` | 是否可重做 |
| `onUndo` | `() => void` | 撤回 |
| `onRedo` | `() => void` | 重做 |

---

### 4.2 变更组件

#### PreviewPanel（预览面板 — V3.2 重构）

| 变更项 | V3.1 | V3.2 |
| :--- | :--- | :--- |
| 内容渲染 | 带 Checkbox 的只读段落 | **可编辑 textarea** + 行内 Checkbox |
| 编辑能力 | 无 | 支持直接修改文本，输入停止 500ms 后保存快照 |
| 溯源浮层 | 已有 Tooltip | 保留，格式优化（见 AC-04-02） |
| 宽度 | flex-1 | **min-w-[55%]**（主位化） |

> **编辑模式实现建议**：使用 `contentEditable` div 或富文本方案需要平衡复杂度。推荐方案：
> - 预览区顶部提供「✏️ 编辑」按钮，点击切换编辑/阅读模式
> - 编辑模式下，使用带 Checkbox 的可编辑段落组件
> - 每一段渲染为 `<div contentEditable>`，允许用户修改文字
> - 段落 Checkbox 在编辑模式下仍可用

---

#### FileSortList → 废弃

V3.2 中 `FileSortList` 由 `FileChipBar` 替代，原组件可从代码库移除。

#### FileDropZone → 废弃

V3.2 中 `FileDropZone` 由 `UploadButton` + `DragOverlay` 替代，原组件可移除。

---

## 五、组件树（V3.2 完整版）

```text
App
├── TitleBar                                          ← 不变
├── ModeTabs                                          ← 新增：合并去重/文档对比切换
│   ├── UploadButton                                  ← 新增：📁 添加文件
│   └── DragOverlay                                   ← 新增：全窗口拖拽遮罩
│
├── FileChipBar                                       ← 重构：替代 FileSortList + FileDropZone
│   ├── FileChip (×N)                                 ← 新增：横向芯片
│   │   ├── FileIcon
│   │   ├── FileName (截断20字)
│   │   ├── MainBadge (★)
│   │   └── RemoveButton (×)
│   └── AddChipButton
│
├── [合并去重模式] MainContent                         ← 重构布局
│   ├── DuplicateList (w-[280px])                     ← 宽度缩小
│   │   └── DuplicateItem (×N)
│   │       ├── Checkbox (三态)
│   │       ├── Snippet + Sources
│   │       └── GroupIndeterminateBadge
│   ├── PreviewPanel (min-w-[55%])                    ← 主位化 + 可编辑
│   │   ├── EditToggle                               ← 新增：✏️ 编辑/阅读切换
│   │   ├── PreviewParagraph (×N)                    ← 可编辑版本
│   │   │   ├── Checkbox
│   │   │   ├── ContentEditableDiv                   ← 新增：可编辑内容
│   │   │   └── SourceTooltip (on hover)             ← 增强：显示所有来源
│   │   └── EmptyState
│   └── SidePanel (w-[260px])                         ← 宽度微缩
│       ├── CleanPanel
│       ├── ChapterPanel
│       └── FormatPanel
│
├── [对比模式] DiffView                               ← 全新
│   ├── DiffLeftPanel                                 ← 新增：左栏
│   │   └── DiffParagraph (×N)
│   ├── DiffRightPanel                                ← 新增：右栏
│   │   └── DiffParagraph (×N)
│   └── DiffStats                                     ← 新增：统计栏
│
├── BottomToolbar                                     ← 增强
│   ├── SelectAllButton
│   ├── SelectionCounter
│   ├── UndoButton                                    ← 新增：↶ 撤回
│   ├── RedoButton                                    ← 新增：↷ 重做
│   ├── ApplyButton
│   └── ExportButton
│
└── StatusBar                                         ← 增强
    ├── StatusText
    ├── ParagraphCount
    ├── ChapterCount
    └── UndoStepIndicator                             ← 新增：当前步/总步
```

---

## 六、新增交互流程

### 6.1 全窗口拖拽上传流程

```text
用户从 OS 拖拽文件到软件窗口
              │
              ▼
[document dragenter] → counter++
              │
              ▼
[DragOverlay 显示] — 蓝色半透明遮罩
  "📁 释放到此添加 TXT 文件"
              │
     ┌───────┴────────┐
     │ 检测文件扩展名   │
     ├─ .txt ────────► 继续显示蓝色
     └─ 非 .txt ─────► 遮罩变红 + "仅支持 .txt 文件"
              │
     ┌───────┴────────┐
     │ 用户拖出窗口    │ 用户松开鼠标
     ├─ dragleave     ├─ drop 事件
     │  counter--     │  触发文件处理
     │  counter=0时   │  隐藏遮罩
     │  隐藏遮罩       │
     └────────────────┴─────────
```

### 6.2 预览编辑 + 撤回流程

```text
用户点击「✏️ 编辑」→ 预览区变为可编辑
              │
     ┌───────┴────────┬──────────────┐
     │ 用户修改文字    │ 用户点工具面板│ 用户勾选段落
     │ (超500ms停笔)  │ 「应用处理」  │
     ▼                ▼              ▼
[保存当前快照到撤回栈] ← 自动入栈
     │
     ▼
[底部 UndoRedoButtons 更新]
  ↶ 可撤回 (stack.pointer > 0)
  ↷ 可重做 (stack.pointer < stack.length-1)
     │
     ▼
[Ctrl+Z] → undo() → 恢复到 pointer-1 的快照
[Ctrl+Y] → redo() → 恢复到 pointer+1 的快照
     │
     ▼
[栈满5步后] → 新操作入栈时 shift() 丢弃最早快照
```

### 6.3 文档对比流程

```text
用户切换到「📋 文档对比」Tab
              │
              ▼
[显示对比模式 UI — 空状态]
  "请添加 2 个 TXT 文件进行对比"
              │
              ▼
[用户添加文件]
  ├─ 恰好 2 个 → 执行对比
  └─ ≠ 2 个  → Toast "对比模式仅支持 2 个文件"
              │
              ▼
[Rust 后端归一化两个文件]
              │
              ▼
[前端 LCS 段落对齐]
  1. 按 \n\n 分割段落
  2. LCS 算法计算对齐
  3. 相似段落: Levenshtein 距离 > 60% → diff 类型
              │
              ▼
[DiffViewer 渲染双栏]
  绿色 = 相同
  红色 = 左独有
  蓝色 = 右独有
  灰色 = 差异（差异词标红）
              │
              ▼
[同步滚动: 左栏 scroll → 右栏跟随; 反之亦然]
              │
              ▼
[DiffStats 更新统计]
```

---

## 七、状态管理扩展（Zustand Store）

```typescript
interface AppState {
    // ...existing V3.1 fields...

    // V3.2 模式切换
    activeMode: 'merge' | 'compare';

    // V3.2 预览可编辑
    isEditing: boolean;                     // 预览编辑模式
    toggleEditing: () => void;

    // V3.2 撤回栈
    undoStack: Snapshot[];                  // 最多 5 个快照
    undoPointer: number;                    // 当前指针
    undo: () => void;
    redo: () => void;
    pushSnapshot: (reason?: string) => void;
    canUndo: boolean;                       // 派生
    canRedo: boolean;                       // 派生

    // V3.2 拖拽遮罩
    isDragOverlayVisible: boolean;
    setDragOverlayVisible: (v: boolean) => void;

    // V3.2 对比模式
    diffAlignment: DiffAlignment[];
    setDiffAlignment: (alignment: DiffAlignment[]) => void;
    diffLeftFile: string | null;
    diffRightFile: string | null;
}

interface Snapshot {
    id: string;                             // UUID
    paragraphs: PreviewParagraph[];         // 深拷贝
    checkedMap: Record<string, boolean>;    // 深拷贝
    reason?: string;                        // "应用处理" | "手动编辑" | "勾选切换"
    timestamp: number;
}
```

---

## 八、快捷键（V3.2 更新）

| 快捷键 | V3.1 | V3.2 |
| :--- | :---: | :---: |
| `Ctrl+A` | 全选/取消全选 | 不变 |
| `Shift+点击` | 批量切换 | 不变 |
| `Ctrl+Z` | 还原排版 | **撤回**（升级为全操作撤回栈） |
| `Ctrl+Y` | — | **新增：重做** |
| `Ctrl+E` | 触发排版 | 不变 |
| `Ctrl+S` | 导出 | 不变 |

---

## 九、响应式布局更新

| 窗口宽度 | 布局行为 | V3.2 变化 |
| :--- | :--- | :--- |
| ≥ 1400px | 三栏：重复组(280px) + 预览(≥55%) + 工具(260px) | 重复组宽度缩小，预览主位化 |
| 1024-1399px | 两栏：预览 + 工具，重复组折叠到左侧抽屉 | 新增抽屉模式 |
| < 1024px | 单栏堆叠，文件芯片收缩为滚动条 | 不变 |

---

*本文档应与 `PRD_V3.2_产品需求文档.md`、`PRD_V3.1_交互原型.md` 配合阅读。对比模式的完整算法见 PRD 第 2.1 节。*
