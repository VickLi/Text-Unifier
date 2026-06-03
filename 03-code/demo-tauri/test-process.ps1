# Text Unifier Demo — 进程生命周期验证脚本
# 用法: 先构建 Demo，然后运行此脚本验证进程启动/退出

param(
    [string]$ExePath = "src-tauri\target\release\text-unifier-demo.exe",
    [int]$TestDuration = 10
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Text Unifier Tauri Demo — 进程验证" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. 检查 exe 是否存在
if (-not (Test-Path $ExePath)) {
    Write-Host "❌ 找不到 Demo exe: $ExePath" -ForegroundColor Red
    Write-Host "   请先运行: npm run tauri build" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Demo exe 存在: $ExePath" -ForegroundColor Green

# 2. 记录启动前的进程快照
Write-Host ""
Write-Host "[1] 启动前进程快照..." -ForegroundColor Yellow
$before = Get-Process | Select-Object Name, Id | Sort-Object Name

# 3. 启动 Demo
Write-Host "[2] 启动 Demo..." -ForegroundColor Yellow
$proc = Start-Process -FilePath $ExePath -PassThru
Write-Host "    PID: $($proc.Id)" -ForegroundColor Gray
Start-Sleep -Seconds 3

# 4. 检查进程是否存在
Write-Host "[3] 检查进程状态..." -ForegroundColor Yellow
$alive = Get-Process -Id $proc.Id -ErrorAction SilentlyContinue
if ($alive) {
    Write-Host "✅ 进程运行中 (PID: $($proc.Id))" -ForegroundColor Green
    
    # 检查窗口
    $hasWindow = $alive.MainWindowHandle -ne 0
    if ($hasWindow) {
        Write-Host "✅ 窗口句柄存在 (HWND: $($alive.MainWindowHandle))" -ForegroundColor Green
    } else {
        Write-Host "⚠️ 进程运行但无窗口句柄 — 这可能就是之前遇到的问题！" -ForegroundColor Yellow
    }
    
    # 检查内存
    $ws = [math]::Round($alive.WorkingSet64 / 1MB, 1)
    Write-Host "   内存: ${ws}MB" -ForegroundColor Gray

    # 等待用户操作
    Write-Host ""
    Write-host "📋 Demo 已启动，请在窗口中进行以下测试：" -ForegroundColor Cyan
    Write-Host "   1. 拖拽一个 .txt 文件到窗口" -ForegroundColor White
    Write-Host "   2. 点击 + 按钮选择文件" -ForegroundColor White
    Write-Host "   3. 查看预览区是否正常显示文本" -ForegroundColor White
    Write-Host "   4. 点击导出按钮" -ForegroundColor White
    Write-Host ""
    Write-Host "   完成后关闭 Demo 窗口，此脚本将自动检测..." -ForegroundColor Gray

    # 等待进程退出
    Wait-Process -Id $proc.Id -Timeout 120 -ErrorAction SilentlyContinue
    
    # 再等 2 秒确保完全退出
    Start-Sleep -Seconds 2
} else {
    Write-Host "❌ 进程已退出！启动后 3 秒内退出，可能存在启动错误" -ForegroundColor Red
}

# 5. 检查是否有残留进程
Write-Host ""
Write-Host "[4] 检查残留进程..." -ForegroundColor Yellow
$after = Get-Process | Where-Object { $_.Name -like "*text-unifier*" -or $_.Name -like "*msedgewebview2*" }

if ($after) {
    Write-Host "❌ 发现残留进程！" -ForegroundColor Red
    $after | Format-Table Name, Id, MainWindowTitle -AutoSize
    
    Write-Host ""
    Write-Host "是否强制终止这些进程? (Y/N)" -ForegroundColor Yellow
    $response = Read-Host
    if ($response -eq 'Y') {
        $after | Stop-Process -Force
        Write-Host "✅ 已终止所有残留进程" -ForegroundColor Green
    }
} else {
    Write-Host "✅ 无残留进程，退出干净" -ForegroundColor Green
}

# 6. 总结
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " 测试总结" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
if (-not $after -and $alive) {
    Write-Host "✅ 所有检查通过 — Tauri Demo 在你的环境中运行正常" -ForegroundColor Green
    Write-Host "   建议: 继续 Tauri 全量重构方案" -ForegroundColor Green
} else {
    Write-Host "❌ 发现问题 — 建议回退 Electron 方案" -ForegroundColor Red
}
