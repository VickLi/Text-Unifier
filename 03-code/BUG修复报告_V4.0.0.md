# Text Unifier V4.0 — Bug 修复报告

> **版本**: V4.0.0（修订 8）  
> **日期**: 2026-05-24  
> **关联**: `releases/v4.0/` 便携版已同步更新

---

## 修复清单（全部 9 项）

| Bug ID | 严重级 | 问题 | 修订 | 状态 |
| :--- | :---: | :--- | :---: | :---: |
| BUG-V4.0-001 | P1 | 预览区显示字面 `\n` 而非换行 | 1 | ✅ |
| BUG-V4.0-002 | P2 | 文件名 tooltip 被 ModeTabs 遮挡 | 2 | ✅ |
| BUG-V4.0-003 | P1 | 搜索点击不跳转到预览区 | 1 | ✅ |
| BUG-V4.0-004 | P2 | Minimap 色条上半深绿下半浅绿 | 1 | ✅ |
| BUG-V4.0-005 | P1 | 预览区底部显示连接确认文件名 | 1 | ✅ |
| BUG-V4.0-006 | P2 | 文件名 tooltip 仍被遮挡（CSS overflow-x 强制 overflow-y） | 2 | ✅ |
| BUG-V4.0-007 | P2 | Minimap 不显示完整文档长度（只显示一部分） | 2 | ✅ |
| BUG-V4.0-008 | P1 | 搜索导致软件卡顿 + 清空关键词不关闭侧栏 | 2 | ✅ |
| BUG-V4.0-009 | P1 | 替换/修改文本后撤回失效 | 3 | ✅ |\n| BUG-V4.0-010 | P2 | Minimap 显示滚动条/只能看一部分 | 3 | ✅ |\n| BUG-V4.0-011 | P1 | 替换后撤回仍然失效（嵌套 set 竞态 v2） | 3 | ✅ |\n| BUG-V4.0-012 | P2 | 界面超出窗口大小，不能自适应 | 3 | ✅ |
| BUG-V4.0-013 | P2 | Minimap 重构：N=容器高度/3 等比例压缩 + ratio 跳转 | 5 | ✅ |
| BUG-V4.0-014 | P1 | 替换后撤回仍然失效（`undoPointer <= 0` 应为 `< 0`） | 4 | ✅ |
| BUG-V4.0-015 | P2 | 导出文件格式 UTF-8-BOM 应为 UTF-8 | 4 | ✅ |
| BUG-V4.0-016 | P1 | 搜索关键词导致软件卡住不动 | 4 | ✅ |
| BUG-V4.0-017 | P2 | Minimap 缺少悬停高亮 + 连接点特殊颜色标记 | 6 | ✅ |
| BUG-V4.0-018 | P1 | DiffViewer 只显示"UTF-8"不显示文件内容 | 6 | ✅ |
| BUG-V4.0-019 | P1 | 删除文件后预览文本不刷新/全部删除不清空 | 7 | ✅ |
| BUG-V4.0-020 | P2 | 文件删除后芯片栏文件仍存在 | 7 | ✅ |
| BUG-V4.0-021 | P1 | 关键词查询数量过多软件卡死 | 7 | ✅ |
| BUG-V4.0-022 | P1 | 文档对比文字正确但显示/对齐不正确 | 7 | ✅ |
| BUG-V4.0-023 | P2 | 文档对比缺少 Minimap | 7 | ✅ |
| BUG-V4.0-024 | P1 | 删除文件后预览/搜索区未清空 | 8 | ✅ |
| BUG-V4.0-025 | P1 | 对比模式无法切回合并/无法重新开始 | 8 | ✅ |
| BUG-V4.0-026 | P1 | DiffViewer 段落拆分错误导致对比不准 | 8 | ✅ |

---

## BUG-V4.0-001：预览区字面 `\n` 显示

**现象**：阅读模式下，最终文档预览区显示 `第一行\n第二行\n第三行`，而非实际换行。

