@echo off
echo [DEV] Копируем nginx конфиг для dev...
copy /Y nginx\default.dev.conf nginx\default.conf

echo [DEV] Запускаем контейнеры...
docker compose up -d

echo.
echo Готово. Приложение доступно на http://localhost
echo Фронтенд напрямую: http://localhost:3000