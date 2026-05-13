@echo off
chcp 65001 >nul
title Text Unifier V3.2.1 安装程序

echo ========================================
echo  Text Unifier V3.2.1 — 安装程序
echo  文档终版确定器 (Electron 版)
echo ========================================
echo.

set "PORTABLE_DIR=%~dp0..\portable\TextUnifier_Portable_v3.2.1"

if not exist "%PORTABLE_DIR%\TextUnifier.exe" (
    echo [错误] 找不到便携版文件！
    pause
    exit /b 1
)

set "INSTALL_DIR=C:\Program Files\TextUnifier"
set /p "INSTALL_DIR=请输入安装路径（直接回车使用默认值）: "
if "%INSTALL_DIR%"=="" set "INSTALL_DIR=C:\Program Files\TextUnifier"

mkdir "%INSTALL_DIR%" 2>nul
if %errorlevel% neq 0 (
    echo [提示] 需要管理员权限，请右键「以管理员身份运行」。
    pause
    exit /b 1
)

xcopy "%PORTABLE_DIR%\*" "%INSTALL_DIR%\" /E /I /Y /Q >nul

mshta "javascript:var sh=new ActiveXObject('WScript.Shell');var lnk=sh.CreateShortcut('%USERPROFILE%\\Desktop\\TextUnifier.lnk');lnk.TargetPath='%INSTALL_DIR%\\TextUnifier.exe';lnk.Description='Text Unifier V3.2.1';lnk.WorkingDirectory='%INSTALL_DIR%';lnk.Save();close()" 2>nul

echo.
echo ========================================
echo  ✅ 安装完成！
echo ========================================
echo  安装路径: %INSTALL_DIR%
echo  桌面快捷方式: 已创建
echo.
pause
