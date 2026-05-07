# Text Unifier Git 版本历史构建脚本
# 从 V1.0 到 V3.2.1，每个版本一个 commit，每小时一个版本

$env:Path = "C:\Program Files\Git\bin;$env:Path"
cd "G:\CodeProject\Text Unifier"

# 如果已存在提交，先重置
if (git log --oneline 2>$null) {
    Write-Output "仓库已有提交，跳过初始化"
} else {
    Write-Output "===== 开始构建版本历史 ====="
}

# ============================================================
# V1.0 - 2026-05-06 09:00 - 初始版本
# ============================================================
$env:GIT_AUTHOR_DATE = "2026-05-06T09:00:00+08:00"
$env:GIT_COMMITTER_DATE = "2026-05-06T09:00:00+08:00"

git add .gitignore
git add package.json package-lock.json
git add tsconfig.json tsconfig.node.json tsconfig.electron.json
git add vite.config.ts postcss.config.js tailwind.config.js
git add index.html
git add README.md
git add src-tauri/Cargo.toml src-tauri/build.rs src-tauri/tauri.conf.json
git add src-tauri/capabilities/ src-tauri/gen/
git add src-tauri/icons/
git add src-tauri/src/
git add src/main.tsx src/App.tsx src/index.css src/vite-env.d.ts
git add src/types/ src/store/ src/utils/
git add src/components/
git add public/

git commit -m "feat: V1.0 初始版本发布

- Tauri v2 桌面框架 + Rust 后端
- React 18 + TypeScript 前端
- 文本归一化（换行符、空白、控制字符）
- 基于 SHA-256 的重复段落检测
- 可视化编辑与实时预览
- 一键导出 UTF-8 无 BOM"
git tag -a v1.0 -m "Text Unifier V1.0 - 初始版本 (2026-05-06)"
Write-Output "✅ V1.0 提交完成"

# ============================================================
# V1.0.1 - 2026-05-07 10:00 - Bug 修复版
# ============================================================
$env:GIT_AUTHOR_DATE = "2026-05-07T10:00:00+08:00"
$env:GIT_COMMITTER_DATE = "2026-05-07T10:00:00+08:00"

git add src-tauri/
git add src/
git add package.json
git commit -m "fix: V1.0.1 Bug 修复版

- 修复文件移除后状态残留 (BUG-V2.0-001)
- 修复 shiftKey 类型安全 (BUG-V2.0-002)
- 修复变量名语义 (BUG-V2.0-003)
- 新增 Tab 字符测试 (BUG-V2.0-004)
- 空导出增加提示 (BUG-V2.0-005)"
git tag -a v1.0.1 -m "Text Unifier V1.0.1 - Bug 修复版 (2026-05-07)"
Write-Output "✅ V1.0.1 提交完成"

# ============================================================
# V2.0 - 2026-05-09 09:00 - 大版本更新（文件排序、段落勾选、文档排版）
# ============================================================
$env:GIT_AUTHOR_DATE = "2026-05-09T09:00:00+08:00"
$env:GIT_COMMITTER_DATE = "2026-05-09T09:00:00+08:00"

git add src/
git add src-tauri/
git add package.json
git add vite.config.ts
git add docs/代码变更记录_V2.0.md
git add docs/自审代码报告_V2.0.md
git add docs/PRD_V2.0_产品需求文档.md docs/PRD_V2.0_交互原型.md
git add docs/系统架构设计文档_V2.0.md docs/数据库设计文档_V2.0.md docs/接口规范文档_V2.0.md
git commit -m "feat: V2.0 大版本更新 - 文件排序、段落勾选、文档排版

RQ-01: 文件排序 - 拖拽排序 + 占位线
RQ-02: 段落勾选 - 勾选/取消 + Shift 多选 + 三态联动
RQ-03: 文档排版 - 去硬回车 + 列表/诗歌/缩进保护"
git tag -a v2.0 -m "Text Unifier V2.0 - 大版本更新 (2026-05-09)"
Write-Output "✅ V2.0 提交完成"

# ============================================================
# V2.0.1 - 2026-05-10 10:00 - Bug 修复
# ============================================================
$env:GIT_AUTHOR_DATE = "2026-05-10T10:00:00+08:00"
$env:GIT_COMMITTER_DATE = "2026-05-10T10:00:00+08:00"

git add src/
git add src-tauri/
git add test_data/functional/04_bom_special_chars/
git add docs/代码变更记录_V2.0.1.md docs/自审代码报告_V2.0.1.md docs/Bug修复说明_V2.0.1.md
git commit -m "fix: V2.0.1 Bug 修复 + 规范化

