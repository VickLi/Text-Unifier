# Text Unifier V3.1.2 发布包

## 版本信息

| 项目 | 内容 |
| :--- | :--- |
| **版本号** | V3.1.2 |
| **构建日期** | 2026-05-11 |
| **基线版本** | V3.1.1 |
| **变更类型** | 代码规范校验 + camelCase 对齐 + 性能优化 |

## V3.1.2 修复内容

| ID | 等级 | 问题 | 修复文件 |
| :--- | :---: | :--- | :--- |
| BUG-V3.1.2-001 | 🟠 P1 | `ExportResult.saved_path` 未对齐 napi-rs camelCase | `types/index.ts`, `ExportButton.tsx`, `ipc.ts`, `preload.d.ts` |
| BUG-V3.1.2-002 | 🟠 P1 | `setAnalysisResult` 参数类型仍用 snake_case | `useStore.ts` |
| BUG-V3.1.2-003 | 🟡 P2 | `splitChapters`/`reorderChapters` 使用 CJS `require` | `useStore.ts` |
| OPT-V3.1.2-001 | 🔵 P3 | 新增 `_updateChapterList` 统一章节列表管理 | `useStore.ts` |
| OPT-V3.1.2-002 | 🔵 P3 | Rust `FileMetadata.file_name` 添加 `#[allow(dead_code)]` | `file_processor.rs` |

## 验证结果

| 检查项 | 结果 |
| :--- | :---: |
| Rust 测试 | **25/25 ✅** |
| TypeScript | **零错误 ✅** |
| Vite 构建 | **成功 ✅** |
