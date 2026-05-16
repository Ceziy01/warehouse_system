@echo off
echo [PROD] Копируем nginx конфиг для prod...
copy /Y nginx\default.prod.conf nginx\default.conf

echo [PROD] Собираем и запускаем контейнеры...
docker compose -f docker-compose.prod.yml up -d --build

echo.
echo Готово. Приложение доступно на http://localhost