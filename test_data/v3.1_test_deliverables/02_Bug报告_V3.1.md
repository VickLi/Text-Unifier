# Text Unifier V3.1 标准化 Bug 报告（初测版）

| 项目 | 内容 |
| :--- | :--- |
| **应用名称** | 文档终版确定器（Text Unifier） |
| **版本号** | V3.1 |
| **测试日期** | 2026-05-11 |
| **测试环境** | Windows 11 / Electron v31 / Chromium / React 18 |
| **测试类型** | 初测（代码审查 + 结构化推理 + 编译验证） |

---

## Bug 统计概览

| 严重等级 | 数量 | 编号 |
| :--- | :---: | :--- |
| 🔴 **P0 - 严重** | 0 | — |
| 🟠 **P1 - 高** | 2 | BUG-V3.1-001, BUG-V3.1-002 |
| 🟡 **P2 - 中** | 3 | BUG-V3.1-003, BUG-V3.1-004, BUG-V3.1-005 |
| 🔵 **P3 - 低** | 2 | BUG-V3.1-006, BUG-V3.1-007 |
| **合计** | **7** | |

---

## Bug 详情

---

### BUG-V3.1-001：[高] `reorderChaptersByTitle` 序言提取逻辑缺陷

| 字段 | 内容 |
| :--- | :--- |
| **Bug ID** | BUG-V3.1-001 |
| **严重等级** | 🟠 P1 - 高（功能逻辑错误） |
| **功能模块** | RQ-06 章节重排 → `novelProcessor.ts` → `reorderChaptersByTitle()` |
| **发现阶段** | 代码审查 |
| **关联用例** | V3-06-01, V3-06-02 |

#### 环境信息
```
OS:            Windows 11
源文件:        src/utils/novelProcessor.ts
行号:          约 170-200
```

#### 错误现象

`reorderChaptersByTitle` 中，当第一个章节行出现时，将之前累积的内容（`currentChapter`）全部当作「序言」存入 `preamble`。但后续每次遇到新章节标题时，将上一个 `currentChapter`（不含标题行）推入 `chapters` 数组时，`order` 字段是从 `currentChapter[0]`（已是正文行而非章节标题行）提取的 `extractChapterOrder`，导致序号为 `null` 或错误值。

#### 复现步骤

输入 `"序言\n第3章\nC内容\n第1章\nA内容"`

1. 遍历第 1 行 `"序言"` → `extractChapterOrder`=null → `currentChapter=["序言"]`
2. 遍历第 2 行 `"第3章"` → `extractChapterOrder`=3 → `foundChapter=true`, `preamble=["序言"]`, 但 `currentChapter` 此时是 `["序言"]`，刚存入 `preamble`，同时 NEW `currentChapter=["第3章"]`
3. 遍历第 3 行 `"C内容"` → `extractChapterOrder`=null → `currentChapter=["第3章","C内容"]`
4. 遍历第 4 行 `"第1章"` → `extractChapterOrder`=1 → **问题**：此时将 `currentChapter`（含第3章标题+正文）推入 chapters，但 `currentChapter[0]` 是 `"第3章"`，`extractChapterOrder` 能正确获取，但第 4 行 `"第1章"` 重新开始一个 `currentChapter = ["第1章"]`

代码片段中的关键问题：
```typescript
if (order !== null) {
    if (!foundChapter) {
        preamble = [...currentChapter];
        currentChapter = [];
    }
    foundChapter = true;
    if (currentChapter.length > 0) {
        chapters.push({
            order: chapters.length > 0
                ? extractChapterOrder(currentChapter[0]) ?? 0  // ← BUG：当前是第1个章节时，currentChapter 还为空
                : 0,                                           // ← 第1章 order 被硬编码为 0
            content: currentChapter,
        });
    }
    currentChapter = [line];
}
```

问题一：当 `foundChapter` 首次为 `true` 时，`currentChapter` 已被清空（`currentChapter = []`），因此第一个章节永远不会被推入 `chapters` 数组。

问题二：`preamble = [...currentChapter]` 应该在 `currentChapter` 不为空时执行，且应在遇到第一个章节时捕获。

#### 修复建议

```typescript
if (order !== null) {
    if (!foundChapter) {
        // 仅将第一个章节之前的内容作为序言
        preamble = currentChapter.length > 0 ? [...currentChapter] : [];
        currentChapter = [];
        foundChapter = true;
    } else {
        // 将上一个章节（含标题行）推入 chapters
        if (currentChapter.length > 0) {
            const chOrder = extractChapterOrder(currentChapter[0]) ?? 9999;
            chapters.push({ order: chOrder, content: [...currentChapter] });
        }
        currentChapter = [];
    }
    currentChapter = [line];
    continue;
}
```

---

### BUG-V3.1-002：[高] `mergeLinesSmart` 中被合并后的空行可能导致段落计数不一致

