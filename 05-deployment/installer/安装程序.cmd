@echo off
chcp 65001 >nul
title Text Unifier V4.0.0 安装程序

:: ============================================
:: Text Unifier V4.0.0 — 安装程序
:: 文档终版确定器 (Electron 31 + napi-rs)
:: ============================================
:: 使用方法：右键 → 「以管理员身份运行」
:: ============================================

setlocal enabledelayedexpansion

echo ========================================
echo  Text Unifier V4.0.0 — 安装程序
echo  文档终版确定器 (Electron 版)
echo ========================================
echo.

:: 检测是否管理员权限
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [提示] 本脚本需要管理员权限。
    echo        请右键 → 「以管理员身份运行」。
    pause
    exit /b 1
)

:: 确定便携版目录（相对于脚本所在目录）
set "SCRIPT_DIR=%~dp0"
set "PORTABLE_DIR=%SCRIPT_DIR%..\portable\TextUnifier_Portable_v4.0.0"

if not exist "%PORTABLE_DIR%\Text Unifier.exe" (
    echo [错误] 找不到便携版文件！
    echo        预期路径: %PORTABLE_DIR%
    echo.
    echo        请确保便携版 ZIP 已解压到 portable\TextUnifier_Portable_v4.0.0\ 目录。
    pause
    exit /b 1
)

:: 选择安装路径
set "INSTALL_DIR=C:\Program Files\TextUnifier"
set /p "INSTALL_DIR=请输入安装路径（直接回车使用默认值 C:\Program Files\TextUnifier）: "
if "!INSTALL_DIR!"=="" set "INSTALL_DIR=C:\Program Files\TextUnifier"

:: 创建安装目录
mkdir "!INSTALL_DIR!" 2>nul
if !errorlevel! neq 0 (
    echo [错误] 无法创建目录 !INSTALL_DIR!。
    echo        请检查权限或选择其他路径。
    pause
    exit /b 1
)

:: 复制文件
echo 正在复制文件到 !INSTALL_DIR! ...
xcopy "%PORTABLE_DIR%\*" "!INSTALL_DIR!\" /E /I /Y /Q >nul
if !errorlevel! neq 0 (
    echo [错误] 文件复制失败！
    pause
    exit /b 1
)

:: 创建桌面快捷方式
echo 正在创建桌面快捷方式 ...
mshta "javascript:var sh=new ActiveXObject('WScript.Shell');var lnk=sh.CreateShortcut('%USERPROFILE%\\Desktop\\TextUnifier.lnk');lnk.TargetPath='!INSTALL_DIR!\\Text Unifier.exe';lnk.Description='Text Unifier V4.0.0 - 文档终版确定器';lnk.WorkingDirectory='!INSTALL_DIR!';lnk.Save();close()" 2>nul

:: 创建开始菜单快捷方式
echo 正在创建开始菜单快捷方式 ...
mshta "javascript:var sh=new ActiveXObject('WScript.Shell');var sm=sh.SpecialFolders('Programs');var lnk=sh.CreateShortcut(sm+'\\\\TextUnifier.lnk');lnk.TargetPath='!INSTALL_DIR!\\Text Unifier.exe';lnk.Description='Text Unifier V4.0.0 - 文档终版确定器';lnk.WorkingDirectory='!INSTALL_DIR!';lnk.Save();close()" 2>nul

echo.
echo ========================================
echo  ✅ 安装完成！
echo ========================================
echo  安装路径: !INSTALL_DIR!
echo  桌面快捷方式: 已创建
echo  开始菜单: 已添加
echo.
echo  启动方式：双击桌面「TextUnifier」快捷方式
echo.
pause
