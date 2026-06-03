# Text Unifier Tauri Demo — 编译、打包与部署问题全记录

> **项目**: Text Unifier V4.0 Tauri Demo  
> **日期**: 2026-05-22  
> **环境**: Windows 11, Rust 1.x, Node 18+, Tauri 2.11.2, MSVC

---

## 一、问题总览

| # | 阶段 | 现象 | 根因 | 严重度 |
|:--:|:-----|:-----|:-----|:---:|
| 1 | 编译 | `icons/icon.ico not found` | PowerShell 生成的 ICO 格式无效 | 🔴 |
| 2 | 编译 | `E0255: __cmd__* defined multiple times` | `crate-type = ["staticlib","cdylib","rlib"]` 导致宏三重展开 | 🔴 |
| 3 | 编译 | `unexpected closing delimiter: }` | 合并 lib.rs 到 main.rs 时遗留多余 `}` | 🔴 |
| 4 | 部署 | 双击 exe → 任务栏闪边框 → 崩溃 | `tauri.conf.json` 中 `plugins.dialog: {}` 反序列化失败 | 🔴 |
| 5 | 部署 | 窗口显示 `localhost:5173 拒绝连接` | debug 构建默认连接 Vite dev server | 🔴 |
| 6 | 部署 | `TAURI_DEV=false` 环境变量无效 | 该变量是编译期 `cfg!` 检查，运行时设置无效 | 🟡 |
| 7 | 工具 | PowerShell 脚本中文乱码 | PS 5.1 对 UTF-8 without BOM 兼容性差 | 🟡 |
| 8 | 工具 | `web_atoms` 编译极慢（~5min） | 大型 proc-macro crate 首次编译 | 🟢 |

---

## 二、问题详情与解决方案

### 问题 1：图标文件无效

**现象**：
```
error: icons/icon.ico not found; required for generating a Windows Resource file
```
后续用 PowerShell `[System.Drawing.Icon]` 生成的文件虽然有 766 bytes，但 Tauri 解析报错：
```
failed to parse icon: Invalid reserved field value in ICONDIRENTRY (was 64, but must be 0)
```

**根因**：PowerShell `Icon.Save()` 生成的 ICO 不符合规范（ICONDIRENTRY 保留字段非零）。

**解决**：用原始字节构建 ICO——手动写 6 字节 ICONDIR 头 + 16 字节 ICONDIRENTRY + 嵌入 PNG 数据。生成的 243 字节 ICO 通过 Tauri 校验。

**教训**：不要用 `[System.Drawing.Icon]::Save()` 生成 ICO。用字节流手动拼装，或直接嵌入 PNG。

---

### 问题 2：宏符号重复定义

**现象**：
```
error[E0255]: the name `__cmd__read_text_file` is defined multiple times
  --> src\lib.rs:32:8
   |
31 | #[tauri::command]
   | ----------------- previous definition here
32 | pub fn read_text_file(path: String) -> Result<FileInfo, String> {
   |        -^^^^^^^^^^^^^ reimported here
```
4 个 `#[tauri::command]` 函数全部报此错误（8 个 error）。

**根因**：`Cargo.toml` 中 `[lib] crate-type = ["staticlib", "cdylib", "rlib"]`，三种目标类型各自触发一次 proc-macro 展开，`#[tauri::command]` 内部生成的 `__cmd__*` 和 `__tauri_command_name_*` 宏符号被重复导出，导致 name resolution 冲突。

**尝试的错误修复**：
- 改为 `crate-type = ["rlib"]` → 无效（缓存残留）
- 改为 `crate-type = ["lib"]` + 添加 `[[bin]]` → 无效
- 移除 `crate-type` → 无效

**最终解决**：删除 `lib.rs`，将所有命令和 `run()` 函数合并到 `main.rs`，移除 `Cargo.toml` 中 `[lib]` 节。项目变为纯二进制单文件结构，`#[tauri::command]` 宏仅在二进制 crate 内展开一次。

**教训**：Tauri 2.x 的项目结构应避免复杂的 `crate-type` 组合。推荐单文件 `main.rs` 或使用 Cargo workspace 分离 lib/bin。

---

### 问题 3：语法错误

**现象**：
```
error: unexpected closing delimiter: `}`
  --> src\main.rs:189:1
```

**根因**：替换 `main.rs` 内容时，旧的 `fn main() { text_unifier_demo_lib::run() }` 和新的完整 `fn main()` 之间残留了多余的 `}`。

**解决**：删除文件末尾多余的 `}`。

---

### 问题 4：插件配置反序列化失败（闪退根因）

**现象**：双击 exe → Windows 任务栏短暂出现边框 → 立即消失。捕获 stderr：
```
thread 'main' panicked at src\main.rs:187:10:
启动 Text Unifier Demo 失败: PluginInitialization("dialog", 
"Error deserializing 'plugins.dialog' within your Tauri configuration: 
invalid type: map, expected unit")
```

**根因**：`tauri.conf.json` 中：
```json
"plugins": {
    "dialog": {},
    "fs": { "scope": { "allow": ["**"], "deny": [] } }
}
```
Tauri 2.11.2 的 `dialog` 插件不接受 `{}`（空 map），期望 `null` 或不存在。Rust 代码中已通过 `.plugin(tauri_plugin_dialog::init())` 初始化，配置节是冗余且有害的。

