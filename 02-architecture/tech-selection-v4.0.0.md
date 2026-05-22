# 文档终版确定器（Text Unifier）V4.0 技术选型说明文档

| 项目名称 | 文档终版确定器（Text Unifier） |
| :--- | :--- |
| **版本号** | V4.0（项目重构版） |
| **文档类型** | 技术选型说明文档（主方案、备选方案、对比分析） |
| **关联文档** | `architecture-v4.0.0.md` / `PRD_V4.0_产品需求文档.md` |

---

## 第一部分：技术选型结论

V4.0 基于 PRD 更新的目标平台（**Windows 10+** 替代 Win7），经过 Tauri 2.x Demo 实证评估（详见 `tech-decision-report-v4.0.0.md`），最终选择 **Electron 31 + React + Zustand + Rust (napi-rs)** 作为正式技术栈。

| 结论 | 说明 |
| :--- | :--- |
| **最终方案** | ✅ **Electron 31 + napi-rs（裁减重构）** |
| **决策依据** | Tauri Demo 经历 8 个问题（其中 6 个为 Tauri 特有），核心痛点：配置错误→静默崩溃（与历史 WebView2 创伤症状一致）；Electron 零迁移成本 + 6 代工程积累 + 错误信息清晰可见 |
| **Tauri 状态** | 保留为 V4.1+ 远期规划，Demo 源码及问题报告已归档至 `demo-tauri/` + `archive/` |
| **前端复用度** | 100%（纯裁减重构，零架构变更） |

---

## 第二部分：最终方案说明（Electron 31）

### 2.1 完整技术栈（V4.0 正式版）

```
项目根目录/
├── src/                    # React 前端（100% 复用 V3.3，仅裁减）
│   ├── components/         # UI 组件（移除 ChapterPanel/FormatPanel/KeywordSearchBar）
│   ├── store/              # Zustand Store（移除 12 字段 + 7 Actions）
│   ├── hooks/              # 自定义 Hooks（移除 useChapterSort/useFormatOptions）
│   └── utils/              # 工具函数（移除 chapterGrouping/paragraphFormat）
├── electron/               # Electron 主进程（移除 format-document IPC）
│   ├── main.ts
│   └── preload.ts
├── native/                 # Rust napi-rs 引擎（移除 document_formatter.rs）
│   ├── src/
│   │   ├── text_normalizer.rs    # 保留：文本归一化 + 编码探测
│   │   ├── chain_merger.rs       # 新增：V4.0 链式重叠合并
│   │   └── encoding_detector.rs  # 保留：编码探测链
│   └── Cargo.toml
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── electron-builder.yml
```

### 2.2 各组件选型依据

#### 2.2.1 桌面框架：Electron 31 ← 最终选择

| 维度 | 说明 |
| :--- | :--- |
| **选型理由** | Tauri Demo 实证：8 个问题中 6 个为 Tauri 特有，核心痛点（配置错误→静默崩溃）不可接受。Electron 零迁移成本，V3.0~V3.3 已验证稳定 |
| **已知限制** | 包体积 ~120MB、内存 ~150MB 基线 |
| **V4.0 缓解** | `electron-builder` compression: maximum；`chromiumArgs` 禁用拼写检查/翻译服务等冗余特性 |
| **Tauri 的教训** | 配置错误→Rust panic→无 UI 反馈。Electron 的 Node.js 异常→终端输出 + 对话框，调试路径清晰 |

#### 2.2.2 原生引擎：Rust (napi-rs)

| 维度 | 说明 |
| :--- | :--- |
| **选型理由** | V3.3 已验证。napi-rs 提供稳定的 Rust ↔ Node.js FFI，4 层 IPC 调用链（React→preload→main→napi→Rust）虽长但经 6 个版本验证 |
| **V4.0 变更** | 移除 `document_formatter.rs` + `format_document` napi 导出；新增 `chain_merger.rs`（V4.0 链式重叠合并算法） |

#### 2.2.3 前端框架 / 构建 / 状态管理 / 样式：不变

| 组件 | 版本 | V4.0 变更 |
|:---|:---|:---|
| React | 18.3 | 不变 |
| TypeScript | 5.4 | 不变 |
| Vite | 5.2 | 不变 |
| Zustand | 4.5 | 瘦身（移除 12 字段 + 7 Actions） |
| Tailwind CSS | 3.4 | 不变 |
| @dnd-kit | 6.1 | 不变 |

---

## 第三部分：Tauri 方案（V4.1+ 远期规划）

### 3.1 评估结论

Tauri 2.x 在**技术上完全可行**（Demo 所有功能均通过），但在**开发体验和风险控制**上不满足 V4.0 的交付要求。

### 3.2 Demo 实测数据（详见 `tech-decision-report-v4.0.0.md`）

| 指标 | 数据 |
|:---|:---|
| 从零到可运行 | ~3 小时（8 个问题） |
| 配置错误后果 | 静默崩溃（与 WebView2 创伤症状一致） |
| 调试难度 | 需 `Start-Process -RedirectStandardError` |
| 编译次数 | ~10 次 |

### 3.3 V4.1+ 启用条件

| 条件 | 说明 |
|:---|:---|
| Tauri 2.x 进入稳定 LTS | 配置 schema 校验完善，不再静默 panic |
| CI 中建立 Tauri 自动化测试 | 编译 + 打包 + 冒烟全自动化 |
| 预留 2 周迁移预算 | ~10.5 人天（见决策报告） |

---

## 第四部分：Electron vs Tauri 完整对比（基于 Demo 实证）

