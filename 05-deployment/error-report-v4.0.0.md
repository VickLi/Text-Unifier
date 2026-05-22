# Text Unifier V4.0.0 — 错误报告

> **报告日期**: 2026-05-22
> **报告阶段**: 部署运维 — GitHub 发布
> **严重级别**: 🟡 警告（非阻断）

---

## 一、错误概述

| 项目 | 内容 |
|:----|:------|
| **错误编号** | ERR-V4.0-DEPLOY-001 |
| **错误类型** | 配置文件缺失 |
| **错误信息** | 未找到 `.github/config.yml` 配置文件 |
| **影响范围** | GitHub Actions 自动发布流程 |
| **严重级别** | 🟡 警告（不影响代码推送和标签创建） |

## 二、错误详情

### 2.1 缺失文件

| 文件 | 说明 |
|:----|:------|
| `.github/config.yml` | GitHub 发布配置，用于定义 Release 自动生成规则、分类标签等 |

### 2.2 已检测到的有效配置

| 配置项 | 值 | 来源 |
|:------|:---|:-----|
| Git 远程仓库 | `https://github.com/VickLi/Text-Unifier.git` | `.git/config` |
| 已有版本标签 | v1.0 ~ v3.3（共 14 个） | `git tag -l` |
| 当前版本 | V4.0.0 | `package.json` |
| 项目配置 | `"private": true` | `package.json` |

## 三、影响分析

| 影响项 | 说明 |
|:------|:------|
| 代码推送 | ✅ 不受影响（Git 远程已配置） |
| 版本标签创建 | ✅ 不受影响（`git tag` + `git push` 可正常执行） |
| GitHub Release 发布 | ⚠️ 需手动操作（无法自动触发 Release 创建） |
| CI/CD 流水线 | ⚠️ 无自动构建/测试/发布流水线 |

## 四、修复建议

### 4.1 快速修复（推荐）

创建 `.github/config.yml` 文件：

```yaml
# .github/config.yml - Text Unifier Release 配置
release:
  title_template: "v{version} — {summary}"
  tag_template: "v{version}"
  categories:
    - title: "✨ 新特性"
      labels: ["enhancement", "feature"]
    - title: "🐛 Bug 修复"
      labels: ["bug", "fix"]
    - title: "🔧 工程改进"
      labels: ["chore", "refactor"]
    - title: "📄 文档"
      labels: ["documentation"]
```

### 4.2 手动发布（临时方案）

按照 `GitHub_发布说明_V4.0.0.md` 中的步骤在 GitHub 网页端手动创建 Release：

1. 访问 https://github.com/VickLi/Text-Unifier/releases
2. 点击 "Draft a new release"
3. 选择标签 `v4.0.0`
4. 粘贴 Release Notes
5. 上传便携版 ZIP
6. 点击 "Publish release"

## 五、补充所需信息

| 所需信息 | 说明 |
|:--------|:------|
| GitHub Token | 如需自动发布，需配置 `GITHUB_TOKEN` 或 Personal Access Token |
| 发布权限 | 确认当前用户对仓库有写入权限 |
| 便携版 ZIP | `TextUnifier_Portable_v4.0.0.zip` 需在本地构建后上传 |
| macOS/Linux 构建 | 如需跨平台发布，需在对应 OS 上执行构建 |

---

*本报告由部署运维流程自动生成。请在补充 `.github/config.yml` 配置后重新执行自动发布流程。*
