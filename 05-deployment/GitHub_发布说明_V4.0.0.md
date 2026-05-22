# GitHub Release 发布说明 — V4.0.0

> **以下内容已准备就绪，可用于 GitHub Release 正文**

---

## Release Title

**v4.0.0 — 项目重构：链式重叠合并引擎 + 连接点交互 + 搜索替换**

---

## Release Notes

### 🎯 版本概述

V4.0.0 是对 Text Unifier 的一次**重大项目重构**。核心算法从 V3.3 的段落级哈希去重全面升级为**字符级链式重叠合并**，数据模型从「段落列表+勾选」重构为「连续文本+连接点」。同时删除了章节工具和排版增强模块，新增搜索替换功能。

### ✨ 核心新特性

#### 🔗 链式重叠合并（全新算法）

| 特性 | 说明 |
|:----|:------|
| **字符级处理** | 最长后缀-前缀匹配，精度远超市面同类工具 |
| **智能阈值** | 重叠 ≥ 50 字符自动合并，< 50 提示用户确认 |
| **完全包含跳过** | 重复文件被自动识别并跳过 |
| **无重叠拼接** | 无重叠时直接拼接全文 |

#### 🔗 连接点交互面板

- 左侧面板展示每对文件衔接处的重叠信息
- 灰色标记 = 已自动合并，高亮标记 = 待确认
- ToggleSwitch 一键切换合并/保留
- 面板支持宽度拖拽调整

#### 📝 连续文本预览区

- 从段落列表改为连续文本展示
- 可编辑 + 撤回栈（Ctrl+Z/Y）
- Minimap 缩略图导航
- 连接标记可视化

#### 🔍 搜索替换（Ctrl+H）

- 预览区黄色高亮匹配项、橙色焦点
- 逐个替换 / 全部替换
- 替换操作入撤回栈
- 搜索结果列表覆盖连接点面板

#### ⚙️ 合并设置

- 重叠阈值可调（10~500，步长 10）
- 阈值持久化到 IndexedDB

### 🐛 Bug 修复

| ID | 级别 | 问题 |
|:---|:----:|:-----|
| BUG-V4.0-001 | 🔴 | `exportMergedText` 中 `defaultName` 未定义 |
| BUG-V4.0-002 | 🔴 | `revertToExport` 末尾语法错误 |
| BUG-V4.0-003 | 🔴 | DiffViewer 用编码名替代文件内容 |
| BUG-V4.0-004 | 🔴 | PreviewPanel 搜索高亮未渲染 |
| BUG-V4.0-005 | 🟡 | `revertToExport` 残留 `err` 变量 |
| BUG-V4.0-006 | 🟡 | 连接点列表空状态逻辑错误 |

**修复率: 6/6 = 100% ✅**

### 🔧 工程变更

- **Rust**: 新增 `chain_merger.rs`，移除 `document_formatter.rs`
- **IPC**: 移除 `scan-preprocessed-texts`/`format-document`，新增 `merge-files`
- **Store**: 移除 12 字段 + 7 Actions，精简至 26 字段
- **数据库**: IndexedDB v5 → v6
- **依赖**: 移除 `js-opencc`
- **前端**: 移除 ChapterPanel/FormatPanel/KeywordSearchBar/SidePanel

### ✅ 构建验证

| 检查项 | 结果 |
|:------|:----:|
| Rust 单元测试 | ✅ 17/17 通过 |
| TypeScript 编译 | ✅ 零错误 |
| Vite 构建 | ✅ 67 模块构建成功 |
| napi-rs Release 编译 | ✅ 成功 |
| PRD 覆盖率 | ✅ ~96% |

### 📦 下载

| 文件 | 说明 |
|:----|:------|
| `TextUnifier_Portable_v4.0.0.zip` | 便携版（解压即用，推荐） |
| `installer/安装程序.cmd` | 安装脚本（需管理员权限） |
| `installer/卸载程序.cmd` | 卸载脚本 |

> **注意**：安装包需在本地执行 `npm run electron:build` 后从 `release/` 目录获取。

### 📄 文档归档

`05-deployment/` 已归档：
- 隐私安全检查报告
- 用户使用手册
- 版本更新记录
- 人工介入请求汇总
- 全项目归档说明

---

## 发布步骤

```bash
# 1. 创建标签（已执行）
git tag v4.0.0
git push origin v4.0.0

# 2. 在 GitHub 网页端操作：
#    - 访问 https://github.com/VickLi/Text-Unifier/releases
#    - 点击 "Draft a new release"
#    - 选择标签 v4.0.0
#    - 将上方 Release Notes 粘贴到正文
#    - 上传便携版 ZIP
#    - 点击 "Publish release"
```

---

*本发布说明由部署运维流程自动生成，建议人工审核后发布。*
