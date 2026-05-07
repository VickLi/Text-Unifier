# Text Unifier V3.1.2 标准化 Bug 报告（初测版）

| 项目 | 内容 |
| :--- | :--- |
| **应用名称** | 文档终版确定器（Text Unifier） |
| **版本号** | V3.1.2 |
| **测试日期** | 2026-05-11 |
| **测试环境** | Windows 11 / Electron v31 / Chromium / React 18 |
| **测试类型** | 初测（代码审查 + 编译验证） |

---

## Bug 状态总览

| 分类 | 数量 | 编号 |
| :--- | :---: | :--- |
| ✅ **已修复（CLOSED）** | **3** | BUG-V3.1.2-001 ~ 003 |
| 🟢 **代码优化（DONE）** | **2** | OPT-V3.1.2-001, OPT-V3.1.2-002 |
| 🔴 **未修复（OPEN）** | **0** | — |
| **合计** | **5** | **修复率 100%** |

---

## 第一部分：Bug 修复详情

### ✅ BUG-V3.1.2-001：`ExportResult.savedPath` 字段名未对齐 napi-rs camelCase

| 字段 | 内容 |
| :--- | :--- |
| **严重等级** | 🟠 P1 - 高 |
| **文件** | `src/types/index.ts` + `src/components/ExportButton.tsx` + `src/utils/ipc.ts` + `electron/preload.d.ts` |

#### 复现步骤
1. 在 V3.1.1 运行导出功能
2. napi-rs `#[napi(object)]` 自动将 Rust 端的 `saved_path` 转换为 camelCase `savedPath`
3. 前端 TS 类型声明为 `saved_path` → 运行时 `result.saved_path` 为 `undefined`

#### 环境信息
```
源文件:   src/types/index.ts:44
          src/components/ExportButton.tsx:45
          src/utils/ipc.ts:70
          electron/preload.d.ts
Rust napi: native/src/duplicate_resolver.rs → #[napi(object)] ExportResult { saved_path }
```

#### 修复代码验证

```typescript
// types/index.ts
// BUG-V3.1.2-001: napi-rs #[napi(object)] converts saved_path → savedPath
export interface ExportResult {
  savedPath: string;  // ← 原为 saved_path
}

// ExportButton.tsx
showToast('success', `导出成功！已保存至: ${result.savedPath}`);  // ← 原为 result.saved_path
```

---

### ✅ BUG-V3.1.2-002：`setAnalysisResult` 参数 snake_case 未对齐

| 字段 | 内容 |
| :--- | :--- |
| **严重等级** | 🟠 P1 - 高 |
| **文件** | `src/store/useStore.ts` → `setAnalysisResult` |

#### 问题原因
`setAnalysisResult` 的参数类型 `{ file_name: string; file_size: number }[]` 使用了 snake_case，但 napi-rs 自动将 Rust 返回的字段转换为 camelCase，导致类型不匹配。

#### 修复
```typescript
// 修复前
filesMetadata?: { file_name: string; file_size: number; modified: number }[]

// 修复后 (BUG-V3.1.2-002)
filesMetadata?: { fileName: string; fileSize: number; modified: number }[]
```

---

### ✅ BUG-V3.1.2-003：`require()` CJS 调用不兼容 ESM

| 字段 | 内容 |
| :--- | :--- |
| **严重等级** | 🟡 P2 - 中 |
| **文件** | `src/store/useStore.ts` → `splitChapters()` / `reorderChapters()` |

#### 复现步骤
1. 在 Vite ESM 模式下运行应用
2. 点击「章节分割」或「章节重排」按钮
3. 运行时错误：`require is not defined`

#### 修复
```typescript
// 修复前 (BUG-V3.1.2-003)
const { splitInlineChapterTitles } = require('../utils/novelProcessor');

// 修复后
const { splitInlineChapterTitles } = await import('../utils/novelProcessor');
```

同时将函数签名从 `() => void` 改为 `() => Promise<void>`。

---

## 第二部分：代码优化详情

### ✅ OPT-V3.1.2-001：`_updateChapterList` 统一管理

| 字段 | 内容 |
| :--- | :--- |
| **类型** | 🟢 代码质量优化 |
| **文件** | `src/store/useStore.ts` |

新增 `_updateChapterList` action，集中管理章节列表提取逻辑，避免多处散布相同的章节扫描代码。

---

### ✅ OPT-V3.1.2-002：Rust warning 消除

| 字段 | 内容 |
| :--- | :--- |
| **类型** | 🟢 代码规范 |
| **文件** | `native/src/file_processor.rs` |

在 `FileMetadata` 结构的 `file_name` 字段上添加 `#[allow(dead_code)]`，消除编译器 warning。

---

## 第三部分：编译验证日志

```
Rust cargo test:     25/25 ✅       (全部通过，0 warning)
TypeScript tsc:      零错误 ✅     (strict 模式)
Vite npm run build:  成功 ✅       (65 modules, 226KB JS)
```

---

## 结论

> ✅ **V3.1.2 发现的 3 个 Bug + 2 个优化项已全部修复（5/5 = 100%）。**
> **编译验证全部通过，无未修复问题。**
> **V3.1.2 可进入发布流程。**
