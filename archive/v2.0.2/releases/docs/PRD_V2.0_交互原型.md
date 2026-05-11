# 产品交互原型 V2.0（高保真，适配 AI 开发）

> **关联文档**: `PRD_V2.0_产品需求文档.md`
> **版本**: V2.0
> **变更说明**: 在 V1.0 原型基础上新增文件拖拽排序、预览段落勾选、文档排版功能

---

## 一、整体布局结构（V2.0 更新版）

```text
+-------------------------------------------------------------------------------+
|  [≡] [文档终版确定器 — Text Unifier]                            [ _ ][ □ ][ X ] |
+-------------------------------------------------------------------------------+
|                                                                               |
|  ┌─────────────────────────────────────────────────────────────────────────┐  |
|  │  文件列表（可拖拽排序）                              [+ 添加文件]        │  |
|  │  ┌───────────────────────────────────────────────────────────────────┐  │  |
|  │  │ ≡ 📄 乖乖女的天降足控系统（全本）.txt    257.0 KB  UTF-8    ★ 主  │  │  |
|  │  │ ≡ 📄 乖乖女的天降足控系统（一）.txt       12.3 KB  UTF-8         │  │  |
|  │  │ ≡ 📄 乖乖女的天降足控系统（二）.txt       15.1 KB  GBK           │  │  |
|  │  │ ≡ 📄 乖乖女的天降足控系统（三）.txt       11.8 KB  UTF-8         │  │  |
|  │  └───────────────────────────────────────────────────────────────────┘  │  |
|  └─────────────────────────────────────────────────────────────────────────┘  |
|                                                                               |
+-------------------------------+-----------------------------------------------+
|  左侧：重复段落列表 (3组)      |  右侧：最终文档预览（每段可勾选）            |
|                               |                                               |
|  [☑] 重复组1 (出现2次)        |  ☑ 这是第一段独有的内容。                     |
|      原文: "项目启动会议纪要"   |     这是第一段独有的第二句内容。               |
|      来源: A.txt, B.txt       |                                               |
|  [☐] 重复组2 (出现3次)        |  ☑ 项目启动会议纪要                          |
|      原文: "待办事项：..."      |     1. 确认预算                              |
|      来源: A.txt, B.txt, C.txt|     2. 分配任务                              |
|  [☑] 重复组3 (出现2次)        |                                               |
|      原文: "附件见邮件"         |  ☑ 以上内容来自多个文档的整合。                |
|      来源: B.txt, C.txt       |                                               |
|                               |  ☐ ……                   [← 用户已取消勾选]  |
|                               |      (此段落已排除，不导出)                    |
|                               |                                               |
|                               |  ☑ 这是另一段独有的内容。                      |
|                               |                                               |
+-------------------------------+-----------------------------------------------+
|                                                                               |
|  [ 全选 ] [ 取消全选 ]    已排除 2/12 段     [ 文档排版 ]  [ 还原 ]  [ 导出 ]  |
|                                                                               |
+-------------------------------------------------------------------------------+
|  状态栏：就绪  |  段落数：12  |  预估导出大小：2.3 KB                         |
+-------------------------------------------------------------------------------+
```

---

## 二、V2.0 新增/变更组件规格定义

### 2.1 新增组件

#### FileSortList（文件排序列表）

| 属性 | 类型 | 说明 |
| :--- | :--- | :--- |
| `files` | `SortableFile[]` | 可排序的文件列表 |
| `onReorder` | `(newOrder: SortableFile[]) => void` | 拖拽排序完成后的回调 |
| `onAddFile` | `() => void` | 点击「+添加文件」按钮触发 |
| `onRemoveFile` | `(fileId: string) => void` | 删除某个文件 |

**SortableFile 数据结构**：
```typescript
interface SortableFile {
    id: string;
    name: string;          // 文件名
    path: string;          // 绝对路径
    size: number;          // 文件大小（字节）
    encoding: string;      // 检测到的编码（UTF-8 / GBK 等）
    isMainFile: boolean;   // 是否为主文件（排第一）
}
```

