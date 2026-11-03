#!/bin/bash
# StrideCraft - Local Web Server Launcher
# Uses built-in macOS ruby webrick or opens index.html directly

PORT=8080
echo "=========================================================="
echo "🏃 StrideCraft — Generator Program Latihan Lari"
echo "=========================================================="

if which ruby >/dev/null 2>&1; then
  echo "Menjalankan server lokal di http://localhost:$PORT ..."
  echo "Tekan Ctrl+C untuk menghentikan server."
  (sleep 1 && open "http://localhost:$PORT") &
  ruby -run -e httpd . -p $PORT
else
  echo "Membuka langsung di browser..."
  open "index.html"
fi