**根因**：`renderTextWithHighlights()` 中 `text.split('\n')` 将文本按换行符拆分后，用 `<span>{line}\n</span>` 渲染，React 将 `\n` 作为字面文本而非换行处理。

**修复**：
- **文件** `src/components/PreviewPanel.tsx`
- 删除 `renderTextWithHighlights` 独立函数，将渲染逻辑内联到 `renderContent`
- 将 `font-mono` 改为 `font-sans`（更适合阅读）
- 在 `<pre>` 标签内使用 `{"\n"}` React 表达式插入实际换行

```tsx
// 修复前（错误）
<span key={i}>{line}\n</span>

// 修复后（正确）
<span key={i}>{line}{'\n'}</span>
```

---

## BUG-V4.0-002：文件名 tooltip 被 ModeTabs 遮挡

**现象**：鼠标悬停在文件名芯片上时，弹出的完整文件名被上方模式切换条遮挡。

**根因**：
1. `FileChipBar` 的 `overflow-x-auto` 隐含 `overflow-y: auto`，裁剪了向上的 tooltip
2. `ModeTabs` 未设置 z-index，与 tooltip 处于同一层叠上下文中，渲染顺序导致遮挡

**修复**：
- **文件** `src/components/FileChipBar.tsx` — 添加 `overflow-y-visible` + `relative z-10`
- **文件** `src/components/ModeTabs.tsx` — 添加 `relative z-0`

```tsx
// FileChipBar.tsx
<div className="... overflow-x-auto overflow-y-visible relative z-10">

// ModeTabs.tsx
<div className="... relative z-0">
```

---

## BUG-V4.0-003：搜索结果点击不跳转

**现象**：在连接点列表面板点击搜索结果时，预览区不滚动到对应位置。

**根因**：
1. 原代码尝试 `document.getElementById('match-{position}')` 查找元素，但预览区未渲染此 ID
2. `scrollIntoView` 对 `overflow` 容器内的元素表现不稳定

**修复**：
- **文件** `src/components/PreviewPanel.tsx` — 每行添加 `id={match ? 'match-{position}' : undefined}` 标记；预览区容器添加 `data-preview-container` 属性
- **文件** `src/components/ConnectionPointList.tsx` — 改为精确计算滚动偏移：通过 `data-preview-container` 找到容器，计算目标元素相对容器位置后设置 `container.scrollTop`

```tsx
// ConnectionPointList.tsx — 修复后
const container = document.querySelector('[data-preview-container]');
const target = document.getElementById(`match-${r.position}`);
if (container && target) {
  const containerRect = container.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  container.scrollTop += targetRect.top - containerRect.top - containerRect.height / 3;
}
useStore.setState({ currentMatchIndex: r.index });
```

---

## BUG-V4.0-004：Minimap 色条深浅不一

**现象**：右侧 Minimap 缩略图上半部分深绿（`bg-green-500`），下半部分浅绿（`bg-green-300`），全部都是绿色。

**根因**：Minimap 的 `visibleRange` 固定为 `[0, Math.min(items.length - 1, 50)]`，导致上半段始终标记为"可视"，下半段标记为"不可视"。Minimap 使用 `isVisible ? 'bg-green-500' : 'bg-green-300'` 绘制两种深度。

**修复**：
- **文件** `src/components/PreviewPanel.tsx` — 新增 `visibleLineRange` 状态 + `handlePreviewScroll` 回调；预览区容器绑定 `onScroll={handlePreviewScroll}`，实时计算当前可见行范围
- Minimap 的 `visibleRange` 从固定值改为 `{visibleLineRange}`

```tsx
// 新增：滚动时动态计算可见范围
const [visibleLineRange, setVisibleLineRange] = useState<[number, number]>([0, 50]);
const handlePreviewScroll = useCallback(() => {
  const el = preRef.current?.parentElement;
  if (!el || minimapItems.length === 0) return;
  const lineHeight = 22;
  const start = Math.floor(el.scrollTop / lineHeight);
  const visible = Math.ceil(el.clientHeight / lineHeight);
  setVisibleLineRange([Math.max(0, start), Math.min(minimapItems.length - 1, start + visible)]);
}, [minimapItems.length]);
```

