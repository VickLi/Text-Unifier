# Text Unifier V2.0 标准化 Bug 报告

| 项目 | 内容 |
| :--- | :--- |
| **应用名称** | 文档终版确定器（Text Unifier） |
| **版本号** | V2.0 |
| **测试日期** | 2026-05-09 |
| **测试环境** | Windows 11 / Tauri 2.x / WebView2 / React 18 |

---

## Bug 统计概览

| 严重等级 | 数量 | 编号 |
| :--- | :---: | :--- |
| 🔴 **P0 - 严重** | 1 | BUG-024 |
| 🟠 **P1 - 高** | 2 | BUG-023, BUG-025 |
| 🟡 **P2 - 中** | 2 | BUG-026, BUG-027 |
| 🔵 **P3 - 低** | 2 | BUG-028, BUG-029 |
| **合计** | **7** | |

---

## Bug 详情

---

### BUG-024：[严重] `formatDocumentAction` 排版后段落勾选状态丢失

| 字段 | 内容 |
| :--- | :--- |
| **Bug ID** | BUG-024 |
| **严重等级** | 🔴 P0 - 严重（数据丢失） |
| **功能模块** | RQ-03 文档排版 → 勾选状态联动 |
| **发现阶段** | 代码审查 |
| **关联用例** | FUNC-03-12, FUNC-02-03 |

#### 环境信息
```
OS:            Windows 11 23H2
Tauri:         2.x
React:         18.3.1
Zustand:       4.5.0
源文件:        src/store/useStore.ts → formatDocumentAction()
行号:          约 310-350
```

#### 错误现象
执行「文档排版」后，已勾选段落的勾选状态全部重置为「已勾选」默认值。如果用户此前**取消**了某些段落的勾选，排版后这些段落会恢复为勾选状态。

#### 复现步骤
1. 导入 2 个有重复内容的 .txt 文件
2. 分析完成后，在右侧预览区**取消勾选**段落 P2
3. 确认段落 P2 变为淡化状态（opacity: 0.3）
4. 点击「文档排版」
5. **观察结果**：段落 P2 恢复为正常显示（勾选状态丢失）

#### 根本原因分析

`formatDocumentAction` 在排版后重建 `paragraphCheckedMap` 时，使用 **`content_hash`** 匹配新旧段落：

```typescript
// src/store/useStore.ts - formatDocumentAction() 第 5 步
const rebuiltCheckedMap = new Map<string, boolean>();
for (const p of newParagraphs) {
    const oldPara = state.previewParagraphs.find(
        (op) => op.content_hash === p.content_hash  // ← BUG: 哈希已改变，匹配失败
    );
    if (oldPara) {
        rebuiltCheckedMap.set(p.id, state.paragraphCheckedMap.get(oldPara.id) ?? true);
    } else {
        rebuiltCheckedMap.set(p.id, true);  // ← 格式化后的段落全部默认勾选
    }
}
```

排版操作修改了段落文本（如合并行），因此 `content_hash` 发生了改变。新旧段落的 `content_hash` 不匹配，导致 `find()` 找不到对应旧段落，进入 `else` 分支，所有被格式化的段落勾选状态被重置为 `true`。

**正确做法**：使用 `paragraphId`（或段落索引）进行匹配，因为 `paragraphId` 在排版前后保持不变（见 `newParagraphs.push({ ...originalPara, text: newText, ... })` 保留原 ID）。

#### 修复建议

```typescript
// 修复：使用 paragraphId 而非 content_hash 匹配
const rebuiltCheckedMap = new Map<string, boolean>();
for (const p of newParagraphs) {
    // 直接使用 paragraphId 从旧的 paragraphCheckedMap 获取状态
    const oldState = state.paragraphCheckedMap.get(p.id);
    rebuiltCheckedMap.set(p.id, oldState ?? true);
}
```

---

### BUG-025：[高] `revertFormatting` 还原后残留 `fmt_*` 段落勾选状态

| 字段 | 内容 |
| :--- | :--- |
| **Bug ID** | BUG-025 |
| **严重等级** | 🟠 P1 - 高（状态不一致） |
| **功能模块** | RQ-03 文档排版 → 还原 |
| **发现阶段** | 代码审查 |
| **关联用例** | FUNC-03-10 |

