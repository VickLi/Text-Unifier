# 文档终版确定器（Text Unifier）V4.0 接口规范文档

| 项目名称 | 文档终版确定器（Text Unifier） |
| :--- | :--- |
| **版本号** | V4.0（项目重构版） |
| **文档类型** | 接口规范文档（IPC 接口、Rust napi 接口、纯前端 Store 接口） |
| **基线版本** | V3.3 接口规范文档 |
| **关联文档** | `系统架构设计文档_V4.0.md` / `数据库设计文档_V4.0.md` |

---

## 重要声明

V4.0 核心数据模型从 V3.3 的**段落列表 + 勾选**改为**连续文本 + 连接点**。对应 IPC 接口重构：`scan-files` 出参改为 `MergeResult`（含 `mergedText` + `connectionPoints`）；新增 `merge-files` IPC 通道（链式重叠合并）；`export-file` 入参从段落数组改为连续文本字符串；删除 `scan-preprocessed-texts`（CJK 转换在纯前端完成）；删除 `format-document`（排版增强移除）。

纯前端 Store 接口精简：移除段落勾选 Actions（`toggleParagraphCheck` 等 5 个），新增连接点控制 Actions（`toggleConnectionMerge`）、搜索替换 Actions（`performSearch` 等 5 个）。

---

## 第一部分：IPC 接口

### 1.1 IPC 接口清单

| 编号 | 接口名称 | IPC 通道名 | 底层引擎 | 功能 | V4.0 变更 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| IPC-01 | `mergeFiles` | `merge-files` | napi `merge_files()` | 链式重叠合并：编码探测→归一化→最长后缀-前缀匹配→连接点列表 | ⭐ 重构（替代 V3.3 scanFiles） |
| IPC-02 | `detectEncoding` | `detect-encoding` | napi `detect_encoding()` | 单文件编码探测 | 无 |
| IPC-03 | `exportFile` | `export-file` | Node.js fs + dialog | 导出 TXT 文件（连续文本，排除连接标记） | ✂️ 入参改为 string |
| IPC-04 | `selectFiles` | `select-files` | Node.js dialog + fs | 文件选择对话框 | 无 |
| ~~IPC-05~~ | ~~`scanPreprocessedTexts`~~ | ~~`scan-preprocessed-texts`~~ | — | ~~V3.3 段落级预处理~~ | ❌ 删除（CJK 转换纯前端完成） |
| ~~IPC-06~~ | ~~`formatDocument`~~ | ~~`format-document`~~ | — | ~~文档排版~~ | ❌ 删除 |

### 1.2 接口通用规范

#### 1.2.1 请求头格式

所有 IPC 调用通过 Electron `contextBridge` 暴露的 `electronAPI` 对象发起，无需自定义请求头：

```typescript
// 调用方式
window.electronAPI.mergeFiles(paths, threshold);    // invoke
window.electronAPI.detectEncoding(filePath);         // invoke
window.electronAPI.exportFile(mergedText, defaultName); // invoke
window.electronAPI.selectFiles();                    // invoke
window.electronAPI.getPathForFile(file);             // sync
```

#### 1.2.2 统一响应格式

所有 IPC `invoke` 调用遵循 Promise 模式。成功时 resolve 对应返回类型，失败时 reject 并附带 `Error` 对象。

#### 1.2.3 错误码体系

| 错误码 | 场景 | 前端处理 |
| :--- | :--- | :--- |
| `IPC_NOT_INITIALIZED` | `electronAPI` 未挂载（非 Electron 环境） | 启动时检测，弹窗「核心引擎加载失败」 |
| `NATIVE_MODULE_LOAD_FAILED` | napi 原生模块加载失败 | 启动时检测，弹窗「核心引擎加载失败，请重新安装」 |
| `FILE_READ_FAILED` | 单文件读取异常（权限/不存在） | Toast + 跳过该文件，其他文件继续分析 |
| `ENCODING_DETECT_FAILED` | 所有编码探测失败 | 静默兜底 UTF-8，不阻断流程 |
| `ANALYSIS_TIMEOUT` | 分析超时（60 秒） | Toast「分析超时，请检查文件大小或重试」 |
| `DISK_FULL` | 导出路径磁盘空间不足 | Toast「磁盘空间不足，无法导出」 |
| `EXPORT_CANCELED` | 用户取消保存对话框 | 静默处理，不报错 |

