# PowerShell script to start ngrok tunnel
# This exposes your local server to the internet

$port = if ($env:PORT) { $env:PORT } else { 4000 }

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "🚀 Starting ngrok tunnel..." -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "📡 Local server: http://localhost:$port" -ForegroundColor Yellow
Write-Host "🌐 Public URL will be displayed below`n" -ForegroundColor Yellow

# Check if ngrok is installed
$ngrokCheck = Get-Command ngrok -ErrorAction SilentlyContinue

if (-not $ngrokCheck) {
    Write-Host "❌ ngrok is not installed!" -ForegroundColor Red
    Write-Host "`n💡 To install ngrok:" -ForegroundColor Yellow
    Write-Host "   1. Download from: https://ngrok.com/download" -ForegroundColor White
    Write-Host "   2. Or use chocolatey: choco install ngrok" -ForegroundColor White
    Write-Host "   3. Or use npm: npm install -g ngrok" -ForegroundColor White
    Write-Host "`n   After installation, run this script again.`n" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ ngrok found! Starting tunnel...`n" -ForegroundColor Green

# Start ngrok
Start-Process ngrok -ArgumentList "http $port" -NoNewWindow

Write-Host "🌐 ngrok is starting..." -ForegroundColor Cyan
Write-Host "💡 Check the ngrok web interface at: http://localhost:4040" -ForegroundColor Yellow
Write-Host "💡 Press Ctrl+C to stop ngrok`n" -ForegroundColor Yellow

# Wait for user input
Write-Host "Press any key to stop ngrok..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

