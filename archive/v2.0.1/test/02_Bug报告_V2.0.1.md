# Text Unifier V2.0.1 标准化 Bug 报告（复测版）

| 项目 | 内容 |
| :--- | :--- |
| **应用名称** | 文档终版确定器（Text Unifier） |
| **版本号** | V2.0.1 |
| **测试日期** | 2026-05-09 |
| **测试环境** | Windows 11 / Tauri 2.x / WebView2 / React 18 |
| **测试类型** | 修复验证 + 代码审查 |

---

## Bug 统计概览

| 分类 | 数量 | 编号 |
| :--- | :---: | :--- |
| ✅ **已修复** | 5 | BUG-V2.0-001 ~ 005 |
| 🔴 **未修复 P0（严重）** | 1 | BUG-024 |
| 🟠 **未修复 P1（高）** | 2 | BUG-025, BUG-026 |
| 🟡 **未修复 P2（中）** | 2 | BUG-027, BUG-028 |
| 🔵 **未修复 P3（低）** | 2 | BUG-029, BUG-030 |
| 🔴 **新发现 P0（严重）** | 0 | — |
| **未修复总计** | **7** | |

---

## 第一部分：已修复 Bug（CLOSED）

---

### BUG-V2.0-001：[已修复] 文件移除后分析状态残留

| 字段 | 复测结果 |
| :--- | :--- |
| **状态** | ✅ **CLOSED — 已验证修复** |
| **修复文件** | `src/store/useStore.ts` → `removeFile()` |
| **修复内容** | 文件列表为空时同步清除 `duplicateGroups`、`originalPreview`、`previewParagraphs`、`paragraphCheckedMap`、`formatSnapshot`、`canRevert`，并将 `status` 重置为 `idle` |

#### 复测验证

```
操作: 导入 1 文件 → 分析完成 → 删除文件
结果: status → 'idle', previewParagraphs → [], paragraphCheckedMap → Map(0)
验证: ✅ 符合预期
```

---

### BUG-V2.0-002：[已修复] PreviewParagraph shiftKey 类型不安全

| 字段 | 复测结果 |
| :--- | :--- |
| **状态** | ✅ **CLOSED — 已验证修复** |
| **修复文件** | `src/components/PreviewParagraph.tsx` → `handleCheckboxChange()` |
| **修复内容** | 使用 `instanceof MouseEvent` 类型守卫安全读取 `shiftKey` |

#### 代码验证

```typescript
// 修复后代码
const nativeEvent = e.nativeEvent;
const isShiftKey = nativeEvent instanceof MouseEvent
  ? nativeEvent.shiftKey
  : false;
```

- 鼠标点击：`nativeEvent` 为 `MouseEvent` → 正确读取 `shiftKey`
- 键盘 Space：`nativeEvent` 为 `Event` → 返回 `false`，不报错

---

### BUG-V2.0-003：[已修复] `no_period_end_re` 变量名语义反直觉

| 字段 | 复测结果 |
| :--- | :--- |
| **状态** | ✅ **CLOSED — 已验证修复** |
| **修复文件** | `src-tauri/src/document_formatter.rs` |
| **修复内容** | 删除 `no_period_end_re`，统一使用 `sentence_end_re`；更新诗歌检测注释 |

#### 代码差异验证

```diff
- no_period_end_re: Regex::new(r"[。！？」）〗》]$").unwrap(),
  // 统一使用 sentence_end_re（与句尾分段共用）
```

```diff
- !self.no_period_end_re.is_match(trimmed)
+ !self.sentence_end_re.is_match(trimmed)
  // 语义：统计"不以句尾标点结尾"的行
```

---

### BUG-V2.0-004：[已修复] DocumentFormatter 缺少 Tab 字符测试

| 字段 | 复测结果 |
| :--- | :--- |
| **状态** | ✅ **CLOSED — 已验证修复** |
| **修复文件** | `src-tauri/src/document_formatter.rs` → `#[cfg(test)]` |
| **修复内容** | 新增 `test_tab_character_handling()` 和 `test_mixed_tab_and_space()` |

#### 单元测试结果

```
cargo test
  test document_formatter::tests::test_empty_text ... ok
  test document_formatter::tests::test_tab_character_handling ... ok       ← 🆕
  test document_formatter::tests::test_mixed_tab_and_space ... ok         ← 🆕
  ... (全部 25 项通过)
```

---

### BUG-V2.0-005：[已修复] 空段落导出无提示

| 字段 | 复测结果 |
| :--- | :--- |
| **状态** | ✅ **CLOSED — 已验证修复** |
| **修复文件** | `src-tauri/src/lib.rs` → `export_text` |
| **修复内容** | 增加空段落检测，返回明确错误信息 |

#### 代码验证

```rust
// 修复后代码
if paragraphs.is_empty() || paragraphs.iter().all(|p| p.trim().is_empty()) {
    return Err("导出失败: 没有可导出的内容（所有段落已被排除）".to_string());
}
```

#### 防御性编程层级

