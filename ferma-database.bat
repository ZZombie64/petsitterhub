@echo off
echo Arresto database Docker...
docker compose down
echo.
echo Database fermato. Le finestre di backend/frontend vanno chiuse manualmente (o con Ctrl+C).
pause