---

## BUG-V4.0-005：预览区底部显示连接确认文件

**现象**：阅读模式下，文本预览区底部额外显示一段文件连接确认信息，包含文件名和「切断」「连接」按钮，看起来像多出来的页面内容。

**根因**：V4.0 设计中 preview 底部硬编码了一个 `ConnectionMarker` 列表区域来显示连接点信息，但这对用户来说是干扰信息。

**修复**：
- **文件** `src/components/PreviewPanel.tsx` — 移除阅读模式底部 `ConnectionMarker` 列表渲染块。连接标记（`┈┈` 开头行）保留在文本中以灰色斜体显示，`connectionPoints`/`connectionStates`/`toggleConnectionMerge` 导入一并删除

```tsx
// 删除的代码块：
{connectionPoints.length > 0 && (
  <div className="mt-4 pt-4 border-t border-gray-100">
    {connectionPoints.map((cp) => (
      <ConnectionMarker key={cp.id} cp={cp} ... />
    ))}
  </div>
)}
```

---

## 构建验证

| 验证项 | 结果 |
| :--- | :---: |
| TypeScript 类型检查 | ✅ 零错误 |
| Vite 前端构建 | ✅ 241 KB JS + 28 KB CSS（6.7s） |
| Electron 打包 | ✅ `win-unpacked` 已更新 |
| Portable ZIP | ✅ `releases/v4.0/portable/TextUnifier_Portable_v4.0.zip`（108.3 MB） |

---

## 修改文件清单

| 文件 | 行变更 | 说明 |
| :--- | :---: | :--- |
| `src/components/PreviewPanel.tsx` | +30 / -40 | BUG-001/003/004/005：换行渲染、搜索跳转、Minimap滚动、移除连接列表 |
| `src/components/ConnectionPointList.tsx` | +5 / -1 | BUG-003：搜索结果点击精确跳转 |
| `src/components/FileChipBar.tsx` | +1 / -1 | BUG-002/006：tooltip 改为 fixed 定位（回退 overflow 方法） |
| `src/components/ModeTabs.tsx` | +1 / -1 | BUG-006：回退 z-index 修改（不再需要） |
| `src/components/SortableChip.tsx` | +2 / -4 | BUG-006：tooltip 改用 fixed 定位绕过 overflow 裁剪 |
| `src/components/Minimap.tsx` | +1 / -1 | BUG-007：改为 `h-full overflow-y-auto` 显示全部行 |
| `src/components/SearchReplace.tsx` | +4 / -2 | BUG-008：空关键词立即 clearSearch + 500ms debounce + 最小2字 |
| `src/store/useStore.ts` | +25 / -25 | BUG-008/009：搜索限200结果 + pushSnapshot 移出 set 回调 |

---

## 修订 2：BUG-V4.0-006～009

### BUG-V4.0-006：文件名 tooltip 仍被遮挡

**现象**：上一个修复（overflow-y-visible + z-index）无效，tooltip 依然被裁剪。

**根因**：CSS 规范规定，`overflow-x` 为 `auto/scroll/hidden` 时，`overflow-y` 的 `visible` 会被强制计算为 `auto`（不可混合使用）。

**修复**：
- `SortableChip.tsx` — tooltip 改为 `position: fixed`（绕过父容器 overflow 裁剪），使用 `z-[9999]`
- `FileChipBar.tsx` / `ModeTabs.tsx` — 回退之前无效的 z-index/overflow-y 修改

### BUG-V4.0-007：Minimap 不显示完整文档长度

**现象**：右侧 Minimap 只显示前面一部分色条，滚动到底部后就看不到了。