#### 1.2.4 重试机制

所有 IPC 调用内置 3 次指数退避重试（`src/utils/ipc.ts` 中 `withRetry`）：

| 重试次数 | 延迟 |
| :--- | :--- |
| 第 1 次 | 500ms |
| 第 2 次 | 1000ms |
| 第 3 次 | 2000ms |
| 耗尽后 | 抛出原始错误 |

---

### 1.3 各接口详细定义

#### 1.3.1 IPC-01: `mergeFiles` — 链式重叠合并（V4.0 核心）

| 属性 | 说明 |
| :--- | :--- |
| **IPC 通道** | `merge-files` |
| **调用方式** | `ipcRenderer.invoke('merge-files', paths, threshold)` |
| **底层引擎** | Rust napi `merge_files(paths, threshold)` |
| **功能** | 读取文件 → 编码探测 → 文本归一化 → 链式重叠合并（最长后缀-前缀匹配）→ 返回合并结果 + 连接点列表 |

**入参：**

| 参数名 | 类型 | 必填 | 说明 |
| :--- | :--- | :--- | :--- |
| `paths` | `string[]` | 是 | 文件绝对路径数组，按用户排序顺序。第 1 个为「主文件」 |
| `threshold` | `number` | 否 | 自动合并阈值（默认 50，范围 10~500） |

**出参（MergeResult）：**

| 字段 | 类型 | 说明 |
| :--- | :--- | :--- |
| `mergedText` | `string` | 合并后的完整连续文本（含连接标记占位符） |
| `connectionPoints` | `ConnectionPoint[]` | 连接点列表（每对相邻文件的重叠信息） |
| `totalChars` | `number` | 总字符数 |
| `filesMetadata` | `FileMeta[]` | 各文件元数据（文件名、大小、编码） |
| `skippedFiles` | `string[]` | 被完全包含而跳过的文件名列表 |
| `encodingWarnings` | `string[]` | 编码探测警告（如有） |

**ConnectionPoint 结构：**

| 字段 | 类型 | 说明 |
| :--- | :--- | :--- |
| `id` | `string` | 连接点唯一标识（`cp_{index}`） |
| `fileA` | `string` | 前一个文件名 |
| `fileB` | `string` | 后一个文件名 |
| `overlapLength` | `number` | 重叠字符数 |
| `overlapSnippet` | `string` | 重叠文本截断（前 50 字符） |
| `isAutoMerged` | `boolean` | 是否自动合并（重叠 ≥ 阈值） |
| `position` | `number` | 连接点在 mergedText 中的字符偏移 |

**FileMeta 结构：**

| 字段 | 类型 | 说明 |
| :--- | :--- | :--- |
| `fileName` | `string` | 文件名 |
| `fileSize` | `number` | 文件大小（字节） |
| `encoding` | `string` | 探测到的编码名 |

**调用规则：**

- `paths` 按用户排序顺序传入，元素 0 即主文件（完整保留）
- 单文件时 `connectionPoints` 为空数组，`mergedText` 即为原文
- 重叠 ≥ `threshold` → `isAutoMerged = true`（灰色连接标记）
- 重叠 < `threshold` → `isAutoMerged = false`（高亮连接标记，待用户确认）
- 超时 60 秒（前端 `Promise.race` 保护）
- 自动重试 3 次
- 结果自动缓存（IndexedDB `cache` 表，缓存键 = paths 排序后的 SHA-256）

---

#### 1.3.2 IPC-02: `detectEncoding` — 编码探测

| 属性 | 说明 |
| :--- | :--- |
| **IPC 通道** | `detect-encoding` |
| **调用方式** | `ipcRenderer.invoke('detect-encoding', filePath)` |
| **底层引擎** | Rust napi `detect_encoding(filePath)` |
| **功能** | 读取文件二进制头，探测编码类型 |

**入参：**

| 参数名 | 类型 | 必填 | 说明 |
| :--- | :--- | :--- | :--- |
| `filePath` | `string` | 是 | 文件绝对路径 |

**出参：**

| 返回值 | 类型 | 说明 |
| :--- | :--- | :--- |
| 编码名 | `string` | 如 `"UTF-8"`, `"GB18030"`, `"Windows-1252"`, `"SHIFT-JIS"` |

