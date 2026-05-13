# Text Unifier V3.2.1 — Bug 修复说明

| 项目 | 内容 |
| :--- | :--- |
| **修复日期** | 2026-05-13 |
| **修复范围** | 5 个 V3.2 初测 Bug（1 P1 + 2 P2 + 2 P3） |
| **构建版本** | v3.2.1 |

---

## 修复统计

| 严重等级 | 数量 | 编号 |
| :---: | :---: | :--- |
| 🟠 P1 - 高 | 1 | BUG-V3.2-001 |
| 🟡 P2 - 中 | 2 | BUG-V3.2-002, BUG-V3.2-003 |
| 🔵 P3 - 低 | 2 | BUG-V3.2-004, BUG-V3.2-005 |
| **合计** | **5** | |

---

### BUG-V3.2-001: `undo()`/`redo()` 未对 `checkedMap` 做空值防御

| 项目 | 内容 |
| :--- | :--- |
| **文件** | `src/store/useStore.ts` |
| **严重等级** | 🟠 P1 |

**问题原因**：`undo()`/`redo()` 调用 `Object.entries(snap.checkedMap)`，但快照中 `checkedMap` 可能为 `undefined`（旧格式快照或手动构造的快照），导致运行时崩溃。

**修复逻辑**：添加空值防御：
```typescript
const checkedEntries = snap.checkedMap ? Object.entries(snap.checkedMap) : [];
return { paragraphCheckedMap: new Map(checkedEntries) };
```
同时对 `snap.paragraphs` 也添加 `?? state.previewParagraphs` 后备。

---

### BUG-V3.2-002: `DiffViewer` 异步 IPC 在组件卸载后调用 `setDiffResult`

| 项目 | 内容 |
| :--- | :--- |
| **文件** | `src/components/DiffViewer.tsx` |
| **严重等级** | 🟡 P2 |

**问题原因**：`useEffect` 中的 `loadAndCompare()` 使用 `await detectEncoding()`，Promise resolve 时组件可能已卸载，调用 `setDiffResult` 触发 React warning。

**修复逻辑**：添加 `aborted` 标志，在 cleanup 函数中设置为 `true`，所有异步操作后检查 `if (!aborted)` 再调用 `setDiffResult`。

---

### BUG-V3.2-003: 对比模式 `normalize` 函数未完整归一化

| 项目 | 内容 |
| :--- | :--- |
| **文件** | `src/components/DiffViewer.tsx` |
| **严重等级** | 🟡 P2 |

**问题原因**：内联 `normalize` 仅做简单的 `\n\n` 分割 + `\r\n` 替换，未处理控制字符、BOM、多余空格等，导致相同内容的段落因格式差异被误判为 `leftOnly`/`rightOnly`。

**修复逻辑**：扩展 `normalize` 函数，增加 `replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')` 控制字符过滤、`replace(/[ \t]+/g, ' ')` 空格压缩、`replace(/\u{FEFF}/gu, '')` BOM 去除。

---

### BUG-V3.2-004: `FileChipBar` 横向拖拽误触

| 项目 | 内容 |
| :--- | :--- |
| **文件** | `src/components/FileChipBar.tsx` |
| **严重等级** | 🔵 P3 |

**问题原因**：`PointerSensor` 激活距离为 8px，芯片面积小，用户可能无意触发拖拽。

**修复逻辑**：距离从 `8` 提升至 `12`。

---

### BUG-V3.2-005: `wordDiff` 不支持中文逐字差异

| 项目 | 内容 |
| :--- | :--- |
| **文件** | `src/utils/diffUtils.ts` |
| **严重等级** | 🔵 P3 |

**问题原因**：`tokenize` 按空白分割，中文整句作为一个词，无法精细显示 `"轻轻地说"` vs `"温柔地说"` 的差异。

**修复逻辑**：检测 `[\u4e00-\u9fff]` 中文字符范围，中文字符按单个字符拆分（`tokens.push(ch)`），非中文字符（英文/数字）保持原有单词级拆分。

---

## 修复效果验证

| 检查项 | 状态 |
| :--- | :---: |
| TypeScript `tsc --noEmit` | ✅ **零错误** |
| Vite build | ✅ **成功** |
| Rust `cargo test` | ✅ **零改动** |
