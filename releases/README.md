# Text Unifier - 发布版本

当前最新版本：**v3.2.3**（拖拽添加文件 Bug 修复）

> 旧版本（v1.0 / v1.0.1 / v2.0 / v2.0.1 / v2.0.2）已移至 `archive/` 目录归档。

---

## 版本历史

| 版本 | 日期 | 说明 | 技术栈 | 状态 |
| :--- | :--- | :--- | :--- | :---: |
| **v3.2.3** | 2026-05-19 | 拖拽添加文件 Bug 修复（File.path 异步填充） | Electron + napi-rs | ✅ **当前最新** |
| v3.2.2 | 2026-05-13 | BUG-V3.2.2-001 拖拽修复 | Electron + napi-rs | 📦 已归档 |
| v3.2.1 | 2026-05-13 | 文件对比 + 芯片式文件栏 + 5 Bug 修复 | Electron + napi-rs | 📦 已归档 |
| v3.2 | 2026-05-13 | 差异可视化对比 + 芯片式文件栏 | Electron + napi-rs | 📦 已归档 |
| v3.1.2 | 2026-05-11 | 代码规范校验 + camelCase 字段对齐 | Electron + napi-rs | 📦 已归档 |
| v3.1.1 | 2026-05-11 | 小说文本清洗引擎增强版 | Electron + napi-rs | 📦 已归档 |
| v3.1 | 2026-05-11 | 繁简转换、章节识别、内容清洗 | Electron + napi-rs | 📦 已归档 |
| v3.0 | 2026-05-11 | 架构迁移：Tauri → Electron | Electron + napi-rs | 📦 已归档 |
| v2.0.2 | 2026-05-11 | 全量 Bug 修复（Tauri 最终版） | Tauri + Rust | 📦 已归档 |
| v2.0.1 | 2026-05-10 | Bug 修复 | Tauri + Rust | 📦 已归档 |
| v2.0 | 2026-05-09 | 大版本更新 | Tauri + Rust | 📦 已归档 |
| v1.x | 2026-05-06~08 | 初始版本 | Tauri + Rust | 📦 已归档 |

---

## 构建说明

### V3.x（Electron + napi-rs）

```bash
# 1. 编译 Electron TypeScript → JavaScript
npm run electron:ts

# 2. 构建前端
npm run build

# 3. 编译 Rust napi 原生模块
cd native && npx napi build --platform --release

# 4. 打包（需要网络环境下载 electron-builder 依赖）
electron-builder --win --config electron-builder.yml
```

### V2.x（Tauri - 已归档）

```bash
cd src-tauri
cargo tauri dev    # 开发调试
cargo tauri build  # 生产构建
```