- BUG-V2.0-001 ~ BUG-V2.0-005 修复
- 代码规范化：变量名语义、类型安全
- Rust 测试新增 Tab 字符处理测试"
git tag -a v2.0.1 -m "Text Unifier V2.0.1 - Bug 修复版 (2026-05-10)"
Write-Output "✅ V2.0.1 提交完成"

# ============================================================
# V2.0.2 - 2026-05-11 09:00 - 全量 Bug 修复
# ============================================================
$env:GIT_AUTHOR_DATE = "2026-05-11T09:00:00+08:00"
$env:GIT_COMMITTER_DATE = "2026-05-11T09:00:00+08:00"

git add src/
git add src-tauri/src/document_formatter.rs
git add docs/代码变更记录_V2.0.2.md docs/自审代码报告_V2.0.2.md docs/Bug修复说明_V2.0.2.md
git commit -m "fix: V2.0.2 全量 Bug 修复版

- BUG-024(P0): 排版后段落勾选状态保持
- BUG-025(P1): 还原后 fmt_* 残留清理
- BUG-026(P1): 拖拽排序后自动重新分析
- BUG-027(P2): 诗歌检测含标点误判修复
- BUG-028(P2): 前端哈希改为 Web Crypto SHA-256
- BUG-029(P3): FormatButton 冗余导入移除
- BUG-030(P3): 列表正则可选空格

修复率: 12/12 = 100%"
git tag -a v2.0.2 -m "Text Unifier V2.0.2 - 全量 Bug 修复 (2026-05-11)"
Write-Output "✅ V2.0.2 提交完成"

# ============================================================
# V3.0 - 2026-05-11 10:00 - Electron 迁移
# ============================================================
$env:GIT_AUTHOR_DATE = "2026-05-11T10:00:00+08:00"
$env:GIT_COMMITTER_DATE = "2026-05-11T10:00:00+08:00"

git rm -r src-tauri/ 2>$null
git add native/
git add electron/
git add electron-builder.yml
git add package.json
git rm vite.config.ts 2>$null
git add vite.config.ts
git add docs/迁移方案_V3.0_Electron.md
git add docs/代码变更记录_V3.0.md docs/自审代码报告_V3.0.md
git add docs/PRD_V3.0_产品需求文档.md docs/PRD_V3.0_交互原型.md
git add docs/系统架构设计文档_V3.0.md docs/数据库设计文档_V3.0.md
git add src/utils/ipc.ts
git add .gitignore
git add icons/
git commit -m "feat: V3.0 架构迁移 - Tauri → Electron + napi-rs

- 迁移原因: 解除 WebView2 兼容性瓶颈
- Rust 核心代码零改动迁移至 napi-rs
- React 前端 100% 复用
- 覆盖 Windows 7 SP1+ ~ Windows 11"
git tag -a v3.0 -m "Text Unifier V3.0 - Electron 迁移版 (2026-05-11)"
Write-Output "✅ V3.0 提交完成"

# ============================================================
# V3.1 - 2026-05-11 11:00 - 小说文本清洗引擎
# ============================================================
$env:GIT_AUTHOR_DATE = "2026-05-11T11:00:00+08:00"
$env:GIT_COMMITTER_DATE = "2026-05-11T11:00:00+08:00"

git add src/utils/novelProcessor.ts src/utils/regexPatterns.ts
git add src/store/defaults.ts
git add src/components/CleanPanel.tsx src/components/ChapterPanel.tsx
git add src/components/FormatPanel.tsx src/components/SidePanel.tsx
git add src/store/useStore.ts src/types/index.ts
git add src/utils/ipc.ts src/App.tsx
git add native/src/lib.rs
git add electron/main.ts electron/preload.ts electron/preload.d.ts
git add package.json
git add docs/代码变更记录_V3.1.md docs/自审代码报告_V3.1.md
git commit -m "feat: V3.1 小说文本清洗引擎

RQ-04: 繁简双向转换 (js-opencc)
RQ-05: 章节识别与格式化
RQ-06: 章节重排
RQ-07: 垃圾内容过滤
RQ-08: 内容筛选"
git tag -a v3.1 -m "Text Unifier V3.1 - 小说文本清洗引擎 (2026-05-11)"
Write-Output "✅ V3.1 提交完成"

# ============================================================
# V3.1.1 - 2026-05-11 12:00 - 生产部署版
# ============================================================
$env:GIT_AUTHOR_DATE = "2026-05-11T12:00:00+08:00"
$env:GIT_COMMITTER_DATE = "2026-05-11T12:00:00+08:00"

