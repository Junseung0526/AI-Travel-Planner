FROM node:22-alpine as build-stage

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# 2단계: 경량의 Nginx 이미지로 프로덕션 환경 설정
FROM nginx:stable-alpine as production-stage

# Nginx의 기본 설정 파일을 제거하고 빌드 단계에서 생성된 정적 파일을 복사합니다.
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Nginx가 실행될 포트를 노출합니다.
EXPOSE 80

# Nginx를 실행합니다.
CMD ["nginx", "-g", "daemon off;"]