**探测链**：UTF-8 BOM → UTF-16 LE/BE BOM → GB18030 → Windows-1252 → SHIFT-JIS → 兜底 UTF-8

---

~~#### 1.3.3 IPC-03: `scanPreprocessedTexts` — 已删除~~ 

> V3.3 的 `scanPreprocessedTexts` 通道已删除。CJK 转换（繁简/全半角）在 V4.0 中完全在纯前端完成，操作 `mergedText` 字符串后直接更新预览区，无需通过 IPC。

---

#### 1.3.4 IPC-03: `exportFile` — 导出文件

| 属性 | 说明 |
| :--- | :--- |
| **IPC 通道** | `export-file` |
| **调用方式** | `ipcRenderer.invoke('export-file', mergedText, defaultName)` |
| **底层引擎** | Node.js `dialog.showSaveDialog()` + `fs.writeFile()` |
| **功能** | 弹出保存对话框，将**连续文本**写入 .txt 文件（自动排除连接标记） |

**入参：**

| 参数名 | 类型 | 必填 | 说明 |
| :--- | :--- | :--- | :--- |
| `mergedText` | `string` | 是 | 预览区完整连续文本（**前端已排除连接标记**） |
| `defaultName` | `string` | 是 | 默认文件名（`{第一个文件名}_merged.txt`） |

**出参：**

| 字段 | 类型 | 说明 |
| :--- | :--- | :--- |
| `savedPath` | `string` | 实际保存的文件路径（用户取消时为空字符串） |

**文件格式**：

| 属性 | 规格 |
| :--- | :--- |
| 编码 | UTF-8（带 BOM `\uFEFF`） |
| 换行符 | CRLF（`\r\n`） |
| 扩展名 | `.txt` |

**调用规则：**

- `mergedText` 为空或仅空白时，前端拦截并 Toast「没有可导出的内容」
- 导出内容与预览区显示文本一致（排除连接标记）
- 用户取消保存对话框时返回 `{ savedPath: "" }`（不报错）
- 磁盘空间不足时抛出 `DISK_FULL` 错误

---

#### 1.3.5 IPC-04: `selectFiles` — 文件选择对话框

| 属性 | 说明 |
| :--- | :--- |
| **IPC 通道** | `select-files` |
| **调用方式** | `ipcRenderer.invoke('select-files')` |
| **底层引擎** | Node.js `dialog.showOpenDialog()` + `fs.statSync()` |
| **功能** | 弹出文件选择对话框，返回选中文件的基本信息 |

**入参**：无

**出参：**

```typescript
Array<{
  name: string;   // 文件名（含扩展名）
  path: string;   // 文件绝对路径
  size: number;   // 文件大小（字节）
}>
```

**调用规则：**

- 文件过滤器：仅 `.txt`（`{ name: 'TXT 文件', extensions: ['txt'] }`）
- 支持多选（`properties: ['openFile', 'multiSelections']`）
- 用户取消时返回空数组 `[]`
- 不检查文件大小上限（由前端校验）

---

### 1.4 Preload 暴露接口

```typescript
// electron/preload.ts — contextBridge.exposeInMainWorld('electronAPI', { ... })
interface ElectronAPI {
  // IPC invoke 方法
  mergeFiles(paths: string[], threshold?: number): Promise<MergeResult>;
  detectEncoding(filePath: string): Promise<string>;
  exportFile(mergedText: string, defaultName: string): Promise<{ savedPath: string }>;
  selectFiles(): Promise<{ name: string; path: string; size: number }[]>;

  // 同步方法
  getPathForFile(file: File): string;  // Electron 28+ webUtils.getPathForFile

  // 事件监听
  onMenuNew(callback: () => void): void;
  onMenuAbout(callback: () => void): void;
  onMenuExit(callback: () => void): void;
  removeMenuListeners(): void;
}
```

---

## 第二部分：Rust napi 接口

### 2.1 napi 函数清单

| 编号 | napi 函数 | 输入 | 输出 | V4.0 变更 |
| :--- | :--- | :--- | :--- | :--- |
| NAPI-01 | `merge_files(paths, threshold)` | `Vec<String>, u32` | `MergeResult` | ⭐ 新增（替代 scan_files + scan_preprocessed_texts） |
| NAPI-02 | `detect_encoding(file_path)` | `String` | `String` | 无 |
| ~~NAPI-03~~ | ~~`scan_files(paths)`~~ | — | — | ❌ 被 merge_files 替代 |
| ~~NAPI-04~~ | ~~`scan_preprocessed_texts(...)`~~ | — | — | ❌ 删除（CJK 纯前端） |
| ~~NAPI-05~~ | ~~`format_document(text)`~~ | — | — | ❌ 删除（排版增强移除） |

