@echo off
chcp 65001 >nul
title Text Unifier V3.1.1 安装程序

echo ========================================
echo  Text Unifier V3.1.1 — 安装程序
echo  文档终版确定器 (Electron 版)
echo ========================================
echo.
echo 本程序将 Text Unifier 安装到您的电脑。
echo.

set "PORTABLE_DIR=%~dp0..\portable\TextUnifier_Portable_v3.1.1"

if not exist "%PORTABLE_DIR%\TextUnifier.exe" (
    echo [错误] 找不到便携版文件！
    echo 请确保本安装程序位于 releases\v3.1.1\installer\ 目录下。
    pause
    exit /b 1
)

:CHOOSE_INSTALL_DIR
echo 安装目录 [默认: C:\Program Files\TextUnifier]
set "INSTALL_DIR=C:\Program Files\TextUnifier"
set /p "INSTALL_DIR=请输入安装路径（直接回车使用默认值）: "
if "%INSTALL_DIR%"=="" set "INSTALL_DIR=C:\Program Files\TextUnifier"

echo.
echo 正在安装到: %INSTALL_DIR%
echo.

rem 创建目标目录（如需管理员权限会弹 UAC）
mkdir "%INSTALL_DIR%" 2>nul
if %errorlevel% neq 0 (
    echo [提示] 需要管理员权限安装到系统目录。
    echo 请右键选择「以管理员身份运行」本程序。
    pause
    exit /b 1
)

rem 复制文件
echo 正在复制文件，请稍候...
xcopy "%PORTABLE_DIR%\*" "%INSTALL_DIR%\" /E /I /Y /Q >nul

rem 创建桌面快捷方式
set "DESKTOP=%USERPROFILE%\Desktop"
echo 正在创建桌面快捷方式...
mshta "javascript:var sh=new ActiveXObject('WScript.Shell');var lnk=sh.CreateShortcut('%DESKTOP%\\TextUnifier.lnk');lnk.TargetPath='%INSTALL_DIR%\\TextUnifier.exe';lnk.Description='Text Unifier V3.1.1';lnk.WorkingDirectory='%INSTALL_DIR%';lnk.Save();close()" 2>nul

rem 创建开始菜单快捷方式
set "STARTMENU=%APPDATA%\Microsoft\Windows\Start Menu\Programs"
if exist "%STARTMENU%" (
    mshta "javascript:var sh=new ActiveXObject('WScript.Shell');var lnk=sh.CreateShortcut('%STARTMENU%\\TextUnifier.lnk');lnk.TargetPath='%INSTALL_DIR%\\TextUnifier.exe';lnk.Description='Text Unifier V3.1.1';lnk.WorkingDirectory='%INSTALL_DIR%';lnk.Save();close()" 2>nul
)

echo.
echo ========================================
echo  ✅ 安装完成！
echo ========================================
echo.
echo  安装路径: %INSTALL_DIR%
echo  桌面快捷方式: 已创建
echo  开始菜单: 已创建
echo.
echo  双击桌面「TextUnifier」图标即可运行。
echo.
pause
