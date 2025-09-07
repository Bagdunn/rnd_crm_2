@echo off
echo Starting R&D CRM System...
echo.

echo Building and starting Docker containers...
docker-compose up -d --build

echo.
echo Waiting for services to start...
timeout /t 10 /nobreak > nul

echo.
echo Running database migrations...
docker-compose exec backend npm run migrate

echo.
echo Seeding database with sample data...
docker-compose exec backend npm run seed

echo.
echo System is ready!
echo Frontend: http://localhost
echo Backend API: http://localhost:3000
echo.
echo Press any key to open the application...
pause > nul

start http://localhost