**根因**：Minimap 容器 `overflow-hidden` + 未设置高度，内容被 `min-h-0` 的父容器限制裁剪。

**修复**：
- `Minimap.tsx` — `overflow-hidden` → `h-full overflow-y-auto` 确保容器占满高度并允许滚动

### BUG-V4.0-008：搜索卡顿 + 清空不关闭侧栏

**现象**：
1. 输入搜索关键词后整体卡顿
2. 删除搜索关键词后，左侧搜索结果栏不自动关闭

**根因**：
1. `performSearch` 对全文执行 regex，每次匹配都创建 contextBefore/After 字符串切片（大量 GC 压力）
2. 空关键词仍走 300ms debounce → `performSearch('')` → `isSearching: false`，但对中间状态（逐个删除字符）每次 keystroke 都触发搜索

**修复**：
- `SearchReplace.tsx` — 空/空白关键词立即 `clearSearch()`；debounce 300ms→500ms；最短 2 字符才触发
- `useStore.ts` `performSearch` — 限制最多 200 个结果

### BUG-V4.0-009：替换后撤回失效

**现象**：执行替换操作后，Ctrl+Z 撤回无效，或需要先点重做才能撤回。

**根因**：`replaceOne`/`replaceAll` 在 `set()` 回调内部调用 `get().pushSnapshot()`。Zustand v4 中嵌套 `set()` 存在竞态——内层 `pushSnapshot` 的 `set()` 与外层 `set()` 可能不按预期顺序应用，导致快照栈指针错乱。

**修复**：
- `useStore.ts` `replaceOne`/`replaceAll` — 先通过 `get()` 读取状态，在 `set()` 外部调用 `pushSnapshot()`，再调用 `set()` 更新文本

```typescript
// 修复前（嵌套 set 有竞态）
replaceOne: () => set((state) => {
  get().pushSnapshot('替换一处'); // 嵌套 set
  return { mergedText: newText };
}),

// 修复后
replaceOne: () => {
  const state = get();
  // ... 计算 newText ...
  get().pushSnapshot('替换一处'); // set 外部调用
  set({ mergedText: newText });
},
```


---

## 修订 3：BUG-V4.0-010～012

### BUG-V4.0-010：Minimap 显示滚动条

**现象**：右侧 Minimap 有垂直滚动条，只能看到部分行。

**根因**：`overflow-y-auto` 产生滚动条；固定 `h-[2px]` 行高无法自适应容器高度。

**修复**（`Minimap.tsx`）：新增 `ResizeObserver` 动态计算 `itemHeight = containerHeight / items.length`，每行自适应高度填充全部容器；移除 `overflow-y-auto`。

### BUG-V4.0-011：替换后撤回仍然失效

**现象**：修订 2 的修复仍不生效。

**根因**：两次独立 `set()`（pushSnapshot + 外层 set）在 React 18 下可能被批处理，状态不一致。

**修复**（`useStore.ts`）：快照逻辑**内联到同一 `set()` 回调**，原子更新 `mergedText` + `undoStack` + `undoPointer`。

```typescript
// 修复后：单 set 回调原子更新
replaceOne: () => set((state) => {
  const snapshot: Snapshot = { ... state.mergedText ... };
  let newStack = state.undoStack.slice(0, state.undoPointer + 1);
  newStack.push(snapshot);
  return { mergedText: newText, undoStack: newStack, undoPointer: newStack.length - 1, ... };
}),
```

### BUG-V4.0-012：界面超出窗口

**现象**：窗口缩小时内容溢出。

**根因**：`min-w-[55%]` 强制中间面板至少 55% 宽度 + 两侧固定宽度。

**修复**（`App.tsx`）：中间 `min-w-[55%]` → `min-w-0`；两侧 `w-[280/260px]` → `w-[220px] lg:w-[280/260px]` 响应式。

---

## 修改文件清单（修订 3）

