# Text Unifier Git History Rebuild Script
# Creates 9 version commits with proper timestamps, excluding large binaries

$env:Path = "C:\Program Files\Git\bin;$env:Path"
cd "G:\CodeProject\Text Unifier"

# Clean slate
Remove-Item ".git" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item ".gitignore" -Force -ErrorAction SilentlyContinue

git init
git config user.name "VickLi"
git config user.email "hbxgswgr@gmail.com"

# Create thorough .gitignore excluding large binaries
$ignoreLines = @(
    '# Node',
    'node_modules/',
    'dist/',
    'dist-electron/',
    'native/target/',
    'src-tauri/target/',
    'src-tauri/',
    '*.log',
    '.venv/',
    'release/',
    '.git-rewrite/',
    '# Large binary files (excluded from git, use GitHub Releases)',
    '*.exe',
    '*.zip',
    '*.msi',
    '*.dll',
    '*.pak',
    '*.dat',
    '*.bin',
    '*.node',
    '*.icns',
    '*.ico',
    '*.png',
    '*.jpg',
    '*.jpeg',
    '*.gif'
)
Set-Content ".gitignore" $ignoreLines -Encoding UTF8

git add .gitignore
git commit -m "chore: init gitignore"

Write-Output "=== .gitignore committed ==="

# ============================================================
# V1.0 - 2026-05-06 09:00
# ============================================================
$env:GIT_AUTHOR_DATE = "2026-05-06T09:00:00+08:00"
$env:GIT_COMMITTER_DATE = "2026-05-06T09:00:00+08:00"
git add README.md package.json package-lock.json tsconfig.json tsconfig.node.json vite.config.ts postcss.config.js tailwind.config.js index.html public/ src/ src-tauri/
git commit -m "feat: V1.0 init" -m "Tauri v2 + Rust + React 18. Basic text dedup."
git tag -a v1.0 -m "V1.0 initial release (2026-05-06)"
Write-Output "V1.0 done"

# ============================================================
# V1.0.1 - 2026-05-07 10:00
# ============================================================
$env:GIT_AUTHOR_DATE = "2026-05-07T10:00:00+08:00"
$env:GIT_COMMITTER_DATE = "2026-05-07T10:00:00+08:00"
git add docs/ archive/v1.0/ archive/v1.0.1/ test_data/ scripts/ tsconfig.electron.json
git commit -m "fix: V1.0.1 bug fix - add docs, tests and archive" -m "5 bugs fixed: file remove residual, shiftKey type, var naming, tab test, empty export"
git tag -a v1.0.1 -m "V1.0.1 bug fix (2026-05-07)"
Write-Output "V1.0.1 done"

# ============================================================
# V2.0 - 2026-05-09 09:00
# ============================================================
$env:GIT_AUTHOR_DATE = "2026-05-09T09:00:00+08:00"
$env:GIT_COMMITTER_DATE = "2026-05-09T09:00:00+08:00"
git add archive/v2.0/
git commit -m "feat: V2.0 major update" -m "File sort, paragraph check, document formatting (RQ-01/02/03)"
git tag -a v2.0 -m "V2.0 major update (2026-05-09)"
Write-Output "V2.0 done"

# ============================================================
# V2.0.1 - 2026-05-10 10:00
# ============================================================
$env:GIT_AUTHOR_DATE = "2026-05-10T10:00:00+08:00"
$env:GIT_COMMITTER_DATE = "2026-05-10T10:00:00+08:00"
git add archive/v2.0.1/
git commit -m "fix: V2.0.1 bug fix release"
git tag -a v2.0.1 -m "V2.0.1 bug fix (2026-05-10)"
Write-Output "V2.0.1 done"

# ============================================================
# V2.0.2 - 2026-05-11 09:00
# ============================================================
$env:GIT_AUTHOR_DATE = "2026-05-11T09:00:00+08:00"
$env:GIT_COMMITTER_DATE = "2026-05-11T09:00:00+08:00"
git add archive/v2.0.2/
git commit -m "fix: V2.0.2 full bug fix 12/12" -m "All 12 bugs closed across V2.0, V2.0.1, V2.0.2"
git tag -a v2.0.2 -m "V2.0.2 full bug fix (2026-05-11)"
Write-Output "V2.0.2 done"

