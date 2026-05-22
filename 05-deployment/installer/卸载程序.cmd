@echo off
chcp 65001 >nul
title Text Unifier V4.0.0 卸载程序

:: ============================================
:: Text Unifier V4.0.0 — 卸载程序
:: 文档终版确定器 (Electron 31 + napi-rs)
:: ============================================
:: 使用方法：右键 → 「以管理员身份运行」
:: ============================================

setlocal enabledelayedexpansion

echo ========================================
echo  Text Unifier V4.0.0 — 卸载程序
echo ========================================
echo.

:: 检测是否管理员权限（卸载需要）
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [提示] 卸载需要管理员权限。
    echo        请右键 → 「以管理员身份运行」。
    pause
    exit /b 1
)

:: 显示安装目录
set "DEFAULT_DIR=C:\Program Files\TextUnifier"
set "INSTALL_DIR=%DEFAULT_DIR%"

echo 默认安装路径: %DEFAULT_DIR%
set /p "INSTALL_DIR=请输入实际安装路径（直接回车使用默认值）: "
if "!INSTALL_DIR!"=="" set "INSTALL_DIR=%DEFAULT_DIR%"

if not exist "!INSTALL_DIR!" (
    echo [信息] 安装目录不存在: !INSTALL_DIR!
    echo        可能已被手动删除，将继续清理快捷方式。
) else (
    echo.
    echo 即将删除以下目录及其所有文件:
    echo   !INSTALL_DIR!
    echo.
    set /p "CONFIRM=确认卸载？(Y/N): "
    if /i "!CONFIRM!" neq "Y" (
        echo 已取消卸载。
        pause
        exit /b 0
    )

    :: 删除安装目录
    echo 正在删除安装目录 ...
    rmdir /s /q "!INSTALL_DIR!" 2>nul
    if !errorlevel! neq 0 (
        echo [警告] 部分文件无法删除，请手动检查。
    ) else (
        echo ✅ 安装目录已删除。
    )
)

:: 删除桌面快捷方式
echo 正在删除桌面快捷方式 ...
del /f /q "%USERPROFILE%\Desktop\TextUnifier.lnk" 2>nul
echo ✅ 桌面快捷方式已删除（如存在）。

:: 删除开始菜单快捷方式
echo 正在删除开始菜单快捷方式 ...
del /f /q "%APPDATA%\Microsoft\Windows\Start Menu\Programs\TextUnifier.lnk" 2>nul
echo ✅ 开始菜单快捷方式已删除（如存在）。

echo.
echo ========================================
echo  ✅ 卸载完成！
echo ========================================
echo.
echo  Text Unifier V4.0.0 已从本机完全移除。
echo  用户数据目录如需清理，请手动删除：
echo   %APPDATA%\TextUnifier
echo.
pause
