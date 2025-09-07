Write-Host "Starting R&D CRM System..." -ForegroundColor Green
Write-Host ""

Write-Host "Building and starting Docker containers..." -ForegroundColor Yellow
docker-compose up -d --build

Write-Host ""
Write-Host "Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host ""
Write-Host "Running database migrations..." -ForegroundColor Yellow
docker-compose exec backend npm run migrate

Write-Host ""
Write-Host "Seeding database with sample data..." -ForegroundColor Yellow
docker-compose exec backend npm run seed

Write-Host ""
Write-Host "System is ready!" -ForegroundColor Green
Write-Host "Frontend: http://localhost" -ForegroundColor Cyan
Write-Host "Backend API: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""

Write-Host "Opening application in browser..." -ForegroundColor Yellow
Start-Process "http://localhost"
