# V3.2.3 发布说明

> **发布日期**: 2026-05-19  
> **当前最新版本**: ✅

---

## 更新内容

### Bug 修复

| 编号 | 严重度 | 描述 | 影响模块 |
|:---|:---:|:---|:---|
| BUG-V3.2.3-001 | P0 | 全窗口拖拽文件添加无效 — 从 OS 拖拽 .txt 文件到窗口后文件不加载 | DragOverlay, preload, main |

### 根因分析

1. **根因 1（主）**: Electron 31 中 `File.path` 为异步填充，OS 拖放触发 `drop` 事件时取值为空字符串/undefined，`(f as any).path || f.name` 退化为仅文件名（无路径），`fs.existsSync` 查找失败
2. **根因 2（次）**: 缺少 `will-navigate` 事件阻止，拖放文件可能触发 `file://` 页面导航

### 修复方案

- `electron/preload.ts`: 通过 `contextBridge` 暴露 `webUtils.getPathForFile(file)`（Electron 28+ 推荐 API）
- `src/utils/ipc.ts`: 新增 `getFilePath(file)` 统一工具函数 — **三层降级**：`webUtils.getPathForFile` → `File.path` → `file.name`
- `src/components/DragOverlay.tsx`: 改用 `getFilePath(f)` 替代 `(f as any).path || f.name`，`dataTransfer.files` 访问包裹 try-catch
- `src/components/FileChipBar.tsx`: 统一使用 `getFilePath(f)`
- `electron/main.ts`: 添加 `webContents.on('will-navigate')` 阻止 `file://` 导航

---

## 文件清单

| 文件 | 说明 |
|:---|:---|
| `TextUnifier_Portable_v3.2.3.zip` | 便携版（解压即用） |
| `installer/安装程序.cmd` | 安装脚本（复制到 Program Files + 桌面快捷方式） |
| `text-unifier-src-v3.2.3.zip` | 完整源码包 |

## 构建信息

- TypeScript: ✅ 零错误
- Vite: ✅ 72 modules 构建成功
- Rust test: ✅ 25/25 passed
- Electron: v31.7.7
- Rust: v3.2.3
