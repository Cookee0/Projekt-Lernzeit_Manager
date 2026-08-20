# syntax=docker/dockerfile:1

# ---- Frontend-Build-Stufe: kompiliert die Angular-App zu statischen Dateien ----
FROM node:22-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---- Laufzeit-Stufe: Flask-Backend + Gunicorn, liefert auch das gebaute Frontend aus ----
FROM python:3.12-slim AS runtime
WORKDIR /app

COPY backend/requirements.txt backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY backend/ backend/
COPY start.sh start.sh
COPY --from=frontend-build /app/frontend/dist/frontend/browser frontend/dist/frontend/browser

ENV FLASK_ENV=production
EXPOSE 8000

CMD ["sh", "start.sh"]
