# План: Запуск проекта Nexum локально

## Контекст
Необходимо запустить полный стек проекта Nexum: Docker-сервисы (PostgreSQL + MinIO), backend (ASP.NET Core 10) и frontend (React + Vite).

**Обнаружена проблема**: порт PostgreSQL в `docker-compose.yml` (`5433`) не совпадает с портом в `appsettings.Development.json` (`5434`). Необходимо выровнять.

## Шаги

### 1. Исправить порт PostgreSQL
- **Файл**: `backend/Api/appsettings.Development.json` (строка 10)
- Изменить порт с `5434` на `5433` в connection string, чтобы соответствовать `docker-compose.yml`

### 2. Запустить Docker-сервисы
```bash
docker-compose up -d
```
Дождаться healthcheck для PostgreSQL и MinIO.

### 3. Применить миграции БД
```bash
cd backend/Api && dotnet ef database update
```

### 4. Запустить backend
```bash
cd backend/Api && dotnet run
```
Backend будет доступен на `http://localhost:5066`

### 5. Подготовить и запустить frontend
- Создать `.env.local` из `.env.example`
- Установить зависимости: `npm install`
- Запустить: `npm run dev`
- Frontend будет доступен на `http://localhost:5173`

## Проверка
- Swagger UI: http://localhost:5066/swagger
- Frontend: http://localhost:5173
- MinIO Console: http://localhost:9001

## Файлы для изменения
- `backend/Api/appsettings.Development.json` — исправить порт PostgreSQL (5434 → 5433)
- `frontend/.env.local` — создать из `.env.example`