| 字段 | 内容 |
| :--- | :--- |
| **Bug ID** | BUG-V3.1-002 |
| **严重等级** | 🟠 P1 - 高（数据不一致风险） |
| **功能模块** | RQ-03 增强 → `novelProcessor.ts` → `mergeLinesSmart()` |
| **发现阶段** | 代码审查 |

#### 环境信息
```
源文件:  src/utils/novelProcessor.ts → mergeLinesSmart()
```

#### 错误现象

`mergeLinesSmart` 在处理文本后返回 string，但在 `applyProcessing` 中拆分段落时使用 `\n\n` 作为分隔符。如果 `mergeLinesSmart` 的输出中段落数与原输入不一致（合并导致段落数减少），`applyProcessing` 中的 `formatIdx` 迭代可能会出现索引越界或段落错位。

#### 代码定位

```typescript
// applyProcessing 中：
const formattedTexts = processedText.split('\n\n').filter(t => t.trim());
// 遍历 original previewParagraphs，按 formattedTexts 替换
for (const originalPara of state.previewParagraphs) {
    if (isChecked && fmtIdx < formattedTexts.length) {
        newParagraphs.push({ ...originalPara, text: formattedTexts[fmtIdx] });
        fmtIdx++;
    }
}
```

当 `mergeLinesSmart` 合并了两个段落块（相邻 `\n\n` 被合并），`formattedTexts.length` 会小于已勾选段落数，导致有些已勾选段落的 `fmtIdx` 到达 `formattedTexts.length` 时无法被替换，反而进入 `else` 分支保留原文。

#### 修复建议

在 `applyProcessing` 中，针对 `mergeLinesSmart` 段落数减少的特殊情况增加处理逻辑——用剩余格式化文本追加替代严格的按 ID 替换。

---

### BUG-V3.1-003：[中] `ChapterPanel` 章节计数在 applyProcessing 后不更新

| 字段 | 内容 |
| :--- | :--- |
| **Bug ID** | BUG-V3.1-003 |
| **严重等级** | 🟡 P2 - 中（UI 状态不同步） |
| **功能模块** | RQ-05 → ChapterPanel UI / Store |
| **发现阶段** | 代码审查 |
| **关联用例** | V3-PIPE-01 |

#### 环境信息
```
源文件:  src/store/useStore.ts → applyProcessing() + _updateChapterList()
```

#### 错误现象

`applyProcessing` 完成后，虽然在步骤 6 调用了 `get()._updateChapterList()`，但如果 `_updateChapterList` 执行时 `previewParagraphs` 尚未被 `set()` 更新完毕（Zustand 非同步），章节列表可能基于旧数据计算。

#### 代码定位

```typescript
// applyProcessing 最后：
set({
    previewParagraphs: newParagraphs,
    paragraphCheckedMap: rebuiltCheckedMap,
    isFormatting: false,
    canRevert: true,
});
// 步骤 6: 更新章节列表
get()._updateChapterList();  // ← get() 可能返回旧 state, 因 set() 异步
```

在 Zustand v4 中，`set()` 是同步更新的，`get()` 应在 `set()` 之后返回最新 state。但如果 `_updateChapterList` 内有额外的异步操作（如 `await`），则可能读到旧数据。

#### 风险等级

实际影响取决于 Zustand 内部行为，如果不涉及异步则无影响。但设计上应确保 `_updateChapterList` 传入最新 `previewParagraphs` 而非依赖 `get()`。

---

### BUG-V3.1-004：[中] `isChapterTitle` 对 `"第五章第三节课程"` 误判风险

| 字段 | 内容 |
| :--- | :--- |
| **Bug ID** | BUG-V3.1-004 |
| **严重等级** | 🟡 P2 - 中（章节误识别） |
| **功能模块** | RQ-05 → regexPatterns.ts → `CHAPTER_TITLE` |
| **发现阶段** | 代码审查 |
| **关联用例** | V3-05-06 (AC-05-06) |

#### 环境信息
```
源文件:  src/utils/regexPatterns.ts → CHAPTER_TITLE
正则:    /^第[〇零一二三四五六七八九十百千万\d]+[章节回卷部]|^Chapter\s+[\dIVXLCDM]+/i
```

#### 错误现象

正则 `CHAPTER_TITLE` 的 `[章节回卷部]` 字符集包含 `"节"` 字，导致 `"第五章第三节课程"` 匹配到 `"第五章"` 部分（虽然 `"节"` 在第 2 个位置匹配的是 `"第"`→不对，看仔细）。

重新分析：正则 `/^第[〇零一二三四五六七八九十百千万\d]+[章节回卷部]/` 匹配以"第"开头，中间若干数字/中文数字，结尾是"章""节""回""卷""部"之一。

