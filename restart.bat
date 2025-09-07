@echo off
echo Restarting R&D CRM System...
echo.

echo Stopping current containers...
docker-compose down

echo.
echo Starting containers...
docker-compose up -d

echo.
echo System restarted successfully!
echo Frontend: http://localhost
echo Backend API: http://localhost:3000
echo.
pause
