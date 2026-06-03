# 文档终版确定器 (Text Unifier)

> **最新版本**: v4.0.0 — [部署产出](05-deployment/)
> **架构**: Electron 31 + napi-rs (Rust) + React 18 + TypeScript

> 一款完全离线的桌面工具，用于多 TXT 文件链式重叠合并、内容清洗、预览编辑、文档对比与一键导出。

---

## 项目概述

本应用早期基于 **Tauri v2** 框架（V1.x~V2.x），V3.0 起迁移至 **Electron + napi-rs** 架构，解除 WebView2 兼容性瓶颈，覆盖 Windows 7 SP1+ ~ Windows 11。Rust 核心引擎编译为 Node.js 原生模块，性能无损失。

## 技术栈

| 层级 | 技术（当前版本） | 说明 |
| :--- | :--- | :--- |
| 桌面框架 | **Electron 31** | 内嵌 Chromium，零外部依赖，覆盖 Win10~Win11 |
| 后端引擎 | **Rust + napi-rs** | 原生性能，链式重叠合并引擎 |
| 前端框架 | **React 18 + TypeScript** | 组件化 UI |
| 状态管理 | **Zustand** | 轻量状态管理 |
| 样式方案 | **Tailwind CSS 3** | 实用优先的样式框架 |
| 拖拽排序 | **@dnd-kit** v6 | 横向芯片拖拽排序 |
| 打包分发 | **electron-builder** 25 | NSIS 安装包 + 便携版 |

## 项目结构

```
Text Unifier/
├── index.html                 # 入口 HTML
├── package.json               # Node.js 依赖配置
├── tsconfig.json              # TypeScript 配置（前端）
├── tsconfig.electron.json     # TypeScript 配置（Electron 主进程）
├── vite.config.ts             # Vite 构建配置
├── electron-builder.yml       # Electron 打包配置
├── tailwind.config.js         # Tailwind CSS 配置
├── postcss.config.js          # PostCSS 配置
├── .gitignore
├── README.md
├── AI_PRIVACY_CHECK.md        # AI 隐私检查提示词
│
├── 01-requirements/           # 需求阶段产出
├── 02-architecture/           # 架构阶段产出
├── 03-code/                   # 代码阶段产出（含完整源码副本）
├── 04-test/                   # 测试阶段产出
├── 05-deployment/             # 部署阶段产出（含便携版安装包）
│
├── src/                       # 前端源代码（React 18 + TypeScript）
│   ├── main.tsx               # 应用入口
│   ├── App.tsx                # 根组件
│   ├── index.css              # 全局样式 (Tailwind)
│   ├── types/index.ts         # TypeScript 类型定义
│   ├── store/useStore.ts      # Zustand Store
│   ├── utils/
│   │   ├── ipc.ts             # Electron IPC 封装
│   │   ├── diffUtils.ts       # 文档对比算法
│   │   └── cjkConv.ts         # 繁简/全半角转换
│   └── components/
│       ├── App.tsx             # 根组件
│       ├── ModeTabs.tsx        # 模式切换
│       ├── DragOverlay.tsx     # 拖拽遮罩
│       ├── FileChipBar.tsx     # 芯片式文件栏
│       ├── SortableChip.tsx    # 可排序芯片
│       ├── ConnectionPointList.tsx  # 连接点列表
│       ├── ConnectionPointItem.tsx  # 连接点项
│       ├── PreviewPanel.tsx    # 可编辑预览区
│       ├── Minimap.tsx         # 缩略图
│       ├── CleanPanel.tsx      # 清洗面板
│       ├── SearchReplace.tsx   # 搜索替换
│       ├── DiffViewer.tsx      # 文档对比
│       ├── ExportButton.tsx    # 导出
│       ├── MergeSettings.tsx   # 合并设置
│       └── BottomToolbar.tsx   # 底部工具栏
│
├── electron/                  # Electron 主进程
│   ├── main.ts                # IPC handler + 窗口管理
│   ├── preload.ts             # contextBridge
│   └── preload.d.ts           # 类型声明
│
├── native/                    # Rust napi-rs 原生模块
│   ├── Cargo.toml
│   ├── build.rs
│   └── src/
│       ├── lib.rs              # napi 导出
│       ├── text_normalizer.rs  # 文本归一化
│       ├── encoding_detector.rs# 编码探测链
│       └── chain_merger.rs     # ★ 链式重叠合并（V4.0 新增）
│
├── public/                    # 前端公共资源
├── icons/                     # 应用图标
├── scripts/                   # 开发/构建脚本
├── releases/                  # 历史版本发布包（v3.0~v3.3）
├── archive/                   # 历史版本归档
├── test_data/                 # 测试数据
├── demo-tauri/                # Tauri Demo 源码（V4.1+ 参考）
└── src-tauri/                 # Tauri 源码（V4.1+ 参考）
```

