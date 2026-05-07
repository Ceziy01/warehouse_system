@echo off
cd /d "%~dp0"
echo Останавливаем контейнеры...
docker-compose down
echo Контейнеры остановлены.
pause