# auto-deploy.ps1 - 파일 변경 감지 시 자동 빌드+배포
Write-Host "ORBIT 자동 배포 감시 시작..." -ForegroundColor Cyan
$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = "C:\Kane-github\orbit\apps\web\src"
$watcher.IncludeSubdirectories = $true
$watcher.Filter = "*.*"
$watcher.EnableRaisingEvents = $true

$action = {
    Start-Sleep -Seconds 3
    Write-Host "`n파일 변경 감지! 빌드 시작..." -ForegroundColor Yellow
    Set-Location "C:\Kane-github\orbit\apps\web"
    $result = npx next build 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "빌드 성공! 배포 중..." -ForegroundColor Green
        Set-Location "C:\Kane-github\orbit"
        git add -A
        git commit -m "auto: deploy from file watcher"
        git push origin main
        Write-Host "배포 완료!" -ForegroundColor Green
    } else {
        Write-Host "빌드 실패:" -ForegroundColor Red
        Write-Host $result
    }
}

Register-ObjectEvent $watcher "Changed" -Action $action | Out-Null
Register-ObjectEvent $watcher "Created" -Action $action | Out-Null

Write-Host "감시 중... Antigravity가 파일 수정하면 자동 빌드+배포됩니다." -ForegroundColor Cyan
Write-Host "종료하려면 Ctrl+C" -ForegroundColor Gray
while ($true) { Start-Sleep -Seconds 1 }