**解决**：删除整个 `plugins` 节。Rust 代码中 `.plugin()` 调用已足够。

**教训**：Tauri 2.x 的 `plugins` 配置节应只在需要覆盖默认值时才添加。插件已在 Rust 代码中初始化时，不要在 JSON 中重复声明。

---

### 问题 5：localhost 连接拒绝

**现象**：窗口正常打开，但 WebView 内显示：
```
localhost:5173 拒绝连接
无法访问此页面
```

**根因**：Tauri debug 构建默认连接 `devUrl`（`http://localhost:5173`），期望 Vite dev server 在运行。打包后没有 dev server，WebView 无法加载页面。

**解决**：从 `tauri.conf.json` 的 `build` 节中移除 `devUrl` 和 `beforeDevCommand`。当 `devUrl` 不存在时，Tauri 回退到使用 `frontendDist`（`../dist/`）中的已构建前端文件。

**注意**：确保 `dist/` 目录存在且包含最新的 Vite 构建产物。

---

### 问题 6：TAURI_DEV 环境变量无效

**现象**：在 `.bat` 中设置 `set TAURI_DEV=false` 后启动，仍然连接 localhost。

**根因**：`TAURI_DEV` 在 Tauri 2.x 中通过 `cfg!(dev)`（编译期宏）检查，不是运行时环境变量。设置在 `.bat` 中对已编译的二进制无效。

**教训**：Tauri 的 dev/prod 模式是编译期决定的，无法通过环境变量在运行时切换。需要从 `tauri.conf.json` 中移除 `devUrl`。

---

### 问题 7：PowerShell 脚本编码

**现象**：
```
表达式或语句中包含意外的标记"鎷栨嫿"
```

**根因**：`build-demo.ps1` 中的中文 here-string (`@"…"@`) 在 PowerShell 5.1 中因 UTF-8 without BOM 导致乱码。

**解决**：将 here-string 中的中文替换为英文，或用 `-Encoding UTF8BOM` 保存脚本。

---

### 问题 8：web_atoms 编译缓慢

**现象**：`Compiling web_atoms v0.2.4` 耗时约 5 分钟，进度条停在 418/441。

**根因**：`web_atoms` 是 Tauri 2.x 的大型 proc-macro crate，首次编译极慢。

**缓解**：无解——这是 Tauri 生态的已知问题。只能等待或使用更好的 CPU。

---

## 三、最终可工作配置

### `tauri.conf.json`（最终版）
```json
{
  "productName": "Text Unifier Demo",
  "version": "4.0.0-demo",
  "identifier": "com.textunifier.demo",
  "build": {
    "frontendDist": "../dist",
    "beforeBuildCommand": "npm run build"
  },
  "app": {
    "windows": [{
      "title": "Text Unifier Demo - WebView2 兼容性测试",
      "width": 1400, "height": 900,
      "minWidth": 800, "minHeight": 600,
      "center": true, "resizable": true
    }],
    "security": {
      "csp": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
    }
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": ["icons/32x32.png", "icons/128x128.png", "icons/128x128@2x.png", "icons/icon.ico"],
    "windows": {
      "nsis": { "installMode": "currentUser" },
      "webviewInstallMode": { "type": "downloadBootstrapper", "silent": true }
    }
  }
}
```
**关键变更**：移除 `devUrl`、移除 `beforeDevCommand`、移除 `plugins` 节。

### `Cargo.toml`（最终版）
```toml
[package]
name = "text-unifier-demo"
version = "4.0.0-demo"
edition = "2021"

[build-dependencies]
tauri-build = { version = "2" }

[dependencies]
tauri = { version = "2" }
tauri-plugin-dialog = "2"
tauri-plugin-fs = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
encoding_rs = "0.8"
```
**关键变更**：移除 `[lib]` 节，纯二进制项目。

---

## 四、编译与部署清单

| 步骤 | 命令 | 前提 |
|:-----|:-----|:-----|
| 1. 安装前端依赖 | `cd demo-tauri && npm install` | Node.js ≥18 |
| 2. 构建前端 | `npx vite build` | npm install 已完成 |
| 3. 编译 Rust | `cd src-tauri && cargo build` | Rust + MSVC 工具链 |
| 4. 测试启动 | `.\target\debug\text-unifier-demo.exe` | WebView2 Runtime |
| 5. 打包 portable | 复制 exe + 说明文件 + 压缩 | zip 工具 |

**必须的运行时依赖**：
- **WebView2 Runtime**：Windows 10 1809+ 预装，否则需手动安装 `https://go.microsoft.com/fwlink/p/?LinkId=2124703`

---

## 五、经验教训

1. **Tauri 2.x 配置排查**：出错时不打印日志到终端，需用 `Start-Process -RedirectStandardError` 捕获 panic 信息。
2. **图标生成**：不要依赖 PowerShell/System.Drawing 生成 ICO，用手动字节拼装或 Tauri CLI 的 `tauri icon` 命令。
3. **调试技巧**：用 `$env:TAURI_DEV="false"; & exe 2>&1` 快速诊断 dev server 问题，但最终修复必须在 `tauri.conf.json` 中移除 `devUrl`。
4. **增量编译隐患**：`cargo clean` 比 `Remove-Item target` 更彻底，因为会清除全局 registry 缓存中的旧构建产物。

---

> **报告生成**: 2026-05-22 | 编译次数: ~10 次 | 总耗时: ~2 小时