### 4.1 综合对比

| 对比维度 | ✅ Electron 31（正式方案） | ⏸️ Tauri 2.x（V4.1+ 规划） |
| :--- | :--- | :--- |
| **适用场景** | V4.0 裁减重构，快速交付 | V4.1+ 生态成熟后迁移 |
| **安装包大小** | ~120MB | ~8MB |
| **内存基线（空载）** | ~150MB | ~50MB |
| **内存叠加（10×10MB）** | ~400MB | ~200MB |
| **从零到可运行** | ~15 分钟 | ~3 小时（8 个问题） |
| **配置错误后果** | 明确错误信息 + 窗口提示 | **静默崩溃**（无 UI 反馈） |
| **调试难度** | 低（Chrome DevTools + 终端） | 高（需 stderr 重定向） |
| **迁移成本** | **零**（裁减重构） | ~10.5 人天 |
| **生态成熟度** | 极高（15 年） | 中（4 年） |
| **前端代码复用** | 100% | ~85% |
| **Rust 引擎** | ✅ napi-rs（已验证） | ✅ 原生集成（更优但需验证） |

### 4.2 Demo 实测问题统计

| 类别 | 数量 | 详情 |
|:---|:---:|:---|
| Tauri 特有的编译/配置问题 | 6 | ICO 格式、crate-type 宏冲突、插件反序列化 panic、devUrl 混淆、TAURI_DEV 无效、web_atoms 慢编译 |
| 人工操作失误 | 1 | 合并文件遗留多余 `}` |
| 与 Tauri 无关的工具问题 | 1 | PowerShell 中文乱码 |
| **总计** | **8** | 详见 `archive/Tauri_Demo_问题报告_V4.0.md` |

---

## 第五部分：V4.0 最终技术栈

| 层级 | 组件 | 版本 | V4.0 变更 |
|:---|:---|:---|:---|
| **桌面框架** | Electron | 31 | 不变 |
| 前端框架 | React | 18.3 | 不变 |
| 类型系统 | TypeScript | 5.4 | 不变 |
| 构建工具 | Vite | 5.2 | 不变 |
| 状态管理 | Zustand | 4.5 | **瘦身**（移除 12 字段 + 7 Actions） |
| 样式方案 | Tailwind CSS | 3.4 | 不变 |
| 拖拽排序 | @dnd-kit | 6.1 | 不变 |
| 原生引擎 | Rust（napi-rs） | 2021 | **裁减**（移除 `document_formatter.rs`） |
| 打包分发 | electron-builder | 25 | 不变 |
| 数据持久化 | IndexedDB | - | **简化**（移除废弃字段） |

### 依赖版本锁定

| 包名 | 版本 | 用途 |
|:---|:---|:---|
| `react` | `^18.3.1` | UI 框架 |
| `react-dom` | `^18.3.1` | DOM 渲染 |
| `zustand` | `^4.5.0` | 状态管理 |
| `@dnd-kit/core` | `^6.1.0` | 拖拽核心 |
| `@dnd-kit/sortable` | `^8.0.0` | 拖拽排序 |
| `@dnd-kit/utilities` | `^3.2.2` | 拖拽工具 |
| `typescript` | `^5.4.0` | 类型检查 |
| `vite` | `^5.2.0` | 构建工具 |
| `tailwindcss` | `^3.4.3` | 样式 |
| `electron` | `^31.0.0` | 桌面运行时 |
| `electron-builder` | `^25.0.0` | 打包分发 |
| `@napi-rs/cli` | `^2.18.0` | napi 构建 |

---

## 第六部分：文档索引

| 文档 | 位置 | 说明 |
|:---|:---|:---|
| 技术选型说明（本文档） | `02-architecture/tech-selection-v4.0.0.md` | 最终技术栈 |
| 最终决策报告 | `02-architecture/tech-decision-report-v4.0.0.md` | Demo 实证 + 决策理由 |
| Demo 问题原始记录 | `archive/Tauri_Demo_问题报告_V4.0.md` | 8 个问题的完整记录 |
| Demo 源码 | `demo-tauri/` | Tauri 2.x Demo（保留供 V4.1 参考） |
| 系统架构设计 | `02-architecture/architecture-v4.0.0.md` | 模块设计与交互流程 |
| 数据库设计 | `02-architecture/db-design-v4.0.0.md` | IndexedDB 表结构 |
| 接口规范 | `02-architecture/api-spec-v4.0.0.md` | IPC 接口定义 |

---

*本文档为 Text Unifier V4.0 技术选型最终版。基于 PRD V4.0 (K2: Win10+) 重新评估后，经 Tauri Demo 实证，最终选择 Electron 31 + napi-rs 方案。Tauri 方案保留为 V4.1+ 远期规划。*
| :--- | :--- | :--- |
| NSIS 安装包 | `release/Text Unifier Setup {version}.exe` | 带安装向导 |
| Portable 免安装版 | `release/TextUnifier_Portable_{version}.exe` | 单文件运行 |
| macOS DMG | `release/Text Unifier-{version}.dmg` | macOS 安装镜像 |

### 7.3 目标平台

| 平台 | 架构 | 验证方式 |
| :--- | :--- | :--- |
| Windows 7 SP1 | x64 | 虚拟机 + 实机测试 |
| Windows 10/11 | x64 | 开发环境日常验证 |
| macOS 12+ | x64 + arm64 | CI 构建验证 |

---

*本文档应与 `architecture-v4.0.0.md` 配合阅读，为 V4.0 重构的完整技术选型规范。*
