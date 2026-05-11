# Text Unifier V2.0.1 — Bug 修复说明

> **修复日期**: 2026-05-09
> **修复范围**: 5 个 V2.0 新增 Bug（1 Major + 4 Minor）
> **构建版本**: v2.0.1 (基于 v2.0.0 修复)

---

## 修复清单

| Bug ID | 严重等级 | 文件 | 类型 |
| :--- | :---: | :--- | :--- |
| BUG-V2.0-001 | 🟠 Major | `useStore.ts` | 文件移除后分析状态残留 |
| BUG-V2.0-002 | 🟡 Minor | `PreviewParagraph.tsx` | shiftKey 类型不安全 |
| BUG-V2.0-003 | 🟡 Minor | `document_formatter.rs` | 变量名语义反直觉 |
| BUG-V2.0-004 | 🟡 Minor | `document_formatter.rs` | 缺少 Tab 字符测试用例 |
| BUG-V2.0-005 | 🟡 Minor | `lib.rs` | 空段落导出无提示 |

---

## 🟠 Major 修复

---

### BUG-V2.0-001: 文件移除后分析状态残留

| 项目 | 内容 |
| :--- | :--- |
| **文件** | `src/store/useStore.ts` |
| **方法** | `removeFile()` |
| **严重等级** | 🟠 Major |

#### 问题原因

`removeFile()` action 仅从 `fileList` 和 `sortedFileList` 中移除文件条目，但不清除 `previewParagraphs`、`duplicateGroups`、`paragraphCheckedMap` 等分析结果。当用户通过 `FileSortList` 的删除按钮移除**最后一个文件**时，右侧预览面板仍然显示旧数据，底部状态栏仍然显示"分析完成"，与实际情况不一致。

**复现步骤：**
1. 导入文件 A.txt → 分析完成
2. 点击文件 A 的删除按钮 → 文件列表为空
3. 预期：状态回到 idle，预览区清空
4. 实际：预览区仍然显示文件 A 的分析结果

#### 修复逻辑

在 `removeFile()` 中新增逻辑：当文件列表变为空时（`newFileList.length === 0`），同步清除所有分析状态：

```typescript
removeFile: (path) =>
    set((state) => {
      const newFileList = state.fileList.filter((f) => f.path !== path);
      const newSortedList = state.sortedFileList.filter((f) => f.path !== path);
      const shouldReset = newFileList.length === 0;
      return {
        fileList: newFileList,
        sortedFileList: newSortedList,
        duplicateGroups: shouldReset ? [] : state.duplicateGroups,
        originalPreview: shouldReset ? [] : state.originalPreview,
        previewParagraphs: shouldReset ? [] : state.previewParagraphs,
        paragraphCheckedMap: shouldReset ? new Map() : state.paragraphCheckedMap,
        status: shouldReset ? 'idle' : state.status,
        formatSnapshot: shouldReset ? null : state.formatSnapshot,
        canRevert: shouldReset ? false : state.canRevert,
      };
    }),
```

**设计决策：** 仅当文件列表完全为空时才重置状态。如果有其他文件剩余，保留分析结果（用户可能只是想替换一个文件）。

---

## 🟡 Minor 修复

---

### BUG-V2.0-002: PreviewParagraph shiftKey 类型不安全

| 项目 | 内容 |
| :--- | :--- |
| **文件** | `src/components/PreviewParagraph.tsx` |
| **方法** | `handleCheckboxChange` |
| **严重等级** | 🟡 Minor |

#### 问题原因

```typescript
// 原代码
const handleCheckboxChange = useCallback(
  (e: React.ChangeEvent<HTMLInputElement>) => {
    onCheckToggle(paragraph.id, (e.nativeEvent as MouseEvent).shiftKey);
  },
  [paragraph.id, onCheckToggle]
);
```

`onChange` 事件的 `nativeEvent` 类型取决于触发方式：
- 鼠标点击 → `MouseEvent`，有 `shiftKey` 属性
- 键盘 Space 键 → `Event`，无 `shiftKey` 属性

直接断言为 `MouseEvent` 并读取 `shiftKey` 在键盘触发时返回 `undefined`（被转为 falsy），虽不影响功能但属于类型安全的违规。

#### 修复逻辑

使用 `instanceof` 类型守卫安全访问：

```typescript
const nativeEvent = e.nativeEvent;
const isShiftKey = nativeEvent instanceof MouseEvent
  ? nativeEvent.shiftKey
  : false;
```

---

### BUG-V2.0-003: `no_period_end_re` 变量名语义反直觉

