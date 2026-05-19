// 共享正则常量（V3.1 新增）
// 来源：移植 novel-processor 的 textUtils.ts 正则模式

// 章节标题正则：中文数字章节
export const CHAPTER_CHINESE = /^第[〇零一二三四五六七八九十百千万\d]+[章节回卷部]/;

// 章节标题正则：阿拉伯数字章节
export const CHAPTER_ARABIC = /^第\d+[章节回卷部]/;

// 章节标题正则：英文 Chapter (支持无空格)
export const CHAPTER_ENGLISH = /^Chapter\s*\d+/i;

// 章节标题正则：罗马数字 Chapter (支持无空格)
export const CHAPTER_ROMAN = /^Chapter\s*[IVXLCDM]+/i;

// 通用章节标题开头检测（fallback）
export const CHAPTER_GENERIC = /^[第Chapter]/;

// 综合章节检测
// BUG-V3.1-004: 要求章节关键词"章/回/卷/部"是行结尾或后跟空格/标点，防止"第五章第三节"误匹配
// BUG-V3.1-007: 支持 Chapter5 (无空格) 格式
export const CHAPTER_TITLE = /^第[〇零一二三四五六七八九十百千万\d]+[章节回卷部](?:[\s\.,;:。，；：、]|$)|^Chapter\s*[\dIVXLCDM]+(?:[\s\.,;:]|$)/i;

// 句尾标点（用于智能换行标点感知）
export const SENTENCE_END = /[。！？」）〗》』"']$/;

// 列表标记
export const LIST_MARKERS = /^[-*•·]|^\d+[.、]|^[①②③④⑤⑥⑦⑧⑨⑩]/;

// 行尾数字（页码）
export const LINE_END_NUMBERS = /\d{2,}$/;
