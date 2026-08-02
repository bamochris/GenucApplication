@echo off
title GENUC Backend
echo ============================================
echo   GENUC Backend : demarrage propre
echo ============================================
echo.

echo [1/3] Liberation du port 8082 (arret des instances existantes)...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 8082 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Write-Host ('   - arret du processus PID ' + $_) ; Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }"

echo [2/3] Verification de Redis (port 6379)...
powershell -NoProfile -Command "if (Test-NetConnection localhost -Port 6379 -InformationLevel Quiet -WarningAction SilentlyContinue) { Write-Host '   Redis OK' } else { Write-Host '   Redis inactif : demarrage de Docker Desktop (patientez ~1 min)...' ; Start-Process 'C:\Program Files\Docker\Docker\Docker Desktop.exe' ; $d = (Get-Date).AddSeconds(120) ; while ((Get-Date) -lt $d) { docker info *> $null ; if ($LASTEXITCODE -eq 0) { break } ; Start-Sleep -Seconds 5 } ; docker start genuc-redis | Out-Null ; Write-Host '   Redis demarre' }"

echo [3/3] Lancement du backend : http://localhost:8082/api
echo       (les logs sont aussi copies dans dernier-demarrage.log)
echo.
cd /d "%~dp0genuc-backend"
call mvn spring-boot:run 2>&1 | powershell -NoProfile -Command "$input | Tee-Object -FilePath '%~dp0dernier-demarrage.log'"

echo.
echo Le backend s'est arrete. Consultez les dernieres lignes ci-dessus
echo ou le fichier dernier-demarrage.log pour la cause.
pause
