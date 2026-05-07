# Text Unifier V1.0.1 - Bug 修复说明

> **修复日期**: 2026-05-06
> **修复范围**: 23 个 Bug（3 Critical + 7 Major + 13 Minor）
> **构建版本**: v1.0.1 (基于 v1.0.0 修复)

---

## 目录

1. [🔴 Critical 修复](#-critical-修复)
2. [🟠 Major 修复](#-major-修复)
3. [🟡 Minor 修复](#-minor-修复)
4. [修复效果验证](#修复效果验证)

---

## 🔴 Critical 修复

---

### BUG-001: 中文内容切片导致 Panic（运行时崩溃）

| 项目 | 内容 |
| :--- | :--- |
| **文件** | `src-tauri/src/paragraph_index.rs` |
| **修复版本** | `make_snippet()` 方法 |
| **严重等级** | 🔴 Critical |

#### 问题原因

```rust
// 原代码（第 110-114 行）
snippet: if fingerprint.content.len() > 30 {
    format!("{}...", &fingerprint.content[..30])  // ← 字节索引！
}
```

Rust 中 `str[..n]` 使用**字节偏移**索引，而中文字符在 UTF-8 编码中占 3 字节。当第 30 字节落在一个中文字符的中间字节时，触发 panic：
```
panicked at 'byte index 30 is not a char boundary'
```

这会导致应用在处理含中文的文件时完全崩溃。

#### 修复逻辑

将字节索引改为字符索引：
```rust
fn make_snippet(content: &str) -> String {
    let char_count = content.chars().count();
    if char_count > 10 {
        let snippet: String = content.chars().take(10).collect();
        format!("{}...", snippet)
    } else {
        content.to_string()
    }
}
```

- `content.chars().take(10)` — 取前 **10 个字符**而非前 30 字节
- 边界安全：`chars()` 迭代器天生逐字符处理，不会落在字符中间

---

### BUG-002: 编码降级策略不支持中文

| 项目 | 内容 |
| :--- | :--- |
| **文件** | `src-tauri/src/file_processor.rs` |
| **修复版本** | `read_file_content()` 方法 |
| **严重等级** | 🔴 Critical |

#### 问题原因

```rust
// 原代码（第 20-24 行）
if had_errors {
    let (latin1_text, _, _) = encoding_rs::WINDOWS_1252.decode(&raw_bytes);
    return Ok(latin1_text.into_owned());
}
```

写死了仅降级为 `WINDOWS_1252`（拉丁文编码）。中文 Windows 的"ANSI"编码实际是 **GBK/GB2312**（Windows 代码页 936），与 `WINDOWS_1252` 完全不兼容。中文用户用记事本保存的"ANSI"编码 .txt 文件全部乱码。

#### 修复逻辑

替换为编码探测链：
```rust
let encodings_to_try = [
    encoding_rs::UTF_8,
    encoding_rs::GB18030,     // 覆盖 GBK/GB2312/GB18030（中文）
    encoding_rs::WINDOWS_1252,// 覆盖西欧语言
    encoding_rs::SHIFT_JIS,   // 覆盖日文
];

for encoding in &encodings_to_try {
    let (text, _actual_encoding, had_errors) = encoding.decode(&raw_bytes);
    if !had_errors {
        // 去除 BOM 后返回
        return Ok(text.trim_start_matches('\u{FEFF}').to_string());
    }
}
```

`encoding_rs::GB18030` 编码器兼容 GBK、GB2312、GB18030 三个中文编码标准，覆盖 Windows 记事本"ANSI"编码场景。

---

### BUG-003: 预览段落顺序不确定

| 项目 | 内容 |
| :--- | :--- |
| **文件** | `src-tauri/src/paragraph_index.rs` |
| **修复版本** | `ParagraphIndex` 结构体 |
| **严重等级** | 🔴 Critical |

#### 问题原因

```rust
// 原代码
pub struct ParagraphIndex {
    fingerprint_map: HashMap<String, ParagraphFingerprint>,
}
// analyze() 中使用 HashMap::drain()
let entries: Vec<_> = self.fingerprint_map.drain().collect();
```

`HashMap` 不保证遍历顺序（SipHash 随机种子），每次程序启动后 `drain()` 的顺序可能不同，违反 PRD 要求。

#### 修复逻辑

将 `HashMap` 替换为 `indexmap::IndexMap`（保持插入顺序的哈希表）：
```rust
use indexmap::IndexMap;

pub struct ParagraphIndex {
    fingerprint_map: IndexMap<String, ParagraphFingerprint>,
}
```

`IndexMap` 在插入时记录顺序，`drain(..)` 按插入顺序输出，保证多次分析同一组文件时预览段落顺序一致。

---

## 🟠 Major 修复

---

### BUG-004: 哈希碰撞处理不够健壮

| 文件 | `src-tauri/src/paragraph_index.rs` |
| :--- | :--- |
| **问题** | 碰撞后生成的 `unique_hash` 格式固定，若再次碰撞则覆盖已有数据 |

**原代码**：
```rust
let unique_hash = format!("{}_collision_{}", hash, entry.sources.len());
```

**修复**：使用 `while` 循环检测碰撞直到找到空位：
```rust
loop {
    unique_hash = format!("{}_collision_{}", hash, collision_idx);
    if !self.fingerprint_map.contains_key(&unique_hash) {
        break;
    }
    collision_idx += 1;
}
```

---

### BUG-005: Regex 在线程间共享

| 文件 | `src-tauri/src/lib.rs` |
| :--- | :--- |
| **问题** | `TextNormalizer` 在主线程创建，在 `par_iter()` 的多个线程中共享访问 |

**原代码**：
```rust
let normalizer = TextNormalizer::new();
paths.par_iter().map(|path| {
    let normalized = normalizer.normalize(&content); // 跨线程共享
});
```

**修复**：将 `TextNormalizer::new()` 移入 `par_iter` 闭包内：
```rust
paths.par_iter().map(|path| {
    let normalizer = TextNormalizer::new(); // 每个线程独立创建
    let normalized = normalizer.normalize(&content);
});
```

---

### BUG-006: 文件元数据未暴露给前端

| 文件 | `src-tauri/src/duplicate_resolver.rs` + `lib.rs` |
| :--- | :--- |
| **问题** | `file_size` 和 `modified` 已读取但未通过 `AnalysisReport` 返回 |

**修复**：在 `AnalysisReport` 中添加 `files_metadata: Vec<FileMeta>` 字段，`scan_files` 命令返回文件大小和修改时间。

---

### BUG-007: Set 类型序列化不兼容

| 文件 | `src/store/useStore.ts` |
| :--- | :--- |
| **问题** | Zustand 中 `Set<string>` 无法被 JSON 序列化 |

**修复**：添加序列化/反序列化辅助函数：
```typescript
export function serializeCheckedHashes(hashes: Set<string>): string[] {
  return Array.from(hashes);
}
export function deserializeCheckedHashes(arr: string[]): Set<string> {
  return new Set(arr);
}
```

---

### BUG-008: 缺少 IPC 调用超时

| 文件 | `src/App.tsx` |
| :--- | :--- |
| **问题** | `scanFiles()` 调用无超时保护，大文件时 UI 无限期 loading |

**修复**：使用 `Promise.race()` 添加 60 秒超时：
```typescript
const timeoutPromise = new Promise<never>((_, reject) =>
  setTimeout(() => reject(new Error('分析超时（60秒）')), SCAN_TIMEOUT_MS)
);
const report = await Promise.race([scanFiles(paths), timeoutPromise]);
```

---

### BUG-009: 导出操作竞态条件

| 文件 | `src/components/ExportButton.tsx` |
| :--- | :--- |
| **问题** | 导出过程中用户可修改勾选状态，导致导出内容与预览不一致 |

**修复**：导出开始时创建 `checkedHashes` 快照：
```typescript
const snapshotHashes = new Set(checkedHashes);
const activePreview = computeActivePreview(originalPreview, snapshotHashes);
```

---

### BUG-010: 文件真实性无验证

| 文件 | `src/components/FileDropZone.tsx` |
| :--- | :--- |
| **问题** | 仅通过 `.txt` 扩展名判断，二进制文件改名后可导入 |

**修复**：添加三项检查：
1. ✅ 扩展名检查（已有）
2. ✅ 文件大小检查（不超过 100MB）
3. ✅ MIME 类型检查（`text/plain` 或 `text/*`）

---

## 🟡 Minor 修复

| ID | 文件 | 问题 | 修复内容 |
| :--- | :--- | :--- | :--- |
| BUG-011 | `text_normalizer.rs` | `normalize_for_display` 未使用 | 添加 `#[allow(dead_code)]` |
| BUG-012 | `file_processor.rs` | 无文件大小上限检查 | 添加 100MB `MAX_FILE_SIZE` 常量 |
| BUG-013 | `lib.rs` | 临时文件在 rename 失败时泄露 | 添加 `TempFileGuard` Drop 守卫 |
| BUG-014 | `lib.rs` | 错误消息未包含失败文件名 | 错误消息格式化为 `文件 '名称' 读取失败: 原因` |
| BUG-015 | `PreviewParagraph.tsx` | mousemove 高频触发状态更新 | 使用 `requestAnimationFrame` 节流 |
| BUG-016 | `Tooltip.tsx` | Tooltip 位置硬编码 | 使用 `getBoundingClientRect` 动态计算 |
| BUG-017 | `useStore.ts` | `resetSession()` 未清理 `fileList` | 添加 `fileList: []` |
| BUG-018 | `App.tsx` | 加载中可重复上传 | 添加 `loadingRef` 防护锁 |
| BUG-019 | `App.tsx` | 异常时未重置 status | 添加 `setStatus('error')` |
| BUG-020 | `ipc.ts` | IPC 调用无重试机制 | 添加指数退避重试（3 次） |
| BUG-021 | `ExportButton.tsx` | 使用 alert() 阻塞式通知 | 替换为非阻塞 Toast 组件 |
| BUG-022 | `file_processor.rs` | `unwrap_or_default` 掩盖错误 | 替换为 `and_then` 链 |
| BUG-023 | `App.tsx` | 缺少 Keyboard/ARIA 无障碍支持 | 添加 `role`、`aria-label`、`aria-live` |

---

## 修复效果验证

### 编译验证

| 检查项 | 状态 |
| :--- | :---: |
| Rust `cargo build --release` | ✅ 零错误 |
| TypeScript `tsc --noEmit` | ✅ 零错误 |
| Vite 前端构建 | ✅ 55 模块，5.26s |
| 最终 exe 大小 | ✅ **5.85 MB** |

### 部署包

| 文件 | 路径 | 大小 |
| :--- | :--- | :--- |
| 可执行文件 | `deploy/TextUnifier_v1.0.1.exe` | 5.85 MB |
| 压缩包 | `deploy/TextUnifier_v1.0.1_fixed.zip` | 2.4 MB |
| Bug 报告 | `deploy/Bug报告.md` | — |

### 剩余 Rust 警告

修复后仍有 2 个 minor 警告（未使用的方法），不影响功能和安全性，可在后续版本清理。

---

*本文档对应 Bug 报告和测试日志中的 23 个问题，逐一记录了问题原因和修复逻辑。*
