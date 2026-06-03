# Text Unifier Tauri Demo — 一键构建与打包脚本
# 运行方式: PowerShell 右键 → "使用 PowerShell 运行" 或
#          powershell -ExecutionPolicy Bypass -File build-demo.ps1

$ErrorActionPreference = "Stop"
$demoDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $demoDir

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Text Unifier Tauri Demo 构建脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 1. 确保 npm 依赖已安装
Write-Host "`n[1/4] 检查 npm 依赖..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "  安装 npm 依赖..." -ForegroundColor Gray
    npm install
}
Write-Host "  ✓ npm 依赖就绪" -ForegroundColor Green

# 2. 构建前端 (Vite)
Write-Host "`n[2/4] 构建前端 (Vite)..." -ForegroundColor Yellow
npx vite build
Write-Host "  ✓ 前端构建完成" -ForegroundColor Green

# 3. 编译 Rust 后端 (debug 模式，更快)
Write-Host "`n[3/4] 编译 Rust 后端 (debug 模式，首次 5-10 分钟)..." -ForegroundColor Yellow
Push-Location "src-tauri"
cargo build
Pop-Location
Write-Host "  ✓ Rust 编译完成" -ForegroundColor Green

# 4. 制作 portable 压缩包
Write-Host "`n[4/4] 制作 portable 压缩包..." -ForegroundColor Yellow

$exePath = "src-tauri\target\debug\text-unifier-demo.exe"

if (Test-Path $exePath) {
    $packageDir = "TextUnifier_Demo_Portable"
    $zipName = "TextUnifier_Demo_Portable.zip"
    
    # 清理旧包
    Remove-Item $packageDir -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item $zipName -Force -ErrorAction SilentlyContinue
    
    # 创建目录结构
    New-Item -ItemType Directory -Path $packageDir -Force | Out-Null
    
    # 复制 exe
    Copy-Item $exePath "$packageDir\TextUnifier_Demo.exe" -Force
    
    # 复制 WebView2 引导程序（如有本地安装）
    $wv2Path = "$env:ProgramFiles\Microsoft\EdgeWebView\Application"
    if (Test-Path $wv2Path) {
        Write-Host "  检测到 WebView2 Runtime 已安装: $wv2Path" -ForegroundColor Gray
    } else {
        Write-Host "  ⚠ 未检测到 WebView2 Runtime，首次运行可能需要联网下载" -ForegroundColor Yellow
    }
    
    # 创建说明文件
    $readmeContent = @"
Text Unifier V4.0 Tauri Demo - Portable Edition
================================================

How to run:
  Double-click TextUnifier_Demo.exe

If you need WebView2 Runtime (Win10 LTSC or minimal Windows):
  Download: https://go.microsoft.com/fwlink/p/?LinkId=2124703

Demo features:
  - Drag & drop .txt files into the window
  - Click + button to select files
  - Auto-merge preview
  - Export as UTF-8 with BOM
"@
    $readmeContent | Out-File "$packageDir\README.txt" -Encoding UTF8
    
    # 压缩
    Compress-Archive -Path $packageDir\* -DestinationPath $zipName -Force
    Remove-Item $packageDir -Recurse -Force
    
    $zipSize = (Get-Item $zipName).Length
    Write-Host "  ✓ 打包完成!" -ForegroundColor Green
    Write-Host "  📦 $zipName ($('{0:N0}' -f $zipSize) bytes)" -ForegroundColor Green
    Write-Host "  位置: $(Join-Path $demoDir $zipName)" -ForegroundColor Green
} else {
    Write-Host "  ✗ 找不到编译产物，请检查 Rust 编译是否成功" -ForegroundColor Red
    Write-Host "  尝试手动运行: cd src-tauri; cargo build --release" -ForegroundColor Gray
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " 构建完成!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
