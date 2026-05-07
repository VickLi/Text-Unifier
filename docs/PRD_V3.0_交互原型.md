# 产品交互原型 V3.0（高保真，适配 AI 开发）

> **关联文档**: `PRD_V3.0_产品需求文档.md`、`迁移方案_V3.0_Electron.md`
> **版本**: V3.0
> **变更说明**: 底层框架从 Tauri 切换为 Electron。**交互、布局、组件、状态管理无任何变化。** 此文档为 V2.0 原型的 V3.0 确认版，供 AI 开发时参考。

---

## 一、重要声明

V3.0 的 **所有用户交互、UI 布局、组件行为、状态流转** 与 V2.0.2 **完全一致**。以下仅为 V3.0 技术实现层面的补充，UI/UX 设计直接复用 V2.0 原型。

### 1.1 V2.0 → V3.0 技术层面的等价替换

| 概念 | V2.0 (Tauri) | V3.0 (Electron) |
| :--- | :--- | :--- |
| 前端 ↔ 后端通信 | `@tauri-apps/api/core` `invoke()` | `window.electronAPI.*` (contextBridge) |
| 文件对话框 | `@tauri-apps/plugin-dialog` | Electron `dialog.showOpenDialog/showSaveDialog` |
| 文件读取/编码 | Rust `FileProcessor`（Tauri Command） | Rust `FileProcessor`（napi-rs 模块） |
| 文本归一化 | Rust `TextNormalizer`（Tauri Command） | Rust `TextNormalizer`（napi-rs 模块） |
| 去重引擎 | Rust `InterFileDeduper`（Tauri Command） | Rust `InterFileDeduper`（napi-rs 模块） |
| 文档排版 | Rust `DocumentFormatter`（Tauri Command） | Rust `DocumentFormatter`（napi-rs 模块） |
| 渲染引擎 | 系统 WebView2 | 内嵌 Chromium |
| 包体 | ~6 MB | ~68 MB |

### 1.2 UI 层面：零变化

**以下全部继承 V2.0 原型，无需修改：**

- 整体布局结构
- 文件排序列表（拖拽手柄、主文件标记、编码标签）
- 重复组列表（Checkbox、中间态、联动逻辑）
- 预览面板（段落 Checkbox、已取消淡化效果、悬停浮层）
- 底部工具栏（全选/取消全选、排除计数、排版/还原/导出按钮）
- 状态栏（段落数、预估大小）
- 快捷键绑定
- 响应式布局断点

**详见 `PRD_V2.0_交互原型.md` 全部章节，此处不再重复。**

---

## 二、V3.0 新增交互：应用启动阶段

V3.0 新增了一个短暂的技术启动阶段（对用户透明的 Chromium 初始化），以及一个错误状态。

```text
                      ┌─ 用户双击 .exe ─┐
                      │                  │
                      v                  v
              [Chromium 冷启动]    [Chromium 热启动]
              (~2~3s)              (~0.5s)
                      │                  │
                      v                  v
              [Splash 窗口]         [直接显示主窗口]
              "文档终版确定器
               Text Unifier
               正在启动…"
                      │
                      v
              [加载 napi .node 模块]
                      │
              ┌───────┴────────┐
              │                │
              v                v
        [模块加载成功]    [模块加载失败]
              │                │
              v                v
        [显示主窗口]    [错误对话框]
        [正常使用]       "核心引擎加载失败
                         请重新安装应用"
```

### 2.1 Splash 窗口规格

| 属性 | 值 |
| :--- | :--- |
| 尺寸 | 400×300px |
| 样式 | 居中 Logo + 文字「正在启动文档终版确定器…」 |
| 显示时机 | Chromium 冷启动时（`app.whenReady()` 之前） |
| 关闭时机 | 主窗口 `ready-to-show` 事件触发 |
| 无边框 | 是（`frame: false`） |

---

## 三、V3.0 组件树（技术实现视角）

