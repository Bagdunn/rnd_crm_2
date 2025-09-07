@echo off
echo Stopping R&D CRM System...
echo.

echo Stopping Docker containers...
docker-compose down

echo.
echo System stopped successfully!
echo.
pause
