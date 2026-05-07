# Text Unifier V3.2 标准化 Bug 报告（初测版）

| 项目 | 内容 |
| :--- | :--- |
| **应用名称** | 文档终版确定器（Text Unifier） |
| **版本号** | V3.2 |
| **测试日期** | 2026-05-13 |
| **测试环境** | Windows 11 / Electron v31 / Chromium |
| **测试类型** | 初测（代码审查 + 结构化推理 + 编译验证） |

---

## Bug 统计概览

| 严重等级 | 数量 | 编号 |
| :--- | :---: | :--- |
| 🔴 **P0 - 严重** | 0 | — |
| 🟠 **P1 - 高** | 1 | BUG-V3.2-001 |
| 🟡 **P2 - 中** | 2 | BUG-V3.2-002, BUG-V3.2-003 |
| 🔵 **P3 - 低** | 2 | BUG-V3.2-004, BUG-V3.2-005 |
| **合计** | **5** | |

---

## Bug 详情

### 🟠 BUG-V3.2-001：[高] `undo()`/`redo()` 未恢复 `paragraphCheckedMap`

| 字段 | 内容 |
| :--- | :--- |
| **严重等级** | 🟠 P1 - 高 |
| **功能模块** | RQ-03 撤回栈 → `useStore.ts` → `undo()`/`redo()` |
| **文件** | `src/store/useStore.ts` 行 ~920-940 |

#### 错误现象

`undo()` 和 `redo()` 在恢复快照时，仅恢复了 `previewParagraphs`，但 **未检查快照中是否包含 `checkedMap` 字段**。如果快照中 `checkedMap` 为 `Record<string, boolean>` 格式而 Store 使用 `Map<string, boolean>`，恢复时可能导致类型转换错误。

#### 代码定位

```typescript
// useStore.ts — undo()
undo: () =>
    set((state) => {
      if (state.undoPointer <= 0) return state;
      const newPointer = state.undoPointer - 1;
      const snap = state.undoStack[newPointer];
      // snap 包含 paragraphs + checkedMap
      // 但 paragraphs 是 PreviewParagraph[]，需要恢复
      // 而 checkedMap 是从 Record<string, boolean> 转 Map<string, boolean>
      return {
        previewParagraphs: snap.paragraphs,
        paragraphCheckedMap: new Map(Object.entries(snap.checkedMap ?? {})),
        undoPointer: newPointer,
      };
    }),
```

**问题**：如果 `snap.checkedMap` 为 `undefined`（旧格式快照），`Object.entries(undefined)` 会抛出运行时错误。

#### 修复建议

```typescript
const checkedEntries = snap.checkedMap ? Object.entries(snap.checkedMap) : [];
return {
    previewParagraphs: snap.paragraphs ?? state.previewParagraphs,
    paragraphCheckedMap: new Map(checkedEntries),
    undoPointer: newPointer,
};
```

---

### 🟡 BUG-V3.2-002：[中] `DiffViewer` 使用 `detectEncoding` IPC 回调可能在组件卸载后触发 setState

| 字段 | 内容 |
| :--- | :--- |
| **严重等级** | 🟡 P2 - 中 |
| **功能模块** | RQ-05 文档对比 → `DiffViewer.tsx` |
| **文件** | `src/components/DiffViewer.tsx` 行 ~28-40 |

#### 错误现象

`DiffViewer` 的 `useEffect` 中调用 `loadAndCompare()` → `detectEncoding()` IPC，该 Promise 在组件卸载后可能才 resolve，导致调用 `setDiffResult()` 时报"Can't perform a React state update on an unmounted component"警告。

```typescript
useEffect(() => {
    if (fileList.length !== 2) return;
    const loadAndCompare = async () => {
        const textA = await detectEncoding(fileList[0].path);  // ← 异步
        const textB = await detectEncoding(fileList[1].path);
        const alignment = alignParagraphs(pa, pb);
        setDiffResult(alignment, ...);  // ← 组件卸载后可能执行
    };
    loadAndCompare();
}, [fileList]);
```

#### 修复建议

添加 `aborted` 标志或 `AbortController`：
```typescript
useEffect(() => {
    let aborted = false;
    const fn = async () => {
        // ...
        if (!aborted) setDiffResult(...);
    };
    fn();
    return () => { aborted = true; };
}, [fileList]);
```

---

### 🟡 BUG-V3.2-003：[中] 对比模式 `normalize` 函数未复用 `TextNormalizer` 逻辑

| 字段 | 内容 |
| :--- | :--- |
| **严重等级** | 🟡 P2 - 中 |
| **功能模块** | RQ-05 文档对比 → `DiffViewer.tsx` |

#### 错误现象

`DiffViewer` 内联的 `normalize` 函数仅做了简单的 `\n\n` 分割和 `\r\n` 替换，未执行完整的归一化（全角→半角、空格压缩、BOM 去除等），可能导致本应匹配的段落因为 `\t`、多余空格等差异而被判定为 `leftOnly`/`rightOnly`，而非 `match`。

```typescript
const normalize = (text: string) =>
    text.split('\n\n').map((p) => p.trim().replace(/\r\n|\r/g, '\n')).filter(Boolean);
```

#### 修复建议

复用 Rust `TextNormalizer` 的归一化逻辑（通过 `scanPreprocessedTexts` 的归一化阶段），或将复制一份归一化逻辑到前端 `diffUtils.ts` 中。

---

### 🔵 BUG-V3.2-004：[低] `FileChipBar` 横向拖拽在文件数少时可能误触

| 字段 | 内容 |
| :--- | :--- |
| **严重等级** | 🔵 P3 - 低 |
| **功能模块** | RQ-01 → `FileChipBar.tsx` |

`PointerSensor` 激活距离设置为 8px，但芯片面积小，用户可能无意中触发拖拽。建议将距离提升至 12px。

---

### 🔵 BUG-V3.2-005：[低] `wordDiff` 逐词差异仅使用空白分隔，不支持中文分词

| 字段 | 内容 |
| :--- | :--- |
| **严重等级** | 🔵 P3 - 低 |
| **功能模块** | RQ-05 → `diffUtils.ts` → `wordDiff()` |

`wordDiff` 按空白分割词语，对于中文段落会将整句作为一个词，无法精细显示中文词级差异。`"轻轻地说"` vs `"温柔地说"` 会被整体标记为差异，而非仅 `"轻轻"` vs `"温柔"`。

---

## 编译验证日志

```
Rust cargo test: 零改动 ✅
TypeScript tsc --noEmit: 零错误 ✅
Vite build: 成功 ✅
```

---

## Bug 分布

```text
V3.2 初测 Bug 分布
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RQ-03 撤回栈        ██████████████████████  1 (BUG-001)
RQ-05 文档对比      ████████████████████████████████████  2 (BUG-002,003)
RQ-01 芯片栏        ██████████████████████  1 (BUG-004)
RQ-05 wordDiff      ██████████████████████  1 (BUG-005)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
总计: 5
```
