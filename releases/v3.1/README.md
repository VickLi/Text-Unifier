# Text Unifier V3.1 发布包

## 版本信息

| 项目 | 内容 |
| :--- | :--- |
| **版本号** | V3.1 |
| **构建日期** | 2026-05-11 |
| **基线版本** | V3.0（Electron 迁移版） |
| **功能来源** | 集成 novel-processor（MIT）小说文本清洗引擎 |

## V3.1 新增功能

| 需求 | 功能 | 状态 |
| :--- | :--- | :---: |
| RQ-04 | 繁简双向转换（js-opencc） | ✅ |
| RQ-05 | 章节识别与格式化（中/英/罗马数字） | ✅ |
| RQ-06 | 章节重排（按序号升序） | ✅ |
| RQ-07 | 垃圾内容过滤（广告/水印） | ✅ |
| RQ-08 | 内容筛选（关键词过滤 + 长度豁免） | ✅ |

## 文件清单

```
releases/v3.1/
├── README.md                           # 本文件
└── text-unifier-src-v3.1.zip           # 完整源代码包

native/                                 # Rust napi 核心引擎（2 个新增函数）
├── src/lib.rs                          # + detect_encoding + scan_preprocessed_texts
├── src/...其余模块                      # 零改动

src/
├── utils/novelProcessor.ts             # 🆕 小说文本清洗引擎（13 个函数）
├── utils/regexPatterns.ts              # 🆕 共享正则常量
├── store/defaults.ts                   # 🆕 默认值配置
├── store/useStore.ts                   # 扩展（+3 状态字段 + 3 Actions）
├── types/index.ts                      # 扩展（+4 新类型）
├── components/CleanPanel.tsx           # 🆕 内容清洗面板
├── components/ChapterPanel.tsx         # 🆕 章节工具面板
├── components/FormatPanel.tsx          # 🆕 排版增强面板
├── components/SidePanel.tsx            # 🆕 面板容器
├── utils/ipc.ts                        # + 2 新增 IPC 函数
├── App.tsx                             # 集成 SidePanel
└── ...其余文件                          # 零改动

electron/
├── main.ts                             # + 2 新增 IPC handler
├── preload.ts                          # + 2 新增 API
└── preload.d.ts                        # + 类型声明
```

## 验证结果

| 检查项 | 结果 |
| :--- | :---: |
| Rust 测试 | **25/25 ✅**（含 2 个 V3.1 新增测试） |
| TypeScript | **零错误 ✅** |
| Vite 构建 | **成功 ✅** |
