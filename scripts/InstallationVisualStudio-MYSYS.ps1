# Skript: Setup-DevEnv.ps1

# 1. Visual Studio 2022 Build Tools herunterladen und installieren
Write-Host "Lade Visual Studio 2022 Build Tools herunter..."
$vsInstallerUrl = "https://aka.ms/vs/17/release/vs_BuildTools.exe"
$vsInstallerPath = "$env:TEMP\vs_BuildTools.exe"
Invoke-WebRequest -Uri $vsInstallerUrl -OutFile $vsInstallerPath

Write-Host "Installiere Visual Studio 2022 Build Tools (Desktop development with C++, Windows SDK, MSVC v143)..."
# Die folgenden Parameter installieren den Workload "Desktop Development with C++" inkl. empfohlener Komponenten.
Start-Process -FilePath $vsInstallerPath -ArgumentList `
    "--quiet --wait --norestart --nocache modify --installPath `"C:\BuildTools`" --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended" `
    -Wait

# 2. MSYS2 herunterladen und installieren
Write-Host "Lade MSYS2 herunter..."
# Hier wird ein stabiler Build (64-Bit) von MSYS2 verwendet. (Link kann je nach Version variieren)
$msys2InstallerUrl = "https://repo.msys2.org/distrib/x86_64/msys2-x86_64-20210725.exe"
$msys2InstallerPath = "$env:TEMP\msys2.exe"
Invoke-WebRequest -Uri $msys2InstallerUrl -OutFile $msys2InstallerPath

Write-Host "Installiere MSYS2..."
# Viele MSYS2-Installer unterstützen den Schalter "/S" für eine stille Installation.
Start-Process -FilePath $msys2InstallerPath -ArgumentList "/S" -Wait

# 3. MSYS2 aktualisieren und benötigte Pakete installieren
# Standardinstallation von MSYS2 erfolgt in der Regel in C:\msys64 – passe den Pfad an, falls anders!
$msys2Path = "C:\msys64"

Write-Host "Aktualisiere MSYS2 (pacman -Syu)..."
& "$msys2Path\usr\bin\bash.exe" -lc "pacman -Syu --noconfirm"

Write-Host "Installiere pkg-config und Poppler-Entwicklungsdateien..."
# Für 64-Bit-Umgebung: mingw-w64-x86_64-poppler
& "$msys2Path\usr\bin\bash.exe" -lc "pacman -S --noconfirm pkg-config mingw-w64-x86_64-poppler"

Write-Host "Setup abgeschlossen!"