| 文件 | 行变更 | 说明 |
| :--- | :---: | :--- |
| `src/components/Minimap.tsx` | +10 / -5 | BUG-010：ResizeObserver 自适应行高 |
| `src/store/useStore.ts` | +25 / -25 | BUG-011：内联快照到单 set 回调 |
| `src/App.tsx` | +5 / -5 | BUG-012：响应式宽度适配 |


---

## 修订 5：Minimap 重构（按最新架构文档）

### BUG-V4.0-013：Minimap 等比例压缩重做 ✅

**背景**：向产品/架构师反馈后，`architecture-v4.0.0.md` 和 `api-spec-v4.0.0.md` 已更新 Minimap 设计：
- N ≈ 容器高度 / 3（每条约 3px）
- 等比例压缩全文，点击跳转 `scrollTop = 全文高度 × ratio`

**修改**：

| 文件 | 变更 | 说明 |
| :--- | :--- | :--- |
| `src/store/useStore.ts` | +30 / -10 | 新增 `minimapItemCount`/`minimapItems` 字段 + `updateMinimap()`/`scrollToRatio(ratio)` Actions；删除 `jumpToParagraph` |
| `src/components/Minimap.tsx` | 重写 | 移除 `visibleRange`/Tooltip；`ResizeObserver` 计算 `N = floor(h/3)`；`onItemClick(ratio)` ratio 接口 |
| `src/components/PreviewPanel.tsx` | +10 / -25 | 移除本地 minimap 状态/handlePreviewScroll；使用 store 的 `updateMinimap`/`scrollToRatio`/`minimapItems` |

**`updateMinimap` 算法**：
```
N = floor(containerHeight / 3)
linesPerChunk = ceil(totalLines / N)
items[i] = { color: 'green', tooltip: '行 start–end' }
```

**`scrollToRatio` 跳转**：
```
target = scrollHeight × clamp(ratio, 0, 1)
el.scrollTo({ top: target, behavior: 'smooth' })
```

---

## 修订 6：Minimap 连接点颜色 + DiffViewer 文件读取

### BUG-V4.0-017：Minimap 缺少悬停高亮 + 连接点颜色

**现象**：Minimap 全部为绿色，看不到连接点区域标记，无悬停高亮。

**根因**：`updateMinimap` 只创建 `color: 'green'` 项，未根据 `connectionPoints` 位置计算颜色。

**修复**：
- `useStore.ts` `updateMinimap` — 预计算每行字符偏移 `lineOffsets[]`，对每个 chunk 检查是否有 connectionPoint 落入，有则标记 `orange`
- `Minimap.tsx` — 新增 `COLOR_MAP` 映射 + `hoverIdx` 状态 + `onMouseEnter/Leave` 实现悬停放大效果（`ring-1 ring-blue-400 scale-y-[2]`）

### BUG-V4.0-018：DiffViewer 只显示"UTF-8"

**现象**：切换到文档对比模式，左右双栏为空，或只显示编码名称。

**根因**：`detectEncoding(filePath)` 返回编码名称（如"UTF-8"），DiffViewer 将其当作文件内容传给 `normalize()`，导致段落列表为空。

**修复**（4 文件）：
- `electron/main.ts` — 新增 `read-file-content` IPC handler（napi 探测编码 + Node fs 读取内容）
- `electron/preload.ts` — 暴露 `readFileContent`
- `electron/preload.d.ts` — 新增类型 `readFileContent(path): Promise<{content, encoding}>`
- `src/utils/ipc.ts` — 新增 `readFileContent(filePath)` 封装
- `DiffViewer.tsx` — `detectEncoding` → `readFileContent`，使用 `.content` 字段


---

## 修订 7：BUG-019～023 修复

### BUG-019：删除文件后预览不刷新

**修复**：`removeFile` 全部删除时清除 `mergedText`/`connectionPoints`/`connectionStates`；有剩余文件时设 `status: 'loading'` + `setTimeout(() => runMerge(), 0)` 触发重新分析。

### BUG-020：文件删除后芯片栏残留

