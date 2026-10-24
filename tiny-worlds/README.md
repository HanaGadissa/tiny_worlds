# Tiny Worlds 🏡
Cozy 2D room decorator. React + TypeScript + Konva · Node/Express · PostgreSQL.

## Run
```bash
createdb tinyworlds
psql tinyworlds -f server/schema.sql
cd server && cp .env.example .env && npm install && npm start     # http://localhost:4000
cd ../client && npm install && npm run dev                          # http://localhost:5173
```
Rooms are saved as structured JSON (`objects` JSONB: itemKey, x, y, rotation, scale) – not screenshots.
