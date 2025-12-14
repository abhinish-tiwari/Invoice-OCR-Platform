# PowerShell script to set up the Invoice OCR database
# Run this script from PowerShell as Administrator

Write-Host "=== Invoice OCR Database Setup ===" -ForegroundColor Cyan
Write-Host ""

# Check if PostgreSQL is installed
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue

if (-not $psqlPath) {
    Write-Host "ERROR: PostgreSQL (psql) not found in PATH" -ForegroundColor Red
    Write-Host "Please install PostgreSQL or add it to your PATH" -ForegroundColor Yellow
    Write-Host "Common location: C:\Program Files\PostgreSQL\<version>\bin" -ForegroundColor Yellow
    exit 1
}

Write-Host "PostgreSQL found: $($psqlPath.Source)" -ForegroundColor Green
Write-Host ""

# Prompt for postgres password
Write-Host "Please enter the password for PostgreSQL user 'postgres':" -ForegroundColor Yellow
$postgresPassword = Read-Host -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($postgresPassword)
$plainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

# Set environment variable for password
$env:PGPASSWORD = $plainPassword

Write-Host ""
Write-Host "Running database setup script..." -ForegroundColor Cyan

# Run the SQL script
try {
    psql -U postgres -f setup-database.sql
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "=== Database Setup Completed Successfully! ===" -ForegroundColor Green
        Write-Host ""
        Write-Host "Database Details:" -ForegroundColor Cyan
        Write-Host "  Database Name: invoice_ocr" -ForegroundColor White
        Write-Host "  Username: invoice_ocr_user" -ForegroundColor White
        Write-Host "  Password: invoice_ocr_password_123" -ForegroundColor White
        Write-Host ""
        Write-Host "These credentials are already configured in your .env file" -ForegroundColor Green
        Write-Host ""
        Write-Host "You can now start the server with: npm run dev" -ForegroundColor Yellow
    } else {
        Write-Host ""
        Write-Host "ERROR: Database setup failed" -ForegroundColor Red
        Write-Host "Please check the error messages above" -ForegroundColor Yellow
    }
} catch {
    Write-Host ""
    Write-Host "ERROR: Failed to run setup script" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
} finally {
    # Clear the password from environment
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

