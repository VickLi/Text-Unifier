# Text Unifier V4.0.0 Bug 报告

> **测试阶段**: 静态分析 + 编译验证 + 代码审查
> **测试日期**: 2026-06-03（更新）
> **Bug 总数**: 7（P0: 4, P1: 2, P2: 1）
> **已修复**: 6（P0×4, P1×2）
> **待修复**: 1（P2×1）
> **Bug 修复阈值**: 严重/高危(P0) 100% 修复，中危(P1) ≤2 个

---

## 修复确认

上一轮发现的 6 个 Bug（BUG-V4.0-001 ~ 006）已在代码中全部修复 ✅

| ID | 模块 | 严重级别 | 修复状态 | 说明 |
| :--- | :--- | :---: | :---: | :--- |
| BUG-V4.0-001 | Store-导出 | P0 | ✅ 已修复 | `exportMergedText` 中 `defaultName` 变量已正确定义 |
| BUG-V4.0-002 | Store-撤回 | P0 | ✅ 已修复 | `revertToExport` 语法错误已修正 |
| BUG-V4.0-003 | 文档对比 | P0 | ✅ 已修复 | `readFileText` IPC 通道已添加 |
| BUG-V4.0-004 | 搜索替换 | P0 | ✅ 已修复 | PreviewPanel 改用 contentEditable + ConnectionMarker |
| BUG-V4.0-005 | Store-导出 | P1 | ✅ 已修复 | `revertToExport` 残留代码已清理 |
| BUG-V4.0-006 | 连接点列表 | P1 | ✅ 已修复 | 空状态逻辑已修正 |

---

## 当前待修复 Bug 清单

### 🟢 P2-低危

#### BUG-V4.0-007: CleanPanel 缺少 SearchReplace 组件及 E 模块 Store Actions

| 属性 | 值 |
| :--- | :--- |
| **严重级别** | 🟢 P2-低危 |
| **模块** | E/M - 内容清洗 / 搜索替换 |
| **源文件** | `src/components/CleanPanel.tsx` |
| **根因** | `SearchReplace.tsx` 组件被 CleanPanel 导入但文件不存在；`toggleFullWidth`/`toggleTraditional` Actions 及对应状态字段在 Store 中未定义 |
| **影响** | 当前被 `MODULE_E_ENABLED = false` 和 `MODULE_M_ENABLED = false` 隐藏，不影响运行。启用 flag 会导致编译/运行时错误 |
| **修复方案** | 1. 在 Store 中添加 E 模块 Actions 及状态字段<br>2. 创建 `SearchReplace.tsx` 组件（Store 层搜索替换逻辑已实现）<br>3. 启用 feature flag |
