FROM python:3.13-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

ENV HF_HOME=/app/ml_models/hf_cache
ENV TRANSFORMERS_CACHE=/app/ml_models/hf_cache

RUN apt-get update && apt-get install -y gcc libpq-dev postgresql-client

COPY requirements.txt .

RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]


# Билд
# docker build -t storage-system-back .

# Запуск на http://localhost:8000
# docker run -d -p 8000:8000 --name storage-system-back storage-system-back 

# Запущенные контейнеры
#docker ps

# Остановить контейнер
#docker stop storage-system-front

# Удалить контейнер
#docker rm storage-system-front

#=============================

# для сервака
# docker buildx build --platform linux/arm64 -t storage-system-back:arm64 --load ./
# docker save -o storage-system-back-arm64.tar storage-system-back:arm64
# scp -P 1409 storage-system-back-arm64.tar storage-system-front-arm64.tar ./app/db/storage.db ceziy@185.61.77.236:/home/ceziy/

# на сервере
# sudo docker load -i ~/storage-system-back-arm64.tar
# sudo docker load -i ~/storage-system-front-arm64.tar

# sudo docker network create storage-network


# sudo docker run -d --name storage-system-back --network storage-network -p 8000:8000 storage-system-back:arm64
# sudo docker cp ~/storage.db storage-system-back:/app/app/db/storage.db
# sudo docker restart storage-system-back


# sudo docker run -d --name storage-system-front --network storage-network -p 3000:80 storage-system-front:arm64



# зайти в контейнер
# sudo docker exec -it storage-system-back sh


#===========================
# удаление с сервера


# sudo docker stop storage-system-back storage-system-front

# sudo docker rm storage-system-back storage-system-front

# sudo docker rmi storage-system-back:arm64 storage-system-front:arm64

# sudo docker network rm storage-network

# rm -f ~/storage-system-back-arm64.tar ~/storage-system-front-arm64.tar ~/storage.db