**交互说明**：
- 每行左侧显示拖拽手柄 `≡`，鼠标悬停时变为 `↕` 光标
- 使用 `@dnd-kit` 或原生 HTML5 Drag & Drop 实现
- 拖拽过程中目标位置显示蓝色占位线
- 主文件（第1个）行尾标注 `★ 主` 徽章，拖拽后自动更新
- 每行显示文件编码类型（颜色标签：绿色=UTF-8，黄色=GBK，灰色=其他）

#### PreviewCheckbox（预览段落复选框）

| 属性 | 类型 | 说明 |
| :--- | :--- | :--- |
| `paragraphId` | `string` | 段落唯一 ID |
| `isChecked` | `boolean` | 是否勾选（默认 true） |
| `onToggle` | `(id: string) => void` | 切换勾选状态 |
| `isDimmed` | `boolean` | 是否处于淡化状态 |

#### FormatButton（文档排版按钮）

| 属性 | 类型 | 说明 |
| :--- | :--- | :--- |
| `onFormat` | `() => void` | 执行排版 |
| `onRevert` | `() => void` | 还原到排版前状态 |
| `canRevert` | `boolean` | 是否有可还原的快照 |
| `isProcessing` | `boolean` | 是否正在排版处理中 |

### 2.2 变更组件

#### PreviewPanel（预览面板 — V2.0 扩展）

| 变更项 | V1.0 | V2.0 |
| :--- | :--- | :--- |
| 段落渲染 | 纯文本展示 | 每段左侧加 Checkbox |
| 取消勾选效果 | 无此功能 | 段落透明度降至 0.3，文字颜色变灰 |
| 段落 ID 关联 | 仅用于悬停溯源 | 额外关联勾选状态 |
| 交互 | 仅悬停浮层 | 点击 Checkbox + Shift 多选 |

#### DuplicateItem（重复组列表项 — V2.0 联动更新）

| 变更项 | V1.0 | V2.0 |
| :--- | :--- | :--- |
| 勾选效果 | 仅控制预览段显示/隐藏 | 同步更新 PreviewCheckbox 状态 |
| 状态同步 | 独立状态 | 与 PreviewCheckbox 双向绑定 |
| 部分勾选 | 无 | 组内段落被部分取消时，显示「➖」中间态 |

---

## 三、新增交互状态与流程

### 3.1 文件拖拽排序流程

```text
                        ┌─ 鼠标按下拖拽手柄 ─┐
                        │                     │
                        v                     │
              [文件行跟随鼠标移动]              │
                        │                     │
                        v                     │
              [目标位置显示蓝色占位线]           │
                        │                     │
              ┌──── 松开鼠标 ────┐             │
              │                  │             │
              v                  v             │
      [列表重排]          [移出列表区域]        │
              │                  │             │
              v                  v             │
  [自动重新合并分析]      [取消拖拽]            │
      (若已有结果)        [顺序不变]            │
              │                                │
              v                                │
  [保留已勾选状态]                              │
  [更新 ★ 主 标记]                              │
  [刷新预览]                                   │
```

### 3.2 段落勾选交互流程

```text
                    [用户在预览区点击段落 Checkbox]
                              │
                    ┌─────────┴──────────┐
                    │                     │
                    v                     v
              [单独点击]            [Shift + 点击]
                    │                     │
                    v                     v
        [切换该段落勾选状态]    [切换从上一个点击的
               │                段落到当前段落的
               v                 全部段落勾选状态]
        [更新左侧重复组状态]           │
               │                     v
               v            [批量更新勾选状态]
        [实时更新预览:
         已取消 = 淡化(0.3)]          │
               │                     v
               v            [实时更新预览]
        [更新全选按钮状态:
         全部勾选→全选;
         部分勾选→中间态;
         全不勾选→取消全选]
```

### 3.3 文档排版流程