#### 环境信息
```
源文件:  src/store/useStore.ts → revertFormatting()
行号:    约 380-395
```

#### 错误现象
排版后若新增了段落（`fmt_*` ID 的段落），点击「还原」后，`paragraphCheckedMap` 中仍残留这些 `fmt_*` 段落的勾选状态条目，导致 Map 中存在无效键。

#### 复现步骤
1. 准备一个文本，排版后段落数会增加（如含缩进分段的大段文本）
2. 执行排版 → 部分段落拆分为多段（生成 `fmt_0`, `fmt_1` 等 ID）
3. 立即点击「还原」
4. **内部状态**：`paragraphCheckedMap` 中仍存在 `fmt_0`, `fmt_1` 等键，但 `previewParagraphs` 中已无对应段落

#### 根本原因分析

```typescript
revertFormatting: () =>
    set((state) => {
      if (!state.formatSnapshot) return state;
      const restoredCheckedMap = new Map(state.paragraphCheckedMap);  // ← 复制了 fmt_* 条目
      for (const p of state.formatSnapshot) {
        const oldMapEntry = state.paragraphCheckedMap.get(p.id);
        if (oldMapEntry !== undefined) {
          restoredCheckedMap.set(p.id, oldMapEntry);
        }
      }
      return {
        previewParagraphs: state.formatSnapshot,  // ← 不包含 fmt_* 段落
        paragraphCheckedMap: restoredCheckedMap,   // ← 仍包含 fmt_* 的无效条目
        ...
      };
    }),
```

#### 修复建议

```typescript
revertFormatting: () =>
    set((state) => {
      if (!state.formatSnapshot) return state;
      // 修复：基于快照段落重建 checkedMap
      const restoredCheckedMap = new Map<string, boolean>();
      for (const p of state.formatSnapshot) {
        const oldState = state.paragraphCheckedMap.get(p.id);
        restoredCheckedMap.set(p.id, oldState ?? true);
      }
      return {
        previewParagraphs: state.formatSnapshot,
        formatSnapshot: null,
        canRevert: false,
        paragraphCheckedMap: restoredCheckedMap,
      };
    }),
```

---

### BUG-026：[高] 拖拽排序后不触发自动重新分析

| 字段 | 内容 |
| :--- | :--- |
| **Bug ID** | BUG-025 (已存在于自审报告) |
| **严重等级** | 🟠 P1 - 高（功能不完整） |
| **功能模块** | RQ-01 文件拖拽排序 |
| **发现阶段** | 代码审查 |
| **关联用例** | FUNC-01-05, AC-01-04 |

#### 环境信息
```
源文件:  src/store/useStore.ts → reorderFiles()
         src/App.tsx
行号:    约 160-170 (useStore) + 约 60-90 (App.tsx)
```

#### 错误现象
拖拽交换文件顺序后，主文件标记更新，但**不会自动触发重新合并分析**。用户需要手动重新拖入文件或刷新才能看到排序生效后的去重结果。

#### 复现步骤
1. 添加文件 F1（含 "A,B"）和 F2（含 "A,C"），初始顺序 [F1, F2]
2. 观察预览：以 F1 为主文件
3. 拖拽交换 F2 到第一位置
4. **预期**：自动重新分析，预览以 F2 为主文件
5. **实际**：预览不变，仍以 F1 为主文件

#### 根本原因分析

`reorderFiles()` 仅更新 `sortedFileList` 的 UI 顺序：

```typescript
reorderFiles: (fromIndex, toIndex) =>
    set((state) => {
      const newList = [...state.sortedFileList];
      const [moved] = newList.splice(fromIndex, 1);
      newList.splice(toIndex, 0, moved);
      return { sortedFileList: newList };  // ← 仅排序，不触发 scan_files
    }),
```

`App.tsx` 中的 `handleDragEnd` 未监听排序变化并重新调用 `scanFiles`。

#### 修复建议

在 `App.tsx` 中添加拖拽后的自动重新分析逻辑：

```typescript
// 在 FileSortList 组件中添加 onReorderComplete 回调
// 或在 useStore 中添加排序后副作用监听
// 使 reorderFiles 完成时自动调用 scanFiles 并传递新的排序顺序
```

---

