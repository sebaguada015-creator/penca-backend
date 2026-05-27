# Penca Brada Barber - Backend

Backend en Vercel para actualizar automáticamente los resultados del Mundial 2026 desde API-Football y guardarlos en JSONBin.

## Variables de entorno (configurar en Vercel)

- `API_FOOTBALL_KEY`: tu API key de api-football.com
- `JSONBIN_API_KEY`: tu Master Key de jsonbin.io
- `JSONBIN_BIN_ID`: el ID del Bin de JSONBin

## Endpoints

- `GET /api/diagnostico` - Verifica que la API funciona y muestra el ID del Mundial 2026
- `GET /api/actualizar-resultados` - Actualiza los resultados (se llama automáticamente cada 20 min)

## Cron

Vercel llama a `/api/actualizar-resultados` cada 20 minutos automáticamente (ver `vercel.json`).