```text
Electron Main Process
├── electron/main.ts                     ← 新增：主进程入口
│   ├── ipcMain.handle('scan-files')     ← 调用 napi scanFiles
│   ├── ipcMain.handle('format-document') ← 调用 napi formatDocument
│   ├── ipcMain.handle('export-file')    ← dialog.saveDialog + fs.writeFile
│   └── ipcMain.handle('select-files')   ← dialog.openDialog + fs.statSync
├── electron/preload.ts                  ← 新增：contextBridge 安全暴露
│   └── contextBridge.exposeInMainWorld('electronAPI', { ... })
│
Electron Renderer Process (Chromium)
├── React App (src/)                     ← 100% 复用
│   ├── FileDropZone                     ← 调用 electronAPI.selectFiles()
│   ├── FileSortList                     ← 拖拽排序逻辑不变
│   ├── DuplicateList                    ← 重复组联动逻辑不变
│   ├── PreviewPanel / PreviewParagraph  ← Checkbox 勾选逻辑不变
│   ├── FormatButton                     ← 调用 electronAPI.formatDocument()
│   ├── ExportButton                     ← 调用 electronAPI.exportFile()
│   └── Zustand Store                    ← 状态管理 100% 不变
│
Native Module (.node)
├── native/                              ← Rust 源码编译产物
│   ├── scan_files()                     ← 取代 #[tauri::command]
│   └── format_document()                ← 取代 #[tauri::command]
```

---

## 四、V3.0 IPC 数据流

与 V2.0 的数据流对比，仅在通信层做了等价替换：

```text
V2.0 (Tauri)                     V3.0 (Electron)
─────────────────────────        ─────────────────────────
React Component                  React Component
    │                                │
    ▼ invoke('scan_files',           ▼ electronAPI.scanFiles(paths)
    │       {paths})                 │
    ▼                                ▼
Tauri Rust Command               ipcMain.handle('scan-files')
    │                                │
    ▼                                ▼
Rust fn scan_files()             napi scanFiles() (.node)
    │                                │
    ▼                                ▼
AnalysisReport JSON              AnalysisReport JS Object
    │                                │
    ▼                                ▼
Zustand Store                    Zustand Store
```

**前端调用侧代码变化**（`src/utils/ipc.ts`）：

```typescript
// V2.0 (旧)
import { invoke } from '@tauri-apps/api/core';
export async function scanFiles(paths: string[]) {
  return invoke<AnalysisReport>('scan_files', { paths });
}

// V3.0 (新)
function getAPI() { return (window as any).electronAPI; }
export async function scanFiles(paths: string[]) {
  return getAPI().scanFiles(paths);
}
```

> 其余所有文件（React 组件、Zustand store、CSS）代码不需要任何修改。

---

## 五、组件规格补充

### 5.1 全部组件规格

> **直接继承 `PRD_V2.0_交互原型.md` 第二章**，包括 `FileSortList`、`DuplicateItem`、`DuplicateList`、`PreviewPanel`、`PreviewCheckbox`、`PreviewParagraph`、`Tooltip`、`FormatButton`、`ExportButton` 的全部属性、交互说明。

### 5.2 仅需补充的内容

Zustand Store 中对 `formatDocument` 的调用，**无需修改**：

```typescript
// src/store/useStore.ts — 不变
import { formatDocument } from '../utils/ipc';
// formatDocument() 内部调用方式变化，但对 store 透明
```

App.tsx 中对 `scanFiles` 的调用，**无需修改**：

```typescript
// src/App.tsx — 不变
import { scanFiles } from './utils/ipc';
// scanFiles() 内部调用方式变化，但对组件透明
```

---

## 六、视觉规范

> **直接继承 `PRD_V2.0_交互原型.md` 第五章**，所有视觉元素、间距、尺寸不变。

---

## 七、快捷键

> **直接继承 `PRD_V2.0_交互原型.md` 第八章**，无变化。

| 快捷键 | 功能 |
| :--- | :--- |
| `Ctrl+A` | 全选/取消全选段落 |
| `Shift + 点击` | 批量切换段落勾选 |
| `Ctrl+Z` | 还原排版 |
| `Ctrl+E` | 触发文档排版 |
| `Ctrl+S` | 导出文件 |

---

## 八、响应式布局

> **直接继承 `PRD_V2.0_交互原型.md` 第九章**，无变化。

---

*本文档应与 `PRD_V2.0_交互原型.md`（完整交互细节）和 `迁移方案_V3.0_Electron.md`（技术实现）配合阅读。*