### 2.2 Rust 源文件（V4.0）

```
native/src/
├── lib.rs                  # napi 入口，导出 2 个函数
├── text_normalizer.rs      # 文本归一化（换行统一、空格压缩、控制字符过滤）
├── encoding_detector.rs    # 编码探测链（UTF-8→GB18030→Win1252→SJIS）
└── chain_merger.rs         # ★ V4.0 新增：链式重叠合并引擎
```

### 2.3 `lib.rs` 导出声明（V4.0）

```rust
#[macro_use]
extern crate napi_derive;

mod text_normalizer;
mod encoding_detector;
mod chain_merger;
// mod document_formatter;  ← V4.0 删除
// mod duplicate_resolver;   ← V4.0 删除（被 chain_merger 替代）
// mod file_processor;       ← V4.0 删除（合并到 chain_merger）
// mod paragraph_index;      ← V4.0 删除（不再需要段落索引）

use napi::bindgen_prelude::*;

#[napi(object)]
pub struct MergeResult {
    pub merged_text: String,
    pub connection_points: Vec<ConnectionPoint>,
    pub total_chars: u32,
    pub files_metadata: Vec<FileMeta>,
    pub skipped_files: Vec<String>,
    pub encoding_warnings: Vec<String>,
}

#[napi(object)]
pub struct ConnectionPoint {
    pub id: String,
    pub file_a: String,
    pub file_b: String,
    pub overlap_length: u32,
    pub overlap_snippet: String,
    pub is_auto_merged: bool,
    pub position: u32,
}

#[napi]
pub fn merge_files(paths: Vec<String>, threshold: u32) -> Result<MergeResult> { /* ... */ }

#[napi]
pub fn detect_encoding(file_path: String) -> Result<String> { /* ... */ }
```

---

## 第三部分：纯前端 Store 接口（Zustand）

### 3.1 接口通用规范

所有 Store 访问通过 Zustand Hook：

```typescript
import { useStore } from './store/useStore';

const value = useStore((s) => s.fieldName);
const action = useStore((s) => s.actionName);
```

### 3.2 Store 接口清单（V4.0）

#### 3.2.1 文件管理 Actions

| Action | 签名 | 说明 | V4.0 变更 |
| :--- | :--- | :--- | :--- |
| `addFiles` | `(files: File[]) => Promise<void>` | 添加文件，去重 + 格式校验 | 无 |
| `removeFile` | `(path: string) => void` | 移除指定路径的文件 | 无 |
| `clearFiles` | `() => void` | 清空所有文件 + 撤回栈 | 无 |
| `reorderFiles` | `(from: number, to: number) => void` | 拖拽排序 → 触发重新合并 | 无 |

#### 3.2.2 合并引擎 Actions

| Action | 签名 | 说明 | V4.0 变更 |
| :--- | :--- | :--- | :--- |
| `runMerge` | `() => Promise<void>` | 调用 IPC `merge-files` → 更新 mergedText + connectionPoints | ⭐ 新增 |
| `setMergeResult` | `(result: MergeResult) => void` | 设置合并结果 + 构建 connectionStates | ⭐ 新增 |
| `setOverlapThreshold` | `(t: number) => void` | 更新阈值 → 持久化到 IndexedDB → 触发重新合并 | ⭐ 新增 |

#### 3.2.3 连接点控制 Actions

| Action | 签名 | 说明 | V4.0 变更 |
| :--- | :--- | :--- | :--- |
| `toggleConnectionMerge` | `(cpId: string) => void` | 切换连接点的合并/保留状态 → 预览区即时更新 → debounced 500ms 入栈 | ⭐ 新增 |

#### 3.2.4 内容清洗 Actions

| Action | 签名 | 说明 | V4.0 变更 |
| :--- | :--- | :--- | :--- |
| `toggleFullWidth` | `() => Promise<void>` | 全角↔半角双向切换 | 保留（改为操作 mergedText 字符串） |
| `toggleTraditional` | `() => Promise<void>` | 繁↔简双向切换（懒加载引擎） | 保留（改为操作 mergedText 字符串） |

