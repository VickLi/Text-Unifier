# Text Unifier × Novel Processor — 功能集成分析报告

> **分析日期**: 2026-05-11
> **源项目**: [rockbenben/novel-processor](https://github.com/rockbenben/novel-processor)
> **许可证**: MIT（允许集成、修改、商用）
> **目标**: 将 novel-processor 的小说文本处理功能整合到 Text Unifier V3.1

---

## 一、项目对比总览

### 1.1 定位差异

| 维度 | Text Unifier (本项) | Novel Processor (开源) |
| :--- | :--- | :--- |
| **核心定位** | 多文件合并 + 去重 | 单文件内容清洗 + 排版 |
| **使用场景** | 多个 TXT 合并为一个，去重 | 单本下载小说格式修复 |
| **用户流程** | 拖入多文件 → 去重合并 → 导出 | 上传/粘贴 → 勾选功能 → 处理 |
| **桌面框架** | Tauri V2 → Electron V3 | Web App (Next.js + Ant Design) |
| **技术栈** | Rust + React + TypeScript | React + TypeScript |
| **后端引擎** | Rust (napi-rs) | 纯 TypeScript (浏览器端) |

### 1.2 功能矩阵对比

| 功能 | Novel Processor | Text Unifier (当前) | 集成价值 |
| :--- | :---: | :---: | :---: |
| **智能换行（标点感知）** | ✅ | ⚠️ 有（去硬回车，但无章节感知） | ⭐⭐⭐⭐⭐ |
| **章节标题识别/格式化** | ✅ | ❌ | ⭐⭐⭐⭐⭐ |
| **章节重排（按序号排序）** | ✅ | ❌ | ⭐⭐⭐⭐ |
| **章节分割（标题分行）** | ✅ | ❌ | ⭐⭐⭐⭐ |
| **段落缩进（首行两空格）** | ✅ | ❌ | ⭐⭐⭐⭐ |
| **繁简转换（OpenCC）** | ✅ | ❌ | ⭐⭐⭐⭐⭐ |
| **内容筛选（关键词过滤）** | ✅ | ❌ | ⭐⭐⭐⭐ |
| **行尾去噪（页码清除）** | ✅ | ❌ | ⭐⭐⭐⭐ |
| **垃圾内容过滤（广告/水印）** | ✅ | ❌ | ⭐⭐⭐⭐⭐ |
| **去除相邻重复行** | ✅ | ❌ | ⭐⭐⭐ |
| **全角转半角** | ✅ | ❌ | ⭐⭐⭐ |
| **长段落优化（智能拆分）** | ✅ | ❌ | ⭐⭐⭐ |
| **编码检测（jschardet）** | ✅ | ✅ (Rust内置) | 不集成 |
| **文件间去重** | ❌ | ✅ (V1.1 核心) | — |
| **多文件合并** | ❌ | ✅ (V1.0 核心) | — |
| **段落级勾选删除** | ❌ | ✅ (V2.0) | — |
| **文件拖拽排序** | ❌ | ✅ (V2.0) | — |
| **预览溯源（来源浮层）** | ❌ | ✅ (V1.0) | — |

---

## 二、功能重叠分析

### 2.1 重叠区：智能换行 vs 文档排版

| 维度 | Novel Processor "智能换行" | Text Unifier "文档排版(去硬回车)" |
| :--- | :--- | :--- |
| **触发方式** | 自动（始终执行） | 手动点击按钮 |
| **核心逻辑** | 标点判定 + 章节保护 + 段落缩进 | 空行分隔 + 缩进检测 + 列表保护 |
| **章节感知** | ✅ 章节标题不合并 | ❌ 无章节概念 |
| **输出产物** | 格式化文本（含缩进） | 合并段落文本（无缩进） |
| **保护机制** | 特殊起始行、纯数字行、特殊字符行 | 列表标记行（保守检测） |

> **结论**: Novel Processor 的智能换行更成熟，建议**替代** Text Unifier 当前的文档排版功能。

### 2.2 重叠区：去重

| 维度 | Novel Processor | Text Unifier |
| :--- | :--- | :--- |
| **去重粒度** | **相邻行**去重（trim 后比较） | **段落级**跨文件去重（SHA-256） |
| **去重范围** | 同一文件内 | 不同文件之间 |
| **实现** | 简单 trim + 比较 | Rust SHA-256 + HashMap |

> **结论**: 两种去重模型互补，不冲突。保留 Text Unifier 的跨文件去重，新增 Novel Processor 的相邻行去重作为内容清洗选项。

---

## 三、推荐集成方案

### 3.1 版本规划

```
V3.0 (已完成规划) — Electron 框架迁移（功能无变化）
    │
    ▼
V3.1 (本次规划) — 集成 Novel Processor 内容清洗功能
```

### 3.2 V3.1 新增功能清单

| 编号 | 功能 | 来源 | 实现方式 | 优先级 |
| :---: | :--- | :--- | :--- | :---: |
| RQ-04 | **繁简转换** | novel-processor | 集成 `js-opencc` npm 包 | P0 |
| RQ-05 | **章节识别与格式化** | novel-processor | 移植 `novelUtils.ts` 正则 + 逻辑 | P0 |
| RQ-06 | **章节重排** | novel-processor | 移植 `reorderChaptersByTitle()` | P0 |
| RQ-07 | **垃圾内容过滤** | novel-processor | 移植 `stripNovelArtifacts()` | P0 |
| RQ-08 | **内容筛选（关键词）** | novel-processor | 移植 `filterLines()` | P1 |
| RQ-09 | **段落缩进** | novel-processor | 纯逻辑实现（段首加两个全角空格） | P1 |
| RQ-10 | **相邻重复行去重** | novel-processor | 移植 `removeAdjacentDuplicateLines()` | P1 |
| RQ-11 | **行尾数字清除** | novel-processor | 移植 `removeLineEndNumbers()` | P2 |
| RQ-12 | **全角转半角** | novel-processor | 移植 `toHalfWidth()` | P2 |
| RQ-13 | **长段落智能拆分** | novel-processor | 移植 `splitParagraph()` | P2 |

### 3.3 不集成的功能

| 功能 | 原因 |
| :--- | :--- |
| 编码检测 (jschardet) | Text Unifier 已有 Rust 原生的编码探测链（UTF-8 → GB18030 → WINDOWS-1252 → SHIFT-JIS），更精准 |
| Web UI 框架 (Ant Design / Next.js) | Text Unifier 是桌面应用，使用 Tailwind CSS 自有组件体系 |
| 文本粘贴模式 | Text Unifier 的定位是文件处理工具，粘贴模式与核心场景冲突 |
| 多文件批量自动导出 | Text Unifier 已有更灵活的段落勾选导出机制 |

---

## 四、技术集成路径

### 4.1 实现策略

```
                 ┌──────────────────────────────┐
                 │     Novel Processor 源码       │
                 │  novelUtils.ts (187行)         │
                 │  utils/textUtils.ts (154行)     │
                 │  utils/regex.ts (24行)         │
                 └──────────┬───────────────────┘
                            │
              提取纯函数，去除 Web/Next.js 依赖
                            │
                            ▼
                 ┌──────────────────────────────┐
                 │  Text Unifier V3.1            │
                 │  src/utils/novelProcessor.ts  │  ← 新增：移植的核心逻辑
                 │  src/utils/regex.ts           │  ← 新增：共享正则
                 └──────────┬───────────────────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
              ▼             ▼             ▼
        [合并前处理]   [合并后处理]   [导出前处理]
        繁简转换       章节识别      段落缩进
        全角转半角     章节重排      相邻行去重
        垃圾过滤       智能换行      行尾去噪
                       内容筛选
```

### 4.2 处理流水线（V3.1 完整流程）

```text
[用户拖入 .txt 文件]
       ↓
[文件排序列表]  ← 不变
       ↓
┌──────────────────────────────────────────────┐
│ V3.1 新增：内容清洗预处理（每文件独立执行）     │
│                                              │
│  1. 繁简转换 (RQ-04)：OpenCC 处理              │
│  2. 全角转半角 (RQ-12)                        │
│  3. 垃圾内容过滤 (RQ-07)：stripNovelArtifacts  │
│  4. 行尾数字清除 (RQ-11)                       │
└──────────────┬───────────────────────────────┘
               ↓
[文件间去重合并]  ← V1.1 核心，不变
       ↓
┌──────────────────────────────────────────────┐
│ V3.1 新增：合并后排版增强                      │
│                                              │
│  5. 章节识别与格式化 (RQ-05)                   │
│  6. 章节重排 (RQ-06) — 可选开关                │
│  7. 智能换行增强 — 章节感知合并                │
│  8. 内容筛选 (RQ-08)                          │
│  9. 相邻重复行去重 (RQ-10)                     │
│ 10. 段落缩进 (RQ-09)                          │
│ 11. 长段落拆分 (RQ-13) — 可选开关             │
└──────────────┬───────────────────────────────┘
               ↓
[预览 + 段落勾选]  ← 不变
       ↓
[导出纯净 .txt]  ← 不变
```

### 4.3 新增文件清单

| 文件 | 说明 | 行数(估) |
| :--- | :--- | :---: |
| `src/utils/novelProcessor.ts` | 章节识别、重排、分割、垃圾过滤、行尾去噪 | ~200 |
| `src/utils/regexPatterns.ts` | 章节标题、标点、数字正则（提取共享常量） | ~30 |
| `src/components/CleanOptions.tsx` | V3.1 新增：内容清洗选项面板 | ~150 |
| `src/components/ChapterTools.tsx` | V3.1 新增：章节工具面板 | ~80 |

### 4.4 修改文件清单

| 文件 | 变更 |
| :--- | :--- |
| `src/store/useStore.ts` | 新增清洗选项状态、章节工具状态 |
| `src/types/index.ts` | 新增 CleanOptions、ChapterInfo 等类型 |
| `src/App.tsx` | 集成清洗面板和章节工具面板到 UI 流程 |
| `package.json` | 新增 `js-opencc` 依赖 |
| ~~`native/src/`~~ | **零改动**（纯 TypeScript 功能） |

---

## 五、数据流设计与类型扩展

### 5.1 新增类型定义

```typescript
// src/types/index.ts — V3.1 新增类型

/** 繁简转换模式 */
type ConversionMode = 'none' | 't2s' | 's2t';

/** 内容清洗选项 */
interface CleanOptions {
    /** 繁简转换模式 */
    conversionMode: ConversionMode;
    /** 全角转半角 */
    toHalfWidth: boolean;
    /** 行尾数字清除 */
    removeLineEndNumbers: boolean;
    /** 内容筛选关键词（逗号分隔） */
    filterKeywords: string;
    /** 内容筛选长度阈值（0=不启用） */
    filterMaxLength: number;
}

/** 排版增强选项 */
interface FormatOptions {
    /** 章节识别格式化 */
    enableChapterFormat: boolean;
    /** 章节重排 */
    enableChapterReorder: boolean;
    /** 段落缩进 */
    enableIndent: boolean;
    /** 相邻行去重 */
    removeAdjacentDup: boolean;
    /** 长段落拆分 */
    enableParagraphSplit: boolean;
}

/** 章节信息 */
interface ChapterInfo {
    title: string;
    order: number | null;
    startLine: number;
    lineCount: number;
}
```

### 5.2 Store 扩展

```typescript
// useStore.ts — V3.1 新增字段

interface AppState {
    // ...existing fields...

    // V3.1 内容清洗
    cleanOptions: CleanOptions;
    setCleanOptions: (opts: Partial<CleanOptions>) => void;

    // V3.1 排版增强
    formatOptions: FormatOptions;
    setFormatOptions: (opts: Partial<FormatOptions>) => void;

    // V3.1 章节信息（用于导航/预览高亮）
    chapterList: ChapterInfo[];
}
```

---

## 六、依赖分析

### 6.1 新增 npm 依赖

| 包名 | 用途 | 大小 | 许可证 |
| :--- | :--- | :---: | :--- |
| `js-opencc` | 繁简转换（OpenCC 的 JS 实现） | ~15KB | MIT |

> `js-opencc` 是纯 JS 实现，无需原生编译，运行时加载字典数据（~5MB），可懒加载优化。

### 6.2 不确定依赖

小说段拆分 (`splitParagraph`) 功能在英文场景下依赖 `compromise` NLP 库。中文场景仅使用正则，**不需要额外依赖**。

---

## 七、许可合规确认

| 项目 | 许可证 | 限制 |
| :--- | :--- | :--- |
| novel-processor | MIT | ✅ 允许修改、合并、商用，仅需保留版权声明 |
| js-opencc | MIT | ✅ 同上 |
| Text Unifier | 自有 | — |

> **合规操作**：在 Text Unifier 的 `README.md` 和「关于」页面中添加：
> ```
> 部分文本处理算法参考 [novel-processor](https://github.com/rockbenben/novel-processor) (MIT License)
> Copyright (c) 2026 rockbenben
> ```

---

## 八、风险评估

| 风险 | 等级 | 缓解措施 |
| :--- | :---: | :--- |
| `js-opencc` 字典数据加载慢 | 🟡 低 | 懒加载 + 首次使用时异步初始化 |
| OpenCC 繁简转换准确率 | 🟡 低 | 已知成熟库，广受验证 |
| 章节识别误判（非小说文本） | 🟡 低 | 提供开关，默认关闭；仅用户触发 |
| 处理流水线变长，性能下降 | 🟢 极低 | 所有操作均为 O(n)，Rust 核心不改 |
| 代码复杂度增加 | 🟡 低 | 功能模块独立，不影响现有核心路径 |

---

## 九、建议

### 推荐集成策略：分阶段交付

```
V3.1 Phase 1（核心功能）
├── RQ-04 繁简转换      ← 用户呼声最高
├── RQ-07 垃圾内容过滤   ← 痛点突出
└── RQ-05 章节识别格式化 ← 小说场景刚需

V3.1 Phase 2（体验增强）
├── RQ-06 章节重排
├── RQ-08 内容筛选
├── RQ-09 段落缩进
└── RQ-10 相邻行去重

V3.1 Phase 3（锦上添花）
├── RQ-11 行尾数字清除
├── RQ-12 全角转半角
└── RQ-13 长段落拆分
```

### 总结

**完全可行，且高度互补。** novel-processor 的单文件内容清洗能力恰好填补了 Text Unifier 在小说场景下的功能空白，二者的结合将打造出市面上最强的中文 TXT 小说处理桌面工具。

---

*本文档供 AI 开发时参考，所有功能对应的源码路径和算法逻辑已在上面逐一标注。*
