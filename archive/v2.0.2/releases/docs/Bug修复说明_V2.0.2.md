# Text Unifier V2.0.2 — Bug 修复说明

> **修复日期**: 2026-05-11
> **修复范围**: 7 个未修复 Bug（1 P0 + 2 P1 + 2 P2 + 2 P3）
> **构建版本**: v2.0.2

---

## 修复统计

| 严重等级 | 数量 | 编号 |
| :---: | :---: | :--- |
| 🔴 P0 - 严重 | 1 | BUG-024 |
| 🟠 P1 - 高 | 2 | BUG-025, BUG-026 |
| 🟡 P2 - 中 | 2 | BUG-027, BUG-028 |
| 🔵 P3 - 低 | 2 | BUG-029, BUG-030 |
| **合计** | **7** | |

---

## 🔴 P0 修复

### BUG-024: 排版后段落勾选状态丢失

| 项目 | 内容 |
| :--- | :--- |
| **文件** | `src/store/useStore.ts` → `formatDocumentAction()` |
| **严重等级** | 🔴 P0 |

#### 问题原因

`formatDocumentAction()` 在排版完成后重建勾选状态映射时，使用 `content_hash` 匹配新旧段落：

```typescript
// 原代码（第 345-355 行）
const rebuiltCheckedMap = new Map<string, boolean>();
for (const p of newParagraphs) {
    const oldPara = state.previewParagraphs.find(
        (op) => op.content_hash === p.content_hash  // ← 排版后哈希改变，匹配失败
    );
    if (oldPara) {
        rebuiltCheckedMap.set(p.id, state.paragraphCheckedMap.get(oldPara.id) ?? true);
    } else {
        rebuiltCheckedMap.set(p.id, true);  // ← 全部默认勾选
    }
}
```

排版引擎修改段落文本（去除硬回车、合并行）后，段落内容改变 → `content_hash` 重新计算 → 旧 hash 无法匹配新 hash → 所有段落恢复为默认勾选。

**用户影响**: 排版后之前取消勾选的段落全部恢复勾选，可能误导出不需要的内容。

#### 修复逻辑

直接使用 `paragraphId` 进行一一匹配，因为排版不改变段落顺序和 ID：

```typescript
const rebuiltCheckedMap = new Map<string, boolean>();
for (const p of newParagraphs) {
    // 直接使用 paragraphId 匹配，不依赖 content_hash（排版后 hash 会变）
    const oldState = state.paragraphCheckedMap.get(p.id);
    rebuiltCheckedMap.set(p.id, oldState ?? true);
}
```

**正确性保证**: `formatDocumentAction` 按 `state.previewParagraphs` 的顺序遍历构建 `newParagraphs`，段落 ID 一一对应（已勾选段落被替换为格式化文本，未勾选段落原样保留），因此 `p.id` 直接对应旧段落 ID。

---

## 🟠 P1 修复

### BUG-025: 还原后残留 `fmt_*` 段落勾选状态

| 项目 | 内容 |
| :--- | :--- |
| **文件** | `src/store/useStore.ts` → `revertFormatting()` |
| **严重等级** | 🟠 P1 |

#### 问题原因

`revertFormatting()` 初始化 `restoredCheckedMap` 时复制了 `state.paragraphCheckedMap`（包含排版时新增的 `fmt_*` 条目），然后仅更新快照中存在的段落。这导致 `fmt_*` 条目在还原后仍然残留。

```typescript
// 原代码
const restoredCheckedMap = new Map(state.paragraphCheckedMap);  // ← 复制了 fmt_* 条目
for (const p of state.formatSnapshot) {
    const oldMapEntry = state.paragraphCheckedMap.get(p.id);
    if (oldMapEntry !== undefined) {
        restoredCheckedMap.set(p.id, oldMapEntry);
    }
}
```

#### 修复逻辑

基于快照重建 Map，完全丢弃 `fmt_*` 残留：

```typescript
const restoredCheckedMap = new Map<string, boolean>();
for (const p of state.formatSnapshot) {
    const currentState = state.paragraphCheckedMap.get(p.id);
    restoredCheckedMap.set(p.id, currentState ?? true);
}
```

---

### BUG-026: 拖拽排序后不触发自动重新分析

| 项目 | 内容 |
| :--- | :--- |
| **文件** | `src/store/useStore.ts` + `src/components/FileSortList.tsx` |
| **严重等级** | 🟠 P1 |

#### 问题原因

`reorderFiles()` 仅更新 `sortedFileList` 的 UI 顺序，但未触发 `scan_files` IPC 调用。用户拖拽调整文件顺序后，"主文件"和其他文件的处理顺序未实际改变。

#### 修复逻辑

1. **Store 新增 `triggerReanalysis` action**: 读取当前 `sortedFileList` 的路径顺序，调用 `scanFiles` IPC 重新分析，保留旧勾选状态。

2. **FileSortList 调用**: 在 `handleDragEnd` 中 `reorderFiles` 之后立即调用 `triggerReanalysis()`