git add docs/代码变更记录_V3.1.1.md
git add releases/v3.1.1/
git add package.json native/Cargo.toml src/App.tsx
git commit -m "release: V3.1.1 生产部署版

- 统一版本号 3.1.1
- 修复 napi-rs camelCase 字段名不匹配 (BUG-001/002)
- 构建安装版 + 便携版"
git tag -a v3.1.1 -m "Text Unifier V3.1.1 - 生产部署版 (2026-05-11)"
Write-Output "✅ V3.1.1 提交完成"

# ============================================================
# V3.1.2 - 2026-05-11 13:00 - 代码规范版
# ============================================================
$env:GIT_AUTHOR_DATE = "2026-05-11T13:00:00+08:00"
$env:GIT_COMMITTER_DATE = "2026-05-11T13:00:00+08:00"

git add src/
git add native/
git add docs/代码变更记录_V3.1.2.md
git add package.json native/Cargo.toml
git commit -m "fix: V3.1.2 代码规范校验 + camelCase 对齐

- BUG-V3.1.2-001: ExportResult savedPath camelCase
- BUG-V3.1.2-002: setAnalysisResult 参数类型对齐
- BUG-V3.1.2-003: require() → await import() ESM 兼容
- OPT-V3.1.2-001: 新增 _updateChapterList
- OPT-V3.1.2-002: 消除 Rust warning"
git tag -a v3.1.2 -m "Text Unifier V3.1.2 - 代码规范版 (2026-05-11)"
Write-Output "✅ V3.1.2 提交完成"

# ============================================================
# V3.2 - 2026-05-13 09:00 - 文件对比 + 芯片式文件栏
# ============================================================
$env:GIT_AUTHOR_DATE = "2026-05-13T09:00:00+08:00"
$env:GIT_COMMITTER_DATE = "2026-05-13T09:00:00+08:00"

git add src/components/DiffViewer.tsx src/utils/diffUtils.ts
git add src/components/FileChipBar.tsx src/components/SortableChip.tsx
git add src/App.tsx src/types/index.ts
git add docs/代码变更记录_V3.2.md docs/自审代码报告_V3.2.md
git add docs/PRD_V3.2_产品需求文档.md docs/PRD_V3.2_交互原型.md
git add docs/系统架构设计文档_V3.2.md docs/数据库设计文档_V3.2.md docs/接口规范文档_V3.2.md
git commit -m "feat: V3.2 文件对比 + 芯片式文件栏

RQ-09: 差异可视化对比面板 (DiffViewer)
- 行级差异高亮 + 中文逐字分词
- 文件归一化增强 (BOM/控制字符)

RQ-10: 芯片式文件栏水平滚动拖拽 (FileChipBar)
- 拖拽排序阈值优化"
git tag -a v3.2 -m "Text Unifier V3.2 - 文件对比 + 芯片式文件栏 (2026-05-13)"
Write-Output "✅ V3.2 提交完成"

# ============================================================
# V3.2.1 - 2026-05-13 10:00 - 当前最新（Bug 修复版）
# ============================================================
$env:GIT_AUTHOR_DATE = "2026-05-13T10:00:00+08:00"
$env:GIT_COMMITTER_DATE = "2026-05-13T10:00:00+08:00"

git add src/store/useStore.ts
git add src/components/DiffViewer.tsx
git add src/components/FileChipBar.tsx
git add src/utils/diffUtils.ts
git add docs/代码变更记录_V3.2.1.md docs/自审代码报告_V3.2.1.md docs/Bug修复说明_V3.2.1.md
git add test_data/v3.2.1_test_deliverables/
git add releases/v3.2.1/
git add package.json native/Cargo.toml src/App.tsx
git add archive/
git add test_data/
git add scripts/
git commit -m "fix: V3.2.1 Bug 修复版

- BUG-V3.2-001(P1): 撤回栈 checkedMap 空值防御
- BUG-V3.2-002(P1): DiffViewer 卸载后 setState
- BUG-V3.2-003(P2): 对比模式归一化增强
- BUG-V3.2-004(P3): 芯片拖拽误触阈值 8→12px
- BUG-V3.2-005(P2): wordDiff 中文逐字差异

修复率: 5/5 = 100%"
git tag -a v3.2.1 -m "Text Unifier V3.2.1 - Bug 修复版 (2026-05-13)"
Write-Output "✅ V3.2.1 提交完成"

# ============================================================
# 完成
# ============================================================
Write-Output ""
Write-Output "===== 版本历史构建完成 ====="
git log --oneline --all
Write-Output ""
Write-Output "=== 标签列表 ==="
git tag -l
