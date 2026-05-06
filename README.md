# 文档终版确定器 (Text Unifier)

> **最新版本**: v3.1.1 — [生产部署包](releases/v3.1.1/)
> **架构**: Electron 31 + napi-rs (Rust) + React 18 + TypeScript

> 一款轻量桌面工具，用于检测并合并多个 `.txt` 文件中的重复文本段落，支持繁简转换、章节识别、内容清洗等高级功能。

---

## 项目概述

本应用早期基于 **Tauri v2** 框架（V1.x~V2.x），V3.0 起迁移至 **Electron + napi-rs** 架构，解除 WebView2 兼容性瓶颈，覆盖 Windows 7 SP1+ ~ Windows 11。Rust 核心引擎编译为 Node.js 原生模块，性能无损失。

## 技术栈

| 层级 | 技术（当前版本） | 说明 |
| :--- | :--- | :--- |
| 桌面框架 | **Electron 31** | 内嵌 Chromium，零外部依赖，覆盖 Win7~Win11 |
| 后端引擎 | **Rust + napi-rs** | 原生性能，核心逻辑从 V2.0.2 零改动迁移 |
| 前端框架 | **React 18 + TypeScript** | 组件化 UI |
| 状态管理 | **Zustand** | 轻量状态管理 |
| 样式方案 | **Tailwind CSS 3** | 实用优先的样式框架 |
| 繁简转换 | **js-opencc** | V3.1 新增繁简双向转换 |
| 哈希算法 | **SHA-256** (Web Crypto API) | 段落指纹计算 |

## 项目结构

