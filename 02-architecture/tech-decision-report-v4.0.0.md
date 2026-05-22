# Text Unifier V4.0 技术选型最终决策报告

> **文档编号**: TU-V4.0-DECISION-001
> **日期**: 2026-05-22
> **决策者**: 基于 Demo 实际开发数据
> **关联文档**:
> - `01-requirements/PRD_V4.0_产品需求文档.md`
> - `01-requirements/PRD_V4.0_交互原型.md`
> - `02-architecture/tech-selection-v4.0.0.md`
> - `archive/Tauri_Demo_问题报告_V4.0.md`（原始问题记录）

---

## 一、决策概要

| 项目 | 内容 |
| :--- | :--- |
| **决策事项** | Text Unifier V4.0 桌面框架选型 |
| **候选方案** | A: Tauri 2.x + Rust 原生集成 / B: Electron 31 + napi-rs |
| **最终选择** | ✅ **方案 B: Electron 31 + napi-rs** |
| **决策类型** | 基于实证数据的最终决策（不可逆） |
| **替代方案状态** | Tauri 保留为 V4.1+ 远期规划，待生态成熟后重新评估 |

---

## 二、评估过程回顾

### 2.1 评估阶段

```
阶段一：理论评估（基于 PRD V4.0）
  ├── 发现 PRD K2 已将 Win7 移除支持列表
  ├── WebView2 在 Win10+ 为系统内置 → Tauri 核心阻碍消除
  └── 理论上 Tauri 在包体积、内存、架构简洁性上全面优于 Electron

阶段二：Demo 实证（2026-05-22，~3 小时）
  ├── 搭建完整 Tauri 2.x Demo 项目
  ├── 经历 8 个问题，从编译到打包到部署
  └── 记录全部问题至 archive/Tauri_Demo_问题报告_V4.0.md

阶段三：最终决策
  └── 基于 Demo 实证数据，选择 Electron
```

### 2.2 Demo 测试覆盖

| 测试项 | 结果 | 说明 |
|:---|:---:|:---|
| Rust 编译（cargo build） | ✅ 通过 | 经 #1/#2/#3/#8 四个问题后成功 |
| 前端构建（vite build） | ✅ 通过 | 一次成功 |
| 窗口正常显示 | ✅ 通过 | 经 #4/#5/#6 三个问题后成功 |
| WebView2 兼容性 | ✅ 通过 | WebView2 本身不是问题根因 |
| 拖拽文件 | ✅ 通过 | Tauri 原生拖放 API 正常工作 |
| 文件读取 + 编码探测 | ✅ 通过 | encoding_rs 完美运行 |
| 合并预览 | ✅ 通过 | 文本渲染正常 |
| 导出功能 | ✅ 通过 | UTF-8 BOM 导出正确 |
| 进程退出 | ✅ 通过 | 无残留进程 |

> **结论：Tauri 在技术上是可行的，所有 PRD 要求的核心功能均可实现。决策不基于技术可行性，而基于开发体验与风险控制。**

---

## 三、Demo 实测问题全记录

以下 8 个问题来自 `archive/Tauri_Demo_问题报告_V4.0.md`，按影响程度分级：

### 3.1 致命级（导致应用静默崩溃）

| # | 问题 | 根因 | 用户体验 |
|:--:|:-----|:-----|:-----|
| 4 | **插件配置 → 闪退** | `tauri.conf.json` 中 `"dialog": {}` 反序列化失败 → Rust panic | 双击 exe → 任务栏闪边框 → 消失。与你之前的 WebView2 创伤**症状完全一致** |

> ⚠️ **这是决策的关键转折点**：Tauri 的配置模型缺乏 schema 校验，一个无效配置值导致整个应用静默崩溃。错误信息不在 UI 中展示（UI 还没初始化），需要 `Start-Process -RedirectStandardError` 才能捕获。这对一个面向非技术用户的桌面工具来说是不可接受的风险。

### 3.2 严重级（阻塞编译或运行）

| # | 问题 | 根因 |
|:--:|:-----|:-----|
| 1 | ICO 格式无效 | PowerShell `Icon.Save()` 生成不符合规范的 ICO |
| 2 | 宏符号重复定义 | `crate-type = ["staticlib","cdylib","rlib"]` 三重展开 |
| 5 | localhost 连接拒绝 | debug 构建默认连接 Vite dev server，打包后无 server |

### 3.3 中等级（增加调试难度）

| # | 问题 | 根因 |
|:--:|:-----|:-----|
| 3 | 语法错误 `unexpected }` | 文件合并操作失误 |
| 6 | TAURI_DEV 环境变量无效 | 编译期 `cfg!` 检查 vs 运行时环境变量 |
| 7 | PowerShell 中文乱码 | PS 5.1 对 UTF-8 without BOM 兼容性差 |

### 3.4 轻微级（影响效率但不阻塞）

| # | 问题 | 根因 |
|:--:|:-----|:-----|
| 8 | web_atoms 编译 ~5min | proc-macro crate 首次编译极慢 |

---

## 四、方案对比：不只是数字

### 4.1 技术指标对比

| 维度 | Tauri 2.x | Electron 31 | 胜出 |
|:---|:---|:---|:---:|
| 安装包大小 | ~8MB | ~120MB | Tauri |
| 内存基线（空载） | ~50MB | ~150MB | Tauri |
| IPC 调用链层数 | 2（React→Rust） | 4（React→preload→main→napi→Rust） | Tauri |
| 前端代码复用度 | ~85% | 100% | Electron |

