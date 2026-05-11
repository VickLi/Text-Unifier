# Text Unifier V2.0.2 — 生产环境部署包

> **文档终版确定器** — 一款轻量桌面工具，用于检测并合并多个 `.txt` 文件中的重复文本段落。

| 项目 | 内容 |
| :--- | :--- |
| **版本** | V2.0.2（正式发布版） |
| **构建日期** | 2026-05-11 |
| **构建类型** | Release（LTO + strip + panic=abort） |
| **平台** | Windows x64 |

---

## 部署包内容

```
releases/v2.0.2/
├── README.md                    # 本文件
├── deploy/                      # 生产环境安装包
│   ├── Text Unifier_2.0.2_x64-setup.exe   # NSIS 安装程序（推荐）
│   ├── Text Unifier_2.0.2_x64_en-US.msi   # MSI 安装包
│   └── text-unifier.exe                   # 便携版可执行文件
├── portable/                    # 🌿 绿色便携版（免安装）
│   ├── TextUnifier_Portable_v2.0.2.exe             # 主程序
│   ├── 启动（自动安装WebView2）.bat                 # 🔧 智能启动器（推荐）
│   ├── MicrosoftEdgeWebView2RuntimeInstallerX64.exe # 🌐 WebView2 安装包
│   ├── TextUnifier_Portable_v2.0.2.zip             # ZIP 压缩包（3.95MB）
│   └── 使用说明.md                                  # 绿色版使用说明
├── docs/                        # 全量项目文档
│   ├── PRD_V2.0_产品需求文档.md
│   ├── PRD_V2.0_交互原型.md
│   ├── 系统架构设计文档_V2.0.md
│   ├── 数据库设计文档_V2.0.md
│   ├── 接口规范文档_V2.0.md
│   ├── 需求变更文档_去重算法修正.md
│   ├── 代码变更记录_V2.0.md / _V2.0.1.md / _V2.0.2.md
│   ├── 自审代码报告_V2.0.md / _V2.0.1.md / _V2.0.2.md
│   ├── Bug修复说明_V2.0.1.md / _V2.0.2.md
│   └── 代码变更记录.md
├── test_reports/                # 测试交付物
│   ├── 01_全维度测试用例_V2.0.2.md
│   ├── 02_Bug报告_V2.0.2.md
│   ├── 03_复测测试报告_V2.0.2.md
│   └── 04_回归测试指令_V2.0.2.md
```

---

## 安装说明

### 方式一：NSIS 安装程序（推荐）

双击 `deploy/Text Unifier_2.0.2_x64-setup.exe`，按向导完成安装。

### 方式二：MSI 安装包

双击 `deploy/Text Unifier_2.0.2_x64_en-US.msi`，按向导完成安装。

### 方式三：🌿 绿色便携版（免安装，推荐）

解压 `portable/TextUnifier_Portable_v2.0.2.zip`，然后：

**推荐**：双击 `启动（自动安装WebView2）.bat` — 自动检测环境，缺失 WebView2 时自动安装，然后启动程序。

**直接运行**：双击 `TextUnifier_Portable_v2.0.2.exe`（需系统已安装 WebView2 运行时）。

> ⚠️ 若双击后无反应，通常是 **WebView2 运行时缺失**。部分精简版/旧版 Win10 未预装。使用 `启动（自动安装WebView2）.bat` 一键解决。

- **无需安装**，无注册表残留，删除文件即卸载
- **U 盘可携**，随处可用

---

## 系统要求

| 组件 | 要求 |
| :--- | :--- |
| **操作系统** | Windows 10 / Windows 11（x64） |
| **WebView2** | 系统内置（Windows 10+ 自带） |
| **磁盘空间** | ~50MB |
| **内存** | ≥ 256MB |

---

## 构建验证摘要

| 检查项 | 结果 |
| :--- | :---: |
| Rust 单元测试（25 项） | ✅ 全部通过 |
| TypeScript 类型检查 | ✅ 零错误 |
| Vite 前端构建 | ✅ 成功（65 modules, 226KB JS） |
| Tauri Release 构建 | ✅ 成功（LTO 优化） |
| **已知 Bug 修复率** | **12/12 = 100%** |
| **质量评分** | **9.2/10** |

---

## 版本变更

### V2.0.2（当前版本）

- 🔴 P0：排版后段落勾选状态保持（BUG-024）
- 🟠 P1：还原后无 `fmt_*` 残留（BUG-025）
- 🟠 P1：拖拽排序后自动重新分析（BUG-026）
- 🟡 P2：诗歌检测含标点保护（BUG-027）
- 🟡 P2：前端 SHA-256 哈希（BUG-028）
- 🔵 P3：FormatButton 冗余导入（BUG-029）
- 🔵 P3：列表正则可选空格（BUG-030）

详情见 `docs/代码变更记录_V2.0.2.md` 和 `docs/Bug修复说明_V2.0.2.md`。

---

## 安全说明

- 所有用户文件在本地处理，不上传云端
- 哈希算法使用标准 SHA-256（Web Crypto API）
- 路径遍历通过 Tauri FS Plugin 权限控制
- 文件大小上限 100MB
- 临时文件通过 Drop 守卫确保清理

---

*部署包生成日期：2026-05-11*
