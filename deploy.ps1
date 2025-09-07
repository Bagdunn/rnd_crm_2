# R&D CRM Deployment Script for Windows
param(
    [switch]$SkipValidation
)

Write-Host "🚀 Starting R&D CRM deployment..." -ForegroundColor Green

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ .env file not found. Please create it from env.example" -ForegroundColor Red
    Write-Host "   Copy-Item env.example .env" -ForegroundColor Yellow
    Write-Host "   # Then edit .env with your production values" -ForegroundColor Yellow
    exit 1
}

# Load environment variables
if (-not $SkipValidation) {
    Write-Host "✅ Environment file found" -ForegroundColor Green
}

# Stop existing containers
Write-Host "🛑 Stopping existing containers..." -ForegroundColor Yellow
try {
    docker-compose -f docker-compose.prod.yml down
} catch {
    Write-Host "   No existing containers to stop" -ForegroundColor Gray
}

# Build and start services
Write-Host "🔨 Building and starting services..." -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml up -d --build

# Wait for services to be healthy
Write-Host "⏳ Waiting for services to be healthy..." -ForegroundColor Yellow
$timeout = 300
$elapsed = 0
while ($elapsed -lt $timeout) {
    $status = docker-compose -f docker-compose.prod.yml ps
    if ($status -match "healthy") {
        Write-Host "✅ Services are healthy" -ForegroundColor Green
        break
    }
    Start-Sleep -Seconds 5
    $elapsed += 5
    Write-Host "   Waiting... ($elapsed s/$timeout s)" -ForegroundColor Gray
}

if ($elapsed -ge $timeout) {
    Write-Host "❌ Services failed to become healthy within $timeout s" -ForegroundColor Red
    docker-compose -f docker-compose.prod.yml logs
    exit 1
}

# Run database migrations
Write-Host "🗄️ Running database migrations..." -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml exec backend npm run migrate-all

# Show status
Write-Host "📊 Service status:" -ForegroundColor Green
docker-compose -f docker-compose.prod.yml ps

Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Access information:" -ForegroundColor Cyan
Write-Host "   Frontend: http://your-domain.com" -ForegroundColor White
Write-Host "   Backend API: http://your-domain.com/api" -ForegroundColor White
Write-Host "   Login: http://your-domain.com/login.html" -ForegroundColor White
Write-Host ""
Write-Host "🔐 Default credentials:" -ForegroundColor Cyan
Write-Host "   Username: admin" -ForegroundColor White
Write-Host "   Password: admin123" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Please change the default password after first login!" -ForegroundColor Yellow
Write-Host ""
Write-Host "📝 Useful commands:" -ForegroundColor Cyan
Write-Host "   View logs: docker-compose -f docker-compose.prod.yml logs -f" -ForegroundColor White
Write-Host "   Stop services: docker-compose -f docker-compose.prod.yml down" -ForegroundColor White
Write-Host "   Restart services: docker-compose -f docker-compose.prod.yml restart" -ForegroundColor White
