@echo off
cd /d "%~dp0"
echo Пересобираем образы (без кэша)...
docker-compose build --no-cache
echo Запускаем обновлённые контейнеры...
docker-compose up -d
echo Готово!
pause