```text
              [用户点击「文档排版」按钮]
                        │
                        v
            [保存当前预览快照到内存]
            (包含原文+勾选状态的深拷贝)
                        │
                        v
            ┌─── [后端 Rust 处理] ───┐
            │ 1. 按空行分割段落       │
            │ 2. 检测受保护块（列表）  │
            │ 3. 合并段落内行         │
            │ 4. 压缩多余空格         │
            │ 5. 返回排版后文本       │
            └────────────────────────┘
                        │
                        v
              [更新预览为排版后文本]
                        │
                        v
              [「还原」按钮变为可用]
              [再次点击排版 → 再保存快照再执行]
                        │
                        v
              [用户点击「还原」]
                        │
                        v
              [从快照恢复预览]
              [「还原」按钮变为禁用]
```

---

## 四、段落勾选状态与预览渲染对照

### 4.1 三种渲染模式

| 勾选状态 | 渲染效果 | 导出处理 |
| :--- | :--- | :--- |
| `isChecked = true`（默认） | 正常显示，Checkbox 为 ☑ | ✅ 纳入导出 |
| `isChecked = false`（用户取消） | 透明度 0.3，斜体灰色文字，Checkbox 为 ☐，段落后标注「已排除」 | ❌ 不导出 |
| 属于已勾选的重复组 | 同 `isChecked = false`，但无单独 Checkbox（继承组状态） | ❌ 不导出 |

### 4.2 左侧重复组与右侧段落的联动对照

```text
左侧重复组状态                       右侧对应段落状态
────────────────────────────────────────────────────────────
[☑] 已勾选（排除）        →   对应段落 isChecked = false，淡化
[☐] 未勾选（保留）        →   对应段落 isChecked = true，正常显示
[➖] 部分勾选（中间态）    →   部分段落 isChecked = false，部分 true
```

---

## 五、视觉规范

### 5.1 V2.0 新增视觉元素

| 元素 | 正常态 | 悬停态 | 激活/拖拽态 | 禁用态 |
| :--- | :--- | :--- | :--- | :--- |
| 拖拽手柄 `≡` | `color: gray-400` | `color: blue-500, cursor: grab` | `cursor: grabbing` | `cursor: default` |
| 占位线 | — | — | `border-top: 2px dashed blue-400` | — |
| ★ 主徽章 | `bg: blue-100, text: blue-700` | — | — | — |
| 文件编码标签 (UTF-8) | `bg: green-100, text: green-700` | — | — | — |
| 文件编码标签 (GBK) | `bg: yellow-100, text: yellow-700` | — | — | — |
| 已取消段落 | `opacity: 0.3, color: gray-400` | 聚焦时 `opacity: 0.6` | — | — |
| 多选高亮 | `bg: blue-50` | — | — | — |
| 排版处理中 | 按钮显示 Loading 旋转动画 | — | — | 按钮禁用 |
| 还原按钮可用 | 正常显示 | — | — | 无快照时 `disabled` |

### 5.2 间距与尺寸

| 元素 | 尺寸 |
| :--- | :---: |
| 文件列表行高 | 44px |
| 拖拽手柄区域 | 32×44px |
| 预览段 Checkbox | 16×16px |
| 预览段行间距 | 24px |
| 已取消段落的行高 | 同上，但 opacity 降低 |
| 底部操作栏 | 48px 高，sticky 定位 |

---

## 六、组件树（V2.0 更新）

```text
App
├── TitleBar
├── FileSortList                          ← 新增/替代原简单文件列表
│   ├── SortableFileItem (×N)            ← 新增
│   │   ├── DragHandle                   ← 新增
│   │   ├── FileIcon
│   │   ├── FileName
│   │   ├── FileSize
│   │   ├── EncodingBadge                ← 新增
│   │   └── MainFileBadge                ← 新增
│   └── AddFileButton
├── MainContent
│   ├── DuplicateList                    ← 左侧（无变化）
│   │   ├── DuplicateItem (×N)
│   │   │   ├── Checkbox
│   │   │   └── ...
│   │   └── ...
│   └── PreviewPanel                     ← 右侧（勾选扩展）
│       ├── PreviewParagraph (×N)        ← 每段加 Checkbox
│       │   ├── PreviewCheckbox          ← 新增
│       │   ├── ParagraphText
│       │   ├── Tooltip (on hover)
│       │   └── ExcludedBadge            ← 新增（取消勾选时显示）
│       └── EmptyState                   ← 新增（全部取消时显示）
├── BottomToolbar                        ← 增强
│   ├── SelectAllButton                  ← 新增（全选/取消全选）
│   ├── SelectionCounter                 ← 新增（已排除 n/m 段）
│   ├── FormatButton                     ← 新增（文档排版）
│   ├── RevertButton                     ← 新增（还原排版）
│   └── ExportButton
└── StatusBar
    ├── StatusText
    ├── ParagraphCount
    └── EstimatedSize
```

