# update_github.ps1 - PowerShell-Script zum einfachen Aktualisieren des GitHub-Repositories

Write-Host "=== GitHub Update Script ===" -ForegroundColor Yellow

# Überprüfen Sie die aktuelle Remote-URL
Write-Host "Aktuelle Remote-URL:" -ForegroundColor Blue
git remote -v

# Ändern Sie die Remote-URL auf Ihr Repository
Write-Host "Setze Remote-URL auf dein Repository..." -ForegroundColor Blue
git remote set-url origin https://github.com/japorto100/Backend-to-merge.git

# Überprüfen Sie, ob die Änderung erfolgreich war
Write-Host "Neue Remote-URL:" -ForegroundColor Blue
git remote -v

# 1. Aktuelle Änderungen anzeigen
Write-Host "Aktuelle Änderungen:" -ForegroundColor Blue
git status -s

# 2. Bestätigung vom Benutzer einholen
$commit_msg = Read-Host "Commit-Nachricht eingeben (oder 'q' zum Abbrechen)"

if ($commit_msg -eq "q") {
    Write-Host "Vorgang abgebrochen." -ForegroundColor Yellow
    exit
}

# 3. Änderungen hinzufügen
Write-Host "Füge Änderungen hinzu..." -ForegroundColor Blue
git add .

# 4. Commit erstellen
Write-Host "Erstelle Commit..." -ForegroundColor Blue
git commit -m $commit_msg

# 5. Zu GitHub pushen
Write-Host "Pushe zu GitHub..." -ForegroundColor Blue
git push

# 6. Erfolgsmeldung
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Update erfolgreich! Änderungen wurden zu GitHub gepusht." -ForegroundColor Green
} else {
    Write-Host "⚠ Es gab ein Problem beim Pushen. Bitte überprüfen Sie die Fehlermeldungen." -ForegroundColor Yellow
}