# ============================================================
# V3.0 - 2026-05-11 10:00 - Electron migration
# ============================================================
$env:GIT_AUTHOR_DATE = "2026-05-11T10:00:00+08:00"
$env:GIT_COMMITTER_DATE = "2026-05-11T10:00:00+08:00"
git rm -r --cached src-tauri/ 2>$null
git add native/ electron/ electron-builder.yml icons/ release/
git commit -m "feat: V3.0 Electron migration" -m "Tauri to Electron + napi-rs. Remove WebView2 dependency."
git tag -a v3.0 -m "V3.0 Electron migration (2026-05-11)"
Write-Output "V3.0 done"

# ============================================================
# V3.1 - 2026-05-11 11:00 - Novel processor
# ============================================================
$env:GIT_AUTHOR_DATE = "2026-05-11T11:00:00+08:00"
$env:GIT_COMMITTER_DATE = "2026-05-11T11:00:00+08:00"
git add releases/v3.0/ releases/v3.1/
git commit -m "feat: V3.1 novel processor engine" -m "ZH conversion, chapter recognition, content cleaning (RQ-04~08)"
git tag -a v3.1 -m "V3.1 novel processor (2026-05-11)"
Write-Output "V3.1 done"

# ============================================================
# V3.1.1 - 2026-05-11 12:00 - Deployment
# ============================================================
$env:GIT_AUTHOR_DATE = "2026-05-11T12:00:00+08:00"
$env:GIT_COMMITTER_DATE = "2026-05-11T12:00:00+08:00"
git add releases/v3.1.1/
git commit -m "release: V3.1.1 deployment package" -m "Production build with installer + portable"
git tag -a v3.1.1 -m "V3.1.1 deployment (2026-05-11)"
Write-Output "V3.1.1 done"

# ============================================================
# V3.1.2 - 2026-05-11 13:00 - Code normalization
# ============================================================
$env:GIT_AUTHOR_DATE = "2026-05-11T13:00:00+08:00"
$env:GIT_COMMITTER_DATE = "2026-05-11T13:00:00+08:00"
git add releases/v3.1.2/
git commit -m "fix: V3.1.2 code normalization + camelCase alignment"
git tag -a v3.1.2 -m "V3.1.2 code normalization (2026-05-11)"
Write-Output "V3.1.2 done"

# ============================================================
# V3.2 - 2026-05-13 09:00 - File diff
# ============================================================
$env:GIT_AUTHOR_DATE = "2026-05-13T09:00:00+08:00"
$env:GIT_COMMITTER_DATE = "2026-05-13T09:00:00+08:00"
git add releases/v3.2/
git commit -m "feat: V3.2 file diff + chip bar" -m "DiffViewer, FileChipBar, SortableChip (RQ-09/10)"
git tag -a v3.2 -m "V3.2 file diff (2026-05-13)"
Write-Output "V3.2 done"

# ============================================================
# V3.2.1 - 2026-05-13 10:00 - Final (current)
# ============================================================
$env:GIT_AUTHOR_DATE = "2026-05-13T10:00:00+08:00"
$env:GIT_COMMITTER_DATE = "2026-05-13T10:00:00+08:00"
git add releases/v3.2.1/
git commit -m "release: V3.2.1 bug fix - 5/5 closed" -m "Full archive documentation included"
git tag -a v3.2.1 -m "V3.2.1 final release (2026-05-13)"
Write-Output "V3.2.1 done"

# Summary
Write-Output "`n=========================================="
Write-Output "  Version History Created Successfully!"
Write-Output "=========================================="
git log --oneline --all
Write-Output "`nTags:"
git tag -l --sort=version:refname
Write-Output "`nPush command:"
Write-Output 'git push -u origin main --force --tags'