```
Text Unifier/
├── index.html                 # 入口 HTML
├── package.json               # Node.js 依赖配置
├── tsconfig.json              # TypeScript 配置（前端）
├── tsconfig.electron.json     # TypeScript 配置（Electron 主进程）
├── vite.config.ts             # Vite 构建配置
├── electron-builder.yml       # Electron 打包配置
├── .gitignore
├── README.md
│
├── src/                       # 前端源代码（React）
│   ├── main.tsx               # 应用入口
│   ├── App.tsx                # 主应用组件
│   ├── index.css              # 全局样式 (Tailwind)
│   │
│   ├── types/index.ts         # TypeScript 类型定义
│   ├── store/useStore.ts      # Zustand 状态管理
│   ├── utils/
│   │   ├── ipc.ts             # Electron IPC 封装
│   │   ├── novelProcessor.ts  # 🆕 小说文本清洗引擎
│   │   └── regexPatterns.ts   # 🆕 共享正则常量
│   │
│   └── components/
│       ├── FileDropZone.tsx    # 文件拖拽/选择上传区
│       ├── DuplicateList.tsx   # 重复段落列表容器
│       ├── DuplicateItem.tsx   # 重复段落列表项
│       ├── PreviewPanel.tsx    # 最终文档预览面板
│       ├── PreviewParagraph.tsx# 预览段落实例
│       ├── Tooltip.tsx        # 悬停来源浮层
│       ├── ExportButton.tsx   # 导出按钮
│       ├── FormatButton.tsx   # 排版按钮
│       ├── FileSortList.tsx   # 文件排序列表
│       ├── SidePanel.tsx      # 🆕 侧边栏
│       ├── CleanPanel.tsx     # 🆕 内容清洗面板
│       ├── ChapterPanel.tsx   # 🆕 章节工具面板
│       └── FormatPanel.tsx    # 🆕 排版增强面板
│
├── electron/                  # Electron 主进程源代码
│   ├── main.ts               # Electron 主进程
│   ├── preload.ts            # contextBridge 预加载脚本
│   └── preload.d.ts          # 类型声明
│
├── native/                    # Rust napi-rs 原生模块
│   ├── Cargo.toml             # Rust 依赖配置
│   ├── build.rs               # napi 构建脚本
│   ├── package.json           # napi 包配置
│   │
│   └── src/
│       ├── lib.rs             # napi 导出
│       ├── file_processor.rs  # 文件读取与编码处理
│       ├── text_normalizer.rs # 文本归一化
│       ├── paragraph_index.rs # 段落指纹索引构建
│       ├── duplicate_resolver.rs # 去重分析与报告生成
│       └── document_formatter.rs # 文档排版引擎
│
├── dist/                      # 前端构建产物（Vite）
├── dist-electron/             # Electron JS 编译产物
│
├── public/
│   └── vite.svg               # 应用图标
│
├── releases/                  # 生产部署包
│   └── v3.1.1/               # 当前最新版本
│
├── archive/                   # 历史版本归档
│   ├── v1.0/                  # V1.0 初始版本
│   ├── v1.0.1/                # V1.0.1 Bug 修复版
│   ├── v2.0/                  # V2.0 大版本更新
│   ├── v2.0.1/                # V2.0.1 Bug 修复版
│   └── v2.0.2/                # V2.0.2 全量修复版（Tauri 最终版）
│
└── test_data/                 # 测试数据
    ├── functional/            # 功能测试
    ├── performance/           # 性能测试
    └── security/              # 安全测试
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

### V3.x 功能列表

| 需求 | 功能 | 版本 | 说明 |
| :--- | :--- | :---: | :--- |
| RQ-01 | **文件排序** | V2.0 | 拖拽排序文件，决定去重优先级 |
| RQ-02 | **段落勾选** | V2.0 | 勾选/取消段落，Shift 多选，三态联动 |
| RQ-03 | **文档排版** | V2.0 | 去除硬回车，保护列表/诗歌/缩进 |
| RQ-04 | **繁简转换** | V3.1 | 基于 js-opencc 双向转换 |
| RQ-05 | **章节识别** | V3.1 | 中/英/罗马数字章节格式化 |
| RQ-06 | **章节重排** | V3.1 | 按序号升序排列章节 |
| RQ-07 | **内容过滤** | V3.1 | 广告/水印/关键词过滤 |
| RQ-08 | **内容筛选** | V3.1 | 关键词过滤 + 长度豁免 |

### 基础功能
1. **文件导入**：支持拖拽或点击上传多个 `.txt` 文件
2. **文本归一化**：自动处理换行符、多余空白、控制字符
3. **重复检测**：基于 SHA-256 哈希 + 严格字符串比对（文件间去重）
4. **可视化编辑**：左侧列表展示重复组，支持勾选删除
5. **实时预览**：右侧实时显示合并后文档
6. **来源溯源**：悬停预览段落显示来源文件
7. **一键导出**：导出 UTF-8 无 BOM 编码的纯净 `.txt` 文件
8. **文档排版**：去除硬回车，智能保护列表/诗歌/缩进

## 版本历史

| 版本 | 日期 | 架构 | 说明 |
| :--- | :--- | :--- | :--- |
| **v3.1.1** | 2026-05-11 | Electron + napi-rs | ✅ **当前最新**，生产部署包 |
| v3.1 | 2026-05-11 | Electron + napi-rs | 繁简转换、章节识别、内容清洗 |
| v3.0 | 2026-05-11 | Electron + napi-rs | 架构迁移：Tauri → Electron |
| v2.0.2 | 2026-05-11 | Tauri + Rust | 全量 Bug 修复（12/12=100%），Tauri 最终版 |
| v2.0.1 | 2026-05-10 | Tauri + Rust | Bug 修复 |
| v2.0 | 2026-05-09 | Tauri + Rust | 文件排序、段落勾选、文档排版 |
| v1.x | 2026-05-06~08 | Tauri + Rust | 初始版本 + 迭代 |

> 历史版本完整归档见 [`archive/`](archive/) 目录。

## 部署指南

### 直接使用（推荐）

从 [`releases/v3.1.1/`](releases/v3.1.1/) 获取最新生产部署包：

- **🌿 便携版**：解压 ZIP，双击 `TextUnifier.exe` 即开即用（无需安装）
- **📦 安装版**：以管理员身份运行 `安装程序.cmd`

### Windows 部署（V3.x）

```bash
npm run electron:ts     # 编译 Electron 主进程
npm run build           # 构建前端
cd native && npx napi build --platform --release  # 编译 Rust 模块
# 然后使用 electron-builder 打包或手动部署
```

### 旧版 V2.x（Tauri）构建

```bash
cd src-tauri && cargo tauri build
```

## 架构设计原则

- **纯本地处理**：所有数据在本地处理，不会上传至任何服务器
- **安全 IPC**：通过 Electron contextBridge + ipcMain 隔离通信
- **写入原子性**：导出使用先写临时文件再移动策略，防止文件损坏
- **编码健壮性**：UTF-8 解码失败时降级为 Latin1，最大程度避免乱码
- **原生性能**：Rust 核心引擎通过 napi-rs 编译为 Node.js 原生模块，计算性能无损失

## 许可

MIT License
