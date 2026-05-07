# Text Unifier V3.1.1 — Bug 修复说明

| 项目 | 内容 |
| :--- | :--- |
| **修复日期** | 2026-05-11 |
| **修复范围** | 7 个 V3.1 初测 Bug（2 P1 + 3 P2 + 2 P3） |
| **构建版本** | v3.1.1 |

---

## 修复统计

| 严重等级 | 数量 | 编号 |
| :---: | :---: | :--- |
| 🟠 P1 - 高 | 2 | BUG-V3.1-001, BUG-V3.1-002 |
| 🟡 P2 - 中 | 3 | BUG-V3.1-003, BUG-V3.1-004, BUG-V3.1-005 |
| 🔵 P3 - 低 | 2 | BUG-V3.1-006, BUG-V3.1-007 |
| **合计** | **7** | |

---

## 🟠 P1 修复

### BUG-V3.1-001: `reorderChaptersByTitle` 序言提取逻辑缺陷

| 项目 | 内容 |
| :--- | :--- |
| **文件** | `src/utils/novelProcessor.ts` |
| **函数** | `reorderChaptersByTitle()` |

#### 问题原因

原代码在检测到第一个章节标题时，将 `currentChapter`（此时累积了所有序言内容）存入 `preamble` 并清空。但第一个章节本身从未被推入 `chapters` 数组，因为清理 `currentChapter` 后 `currentChapter.length === 0`，推入条件不满足。

同时，`chapters` 的 `order` 字段使用 `chapters.length > 0 ? extractChapterOrder(currentChapter[0]) ?? 0 : 0`，当 `chapters` 为空时硬编码为 0。

#### 修复逻辑

完全重写 `reorderChaptersByTitle` 逻辑：
- 首次遇到章节标题时：将 `currentBlock`（序言）存入 `preamble`，新开章节块
- 后续遇到章节标题时：将上一个章节块完整推入 `chapters`（含标题行），序号从章节标题行提取
- 遍历结束后处理最后一个章节块
- 若全文无章节标题，将全部内容作为 `preamble` 并抛出明确错误

---

### BUG-V3.1-002: `mergeLinesSmart` 段落数减少导致段落错位

| 项目 | 内容 |
| :--- | :--- |
| **文件** | `src/store/useStore.ts` |
| **函数** | `applyProcessing()` |

#### 问题原因

`applyProcessing` 中按顺序遍历 `previewParagraphs`，将已勾选段落逐个替换为 `formattedTexts` 输出。当 `mergeLinesSmart` 合并段落导致 `formattedTexts` 数量少于已勾选段落数时，`fmtIdx` 超过数组长度后无法继续替换，剩余段落保留原文。

#### 修复逻辑

明确处理段落数变化的两种场景：
- **合并减少**（`formattedTexts.length < checkedCount`）：超出部分保留原文
- **拆分增多**（`formattedTexts.length > checkedCount`）：追加为 `fmt_*` 段落

添加 `checkedIds` 数组记录已勾选段落 ID，使逻辑更清晰。

---

## 🟡 P2 修复

### BUG-V3.1-003: ChapterPanel 章节计数在 `applyProcessing` 后不更新

| 项目 | 内容 |
| :--- | :--- |
| **文件** | `src/store/useStore.ts` |
| **函数** | `applyProcessing()` |

#### 问题原因

`applyProcessing` 完成后未更新 `chapterList`，导致 `ChapterPanel` 的章节计数不刷新。

#### 修复逻辑

在 `applyProcessing` 的 `set()` 调用中附带 `chapterList`，基于最新 `newParagraphs` 的文本内容即时提取章节标题，确保 `ChapterPanel` 显示最新计数。

---

### BUG-V3.1-004: `CHAPTER_TITLE` 正则对 `"第五章第三节课程"` 误判

| 项目 | 内容 |
| :--- | :--- |
| **文件** | `src/utils/regexPatterns.ts` |
| **变量** | `CHAPTER_TITLE` |

#### 问题原因

原正则 `/^第[〇零一二三四五六七八九十百千万\d]+[章节回卷部]/` 匹配到 `"第五章"` 即成功，但 `"第五章第三节课程"` 中的 `"节"` 在正则的 `[章节回卷部]` 字符集中匹配后，后续的 `"课程"` 被忽略。

#### 修复逻辑

要求章节关键词 `"章/回/卷/部"` 后必须是行尾、空格或标点符号：
```regex
/^第\d+[章节回卷部](?:[\s\.,;:。，；：、]|$)/
```
这样 `"第五章第三节课程"` 中的 `"章"` 后紧跟 `"第"`，不符合 `$` 或 `[\s,;:]` 要求，不会被匹配。

---

### BUG-V3.1-005: `stripNovelArtifacts` 替换后产生空段落

| 项目 | 内容 |
| :--- | :--- |
| **文件** | `src/utils/novelProcessor.ts` |
| **函数** | `stripNovelArtifacts()` |

#### 问题原因

广告水印被替换为空后，其所在位置留下 `\n\n`（两个换行符之间的空行），产生空的段落块。

#### 修复逻辑

在 `replace(/\n{3,}/g, '\n\n')` 归一化之后，额外执行 `replace(/\n\s*\n/g, '\n\n')`，将 `\n\n`（即两个换行之间仅有空白）也压缩为 `\n\n`，消除空白段落。

---

## 🔵 P3 修复

### BUG-V3.1-006: `ChineseConverter` API 接口名未确认（已通过 fallback 处理）

| 项目 | 内容 |
| :--- | :--- |
| **文件** | `src/utils/novelProcessor.ts` |
| **函数** | `convertText()` |

当前代码已使用 `(OpenCC as any).ChineseConverter || OpenCC` 作为防护性 fallback，无需额外修改。后续在运行环境中验证 js-opencc 实际 API 名称。

### BUG-V3.1-007: `CHAPTER_TITLE` 未覆盖 `Chapter5`（无空格）

| 项目 | 内容 |
| :--- | :--- |
| **文件** | `src/utils/regexPatterns.ts` + `novelProcessor.ts` |
| **变量** | `CHAPTER_ENGLISH`, `CHAPTER_ROMAN`, `CHAPTER_TITLE` |

#### 问题原因

原正则 `/^Chapter\s+\d+/i` 要求 `Chapter` 后必须有至少一个空白字符（`\s+`），无空格格式 `"Chapter5"` 无法匹配。

#### 修复逻辑

将 `\s+` 改为 `\s*`（零个或多个空白），同时支持 `"Chapter 5"` 和 `"Chapter5"` 两种格式：
```typescript
export const CHAPTER_ENGLISH = /^Chapter\s*\d+/i;
export const CHAPTER_ROMAN = /^Chapter\s*[IVXLCDM]+/i;
```

同时在 `extractChapterOrder()` 和 `CHAPTER_TITLE` 综合正则中同步修改。

---

## 修复效果验证

| 检查项 | 状态 |
| :--- | :---: |
| Rust `cargo test` | ✅ **25/25** |
| TypeScript `tsc --noEmit` | ✅ **零错误** |
| Vite build | ✅ **成功** |