---

## 七、状态管理扩展

### Zustand Store 新增字段

```typescript
interface TextUnifierStore {
    // === 已有字段（V1.0）===
    fileList: FileInfo[];
    duplicateGroups: DuplicateGroup[];
    previewParagraphs: PreviewParagraph[];
    checkedGroups: Set<string>;
    
    // === V2.0 新增字段 ===
    // 文件排序
    sortedFileList: SortableFile[];         // 排序后的文件列表
    
    // 段落勾选（扩展）
    paragraphCheckedMap: Map<string, boolean>;  // paragraphId → isChecked
    lastClickedParagraphId: string | null;       // 用于 Shift 多选
    isAllSelected: boolean;                      // 全选状态
    
    // 排版功能
    formatSnapshot: PreviewParagraph[] | null;   // 排版前快照
    isFormatting: boolean;                       // 是否正在排版处理中
    canRevert: boolean;                          // 是否可以还原
    
    // === V2.0 新增 actions ===
    reorderFiles: (fromIndex: number, toIndex: number) => void;
    toggleParagraphCheck: (id: string) => void;
    batchToggleParagraphCheck: (ids: string[]) => void;
    selectAll: () => void;
    deselectAll: () => void;
    formatDocument: () => Promise<void>;
    revertFormatting: () => void;
}
```

### 派生状态（computed）

```typescript
const derivedState = {
    // 已排除段落数
    excludedCount: previewParagraphs.filter(p => !paragraphCheckedMap.get(p.id)).length,
    
    // 全选按钮状态: 'all' | 'partial' | 'none'
    selectAllState: computed(() => {
        const checked = previewParagraphs.filter(p => paragraphCheckedMap.get(p.id)).length;
        if (checked === 0) return 'none';
        if (checked === previewParagraphs.length) return 'all';
        return 'partial';
    }),
    
    // 导出的段落列表
    exportParagraphs: previewParagraphs.filter(p => paragraphCheckedMap.get(p.id)),
    
    // 重复组联动状态: 'checked' | 'unchecked' | 'indeterminate'
    duplicateGroupState: (groupId: string) => computed(() => {
        const relatedParas = getParagraphsByGroupId(groupId);
        const checkedCount = relatedParas.filter(p => paragraphCheckedMap.get(p.id)).length;
        if (checkedCount === 0) return 'checked';      // 全部排除
        if (checkedCount === relatedParas.length) return 'unchecked';  // 全部保留
        return 'indeterminate';  // 部分排除
    }),
};
```

---

## 八、快捷键支持

| 快捷键 | 功能 |
| :--- | :--- |
| `Ctrl+A` | 全选/取消全选段落（全部已勾选时取消，反之全选） |
| `Shift + 点击` | 批量切换一段连续段落的勾选状态 |
| `Ctrl+Z` | 还原排版（等同于点击「还原」按钮） |
| `Ctrl+E` | 触发文档排版 |
| `Ctrl+S` | 导出文件 |

---

## 九、响应式与布局要求

| 窗口宽度 | 布局行为 |
| :--- | :--- |
| ≥ 1024px | 标准三栏布局（文件列表 + 左侧重复组 + 右侧预览） |
| 800-1023px | 文件列表折叠为可展开的顶栏，下方保持左右两栏 |
| < 800px | 文件列表折叠，左侧重复组与右侧预览上下堆叠 |
| 最小窗口 | 900×600px（内容完整可读） |