#### 3.2.5 搜索替换 Actions（★ 新增）

| Action | 签名 | 说明 | V4.0 变更 |
| :--- | :--- | :--- | :--- |
| `performSearch` | `(keyword: string) => void` | 搜索 mergedText → searchResults[] → 左侧面板切换为搜索结果 | ⭐ 新增 |
| `replaceOne` | `() => void` | 替换当前焦点匹配项 → 跳至下一项 → 入栈 | ⭐ 新增 |
| `replaceAll` | `() => void` | 全部替换 → Toast「已替换 N 处」→ 入栈 | ⭐ 新增 |
| `clearSearch` | `() => void` | 清空搜索 → 左侧面板恢复为连接点列表 | ⭐ 新增 |

#### 3.2.6 撤回栈 Actions

| Action | 签名 | 说明 | V4.0 变更 |
| :--- | :--- | :--- | :--- |
| `pushSnapshot` | `(reason?: string) => void` | 深拷贝 mergedText + connectionStates + modifiedFlags 入栈 | ✂️ 快照内容从段落模型改为连续文本模型 |
| `undo` | `() => void` | 撤回（undoPointer-- → 恢复快照） | ✂️ 同上 |
| `redo` | `() => void` | 重做（undoPointer++ → 恢复快照） | 无 |
| `clearUndoStack` | `() => void` | 清空撤回栈 | 无 |

#### 3.2.7 对比 Actions

| Action | 签名 | 说明 | V4.0 变更 |
| :--- | :--- | :--- | :--- |
| `setDiffResult` | `(alignment: DiffAlignment[]) => void` | 设置 LCS 对齐结果 | 无 |

#### 3.2.8 导出 Actions

| Action | 签名 | 说明 | V4.0 变更 |
| :--- | :--- | :--- | :--- |
| `exportMergedText` | `() => Promise<void>` | 从 mergedText 排除连接标记 → 调用 IPC `export-file` | ✂️ 入参从段落数组改为连续文本 |
| `revertToExport` | `() => void` | 恢复至最近一次导出前的快照 | 无 |

### 3.3 V4.0 Store 字段清单

```typescript
interface AppState {
    // === 模式 ===
    activeMode: 'merge' | 'compare';

    // === 文件管理 ===
    sortedFileList: SortableFile[];

    // === 合并结果（V4.0 核心数据模型）===
    mergedText: string;                       // 合并后的完整连续文本
    connectionPoints: ConnectionPoint[];       // 连接点列表
    connectionStates: Record<string, boolean>; // 每个连接点的合并/保留状态
    isAnalyzing: boolean;
    analyzeError: string | null;
    overlapThreshold: number;                 // 重叠阈值（默认50）

    // === 搜索替换 ===
    searchKeyword: string;
    replaceText: string;
    caseSensitive: boolean;
    searchResults: SearchResult[];
    currentMatchIndex: number;
    isSearching: boolean;

    // === 清洗状态 ===
    isFullWidthConverted: boolean;
    isTraditionalConverted: boolean;

    // === 撤回栈 ===
    undoStack: Snapshot[];
    undoPointer: number;
    lastExportSnapshot: Snapshot | null;

    // === 文本修改追踪 ===
    modifiedFlags: Set<string>;

    // === 对比 ===
    diffAlignment: DiffAlignment[];

    // === UI 状态 ===
    isDragOverlayVisible: boolean;
    dragOverlayRejecting: boolean;
    connectionListWidth: number;
    toastMessages: ToastMessage[];
}
```

### 3.4 V3.3 → V4.0 Store 变更对照

