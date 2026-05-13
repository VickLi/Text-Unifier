# Text Unifier V3.2.1 — 生产环境部署包

> **文档终版确定器** — 一款轻量桌面工具，用于检测并合并多个 `.txt` 文件的重复文本段落，支持文件对比、差异分析、繁简转换、章节识别等功能。

| 项目 | 内容 |
| :--- | :--- |
| **版本** | V3.2.1（正式发布版） |
| **构建日期** | 2026-05-13 |
| **技术栈** | Electron 31 + napi-rs (Rust) + React 18 + TypeScript |
| **平台** | Windows x64 |

---

## 部署包内容

```
releases/v3.2.1/
├── README.md                         # 本文件
├── 版本更新记录.md                    # 版本更新记录
├── portable/                         # 🌿 绿色便携版
│   ├── TextUnifier_Portable_v3.2.1/  # 解压即用目录
│   │   ├── TextUnifier.exe           # 主程序（双击运行）
│   │   ├── 启动.bat                  # 启动脚本
│   │   └── resources/app/           # 应用程序文件
│   │       ├── dist/                # 前端构建
│   │       ├── dist-electron/       # Electron 主进程
│   │       └── native/              # Rust napi 原生模块
│   └── TextUnifier_Portable_v3.2.1.zip  # ZIP 压缩包
└── installer/                        # 📦 安装版
    └── 安装程序.cmd                  # 安装脚本（以管理员运行）
```

---

## 安装说明

### 🌿 便携版（推荐）
解压 ZIP 或直接进入 `portable/TextUnifier_Portable_v3.2.1/`，双击 `TextUnifier.exe` 运行。

### 📦 安装版
右键 `installer/安装程序.cmd` → **以管理员身份运行** → 选择安装目录 → 自动创建桌面快捷方式。

---

## 系统要求
- **操作系统**: Windows 10 / Windows 11（x64）
- **磁盘空间**: ≥ 500MB
- **运行时**: 内嵌 Chromium，零外部依赖

---

## 构建验证

| 检查项 | 结果 |
| :--- | :---: |
| TypeScript `tsc --noEmit` | ✅ 零错误 |
| Vite 前端构建 | ✅ **99 modules** |
| Rust 单元测试 | ✅ **25/25 全部通过** |
| napi-rs Release LTO | ✅ 编译成功 |
| **Bug 修复率** | **5/5 = 100%** |

---

## V3.2.1 修复内容

| Bug ID | 等级 | 说明 |
| :--- | :---: | :--- |
| BUG-V3.2-001 | 🟠 P1 | 撤回栈 `checkedMap` 空值防御 |
| BUG-V3.2-002 | 🟠 P1 | DiffViewer 卸载后 `setState` |
| BUG-V3.2-003 | 🟡 P2 | 对比模式归一化增强 |
| BUG-V3.2-004 | 🔵 P3 | 芯片拖拽误触阈值提升 |
| BUG-V3.2-005 | 🟡 P2 | wordDiff 中文逐字差异 |

---

## V3.2 新增功能（V3.2.1 基线）

| 需求 | 功能 | 说明 |
| :--- | :--- | :--- |
| RQ-09 | **文件对比** | 差异可视化对比面板（DiffViewer） |
| RQ-10 | **芯片式文件栏** | 文件标签水平滚动拖拽排序（FileChipBar） |

---

*部署包生成日期：2026-05-13*
