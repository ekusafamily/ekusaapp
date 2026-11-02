# EKUSA Digital Platform - Startup Script (PowerShell)
# Launches API Backend, React Admin Portal, and Expo Mobile App in separate process windows

Write-Host "=============================================" -ForegroundColor Green
Write-Host "  Starting EKUSA Digital Platform Services   " -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

# 1. Enable Corepack for Yarn 4
corepack enable

# 2. Ensure Prisma Client is generated
Write-Host "1/4 Generating Prisma Client for API..." -ForegroundColor Cyan
Set-Location "C:\Android studio\EKUSA\apps\api"
npx prisma generate

Set-Location "C:\Android studio/EKUSA"

# 3. Start NestJS API Backend (Port 3000)
Write-Host "2/4 Launching NestJS API Backend (http://localhost:3000/api/v1)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location 'C:\Android studio\EKUSA\apps\api'; yarn dev"

# 4. Start React Admin Portal (Port 5173)
Write-Host "3/4 Launching React Admin Portal (http://localhost:5173)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location 'C:\Android studio\EKUSA\apps\admin'; yarn dev"

# 5. Start Expo Mobile App
Write-Host "4/4 Launching Expo Mobile App..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location 'C:\Android studio\EKUSA\apps\mobile'; npx expo start --android"

Write-Host "=============================================" -ForegroundColor Green
Write-Host "  All 3 EKUSA Services Started Successfully! " -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