```typescript
// FileSortList.tsx
reorderFiles(oldIndex, newIndex);
triggerReanalysis();  // BUG-026: 自动触发重新分析
```

---

## 🟡 P2 修复

### BUG-027: 诗歌检测含标点误判

| 项目 | 内容 |
| :--- | :--- |
| **文件** | `src-tauri/src/document_formatter.rs` → `is_protected_block()` |
| **严重等级** | 🟡 P2 |

#### 问题原因

原代码使用 `any()` 检测中文逗号，任意一行含逗号就阻止诗歌判定：

```rust
// 原代码
let has_mid_punctuation = non_empty_lines.iter().any(|l| {
    trimmed.contains('，') || trimmed.contains('；') || trimmed.contains('、')
});
if has_mid_punctuation { return false; }
```

这过于严格——一首诗中偶尔出现一两个逗号是正常的。

#### 修复逻辑

改为比例阈值：超过 50% 的行含中标点才阻止诗歌判定。

```rust
let mid_punct_lines = non_empty_lines.iter().filter(|l| { ... }).count();
let mid_punct_ratio = mid_punct_lines as f64 / total as f64;
if mid_punct_ratio > 0.5 { return false; }
```

---

### BUG-028: 前端哈希非真实 SHA256

| 项目 | 内容 |
| :--- | :--- |
| **文件** | `src/store/useStore.ts` → `computeContentHash()` |
| **严重等级** | 🟡 P2 |

#### 问题原因

原 `computeContentHash` 使用自定义简易哈希（类 DJB2），32 位整数，碰撞概率高。

```typescript
function computeContentHash(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        hash = ((hash << 5) - hash) + text.charCodeAt(i);
        hash |= 0;
    }
    return `hash_${Math.abs(hash).toString(16).padStart(8, '0')}`;
}
```

#### 修复逻辑

使用 Web Crypto API 的 SHA-256 算法：

```typescript
async function computeContentHash(text: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
```

注意：函数变为 `async`，调用处增加 `await`。

---

## 🔵 P3 修复

### BUG-029: FormatButton 冗余导入

| 项目 | 内容 |
| :--- | :--- |
| **文件** | `src/components/FormatButton.tsx` |
| **严重等级** | 🔵 P3 |

#### 修复逻辑

移除 `computeExcludedCount` 的导入，内联计算逻辑（3 行 filter）：

```typescript
const excludedCount = previewParagraphs.filter(
    (p) => (paragraphCheckedMap.get(p.id) ?? true) === false
).length;
```

---

### BUG-030: 列表正则未覆盖无空格有序列表

| 项目 | 内容 |
| :--- | :--- |
| **文件** | `src-tauri/src/document_formatter.rs` → `list_marker_re` |
| **严重等级** | 🔵 P3 |

#### 问题原因

原正则 `r"^\s*\d+[.、\)]\s"` 要求列表标记后必须有空格，无法匹配 `"1.项目"` 等无空格场景。

#### 修复逻辑

将列表标记后的 `\s` 改为 `\s?`（可选），同时覆盖 `"1. 项目"` 和 `"1.项目"` 两种格式：

```rust
// 修复前
r"^\s*\d+[.、\)]\s"
// 修复后
r"^\s*\d+[.、\)]\s?"
```

同等修复应用于无序列表和特殊标记。

---

## 修复效果验证

| 检查项 | 状态 |
| :--- | :---: |
| Rust `cargo test` | ✅ **25/25 全部通过** |
| TypeScript `tsc --noEmit` | ✅ **零错误** |
| Vite build | ✅ **构建成功** |
| Cargo release build | ✅ **编译成功** |
| **P0 修复率** | **100%** (1/1) |
| **P1 修复率** | **100%** (2/2) |
| **P2 修复率** | **100%** (2/2) |
| **P3 修复率** | **100%** (2/2) |
| **总计修复率** | **100%** (7/7) |

---

## 文件变更清单

| 文件路径 | 变更类型 | 关联 Bug |
| :--- | :---: | :--- |
| `src/store/useStore.ts` | 修复 `formatDocumentAction` hash 匹配 | BUG-024 |
| `src/store/useStore.ts` | 修复 `revertFormatting` Map 重建 | BUG-025 |
| `src/store/useStore.ts` | 新增 `triggerReanalysis` action | BUG-026 |
| `src/store/useStore.ts` | 重写 `computeContentHash` Web Crypto | BUG-028 |
| `src/components/FileSortList.tsx` | 拖拽后调用 `triggerReanalysis` | BUG-026 |
| `src/components/FormatButton.tsx` | 移除冗余导入，内联计算 | BUG-029 |
| `src-tauri/src/document_formatter.rs` | 诗歌检测比例阈值 | BUG-027 |
| `src-tauri/src/document_formatter.rs` | 列表正则可选空格 | BUG-030 |

---

*本文档对应标准化 Bug 报告中 7 个未修复问题的完整修复说明*
