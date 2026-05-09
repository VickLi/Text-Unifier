# Text Unifier V2.0 发布包

## 版本信息

| 项目 | 内容 |
| :--- | :--- |
| **版本号** | V2.0 |
| **构建日期** | 2026-05-09 |
| **基础版本** | V1.0.1 |
| **目标平台** | Windows / macOS |

## 更新内容

### RQ-01：文件拖拽排序
- 支持鼠标拖拽调整文件处理顺序
- 第一项作为主文件（内容完整保留）
- 拖拽后自动触发重新合并分析
- 使用 @dnd-kit 实现，支持键盘排序

### RQ-02：段落级勾选删除
- 每个段落左侧增加 Checkbox，默认全部勾选
- 取消勾选时段落淡化显示，不进入导出
- 支持全选/取消全选快捷操作
- Shift 多选连续段落批量切换
- 重复组三态联动（☑ 全排除 / ➖ 部分排除 / ☐ 全保留）

### RQ-03：文档排版（去硬回车）
- 一键清除段落内多余硬回车，恢复自然段落
- 智能保护列表和诗歌格式
- 排版后可一键还原至上一步状态
- 仅影响已勾选段落

## 文件清单

```
releases/v2.0/
├── README.md                          # 本文件
├── text-unifier-v2.0.zip              # 完整源代码包
├── src-tauri/
│   └── target/release/text-unifier.exe # Windows 可执行文件
└── dist/                               # 前端编译产物
    ├── index.html
    └── assets/
```

## 构建说明

### 前置要求
- Node.js 18+
- Rust 1.70+
- Tauri CLI

### 构建步骤
```bash
# 1. 安装前端依赖
npm install

# 2. 构建前端
npm run build

# 3. 构建 Tauri 应用
cd src-tauri
cargo build --release
```

## 运行说明
- 在 Tauri 开发环境中：`npm run tauri dev`
- 生产环境中直接运行 `src-tauri/target/release/text-unifier.exe`
