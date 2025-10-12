# MongoDB Connection and Cleanup Helper Script
# PowerShell version for Windows

param(
    [string]$TenantId = "t_pk_inspections",
    [switch]$AnalyzeOnly,
    [switch]$Help
)

if ($Help) {
    Write-Host "MongoDB Tenant Cleanup Helper" -ForegroundColor Green
    Write-Host "=============================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Usage:"
    Write-Host "  .\Connect-MongoDB.ps1                    # Interactive mode"
    Write-Host "  .\Connect-MongoDB.ps1 -TenantId 't_pk_inspections' # Direct cleanup"
    Write-Host "  .\Connect-MongoDB.ps1 -AnalyzeOnly       # Analyze data only"
    Write-Host "  .\Connect-MongoDB.ps1 -Help              # Show this help"
    Write-Host ""
    exit 0
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "MongoDB Connection Helper" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "Error: .env file not found!" -ForegroundColor Red
    Write-Host "Please create a .env file with your MONGODB_URI" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Example .env content:" -ForegroundColor Yellow
    Write-Host "MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/intellispec?retryWrites=true&w=majority" -ForegroundColor Gray
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Read MongoDB URI from .env file
$envContent = Get-Content ".env"
$mongoUri = $null

foreach ($line in $envContent) {
    if ($line -match "^MONGODB_URI=(.+)$") {
        $mongoUri = $matches[1]
        break
    }
}

if (-not $mongoUri) {
    Write-Host "Error: MONGODB_URI not found in .env file!" -ForegroundColor Red
    Write-Host "Please add MONGODB_URI to your .env file" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Found MongoDB URI in .env file" -ForegroundColor Green
Write-Host ""

# If AnalyzeOnly switch is used, run analysis
if ($AnalyzeOnly) {
    Write-Host "Analyzing tenant data (no deletion)..." -ForegroundColor Yellow
    Write-Host "Connecting to MongoDB shell with analysis script..." -ForegroundColor Gray
    Write-Host ""
    
    $command = "load('scripts/cleanup-tenant-mongo-shell.js'); analyzeTenant('$TenantId');"
    & mongosh $mongoUri --eval $command
    
    Read-Host "Press Enter to exit"
    exit 0
}

# If TenantId is provided as parameter, run direct cleanup
if ($TenantId -and $TenantId -ne "t_pk_inspections" -or $PSBoundParameters.ContainsKey('TenantId')) {
    Write-Host "Running Node.js cleanup script for tenant: $TenantId" -ForegroundColor Yellow
    Write-Host "WARNING: This will delete ALL data for tenant $TenantId" -ForegroundColor Red
    Write-Host ""
    
    $confirm = Read-Host "Are you sure? Type YES to continue"
    if ($confirm -eq "YES") {
        & node scripts/cleanup-tenant-data.js $TenantId
    } else {
        Write-Host "Operation cancelled." -ForegroundColor Yellow
    }
    
    Read-Host "Press Enter to exit"
    exit 0
}

# Interactive mode
do {
    Write-Host "Choose an option:" -ForegroundColor Cyan
    Write-Host "1. Connect to MongoDB shell (mongosh)" -ForegroundColor White
    Write-Host "2. Run Node.js cleanup script for t_pk_inspections" -ForegroundColor White
    Write-Host "3. Analyze tenant data only (no deletion)" -ForegroundColor White
    Write-Host "4. Custom tenant cleanup" -ForegroundColor White
    Write-Host "5. Exit" -ForegroundColor White
    Write-Host ""
    
    $choice = Read-Host "Enter your choice (1-5)"
    
    switch ($choice) {
        "1" {
            Write-Host ""
            Write-Host "Connecting to MongoDB shell..." -ForegroundColor Green
            Write-Host "You can then run: load(`"scripts/cleanup-tenant-mongo-shell.js`")" -ForegroundColor Gray
            Write-Host "Then: cleanupTenant(`"t_pk_inspections`")" -ForegroundColor Gray
            Write-Host ""
            & mongosh $mongoUri
            break
        }
        
        "2" {
            Write-Host ""
            Write-Host "Running Node.js cleanup script for t_pk_inspections..." -ForegroundColor Yellow
            Write-Host "WARNING: This will delete ALL data for tenant t_pk_inspections" -ForegroundColor Red
            Write-Host ""
            
            $confirm = Read-Host "Are you sure? Type YES to continue"
            if ($confirm -eq "YES") {
                & node scripts/cleanup-tenant-data.js t_pk_inspections
            } else {
                Write-Host "Operation cancelled." -ForegroundColor Yellow
            }
            break
        }
        
        "3" {
            Write-Host ""
            Write-Host "Analyzing tenant data (no deletion)..." -ForegroundColor Yellow
            Write-Host ""
            
            $command = "load('scripts/cleanup-tenant-mongo-shell.js'); analyzeTenant('t_pk_inspections');"
            & mongosh $mongoUri --eval $command
            break
        }
        
        "4" {
            Write-Host ""
            $customTenant = Read-Host "Enter tenant ID to cleanup"
            if ($customTenant) {
                Write-Host "Running Node.js cleanup script for tenant: $customTenant" -ForegroundColor Yellow
                Write-Host "WARNING: This will delete ALL data for tenant $customTenant" -ForegroundColor Red
                Write-Host ""
                
                $confirm = Read-Host "Are you sure? Type YES to continue"
                if ($confirm -eq "YES") {
                    & node scripts/cleanup-tenant-data.js $customTenant
                } else {
                    Write-Host "Operation cancelled." -ForegroundColor Yellow
                }
            }
            break
        }
        
        "5" {
            Write-Host "Goodbye!" -ForegroundColor Green
            exit 0
        }
        
        default {
            Write-Host "Invalid choice. Please try again." -ForegroundColor Red
            Write-Host ""
        }
    }
    
    if ($choice -ne "5") {
        Write-Host ""
        Read-Host "Press Enter to continue"
        Write-Host ""
    }
    
} while ($choice -ne "5")
