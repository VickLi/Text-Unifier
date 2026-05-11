# Text Unifier V3.1.1 — 生产环境部署包

> **文档终版确定器** — 一款轻量桌面工具，用于检测并合并多个 `.txt` 文件的重复文本段落。
>
> **V3.x 架构升级**：从 Tauri (V2) 迁移至 Electron + napi-rs，解除 WebView2 兼容性瓶颈。

| 项目 | 内容 |
| :--- | :--- |
| **版本** | V3.1.1（正式发布版） |
| **构建日期** | 2026-05-11 |
| **技术栈** | Electron 31 + napi-rs + React 18 + TypeScript |
| **平台** | Windows x64 |

---

## 部署包内容

```
releases/v3.1.1/
├── README.md                         # 本文件
├── 版本更新记录.md                    # 版本更新记录
├── portable/                         # 🌿 绿色便携版
│   ├── TextUnifier_Portable_v3.1.1/  # 解压即用目录
│   │   ├── TextUnifier.exe           # 主程序（双击运行）
│   │   ├── 启动.bat                  # 启动脚本
│   │   └── resources/app/           # 应用程序文件
│   │       ├── dist/                # 前端构建
│   │       ├── dist-electron/       # Electron 主进程
│   │       └── native/              # Rust napi 原生模块
│   └── TextUnifier_Portable_v3.1.1.zip  # ZIP 压缩包（96MB）
└── installer/                        # 📦 安装版
    └── 安装程序.cmd                  # 安装脚本（以管理员运行）
```

---

## 安装说明

### 🌿 便携版（推荐）

**方式一**：双击 `portable/TextUnifier_Portable_v3.1.1/TextUnifier.exe` 直接运行。

**方式二**：解压 `portable/TextUnifier_Portable_v3.1.1.zip` 到任意目录（包括 U 盘），双击 `TextUnifier.exe`。

> **注意**：首次运行可能被 Windows Defender 拦截，点击「更多信息」→「仍要运行」即可。

### 📦 安装版

1. 右键 `installer/安装程序.cmd` → **以管理员身份运行**
2. 选择安装目录（默认为 `C:\Program Files\TextUnifier`）
3. 自动创建桌面快捷方式和开始菜单

---

## 系统要求

| 组件 | 要求 |
| :--- | :--- |
| **操作系统** | Windows 10 / Windows 11（x64） |
| **磁盘空间** | ≥ 500MB |
| **内存** | ≥ 512MB |
| **运行时** | 内嵌 Chromium，零外部依赖 |

---

## 构建验证摘要

| 检查项 | 结果 |
| :--- | :---: |
| Rust 单元测试（25 项） | ✅ 全部通过 |
| TypeScript 类型检查 | ✅ 零错误 |
| Vite 前端构建 | ✅ 成功（95 modules） |
| napi-rs 原生模块 | ✅ 成功（Release LTO） |
| **已知 Bug 修复率** | **12/12 = 100%（V2.0.2 基线）** |

---

## 版本变更

### V3.1 → V3.1.1

- 版本号统一更新

### V3.0 → V3.1

| 需求 | 功能 | 状态 |
| :--- | :--- | :---: |
| RQ-04 | 繁简双向转换（js-opencc） | ✅ |
| RQ-05 | 章节识别与格式化（中/英/罗马数字） | ✅ |
| RQ-06 | 章节重排（按序号升序） | ✅ |
| RQ-07 | 垃圾内容过滤（广告/水印） | ✅ |
| RQ-08 | 内容筛选（关键词过滤 + 长度豁免） | ✅ |

### V2.0.2 → V3.0（架构迁移）

- **Tauri → Electron**：解除 WebView2 兼容性瓶颈，覆盖 Win7 SP1+ ~ Win11
- **Rust 后端 → napi-rs**：Rust 核心逻辑零改动，编译为 Node.js 原生模块
- 前端 React/TypeScript 100% 复用

---

## 安全说明

- 所有文件在本地处理，不上传云端
- 哈希算法使用标准 SHA-256
- 临时文件通过 Drop 守卫确保清理

---

*部署包生成日期：2026-05-11*