```
┌─ 前端 ExportButton (UI 层)
│  canExport = hasExportableContent → 按钮禁用
│
├─ Store computeExportParagraphs (逻辑层)
│  过滤 isChecked = false 的段落
│
├─ Rust export_text (后端)
│  空数组检查 → 返回错误提示
│  ← 本次修复加固
```

---

## 第二部分：未修复 Bug（OPEN）

---

### BUG-024：[未修复] 排版后段落勾选状态丢失 ⚠️ P0

| 字段 | 内容 |
| :--- | :--- |
| **状态** | 🔴 **OPEN — 未被本次修复覆盖** |
| **严重等级** | P0 - 严重 |
| **文件** | `src/store/useStore.ts` → `formatDocumentAction()` |
| **行号** | 约 345-355 |
| **根因** | `rebuiltCheckedMap` 使用 `content_hash` 匹配而非 `paragraphId` |

#### 代码现状（未修改）

```typescript
// 第 345-355 行 — 仍未修复
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

#### 修复建议（同初测报告）

```typescript
// 使用 paragraphId 直接匹配
const rebuiltCheckedMap = new Map<string, boolean>();
for (const p of newParagraphs) {
    const oldState = state.paragraphCheckedMap.get(p.id);
    rebuiltCheckedMap.set(p.id, oldState ?? true);
}
```

---

### BUG-025：[未修复] 还原后残留 `fmt_*` 段落勾选状态 ⚠️ P1

| 字段 | 内容 |
| :--- | :--- |
| **状态** | 🟠 **OPEN — 未被本次修复覆盖** |
| **严重等级** | P1 - 高 |
| **文件** | `src/store/useStore.ts` → `revertFormatting()` |
| **行号** | 约 370-385 |

#### 代码现状（未修改）

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
      ...
    }),
```

---

### BUG-026：[未修复] 拖拽排序后不触发自动重新分析 ⚠️ P1

| 字段 | 内容 |
| :--- | :--- |
| **状态** | 🟠 **OPEN — 未被本次修复覆盖** |
| **严重等级** | P1 - 高 |
| **文件** | `src/store/useStore.ts` → `reorderFiles()` / `App.tsx` |

---

### BUG-027：[未修复] 诗歌检测含标点误判 ⚠️ P2

| 字段 | 内容 |
| :--- | :--- |
| **状态** | 🟡 **OPEN — 未被本次修复覆盖** |
| **严重等级** | P2 - 中 |
| **文件** | `src-tauri/src/document_formatter.rs` → `is_protected_block()` |

---

### BUG-028：[未修复] 前端哈希非真实 SHA256 ⚠️ P2

| 字段 | 内容 |
| :--- | :--- |
| **状态** | 🟡 **OPEN — 未被本次修复覆盖** |
| **严重等级** | P2 - 中 |
| **文件** | `src/store/useStore.ts` → `computeContentHash()` |

---

### BUG-029：[未修复] FormatButton 冗余导入 ⚠️ P3

| 字段 | 内容 |
| :--- | :--- |
| **状态** | 🔵 **OPEN — 未被本次修复覆盖** |
| **严重等级** | P3 - 低 |
| **文件** | `src/components/FormatButton.tsx` |

---

### BUG-030：[未修复] 列表正则未覆盖无空格有序列表 ⚠️ P3

| 字段 | 内容 |
| :--- | :--- |
| **状态** | 🔵 **OPEN — 未被本次修复覆盖** |
| **严重等级** | P3 - 低 |
| **文件** | `src-tauri/src/document_formatter.rs` → `list_marker_re` |

---

## 第三部分：全局 Bug 状态总览

### Bug 状态分布图

```text
V2.0.1 Bug 状态总览
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
已修复 (5)     ██████████████████████████████  42%
未修复 P0 (1)  ██████                          8%
未修复 P1 (2)  █████████████                  17%
未修复 P2 (2)  █████████████                  17%
未修复 P3 (2)  █████████████                  17%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
总计: 12 (5 CLOSED + 7 OPEN)
```

### Bug 按文件分布

| 文件 | 已修复 | 未修复 | 状态 |
| :--- | :---: | :---: | :--- |
| `src/store/useStore.ts` | 1 (BUG-001) | 3 (BUG-024,025,028) | ⚠️ 仍有 3 个未修复 |
| `src-tauri/src/document_formatter.rs` | 2 (BUG-003,004) | 2 (BUG-027,030) | ⚠️ 仍有 2 个未修复 |
| `src/components/PreviewParagraph.tsx` | 1 (BUG-002) | 0 | ✅ 全部修复 |
| `src-tauri/src/lib.rs` | 1 (BUG-005) | 0 | ✅ 全部修复 |
| `src/App.tsx` | 0 | 1 (BUG-026) | ❌ 未修复 |
| `src/components/FormatButton.tsx` | 0 | 1 (BUG-029) | ❌ 未修复 |

### 修复判定

> **结论**: V2.0.1 修复了 5 个代码质量 / 边界处理 Bug，但 **7 个 V2.0 初测发现的 Bug 全部未修复**，**包括 1 个 P0 严重 Bug**（BUG-024）。当前版本 **不建议发布**。
