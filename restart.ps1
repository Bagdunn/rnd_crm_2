Write-Host "Restarting R&D CRM System..." -ForegroundColor Yellow
Write-Host ""

Write-Host "Stopping current containers..." -ForegroundColor Yellow
docker-compose down

Write-Host ""
Write-Host "Starting containers..." -ForegroundColor Yellow
docker-compose up -d

Write-Host ""
Write-Host "System restarted successfully!" -ForegroundColor Green
Write-Host "Frontend: http://localhost" -ForegroundColor Cyan
Write-Host "Backend API: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