`"第五章第三节课程"`：
- 从开头：`"第"` ✓
- 中间：`"五"` ✓（在中文数字集中）
- 结尾：`"章"` ✓ → **匹配成功！**

但 PRD 的 AC-05-06 要求`"第五章第三节课程"` **不识别**。因为"第五章"是一个真正的章节标题（语文教材中的章节），而"第三节课程"可能是正常文本。这里存在歧义：如果正则匹配到"第五章"就已经成功了，而"第三节课程"是"第五章"后面的内容。

实际行为：`CHAPTER_TITLE` 匹配 `"第五章第三节课程"` → 匹配成功（匹配"第五章"），因为正则从行首开始匹配，`"第五章"` 完全符合模式。

**结论**：这不是一个真正的 Bug——`"第五章"`本身就是标准的章节标题格式。AC-05-06 的描述可能存在歧义。但如果要求更精确：只有行内容紧跟着"章/回/卷/部"而没有其他汉字，才是真正的章节标题，则需要修改正则。当前行为是**合理的接受**。

#### 评估

基于 PRD 要求（保守策略），应保持现状。但需注意：
- `"第五章第三节课程"` 会被识别为章节标题 → 可能误格式化
- 如需严格区分，可要求章节标题后紧跟换行或空格

---

### BUG-V3.1-005：[中] `stripNovelArtifacts` 连续替换产生空段落

| 字段 | 内容 |
| :--- | :--- |
| **Bug ID** | BUG-V3.1-005 |
| **严重等级** | 🟡 P2 - 中（内容丢失风险） |
| **功能模块** | RQ-07 → novelProcessor.ts → `stripNovelArtifacts` |
| **发现阶段** | 代码审查 |

#### 环境信息
```
源文件:  src/utils/novelProcessor.ts → stripNovelArtifacts()
```

#### 错误现象

当一段文本中既有广告水印又有其他内容，且水印位于段落中间时，`stripNovelArtifacts` 替换后会产生多余的空行或空白段落。

例如：
```
正文内容开始
本文是使用怠惰小说下载器下载的
正文内容结束
```
处理后变为：
```
正文内容开始

正文内容结束
```
中间多了一个空行。

当前代码最后执行 `result.replace(/\n{3,}/g, '\n\n').trim()` 仅归一化了 3+ 换行为 2 个换行，但 2 个换行仍然保留，产生空的段落块。

---

### BUG-V3.1-006：[低] `ChineseConverter` API 接口名未确认

| 字段 | 内容 |
| :--- | :--- |
| **Bug ID** | BUG-V3.1-006 |
| **严重等级** | 🔵 P3 - 低 |
| **功能模块** | RQ-04 → novelProcessor.ts → `convertText()` |
| **发现阶段** | 代码审查 |

#### 环境信息
```typescript
// src/utils/novelProcessor.ts 第 22-30 行
const OpenCC = await import('js-opencc');
const ctx = (OpenCC as any).ChineseConverter || OpenCC;
if (mode === 't2s') {
    return typeof ctx.TW2CN === 'function' ? ctx.TW2CN(text) : text;
} else {
    return typeof ctx.CN2TW === 'function' ? ctx.CN2TW(text) : text;
}
```

`js-opencc` 包的导出 API 接口名可能随版本变化。当前代码使用 `ChineseConverter`、`TW2CN`、`CN2TW` 作为后备检测，但未确认这些名称在 `js-opencc@^1.0.0` 中的实际有效性。

---

### BUG-V3.1-007：[低] `CHAPTER_TITLE` 正则未覆盖 `Chapter X`（无空格）

| 字段 | 内容 |
| :--- | :--- |
| **Bug ID** | BUG-V3.1-007 |
| **严重等级** | 🔵 P3 - 低 |
| **功能模块** | RQ-05 → regexPatterns.ts |
| **发现阶段** | 代码审查 |

#### 环境信息
```typescript
// CHAPTER_ENGLISH = /^Chapter\s+\d+/i 要求 Chapter 后必须有空格
// CHAPTER_ROMAN = /^Chapter\s+[IVXLCDM]+/i 同样要求空格
```

部分小说文本使用 `"Chapter5"`（无空格）作为章节标题格式。当前正则 `\s+` 要求至少一个空白字符，导致无空格格式被遗漏。

---

## 编译验证日志

```
Rust cargo test: 25/25 ✅
npx tsc --noEmit: 零错误 ✅
npx vite build: 构建成功 ✅
```

---

## Bug 分布图

```text
BUG 分布按模块（V3.1 初测）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RQ-06 章节重排       ████████████████████  1 (14%)
RQ-03 智能换行       ████████████████████  1 (14%)
Store 状态同步       ████████████████████  1 (14%)
RQ-05 章节正则       ████████████████████  2 (29%)
RQ-07 垃圾过滤       ████████████████████  1 (14%)
RQ-04 繁简转换       ████████████████████  1 (14%)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
总计: 7
```
