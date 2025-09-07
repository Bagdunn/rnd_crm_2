@echo off
echo R&D CRM System Status
echo.

echo Docker containers status:
docker-compose ps

echo.
echo Docker images:
docker images | findstr rnd_crm

echo.
echo Docker volumes:
docker volume ls | findstr rnd_crm

echo.
echo System resources:
docker stats --no-stream

echo.
pause