| 项目 | 内容 |
| :--- | :--- |
| **文件** | `src-tauri/src/document_formatter.rs` |
| **结构体字段** | `no_period_end_re` |
| **严重等级** | 🟡 Minor（代码可读性） |

#### 问题原因

```rust
// 原代码
no_period_end_re: Regex::new(r"[。！？」）〗》]$").unwrap(),
```

该 regex 匹配的是"以句尾标点结尾的行"（即 `has_period_end`），但变量名却是 `no_period_end_re`（"无句尾标点"），语义完全相反。虽然在使用时通过 `!self.no_period_end_re.is_match()` 取反得到正确结果，但对代码维护者造成严重困惑。

此外，该 regex 与 `sentence_end_re` 的 regex 完全相同（`r"[。！？」）〗》]$"`），造成重复编译。

#### 修复逻辑

1. 删除 `no_period_end_re` 字段
2. 所有使用 `self.no_period_end_re` 的地方替换为 `self.sentence_end_re`
3. 更新相关注释使逻辑清晰

---

### BUG-V2.0-004: DocumentFormatter 缺少 Tab 字符测试

| 项目 | 内容 |
| :--- | :--- |
| **文件** | `src-tauri/src/document_formatter.rs` |
| **模块** | `#[cfg(test)] mod tests` |
| **严重等级** | 🟡 Minor（测试覆盖） |

#### 问题原因

`DocumentFormatter` 的测试集覆盖了空文本、单行、多行合并、段落分隔、列表保护、诗歌保护、缩进分段、句尾分段、幂等性、空白处理等场景，但缺少 Tab 字符相关的测试用例。

虽然 Tab 字符的归一化由 `TextNormalizer` 负责，但 `DocumentFormatter` 在合并行时不应对 Tab 做特殊处理，需要测试确认 Tab 字符不会在排版过程中被截断或导致 panic。

#### 修复逻辑

新增两个测试方法，验证 Tab 字符在排版过程中的正确处理：

```rust
#[test]
fn test_tab_character_handling() {
    // Tab 字符在排版中保持原样，仅做行合并
    let input = "列A\t列B\t列C\n续行1\t续行2";
    let result = formatter.format(input);
    assert_eq!(result.formatted_text, "列A\t列B\t列C 续行1\t续行2");
}

#[test]
fn test_mixed_tab_and_space() {
    // Tab 和空格混合场景
    let input = "Hello\tWorld\nFoo  Bar";
    let result = formatter.format(input);
    assert_eq!(result.formatted_text, "Hello\tWorld Foo Bar");
}
```

---

### BUG-V2.0-005: 空段落导出无提示

| 项目 | 内容 |
| :--- | :--- |
| **文件** | `src-tauri/src/lib.rs` |
| **Command** | `export_text` |
| **严重等级** | 🟡 Minor |

#### 问题原因

当用户将所有段落取消勾选后点击导出，`paragraphs` 数组为空或仅含空字符串。此时 `export_text` 会写入一个空文件，用户无法知晓导出内容为空。

#### 修复逻辑

在 `export_text` 开头增加空段落检测，提前返回明确的错误信息：

```rust
if paragraphs.is_empty() || paragraphs.iter().all(|p| p.trim().is_empty()) {
    return Err("导出失败: 没有可导出的内容（所有段落已被排除）".to_string());
}
```

前端 `ExportButton` 的 `canExport` 已通过 `hasExportableContent` 判断阻止导出按钮点击。后端增加此校验作为防御性编程。

---

## 修复效果验证

| 检查项 | 状态 |
| :--- | :---: |
| Rust `cargo test` | ✅ **25/25 全部通过** |
| TypeScript `tsc --noEmit` | ✅ **零错误** |
| Vite build | ✅ **构建成功** |
| Cargo release build | ✅ **编译成功** |
| 新增测试用例 | ✅ **2 个（Tab 处理）** |

---

## 文件变更清单

| 文件路径 | 变更类型 | 关联 Bug |
| :--- | :---: | :--- |
| `src/store/useStore.ts` | 修改 `removeFile` | BUG-V2.0-001 |
| `src/components/PreviewParagraph.tsx` | 修改 `handleCheckboxChange` | BUG-V2.0-002 |
| `src-tauri/src/document_formatter.rs` | 删除 `no_period_end_re` + 新增测试 | BUG-V2.0-003, 004 |
| `src-tauri/src/lib.rs` | 新增空段落检查 | BUG-V2.0-005 |

---

*本文档对应 V2.0 代码审查中发现的 5 个问题*
