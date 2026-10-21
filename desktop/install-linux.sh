#!/bin/sh
set -eu
craftnor_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
craftnor_data=${XDG_DATA_HOME:-"$HOME/.local/share"}
mkdir -p "$craftnor_data/applications" "$craftnor_data/mime/packages" "$craftnor_data/icons/hicolor/192x192/apps" "$craftnor_data/icons/hicolor/192x192/mimetypes"
# Escape the executable path using the Desktop Entry Exec quoting rules.
craftnor_exec=$(printf '%s' "$craftnor_dir/craftnor" | sed 's/\\/\\\\/g;s/"/\\"/g;s/`/\\`/g;s/\$/\\$/g;s/%/%%/g')
cat > "$craftnor_data/applications/studio.craftnor.desktop" <<ENTRY
[Desktop Entry]
Type=Application
Name=Craftnor
Comment=Unicode vector typography effects studio
Exec="$craftnor_exec" %f
Icon=studio.craftnor
Terminal=false
Categories=Graphics;
MimeType=application/x-craftnor-project;
ENTRY
cat > "$craftnor_data/mime/packages/studio.craftnor.xml" <<'MIME'
<?xml version="1.0" encoding="UTF-8"?>
<mime-info xmlns="http://www.freedesktop.org/standards/shared-mime-info"><mime-type type="application/x-craftnor-project"><comment>Craftnor Project</comment><icon name="application-x-craftnor-project"/><glob pattern="*.cfnr"/></mime-type></mime-info>
MIME
cp "$craftnor_dir/craftnor-icon.png" "$craftnor_data/icons/hicolor/192x192/apps/studio.craftnor.png"
cp "$craftnor_dir/craftnor-document.png" "$craftnor_data/icons/hicolor/192x192/mimetypes/application-x-craftnor-project.png"
if command -v update-mime-database >/dev/null 2>&1; then update-mime-database "$craftnor_data/mime"; fi
if command -v update-desktop-database >/dev/null 2>&1; then update-desktop-database "$craftnor_data/applications"; fi
if command -v xdg-mime >/dev/null 2>&1; then xdg-mime default studio.craftnor.desktop application/x-craftnor-project; fi
printf '%s\n' 'Craftnor is registered for .cfnr projects. Keep this extracted folder in its current location.'