## 开发环境要求

| 工具 | 版本要求 | 安装方式 |
| :--- | :--- | :--- |
| **Node.js** | >= 18 | [nodejs.org](https://nodejs.org) |
| **Rust** | >= 1.77 | [rustup.rs](https://rustup.rs) |
| **VS Code** | 任意 | [code.visualstudio.com](https://code.visualstudio.com) |

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 编译 Electron 主进程（TypeScript → JavaScript）

```bash
npm run electron:ts
```

### 3. 构建前端

```bash
npm run build
```

### 4. 编译 Rust napi 原生模块

```bash
cd native && npx napi build --platform --release
```

### 5. 开发模式运行

```bash
npm run electron:dev
```

### 6. 生产打包

```bash
# 需要网络环境安装 electron-builder 依赖
npm run electron:build
```

## 核心功能

### V4.0 功能总览

| 模块 | 功能 | 说明 |
| :--- | :--- | :--- |
| **A. 文件输入** | 拖拽/按钮上传 .txt | 全窗口蓝色遮罩，仅接受 .txt |
| **B. 链式重叠合并** | 字符级最长后缀-前缀匹配 | V4.0 全新算法，替代段落哈希去重 |
| **C. 连接点列表** | 重叠信息展示 + 切换合并/保留 | 自动合并(灰色)/待确认(高亮) |
| **D. 预览区** | 连续文本可编辑 + Minimap | 连接标记可视化，Ctrl+Z/Y 撤回 |
| **E. 内容清洗** | 繁简转换 + 全角半角转换 | 双向 ToggleButton |
| **H. 撤回栈** | 5 步 FIFO | Ctrl+Z/Y，导出后保留 |
| **I. 文档对比** | 双栏 LCS 对齐 + 四色渲染 | 同步滚动，词级差异高亮 |
| **J. 导出** | UTF-8 BOM .txt | 排除连接标记，Ctrl+S 快捷键 |
| **L. 合并设置** | 重叠阈值可调 (10~500) | 持久化到 IndexedDB |
| **M. 搜索替换** | Ctrl+H 高亮搜索 + 替换 | 逐个/全部替换，入撤回栈 |

## 版本历史

| 版本 | 日期 | 架构 | 说明 |
| :--- | :--- | :--- | :--- |
| **v4.0.0** | 2026-05-22 | Electron + napi-rs | ✅ **当前最新** — 链式重叠合并 + 搜索替换 + 项目重构 |
| v3.3 | 2026-05-21 | Electron + napi-rs | UX 改进 + 隐私修复 |
| v3.2.3 | 2026-05-20 | Electron + napi-rs | 拖拽修复 + asar 加载修复 |
| v3.2.2 | 2026-05-19 | Electron + napi-rs | Bug 修复 + 代码精简 |
| v3.2.1 | 2026-05-18 | Electron + napi-rs | Bug 修复 |
| v3.2 | 2026-05-17 | Electron + napi-rs | 界面重构 + 撤回栈 + 文档对比 |
| v3.1 | 2026-05-10 | Electron + napi-rs | 小说文本清洗引擎 |
| v3.0 | 2026-05-08 | Electron + napi-rs | 架构迁移：Tauri → Electron |
| v2.x | 2026-05-01~06 | Tauri + Rust | Tauri 版本迭代 |
| v1.x | 2026-04-25~28 | Tauri + Rust | 初始版本 |

> 历史版本完整归档见 [`archive/`](archive/) 目录。

## 部署指南

### 直接使用（推荐）

从 [`05-deployment/portable/`](05-deployment/portable/) 获取最新 V4.0.0 便携版：

- **🌿 便携版**：解压 `TextUnifier_Portable_v4.0.0.zip`，双击 `Text Unifier.exe` 即开即用
- **📦 安装版**：以管理员身份运行 `05-deployment/installer/安装程序.cmd`

### 从源码构建

```bash
npm install                     # 安装依赖
npm run napi:build              # 编译 Rust 原生模块
npm run electron:ts             # 编译 Electron 主进程
npx vite build                  # 构建前端
npx electron-builder --win portable  # 打包便携版
```

## 架构设计原则

- **纯本地处理**：所有数据在本地处理，不会上传至任何服务器
- **安全 IPC**：通过 Electron contextBridge + ipcMain 隔离通信
- **链式重叠合并**：V4.0 全新算法 — 字符级最长后缀-前缀匹配，替代 V3.3 段落哈希去重
- **原生性能**：Rust 核心引擎（napi-rs）处理编码探测、文本归一化、链式合并
- **前端离线引擎**：繁简转换、全半角转换、文档对比算法全部在纯前端完成
- **5 步撤回栈**：深拷贝快照，Ctrl+Z/Y，导出后保留

## 许可

MIT License
