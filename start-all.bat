@echo off
title EKUSA Digital Platform Services Launcher
echo =============================================
echo   Starting EKUSA Digital Platform Services
echo =============================================

:: Enable Corepack for Yarn 4
call corepack enable

:: Generate Prisma Client
echo [1/4] Generating Prisma Client...
cd /d "C:\Android studio\EKUSA\apps\api"
call npx prisma generate

cd /d "C:\Android studio\EKUSA"

:: Launch NestJS API
echo [2/4] Starting NestJS API Backend (Port 3000)...
start "EKUSA NestJS API (Port 3000)" cmd /k "cd /d C:\Android studio\EKUSA\apps\api && yarn dev"

:: Launch Admin Portal
echo [3/4] Starting React Admin Portal (Port 5173)...
start "EKUSA Admin Portal (Port 5173)" cmd /k "cd /d C:\Android studio\EKUSA\apps\admin && yarn dev"

:: Launch Mobile App
echo [4/4] Starting Expo Mobile App...
start "EKUSA Mobile App (Expo)" cmd /k "cd /d C:\Android studio\EKUSA\apps\mobile && npx expo start --android"

echo =============================================
echo   All EKUSA Services Started!
echo =============================================
