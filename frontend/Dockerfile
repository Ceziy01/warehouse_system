FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

RUN npm run build

FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

# Билд
# docker build -t storage-system-front .

# Запуск на http://localhost:3000
# docker run -d -p 3000:80 --name storage-system-front storage-system-front

# Запущенные контейнеры
#docker ps

# Остановить контейнер
#docker stop storage-system-front

# Удалить контейнер
#docker rm storage-system-front