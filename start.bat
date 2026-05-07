@echo off
cd /d "%~dp0"
echo Запускаем контейнеры...
docker-compose up -d
echo Фронтенд: http://localhost, Бэкенд: http://localhost:8000
pause