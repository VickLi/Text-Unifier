# AI 隐私安全检查提示词

> 在推送代码到 GitHub 公开仓库前，请执行以下检查。

---

## 1. 身份信息检查

```regex
user\.name\s*["']\w+["']
user\.email\s*["'][^@"']+@[^@"']+["']
```

- [ ] 确认 `git config user.name` 没有真实姓名（应替换为 `"Developer"`）
- [ ] 确认 `git config user.email` 没有个人邮箱（应替换为 `"dev@example.com"`）
- [ ] 搜索 `@xxx.com` / `@xxx.cn` 确认无其他个人邮箱

## 2. 绝对路径检查

```regex
[A-Z]:\\          # Windows 盘符路径
/home/\w+         # Linux 家目录
/Users/\w+        # macOS 家目录
```

- [ ] 脚本中的 `cd "G:\CodeProject\..."` 等绝对路径已替换为 `$PSScriptRoot`
- [ ] 配置文件中的绝对路径已替换为环境变量或相对路径

## 3. API 密钥与凭证检查

```regex
api[_ ]?key|apiKey|secret|token|password|auth
```

- [ ] 无硬编码的 API 密钥
- [ ] 无硬编码的 Token 或 Secret
- [ ] 无硬编码的密码

## 4. 开发环境信息检查

- [ ] 无硬编码的 MSVC 版本号（如 `14.44.35207`）
- [ ] 无硬编码的 Windows SDK 版本（如 `10.0.26100.0`）
- [ ] 无硬编码的工具链安装路径（如 `C:\Program Files (x86)\...`）
- [ ] 无 `.env` 或 `*.local` 环境配置文件被 Git 跟踪

## 5. 敏感文件检查

检查 `.gitignore` 是否已包含：
- [ ] `node_modules/`
- [ ] `dist/` / `dist-electron/`
- [ ] `release/` / `releases/`
- [ ] `*.exe` / `*.zip` / `*.msi` / `*.dll`
- [ ] `*.pem` / `*.key` / `*.crt` / `*.p12`（私钥/证书）
- [ ] `*.log`
- [ ] `.git-rewrite/`
- [ ] `src-tauri/`（如已废弃）
- [ ] `native/target/`

## 6. 配置安全检查

- [ ] `package.json` 包含 `"private": true`
- [ ] `.gitignore` 配置完整
- [ ] 没有 `.env` 文件被意外 `git add`

## 7. 每次修改后快速复查

| 修改文件 | 需复查项 |
|:---------|:---------|
| `scripts/*.ps1` / `scripts/*.sh` | 身份信息、绝对路径 |
| `.gitignore` | 敏感文件覆盖 |
| `package.json` | `private` 字段 |
| 新增 `*.config.*` 文件 | 密码、Token、密钥 |
| 新增文档 | 绝对路径、个人信息 |

---

> **原则**：推送到公开仓库前，假设任何信息都可能会被恶意爬取。不确定的信息就替换或删除。
