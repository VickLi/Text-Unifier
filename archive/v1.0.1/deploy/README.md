# 文档终版确定器 (Text Unifier) V1.0

> 一款轻量桌面工具，用于检测并合并多个 `.txt` 文件中的重复文本段落。

## 项目概述

本应用基于 **Tauri v2** 框架开发，采用 **Rust** 后端 + **React/TypeScript** 前端架构，实现高效的文件分析、重复段落检测、可视化编辑和一键导出功能。

## 技术栈

| 层级 | 技术 | 说明 |
| :--- | :--- | :--- |
| 桌面框架 | **Tauri v2** | 轻量跨平台桌面应用框架（~10MB 打包体积） |
| 后端语言 | **Rust** | 高性能文本处理，支持并行计算 |
| 前端框架 | **React 18 + TypeScript** | 组件化 UI |
| 状态管理 | **Zustand** | 轻量状态管理 |
| 样式方案 | **Tailwind CSS 3** | 实用优先的样式框架 |
| 哈希算法 | **SHA-256** | 段落指纹计算 |

## 项目结构

```
Text Unifier/
├── index.html                 # 入口 HTML
├── package.json               # Node.js 依赖配置
├── tsconfig.json              # TypeScript 配置
├── vite.config.ts             # Vite 构建配置
├── tailwind.config.js         # Tailwind CSS 配置
├── postcss.config.js          # PostCSS 配置
├── .gitignore
├── README.md
│
├── src/                       # 前端源代码
│   ├── main.tsx               # 应用入口
│   ├── App.tsx                # 主应用组件
│   ├── index.css              # 全局样式 (Tailwind)
│   ├── vite-env.d.ts          # Vite 类型声明
│   │
│   ├── types/
│   │   └── index.ts           # TypeScript 类型定义
│   │
│   ├── store/
│   │   └── useStore.ts        # Zustand 状态管理
│   │
│   ├── utils/
│   │   └── ipc.ts             # Tauri IPC 封装
│   │
│   └── components/
│       ├── FileDropZone.tsx    # 文件拖拽/选择上传区
│       ├── DuplicateList.tsx   # 重复段落列表容器
│       ├── DuplicateItem.tsx   # 重复段落列表项
│       ├── PreviewPanel.tsx    # 最终文档预览面板
│       ├── PreviewParagraph.tsx# 预览段落实例
│       ├── Tooltip.tsx        # 悬停来源浮层
│       └── ExportButton.tsx   # 导出按钮
│
├── public/
│   └── vite.svg               # 应用图标
│
└── src-tauri/                 # Rust 后端源代码
    ├── Cargo.toml             # Rust 依赖配置
    ├── build.rs               # Tauri 构建脚本
    ├── tauri.conf.json        # Tauri 应用配置
    │
    ├── capabilities/
    │   └── default.json       # 权限配置
    │
    └── src/
        ├── main.rs            # Rust 入口
        ├── lib.rs             # Tauri Command 注册
        ├── file_processor.rs  # 文件读取与编码处理
        ├── text_normalizer.rs # 文本归一化
        ├── paragraph_index.rs # 段落指纹索引构建
        └── duplicate_resolver.rs # 去重分析与报告生成
```

## 开发环境要求

| 工具 | 版本要求 | 安装方式 |
| :--- | :--- | :--- |
| **Node.js** | >= 18 | [nodejs.org](https://nodejs.org) |
| **Rust** | >= 1.77 | [rustup.rs](https://rustup.rs) |
| **VS Code** | 任意 | [code.visualstudio.com](https://code.visualstudio.com) |
| **WebView2** | Win 10+ 内置 | 系统组件（Windows 10+ 自带） |

## 快速开始

### 1. 安装依赖

```bash
# 安装前端依赖
cd "Text Unifier"
npm install

# Rust 依赖会自动下载（首次编译时）
```

### 2. 开发模式运行

```bash
npm run tauri dev
```

### 3. 生产构建

```bash
npm run tauri build
```

构建产物位于：`src-tauri/target/release/bundle/`

- Windows: `.msi` 或 `.exe` 安装包
- macOS: `.dmg` 磁盘映像
- Linux: `.deb` / `.AppImage`

## 核心功能

### 功能列表
1. **文件导入**：支持拖拽或点击上传多个 `.txt` 文件
2. **文本归一化**：自动处理换行符、多余空白、控制字符
3. **重复检测**：基于 SHA-256 哈希 + 严格字符串比对
4. **可视化编辑**：左侧列表展示重复组，支持勾选删除
5. **实时预览**：右侧实时显示合并后文档
6. **来源溯源**：悬停预览段落显示来源文件
7. **一键导出**：导出 UTF-8 无 BOM 编码的纯净 `.txt` 文件

### 验收标准覆盖
| 编号 | 验收项 | 状态 |
| :--- | :--- | :--- |
| AC-01 | 文件导入（.txt 多选/拖拽） | ✅ 已实现 |
| AC-02 | 空格容错（"Hello  World" == "Hello World"） | ✅ 已实现 |
| AC-03 | 换行容错（归一化处理） | ✅ 已实现 |
| AC-04 | 乱码/特殊字符处理（BOM、控制字符） | ✅ 已实现 |
| AC-05 | 重复项高亮与联动 | ✅ 已实现 |
| AC-06 | 来源溯源（悬停浮层） | ✅ 已实现 |
| AC-07 | 手动勾选删除逻辑 | ✅ 已实现 |
| AC-08 | 导出功能（UTF-8 无 BOM） | ✅ 已实现 |

## 部署指南

### Windows 部署
1. 运行 `npm run tauri build`
2. 从 `src-tauri/target/release/bundle/msi/` 获取 `.msi` 安装包
3. 双击安装即可使用（无需额外运行时）

### macOS 部署
1. 运行 `npm run tauri build`
2. 从 `src-tauri/target/release/bundle/dmg/` 获取 `.dmg` 文件
3. 拖拽到 Applications 文件夹

### Linux 部署
1. 运行 `npm run tauri build`
2. 安装包位于 `src-tauri/target/release/bundle/deb/` 或 `appimage/`

## 架构设计原则

- **纯本地处理**：所有数据在本地处理，不会上传至任何服务器
- **安全 IPC**：通过 Tauri 严格权限控制的 IPC 通道通信
- **写入原子性**：导出使用先写临时文件再移动策略，防止文件损坏
- **编码健壮性**：UTF-8 解码失败时降级为 Latin1，最大程度避免乱码

## 许可

MIT License
