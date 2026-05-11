@echo off
chcp 65001 >nul
title Text Unifier V2.0.2 便携版 - 环境检测启动器

echo ========================================
echo  Text Unifier V2.0.2 便携版
echo  正在检测运行环境...
echo =========================================
echo.

REM 检测 WebView2 是否已安装
reg query "HKLM\SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00A3C2C9C4B4}" >nul 2>&1
if %errorlevel% equ 0 (
    echo [✓] WebView2 运行时已安装
    goto :RUN
)

reg query "HKLM\SOFTWARE\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00A3C2C9C4B4}" >nul 2>&1
if %errorlevel% equ 0 (
    echo [✓] WebView2 运行时已安装
    goto :RUN
)

echo [!] 未检测到 WebView2 运行时，正在自动安装...
echo.

REM 检查同目录下是否有离线安装包
if exist "MicrosoftEdgeWebView2RuntimeInstallerX64.exe" (
    echo [*] 正在使用本地安装包进行静默安装...
    start /wait "" "MicrosoftEdgeWebView2RuntimeInstallerX64.exe" /silent /install
) else (
    echo [*] 正在下载 WebView2 运行时（约 2MB）...
    echo [*] 请稍候...
    powershell -Command "& {try{Invoke-WebRequest -Uri 'https://go.microsoft.com/fwlink/p/?LinkId=2124703' -OutFile '%TEMP%\WebView2Bootstrapper.exe' -UseBasicParsing; Write-Output '下载完成'}catch{Write-Error '下载失败'}}"
    
    if exist "%TEMP%\WebView2Bootstrapper.exe" (
        echo [*] 正在静默安装 WebView2 运行时...
        start /wait "" "%TEMP%\WebView2Bootstrapper.exe" /silent /install
        del "%TEMP%\WebView2Bootstrapper.exe" 2>nul
    ) else (
        echo.
        echo [✗] 自动下载失败，请手动安装 WebView2 运行时：
        echo     1. 打开浏览器访问：
        echo        https://developer.microsoft.com/zh-cn/microsoft-edge/webview2/
        echo     2. 点击"下载" → "Evergreen 独立安装程序"
        echo     3. 运行下载的安装程序完成安装
        echo.
        pause
        exit /b 1
    )
)

REM 验证安装结果
reg query "HKLM\SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00A3C2C9C4B4}" >nul 2>&1
if %errorlevel% equ 0 (
    echo [✓] WebView2 运行时安装成功！
) else (
    echo [!] 安装可能未完成，继续尝试启动...
)

:RUN
echo.
echo =========================================
echo  正在启动 Text Unifier V2.0.2...
echo  如仍无反应，请右键以管理员身份运行
echo =========================================
echo.

start "" "%~dp0TextUnifier_Portable_v2.0.2.exe"