**根因**：同 BUG-019，`removeFile` 未触发 re-merge。修复同上。

### BUG-021：搜索卡死

**修复**：`performSearch` 改用 `requestIdleCallback`（降级 `setTimeout(10)`）；结果上限 100→50；ctxLen 15→10。

### BUG-022：DiffViewer 重写

**问题**：左右栏分别独立滚动 + `overflow-y-auto`，行高不对齐。

**重写**：统一滚动容器 + 每行 `<div className="flex">` 同时渲染左右单元格（同 `diffAlignment` 索引保证对齐），左侧色条 `w-1`。

### BUG-023：DiffViewer 添加 Minimap

**新增**：右侧 18px 宽 DiffMinimap，N≈容器高/3，颜色对应底部图例（🟢匹配/🔴左独有/🔵右独有/🟣交错/🟡差异），点击跳转对应行。


---

## 修订 8：BUG-024～026 修复

### BUG-024：删除文件后预览/搜索未清空

**修复**（`useStore.ts` `removeFile`）：
- 删除任一文件时：`set({ searchKeyword: '', replaceText: '', searchResults: [], ... })` 清空搜索
- 全部删除时：同步清空搜索 + `activeMode: 'merge'`
- 修复 `minimizeItems` → `minimapItems` 拼写错误

### BUG-025：对比模式无法切回合并

**根因**：全部删除文件后 `shouldReset` 清空了 `mergedText` 但未重置 `activeMode`，导致停留在 compare 模式。

**修复**：`shouldReset` 返回中添加 `activeMode: 'merge'`；`resetSession` 添加 `minimapItems/minimapItemCount` 重置。

### BUG-026：DiffViewer 段落拆分错误

**根因**：重写的 DiffViewer 中 `normalize` 使用 `split('\n')`（单换行）拆分，将每个空行/行都当作独立段落，LCS 匹配粒度错误。

**修复**：`normalize` 改为 `split('\n\n')`（双换行 = 段落边界），段内 `\n` 替换为空格，恢复正确的段落级对比。

---

## 修订 4：BUG-V4.0-013～016

### BUG-V4.0-013：Minimap 无法显示全部行 【❌ 未修复】

**现象**：`ResizeObserver` 动态计算行高后仍无法显示全部行，Minimap 底部仍有空白或被截断。

**状态**：已记录，待进一步调查。ResizeObserver 在 flex 布局 + 动态内容环境下计算时机可能不准确。

### BUG-V4.0-014：替换后撤回仍然失效

**现象**：执行替换后 Ctrl+Z 无效，全部 3 轮修复均未解决。

**根因**：`undo()` 中 `if (state.undoPointer <= 0) return state;` —— 第一个快照在索引 0，`<= 0` 导致永远无法回退到第一个快照。

**修复**（`useStore.ts`）：`undoPointer <= 0` → `undoPointer < 0`。

```typescript
// 修复前（Bug）
undo: () => set((state) => {
  if (state.undoPointer <= 0) return state;  // 0 <= 0 → 拒绝撤回!
  ...
})

// 修复后
undo: () => set((state) => {
  if (state.undoPointer < 0) return state;   // 仅初始值 -1 时拒绝
  ...
})
```

### BUG-V4.0-015：导出文件 UTF-8-BOM → UTF-8

**现象**：导出文件开头有 `\uFEFF` BOM 标记，需求要求纯 UTF-8。

**修复**（`electron/main.ts`）：移除 `'\uFEFF' +` 前缀，直接写入 UTF-8。

### BUG-V4.0-016：搜索导致软件卡死

**现象**：输入搜索关键词后整个界面卡住不动。

**根因**：`performSearch` 是同步函数，正则全文搜索 + 每项 contextBefore/After 切片阻塞主线程。

**修复**（`useStore.ts`）：
- `performSearch` 改为 `setTimeout(..., 0)` 异步分片执行
- 搜索前检查关键词是否已变化（放弃过期搜索）
- 结果上限从 200 → 100