### BUG-027：[中] `DocumentFormatter` 诗歌检测未处理全角句号诗歌

| 字段 | 内容 |
| :--- | :--- |
| **Bug ID** | BUG-027 |
| **严重等级** | 🟡 P2 - 中（有限误判） |
| **功能模块** | RQ-03 文档排版 → 诗歌保护 |
| **发现阶段** | 代码审查 |
| **关联用例** | FUNC-03-09 |

#### 环境信息
```
源文件:  src-tauri/src/document_formatter.rs → is_protected_block()
行号:    约 180-220
```

#### 错误现象
现代诗或含有全角标点（逗号、分号）的短文本被错误合并，未受到诗歌保护。

#### 复现步骤
1. 输入以下文本：
   ```
   这是一个短行，
   每行都很短，
   但又含逗号，
   所以被合并。
   ```
2. 执行排版
3. **预期**：诗歌换行保留
4. **实际**：被合并为一行（因含中文逗号触发 `has_mid_punctuation` 取消判定）

#### 根本原因分析

```rust
// is_protected_block() 中诗歌检测规则：
// 条件 3：包含中文逗号/分号等中标点 → 取消诗歌判定
let has_mid_punctuation = non_empty_lines.iter().any(|l| {
    let trimmed = l.trim();
    trimmed.contains('，') || trimmed.contains('；') || trimmed.contains('、')
});
if has_mid_punctuation {
    return false;  // ← 太严格，忽略了含标点的诗歌
}
```

当前规则过于严格：**任何一行**包含中文逗号就直接判定为非诗歌。但许多现代诗/歌词会使用中文标点。

#### 修复建议

将规则改为基于比例而非 `any()`：

```rust
// 更合理的阈值：超过 50% 的行含中文逗号才取消诗歌判定
let mid_punct_lines = non_empty_lines
    .iter()
    .filter(|l| {
        let trimmed = l.trim();
        trimmed.contains('，') || trimmed.contains('；') || trimmed.contains('、')
    })
    .count();
let mid_punct_ratio = mid_punct_lines as f64 / total as f64;
if mid_punct_ratio > 0.5 {
    return false;
}
```

---

### BUG-028：[中] `computeContentHash` 前端哈希非真实 SHA256

| 字段 | 内容 |
| :--- | :--- |
| **Bug ID** | BUG-028 |
| **严重等级** | 🟡 P2 - 中（哈希碰撞风险） |
| **功能模块** | RQ-03 文档排版 → 哈希匹配 |
| **发现阶段** | 代码审查 |
| **关联用例** | FUNC-03-10, FUNC-01-06 |

#### 环境信息
```
源文件:  src/store/useStore.ts → computeContentHash()
行号:    约 18-24
```

#### 错误现象
前端 `computeContentHash()` 使用简易 JavaScript 整数哈希（djb2 风格），而非 Rust 后端的 SHA256。前端生成的 hash 格式为 `hash_xxxxxxxx`（8 位十六进制），后端为 64 位十六进制 SHA256。两种哈希不可互用。

#### 代码定位

```typescript
/** 计算文本的 content_hash（简易 SHA256 模拟，实际应由后端计算） */
function computeContentHash(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return `hash_${Math.abs(hash).toString(16).padStart(8, '0')}`;
}
```

#### 根本原因分析

在 `formatDocumentAction` 排版后重建段落时，新段落的 `content_hash` 由前端 JS 计算（简易哈希），旧段落的 `content_hash` 由后端 Rust SHA256 计算。两者格式不同：
- 前端哈希格式：`hash_a1b2c3d4`
- 后端哈希格式：`e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6`

虽然当前 `content_hash` 仅用于前端内部分组匹配，但：
1. 排版后重建的 `previewParagraphs` 混合了两种哈希格式
2. 导出时如有重复组检查，可能因哈希不匹配而遗漏
3. 与后端 `DuplicateGroup.content_hash` 无法交叉引用

#### 修复建议

**方案 A**（推荐）：排版后直接调用后端重新计算哈希
```typescript
// 调用新增的 compute_hash 后端接口
const newHash = await computeHash(newText);
```

