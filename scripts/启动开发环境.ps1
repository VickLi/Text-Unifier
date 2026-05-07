# 文档终版确定器 (Text Unifier) - 开发环境启动脚本
# 此脚本自动配置 MSVC 编译环境并启动 Tauri 开发服务器

$ErrorActionPreference = "Stop"

# 设置 PATH
$env:Path = "$env:USERPROFILE\.cargo\bin;$env:USERPROFILE\.node-portable;$env:Path"

# 配置 MSVC 编译环境
$vcDir = "$env:USERPROFILE\.vs\VC\Tools\MSVC\14.44.35207"
$kitVer = "10.0.26100.0"
$kitRoot = "C:\Program Files (x86)\Windows Kits\10"

if (Test-Path $vcDir) {
    $env:Path = "$vcDir\bin\Hostx64\x64;$env:Path"
    $env:INCLUDE = "$vcDir\include;$kitRoot\Include\$kitVer\um;$kitRoot\Include\$kitVer\shared;$kitRoot\Include\$kitVer\ucrt"
    $env:LIB = "$vcDir\lib\x64;$kitRoot\Lib\$kitVer\um\x64;$kitRoot\Lib\$kitVer\ucrt\x64"
    Write-Host "MSVC 环境已配置" -ForegroundColor Green
} else {
    Write-Host "警告: MSVC 编译工具未安装" -ForegroundColor Yellow
}

# 启动开发服务器
Write-Host "正在启动 Tauri 开发服务器..." -ForegroundColor Cyan
cd "g:\CodeProject\Text Unifier"
npm run tauri dev
