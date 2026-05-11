# Text Unifier V3.0 发布包

## 版本信息

| 项目 | 内容 |
| :--- | :--- |
| **版本号** | V3.0 |
| **构建日期** | 2026-05-11 |
| **基线版本** | V2.0.2（Tauri v2） |
| **目标平台** | Windows 7 SP1+ ~ Windows 11 / macOS |

## V3.0 变更说明

V3.0 是 **纯技术架构升级**，不涉及任何功能变更：

| 维度 | V2.0.2 | V3.0 |
| :--- | :--- | :--- |
| 桌面框架 | Tauri v2 | **Electron v31** |
| 后端引擎 | Rust（Tauri Command） | **Rust（napi-rs 原生模块 `.node`）** |
| 渲染引擎 | 系统 WebView2 | **内嵌 Chromium** |
| Windows 兼容 | Win10 1803+ | **Win7 SP1+ ~ Win11** |
| Rust 核心模块 | 零改动 | **零改动**（TextNormalizer / InterFileDeduper / DocumentFormatter） |
| 功能行为 | — | **零变化**（RQ-01/02/03 全部继承） |

## 文件清单

```
releases/v3.0/
├── README.md                           # 本文件
└── text-unifier-src-v3.0.zip           # 完整源代码包

native/                                 # napi-rs Rust 核心引擎
├── Cargo.toml
├── build.rs
└── src/
    ├── lib.rs                          # #[napi] exports
    ├── duplicate_resolver.rs           # #[napi(object)] 类型适配
    ├── file_processor.rs               # = 零改动
    ├── text_normalizer.rs              # = 零改动
    ├── paragraph_index.rs              # = 算法零改动
    └── document_formatter.rs           # = 零改动

electron/                               # Electron 主进程
├── main.ts                             # 主进程入口 + IPC Handler
├── preload.ts                          # contextBridge 安全桥
└── preload.d.ts                        # TypeScript 类型声明

src/                                    # React 前端（100% 复用）
├── utils/ipc.ts                        # ← 唯一重写文件（Tauri→Electron IPC）
├── store/, components/, types/, ...    # = 零改动
```

## 构建说明

```bash
# 1. 安装依赖
npm install

# 2. 构建 napi 原生模块
npm run napi:build

# 3. 构建前端
npm run build

# 4. 开发模式启动
npm run electron:dev

# 5. 生产构建
npm run electron:build
```
