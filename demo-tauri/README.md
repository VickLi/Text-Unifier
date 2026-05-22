# Text Unifier V4.0 — Tauri Demo 验证指南

## 目的

验证 Tauri 2.x (WebView2) 方案在你的 Windows 环境中的兼容性，确保不会重现之前的"进程运行但窗口不显示"问题。

## 前置条件

1. **Rust 工具链**：需安装 [rustup](https://rustup.rs/)，MSVC 工具链
   ```powershell
   rustup default stable-msvc
   ```

2. **Node.js**：≥18.x (已安装)

## 快速启动

```powershell
# 1. 进入 demo 目录
cd demo-tauri

# 2. 安装前端依赖
npm install

# 3. 以开发模式运行（会先开 Vite dev server，再开 Tauri 窗口）
npm run tauri dev
```

## 如果遇到 WebView2 相关问题

Tauri 配置中已设置 `"webviewInstallMode": { "type": "downloadBootstrapper", "silent": true }`，首次运行时会自动下载安装 WebView2 Runtime。

如果自动下载失败，手动安装：
- 下载 [WebView2 Evergreen Bootstrapper](https://go.microsoft.com/fwlink/p/?LinkId=2124703)
- 以管理员身份运行安装

## 验证清单

运行 Demo 后，确认以下各项：

| # | 测试项 | 预期结果 | 实际 |
|---|--------|----------|------|
| 1 | 窗口正常显示 | 标题栏显示 "Text Unifier Demo — WebView2 兼容性测试" | |
| 2 | WebView 指示器 | 顶部绿色标签显示 "✅ WebView2 运行正常" | |
| 3 | 拖拽 .txt 文件 | 蓝色遮罩 → 芯片栏显示文件 | |
| 4 | 点击 + 按钮 | 文件选择对话框 → 芯片栏显示文件 | |
| 5 | 合并预览 | 添加 2+ 文件后预览区显示合并文本 | |
| 6 | 导出功能 | 点击导出 → 保存对话框 → 文件写入成功 | |
| 7 | 关闭窗口 | 进程完全退出，任务管理器无残留 | |
| 8 | 二次启动 | 关闭后重新打开，正常启动 | |

## 打包测试（正式版模拟）

```powershell
# 构建 MSI/NSIS 安装包
npm run tauri build

# 安装包位置: src-tauri/target/release/bundle/
# 安装后测试双击 .exe 是否能正常运行
```

## 决策门

```
┌─────────────────────────────────┐
│  Demo 全部验证项通过？            │
└──────────────┬──────────────────┘
         YES ↓              NO ↓
   ┌──────────────┐   ┌──────────────────┐
   │ Tauri 全量重构 │   │ 回退 Electron 方案 │
   │ 继续 V4.0 开发 │   │ 仅做裁减重构       │
   └──────────────┘   └──────────────────┘
```

## 已知问题记录

> 在此记录 Demo 测试中发现的任何问题：
>
> - [ ] （待填写）