| V3.3 字段/Action | V4.0 状态 | 替代方案 |
| :--- | :---: | :--- |
| `duplicateGroups` | ❌ 删除 | `connectionPoints` |
| `previewParagraphs` | ❌ 删除 | `mergedText`（string） |
| `paragraphCheckedMap` | ❌ 删除 | `connectionStates` |
| `toggleParagraphCheck` | ❌ 删除 | `toggleConnectionMerge` |
| `toggleGroupCheckV2` | ❌ 删除 | `toggleConnectionMerge` |
| `selectAllParagraphs` | ❌ 删除 | （无——V4.0 无段落勾选概念） |
| `deselectAllParagraphs` | ❌ 删除 | （无） |
| `batchToggleParagraphCheck` | ❌ 删除 | （无） |
| `setAnalysisResult` | ❌ 删除 | `setMergeResult` |
| `scanPreprocessedTexts` 流程 | ❌ 删除 | CJK 转换纯前端完成 |
| — | ⭐ 新增 | `runMerge`, `setOverlapThreshold` |
| — | ⭐ 新增 | `performSearch`, `replaceOne`, `replaceAll`, `clearSearch` |

---

*本文档为 Text Unifier V4.0 接口规范。V4.0 核心数据模型从段落列表重构为连续文本 + 连接点，所有接口定义已与 PRD V4.0 对齐。*

#### 3.2.7 模式切换 Actions

| Action | 签名 | 说明 | V4.0 变更 |
| :--- | :--- | :--- | :--- |
| `setActiveMode` | `(mode: AppMode) => void` | 切换合并/对比模式 | 无 |

#### 3.2.8 文档对比 Actions

| Action | 签名 | 说明 | V4.0 变更 |
| :--- | :--- | :--- | :--- |
| `setDiffResult` | `(alignment, leftFile, rightFile) => void` | 设置对比结果 | 无 |

#### 3.2.9 预览区 Actions

| Action | 签名 | 说明 | V4.0 变更 |
| :--- | :--- | :--- | :--- |
| `setHoveredParagraph` | `(id, sourceFiles?, position?) => void` | 设置悬停段落 | 无 |
| `setLastClickedParagraphId` | `(id: string \| null) => void` | 设置 Shift 锚点 | 无 |
| `jumpToParagraph` | `(index: number) => void` | Minimap 点击跳转 | 无 |
| `_updateMinimap` | `() => void` | 更新 Minimap 色条 | 无 |
| `_markModifiedParagraphs` | `(before, after) => void` | 标记被修改段落 ID | 无 |

#### 3.2.10 V4.0 删除的 Actions

| Action | 说明 | 删除原因 |
| :--- | :--- | :--- |
| ~~`setCleanOptions`~~ | 设置清洗选项 | `cleanOptions` 瘦身，无需独立 setter |
| ~~`setFormatOptions`~~ | 设置排版选项 | 排版增强模块移除 |
| ~~`applyProcessing`~~ | 执行全处理流水线 | 处理流水线简化（仅 CJK 转换） |
| ~~`splitChapters`~~ | 章节分割 | 章节工具模块移除 |
| ~~`reorderChapters`~~ | 章节重排 | 章节工具模块移除 |
| ~~`revertFormatting`~~ | 还原排版 | 排版增强模块移除 |
| ~~`searchNextKeyword`~~ | 搜索下一个关键词 | 关键词搜索移除 |
| ~~`deleteAllKeywordMatches`~~ | 删除所有关键词匹配 | 关键词搜索移除 |

---

## 第四部分：前端工具函数接口

### 4.1 `src/utils/ipc.ts`

| 函数 | 签名 | 说明 | V4.0 变更 |
| :--- | :--- | :--- | :--- |
| `mergeFiles` | `(paths: string[], threshold?: number) => Promise<MergeResult>` | IPC 封装 | ⭐ 新增（替代 scanFiles） |
| `detectEncoding` | `(filePath: string) => Promise<string>` | IPC 封装 | 无 |
| `exportFile` | `(mergedText: string, defaultName: string) => Promise<ExportResult>` | IPC 封装 | ✂️ 入参改为 string |
| `selectTxtFiles` | `() => Promise<FileEntry[]>` | IPC 封装 | 无 |
| `getFilePath` | `(file: File) => string` | 三层降级获取文件路径 | 无 |
| ~~`scanFiles`~~ | — | — | ❌ 删除 |
| ~~`scanPreprocessedTexts`~~ | — | — | ❌ 删除 |

### 4.2 `src/utils/cjkConv.ts`（V4.0 保留）

| 函数 | 签名 | 说明 | V4.0 变更 |
| :--- | :--- | :--- | :--- |
| `toSimplified` | `(text: string) => Promise<string>` | 繁→简转换（懒加载引擎） | 无 |
| `toTraditional` | `(text: string) => Promise<string>` | 简→繁转换（懒加载引擎） | 无 |

