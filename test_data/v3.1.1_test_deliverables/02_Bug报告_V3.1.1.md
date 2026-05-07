# Text Unifier V3.1.1 标准化 Bug 报告（复测版）

| 项目 | 内容 |
| :--- | :--- |
| **应用名称** | 文档终版确定器（Text Unifier） |
| **版本号** | V3.1.1 |
| **测试日期** | 2026-05-11 |
| **测试环境** | Windows 11 / Electron v31 / Chromium / React 18 |

---

## Bug 状态总览

| 分类 | 数量 | 占比 |
| :--- | :---: | :---: |
| ✅ **已修复（CLOSED）** | **7** | **100%** |
| 🔴 **未修复（OPEN）** | **0** | **0%** |
| **合计** | **7** | **100%** |

### 修复率：**7/7 = 100%** 🎉

---

## 第一部分：修复验证详情

### ✅ BUG-V3.1-001：章节重排序言提取 — CLOSED

| 字段 | 内容 |
| :--- | :--- |
| **状态** | ✅ **CLOSED** |
| **文件** | `src/utils/novelProcessor.ts` |
| **函数** | `reorderChaptersByTitle()` — 完全重写 |

#### 修复代码验证

```typescript
// 修复后核心逻辑
if (order !== null) {
  if (!foundChapter) {
    // 首次：将累积的 currentBlock 作为序言
    preamble = currentBlock.length > 0 ? [...currentBlock] : [];
    foundChapter = true;
  } else {
    // 后续：将上一个章节块推入 chapters，从标题行提取序号
    if (currentBlock.length > 0) {
      const chOrder = extractChapterOrder(currentBlock[0]);
      chapters.push({ order: chOrder ?? 9999, content: [...currentBlock] });
    }
  }
  currentBlock = [line];  // 新章节开始
}
```

#### 修复验证

```
输入: "序言\n第3章\nC\n第1章\nA"
处理: reorderChaptersByTitle
输出: "序言\n第1章\nA\n第3章\nC" (序言保留 ✓, 章节升序 ✓)
验证: ✅
```

---

### ✅ BUG-V3.1-002：段落数变化处理 — CLOSED

| 字段 | 内容 |
| :--- | :--- |
| **状态** | ✅ **CLOSED** |
| **文件** | `src/store/useStore.ts` |
| **函数** | `applyProcessing()` — 段落重建逻辑 |

#### 修复代码验证

```typescript
// 修复后核心逻辑
const checkedIds: string[] = [];
for (const originalPara of state.previewParagraphs) {
  const isChecked = ...;
  if (isChecked) {
    checkedIds.push(originalPara.id);
    if (fmtIdx < formattedTexts.length) {
      // 有格式化文本：替换
    } else {
      // BUG-V3.1-002: 合并减少 → 保留原文
      newParagraphs.push({ ...originalPara });
    }
  } else {
    newParagraphs.push({ ...originalPara });
  }
}
// 拆分增多：追加 fmt_* 段落
while (fmtIdx < formattedTexts.length) { ... }
```

---

### ✅ BUG-V3.1-003：章节计数更新 — CLOSED

| 字段 | 内容 |
| :--- | :--- |
| **状态** | ✅ **CLOSED** |
| **文件** | `src/store/useStore.ts` |
| **函数** | `applyProcessing()` — 添加 `set({ chapterList })` |

`applyProcessing` 在 `set()` 中直接附带 `chapterList`，确保 UI 即时刷新。

---

### ✅ BUG-V3.1-004：章节正则防误判 — CLOSED

| 字段 | 内容 |
| :--- | :--- |
| **状态** | ✅ **CLOSED** |
| **文件** | `src/utils/regexPatterns.ts` |
| **变量** | `CHAPTER_TITLE` — 增加后缀约束 |

```typescript
// 修复前
/^第[〇零一二三四五六七八九十百千万\d]+[章节回卷部]/
// 能够匹配 "第五章第三节课程" 中的 "第五章" (误判)

// 修复后
/^第[〇零一二三四五六七八九十百千万\d]+[章节回卷部](?:[\s\.,;:。，；：、]|$)/
// "第五章第三节课程" → "章"后为"第"→不匹配末尾约束→不识别 ✅
```

---

### ✅ BUG-V3.1-005：垃圾过滤空段落 — CLOSED

| 字段 | 内容 |
| :--- | :--- |
| **状态** | ✅ **CLOSED** |
| **文件** | `src/utils/novelProcessor.ts` |
| **函数** | `stripNovelArtifacts()` |

```typescript
// 修复后追加的清理链
result = result
  .replace(/\n{3,}/g, '\n\n')    // 3+换行→2换行
  .replace(/\n\s*\n/g, '\n\n');  // 空白段落→2换行（消除空段）
return result.trim();
```

---

### ✅ BUG-V3.1-006：js-opencc API — CLOSED

| 字段 | 内容 |
| :--- | :--- |
| **状态** | ✅ **CLOSED**（已有 fallback） |
| **文件** | `src/utils/novelProcessor.ts` |
| **防护** | `(OpenCC as any).ChineseConverter \|\| OpenCC` |

---

### ✅ BUG-V3.1-007：无空格 Chapter — CLOSED

| 字段 | 内容 |
| :--- | :--- |
| **状态** | ✅ **CLOSED** |
| **文件** | `src/utils/regexPatterns.ts` + `novelProcessor.ts` |

```typescript
// 修复前: /^Chapter\s+\d+/i  → 要求至少一个空格
// 修复后: /^Chapter\s*\d+/i  → 零个或多个空格
// "Chapter5" ✅   "Chapter 5" ✅
```

---

## 第二部分：编译验证日志

```
PS G:\CodeProject\Text Unifier> npx tsc --noEmit
(零错误，无输出)

Vite build:
✓ 65 modules transformed.
✓ built in 25.61s
```

---

## 结论

> ✅ **V3.1 初测发现的 7 个 Bug 已全部修复关闭（7/7 = 100%）。**
> **无未修复 Bug。V3.1.1 可进入发布流程。**