**方案 B**（快速修复）：规范前端哈希格式
```typescript
function computeContentHash(text: string): string {
    // 使用 SHA-256 的浏览器原生实现
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    return crypto.subtle.digest('SHA-256', data)
        .then(buf => Array.from(new Uint8Array(buf))
            .map(b => b.toString(16).padStart(2, '0'))
            .join(''));
}
```

---

### BUG-029：[低] `FormatButton` 的 `computeExcludedCount` 冗余导入

| 字段 | 内容 |
| :--- | :--- |
| **Bug ID** | BUG-029 |
| **严重等级** | 🔵 P3 - 低（代码质量） |
| **功能模块** | RQ-03 → FormatButton |
| **发现阶段** | 代码审查 |
| **关联用例** | 无 |

#### 环境信息
```
源文件:  src/components/FormatButton.tsx
行号:    约 1-50
```

#### 错误现象
`FormatButton` 组件导入了 `computeExcludedCount` 并调用，但该值从未在组件渲染中使用。

#### 代码定位

```typescript
import { computeExcludedCount } from '../store/useStore';  // 已导入

export const FormatButton: React.FC = () => {
  // ...
  const excludedCount = computeExcludedCount(previewParagraphs, paragraphCheckedMap);
  // 该变量仅在以下条件渲染中使用：
  {excludedCount > 0 && (
    <span className="text-xs text-gray-400 ml-1">
      已排除 {excludedCount} 段
    </span>
  )}
```

这不是真正的功能 Bug，但存在优化空间：`PreviewPanel` 中也有相同的已排除计数逻辑，两者可能显示不一致（因 selector 更新时机不同）。

---

### BUG-030：[低] `list_marker_re` 正则未覆盖有序列表中文数字

| 字段 | 内容 |
| :--- | :--- |
| **Bug ID** | BUG-030 |
| **严重等级** | 🔵 P3 - 低（有限影响） |
| **功能模块** | RQ-03 文档排版 → 列表保护 |
| **发现阶段** | 代码审查 |
| **关联用例** | FUNC-03-08 |

#### 环境信息
```
源文件:  src-tauri/src/document_formatter.rs → DocumentFormatter::new()
行号:    约 53-56
```

#### 代码定位

```rust
list_marker_re: Regex::new(
    r"^(\s*[-*•·]\s|^\s*\d+[.、\)]\s|^\s*[①⑴㈠㊀]\s)"
).unwrap(),
```

#### 错误现象
正则中 `\s*\d+[.、\)]\s` 匹配有序列表如 "1. "、"2) "、"3、"，但要求数字后必须跟一个空格（`\s`）。如果有序列表行后面紧跟文本如 "1.项目一"（无空格），则无法匹配。

#### 修复建议

```rust
list_marker_re: Regex::new(
    r"^(\s*[-*•·]\s|^\s*\d+[.、\)]\s?|^\s*[①⑴㈠㊀]\s)"
).unwrap(),
// 在 \s 后加 ? 使其可选               ^^
```

---

## Bug 修复优先级建议

| 优先级 | Bug ID | 修复难度 | 影响范围 | 建议 |
| :--- | :--- | :---: | :--- | :--- |
| **P0** | BUG-024 | 🟢 低（修改 2 行） | 排版后全部勾选状态丢失 | **立即修复** |
| **P1** | BUG-025 | 🟢 低（修改 3 行） | 还原后状态残留 | **立即修复** |
| **P1** | BUG-026 | 🟡 中（新增逻辑） | 排序后不触发分析 | V2.0.1 修复 |
| **P2** | BUG-027 | 🟢 低（修改阈值） | 诗歌保护漏判 | V2.0.1 修复 |
| **P2** | BUG-028 | 🟡 中（新增依赖） | 哈希不匹配 | V2.0.1 修复 |
| **P3** | BUG-029 | 🟢 低（移除冗余） | 代码整洁 | 可暂缓 |
| **P3** | BUG-030 | 🟢 低（正则微调） | 列表保护漏判 | 可暂缓 |

---

## Bug 分布图

```text
BUG 分布按模块:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RQ-03 文档排版          ████████████   4  (BUG-024,025,027,030)
RQ-01 文件排序          ████           1  (BUG-026)
全局 - 哈希一致         ████           1  (BUG-028)
全局 - 代码质量         ████           1  (BUG-029)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
总计: 7
```