### 4.3 `src/utils/diffUtils.ts`（V4.0 保留）

| 函数 | 签名 | 说明 | V4.0 变更 |
| :--- | :--- | :--- | :--- |
| `computeDiffAlignment` | `(left: string[], right: string[]) => DiffAlignment[]` | LCS + Levenshtein 段落对齐 | 无 |
| `wordDiff` | `(a: string, b: string) => DiffToken[]` | 词级差异标记 | 无 |

---

## 第五部分：Electron Main Process 接口

### 5.1 IPC Handler 注册（V4.0）

| Handler | 对应 IPC 通道 | V4.0 变更 |
| :--- | :--- | :--- |
| `ipcMain.handle('merge-files', ...)` | `merge-files` | ⭐ 新增（替代 scan-files） |
| `ipcMain.handle('detect-encoding', ...)` | `detect-encoding` | 无 |
| `ipcMain.handle('export-file', ...)` | `export-file` | ✂️ handler 入参改为 string |
| `ipcMain.handle('select-files', ...)` | `select-files` | 无 |
| ~~`ipcMain.handle('scan-files', ...)`~~ | — | ❌ 删除 |
| ~~`ipcMain.handle('scan-preprocessed-texts', ...)`~~ | — | ❌ 删除 |
| ~~`ipcMain.handle('format-document', ...)`~~ | — | ❌ 删除 |

### 5.2 原生模块加载

```typescript
// electron/main.ts — V4.0 不变
let nativeModule: any;
// 多路径尝试加载 native/index.node
// 方案 1: process.resourcesPath（打包后）
// 方案 2: __dirname 相对路径（开发环境）
// 方案 3: app.getAppPath()（回退）
// 加载失败 → 弹窗「核心引擎加载失败，请重新安装」
```

---

## 第六部分：V4.0 变更汇总（接口层）

| 层级 | 变更类型 | 对象 | 说明 |
| :--- | :--- | :--- | :--- |
| **IPC** | ⭐ 新增 | `merge-files` 通道 | V4.0 链式重叠合并核心接口 |
| **IPC** | ❌ 删除 | `scan-files` 通道 | 被 merge-files 替代 |
| **IPC** | ❌ 删除 | `scan-preprocessed-texts` 通道 | CJK 转换改为纯前端 |
| **IPC** | ❌ 删除 | `format-document` 通道 | 排版增强移除 |
| **Rust napi** | ⭐ 新增 | `merge_files()` 函数 + `chain_merger.rs` | V4.0 核心引擎 |
| **Rust napi** | ❌ 删除 | `scan_files()` / `scan_preprocessed_texts()` / `format_document()` | 被替代或废弃 |
| **Store** | ⭐ 新增 | `runMerge` / `setMergeResult` / `setOverlapThreshold` | 合并引擎 Actions |
| **Store** | ⭐ 新增 | `performSearch` / `replaceOne` / `replaceAll` / `clearSearch` | 搜索替换 Actions（PRD M） |
| **Store** | ⭐ 新增 | `toggleConnectionMerge` | 连接点控制 Action |
| **Store** | ❌ 删除 | `toggleParagraphCheck` / `toggleGroupCheckV2` / `selectAllParagraphs` / `deselectAllParagraphs` / `batchToggleParagraphCheck` | 段落勾选模型移除 |
| **Store** | ❌ 删除 | `duplicateGroups` / `previewParagraphs` / `paragraphCheckedMap` | 段落模型字段移除 |
| **Store** | ❌ 删除 | `formatOptions` / `chapterList` / `cleanOptions.stripArtifacts` 等 | 废弃模块移除 |
| **Store** | ✂️ 精简 | `cleanOptions`（JSON 内容） | 移除 3 个子字段 |
| **Preload** | ❌ 删除 | `formatDocument` 方法 | 排版增强移除 |
| **Main** | ❌ 删除 | `format-document` IPC handler | 同上 |
| **IPC** | ✅ 保留 | `scan-files` / `detect-encoding` / `scan-preprocessed-texts` / `export-file` / `select-files` | 零变更 |
| **Utils** | ✅ 保留 | `cjkConv.ts` / `diffUtils.ts` | 零变更 |

---

*本文档应与 `architecture-v4.0.0.md` 配合阅读，为 V4.0 重构的完整接口规范。*
