## Release Title

**v3.2.3** — 拖拽修复 + UX 改进 + 文档归档

---

## Release Notes

### 🐛 Bug 修复

#### P0 — 全窗口拖拽文件添加无效 (BUG-V3.2.3-001)

根本原因：Electron 31 中 `File.path` 为异步填充，OS 拖放触发 `drop` 事件时取值为空字符串。

**修复**：
- 使用 `webUtils.getPathForFile()`（Electron 28+ 推荐 API，同步可靠获取路径）
- 三层降级：`getPathForFile` → `File.path` → `file.name`
- 添加 `will-navigate` 事件阻止 `file://` 导航
- `dataTransfer.files` 访问包裹 try-catch 安全保护

**涉及文件**：`preload.ts`、`ipc.ts`、`DragOverlay.tsx`、`FileChipBar.tsx`、`main.ts`

---

### 🚀 UX 改进

#### 文件名悬停 Tooltip
`SortableChip` 文件名添加 `title` 属性，鼠标悬停显示完整文件名，解决 `max-w-[120px] truncate` 截断后无法识别文件的问题。

#### 文档对比双栏独立着色
`DiffViewer` 左右栏拆分为 `leftColor()` / `rightColor()` 独立着色函数：
- `leftOnly`（左独有）→ 左栏红色，右栏空白
- `rightOnly`（右独有）→ 左栏空白，右栏蓝色
- 行号精确对齐，颜色语义清晰

---

### 🔧 工程改进

- **修复 ESM/CJS 兼容问题**：`package.json` 的 `"type": "module"` 导致 Electron CommonJS 编译产物被误加载为 ESM。新增 `rename-electron-output.cjs` 后处理脚本，编译后将 `.js` 重命名为 `.cjs`
- **修复 asar 路径解析**：使用 `process.resourcesPath` 定位 native 模块，替代 `__dirname + ../` 在 asar 内部失效的问题
- **多路径探测**：加载 native 模块时依次尝试 5 种路径方案，`fs.existsSync` 前置检查

---

### 📦 部署包

| 文件 | 大小 |
|:---|:---:|
| TextUnifier_Portable_v3.2.3.zip | 113 MB |
| installer/安装程序.cmd | 安装脚本 |

> **说明**：便携版解压即用。如需安装，以管理员身份运行 `installer/安装程序.cmd`。

---

### ✅ 构建验证

| 检查项 | 结果 |
|:---|:---:|
| TypeScript | ✅ 零错误 |
| Vite build | ✅ 72 modules |
| Rust cargo test | ✅ 25/25 passed |

---

### 📄 文档归档

`releases/v3.2.3/` 已归档：
- 全部 PRD、架构/数据库/接口设计文档
- 自审报告、Bug 修复说明、代码变更记录
- 全维度测试用例、Bug 报告、测试报告
- 功能/性能/安全测试数据（17 种场景）