### 4.2 开发体验对比（Demo 实测数据）

| 维度 | Tauri 2.x | Electron 31 | 胜出 |
|:---|:---|:---|:---:|
| 从零到可运行耗时 | ~3 小时（8 个问题） | ~15 分钟（V3.3 已验证） | Electron |
| 编译次数 | ~10 次 | 0 次（已有工程） | Electron |
| 需特殊调试技巧 | 是（stderr 重定向） | 否（终端直接输出） | Electron |
| 配置错误后果 | **静默崩溃** | 明确错误 + 窗口提示 | **Electron** |
| 需要 Rust 知识 | 是（crate-type, proc-macro） | 否（napi-rs 已封装） | Electron |
| 插件集成 | Cargo.toml + JSON 配置双重声明 | npm install 即用 | Electron |
| 社区资源（中文） | 稀缺 | 丰富 | Electron |

### 4.3 风险评估

| 风险类别 | Tauri 2.x | Electron 31 |
|:---|:---|:---|
| **静默崩溃风险** | 🔴 高（配置错误 → Rust panic → 无 UI 反馈） | 🟢 低（Node.js 异常 → 终端 + 对话框） |
| **编译环境风险** | 🟡 中（需 Rust + MSVC + Cargo） | 🟢 低（仅 Node.js + npm） |
| **版本兼容风险** | 🟡 中（Tauri 2.x 仍在快速迭代） | 🟢 低（Electron 31 为 LTS 级稳定版） |
| **调试成本** | 🔴 高（需同时掌握 Web + Rust 调试） | 🟢 低（Chrome DevTools + Node.js 调试器） |
| **迁移风险** | 🟡 中（~10.5 人天） | 🟢 无（裁减重构，零架构变更） |
| **包体积风险** | 🟢 低（~8MB） | 🟡 中（~120MB，但目标用户可接受） |

---

## 五、决策理由

### 5.1 一票否决项

**Tauri 的配置错误 → 静默崩溃**是不可接受的用户体验：

```
用户视角：
  双击 Text Unifier.exe
  → 任务栏出现边框
  → 0.3 秒后消失
  → 什么都没有发生
  → "这软件坏了"

这与你之前 WebView2 "幽灵进程" 的用户体验完全相同。
无论根因是 WebView2 还是 Tauri 配置，用户看到的是同一个结果。
```

### 5.2 核心论点

| 论点 | 说明 |
|:---|:---|
| **体量代价是已知且可控的** | 120MB 对桌面应用在 2026 年是可接受的；150MB 内存在 16GB+ RAM 标配下不是瓶颈 |
| **配置风险是未知且不可控的** | 今天有 8 个问题，明天可能有新的；每个 Tauri 版本升级都可能引入新的配置兼容性问题 |
| **时间是最稀缺的资源** | V4.0 的定位是裁减重构（删除废弃模块），不是框架迁移。在 Electron 上 2-4 周可交付；在 Tauri 上额外 2 周框架迁移 + 未知调试时间 |
| **已有工程积累不应浪费** | V3.3 的 Electron 代码、napi-rs 配置、electron-builder 打包流程全部经过 6 个版本验证 |

### 5.3 Electron 的劣势如何处理

| Electron 劣势 | V4.0 缓解措施 |
|:---|:---|
| 包体积 120MB | 启用 `electron-builder` compression: maximum；NSIS 安装包压缩后约 60-70MB |
| 内存 150MB | 使用 `chromiumArgs` 禁用不必要的特性（如拼写检查、翻译服务） |
| IPC 调用链 4 层 | 调用链虽长但已验证稳定，V4.0 不新增 IPC 通道 |
| Chromium 安全更新 | Electron 31 仍在维护期，安全补丁持续发布 |

---

## 六、最终技术栈（V4.0 正式版）

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
| 数据持久化 | IndexedDB | - | **简化** |

---

## 七、远期规划：Tauri V4.1+

Tauri 方案不放弃，但推迟至 V4.1 或更晚版本。届时需要：

| 准备工作 | 说明 |
|:---|:---|
| CI 中建立 Tauri 自动化测试 | 编译 + 打包 + 冒烟测试，避免手动调试 3 小时 |
| 建立 Tauri 配置最佳实践文档 | 基于本次 8 个问题的经验教训 |
| 等待 Tauri 2.x 进入稳定期 | 当前 Tauri 2.x 仍在快速迭代，API 稳定后再评估 |
| 等待社区资源丰富 | 中文文档、常见问题解答积累 |

---

## 八、文档归档

| 文档 | 归档位置 | 说明 |
|:---|:---|:---|
| Tauri Demo 问题原始报告 | `archive/Tauri_Demo_问题报告_V4.0.md` | 8 个问题的完整记录 |
| Tauri Demo 源代码 | `demo-tauri/` | 保留不动，供 V4.1 参考 |
| Tauri Demo 打包产物 | `demo-tauri/TextUnifier_Demo_Portable.zip` | 可运行的 Demo (~ZIP) |
| 本决策报告 | `02-architecture/tech-decision-report-v4.0.0.md` | 最终决策记录 |

---

*本报告基于 2026-05-22 Tauri Demo 实测数据，记录了从理论评估到 Demo 实证到最终决策的完整过程。Electron 方案的选择不是对 Tauri 的否定，而是基于当前生态成熟度和项目时间约束的务实选择。*
