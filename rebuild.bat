@echo off
echo [DEV] Пересобираем бэкенд (если менялся Dockerfile или requirements.txt)...
copy /Y nginx\default.dev.conf nginx\default.conf
docker compose up -d --build

echo Готово.