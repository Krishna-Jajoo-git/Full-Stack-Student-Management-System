# Android Emulator Auto-Launcher and Runner
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Starting Android App on Emulator..." -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

$sdkDir = "$env:LOCALAPPDATA\Android\Sdk"
$emulatorExe = "$sdkDir\emulator\emulator.exe"
$adbExe = "$sdkDir\platform-tools\adb.exe"

# If adb is in PATH, fallback to adb
if (-not (Test-Path $adbExe)) {
    $adbExe = "adb"
}

# 1. Check if an emulator is already attached
$attachedDevices = & $adbExe devices | Where-Object { $_ -match "\tdevice$" }

if (-not $attachedDevices) {
    Write-Host "`n[1/4] No emulator running. Launching Pixel_9a..." -ForegroundColor Yellow
    if (Test-Path $emulatorExe) {
        Start-Process $emulatorExe -ArgumentList "-avd Pixel_9a"
    } else {
        Start-Process "emulator" -ArgumentList "-avd Pixel_9a"
    }

    Write-Host "[2/4] Waiting for emulator to boot up (please wait ~20-30s)..." -ForegroundColor Yellow
    & $adbExe wait-for-device

    $bootComplete = $false
    $timeout = 0
    while (-not $bootComplete -and $timeout -lt 60) {
        Start-Sleep -Seconds 2
        $timeout += 2
        $prop = & $adbExe shell getprop sys.boot_completed 2>$null
        if ($prop -and $prop.Trim() -eq "1") {
            $bootComplete = $true
        }
    }
    Write-Host "✔ Emulator is online and ready!" -ForegroundColor Green
} else {
    Write-Host "`n✔ Active emulator detected!" -ForegroundColor Green
}

# 2. Reverse port for Docker backend
Write-Host "`n[3/4] Routing emulator port 8081 to backend container..." -ForegroundColor Cyan
& $adbExe reverse tcp:8081 tcp:8081

# 3. Install APK
$apkPath = "frontend\android\app\build\outputs\apk\debug\app-debug.apk"
if (Test-Path $apkPath) {
    Write-Host "`n[4/4] Installing & launching app ($apkPath)..." -ForegroundColor Cyan
    & $adbExe install -r $apkPath
} else {
    Write-Host "`n[4/4] Launching app..." -ForegroundColor Cyan
}

# 4. Start activity
& $adbExe shell am force-stop com.studentmanagement.app
& $adbExe shell am start -n com.studentmanagement.app/.MainActivity

Write-Host "`n============================================================" -ForegroundColor Green
Write-Host "  🎉 SUCCESS! The app is now open on your Android Emulator." -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host "Demo Logins:" -ForegroundColor White
Write-Host "  Teacher: teacher@sms.edu | Password: Password123!" -ForegroundColor Yellow
Write-Host "  Student: alice@sms.edu   | Password: Password123!`n" -ForegroundColor Yellow

