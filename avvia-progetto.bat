@echo off
setlocal

echo ============================================
echo   PetSitterHub - Avvio ambiente di sviluppo
echo ============================================
echo.

echo [1/3] Avvio database (Docker)...
docker compose up -d
if errorlevel 1 (
    echo.
    echo ERRORE: Docker non risponde. Assicurati che Docker Desktop sia avviato.
    pause
    exit /b 1
)

echo.
echo Attendo qualche secondo che il database sia pronto...
timeout /t 5 /nobreak >nul

echo.
echo [2/3] Avvio backend in una nuova finestra...
start "PetSitterHub - Backend" cmd /k "cd backend && npm run dev"

echo [3/3] Avvio frontend in una nuova finestra...
start "PetSitterHub - Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ============================================
echo Tutto avviato!
echo   Backend:  http://localhost:3000/api/health
echo   Frontend: http://localhost:5173
echo ============================================
echo.
echo Questa finestra puo' essere chiusa. Le finestre di backend e frontend restano aperte.
pause
