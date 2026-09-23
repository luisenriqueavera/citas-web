# citas-web

Frontend Angular para la gestión de citas de la FCV. Fue importado desde el
proyecto de diseño `fcv-citas`.

## Ejecución local

Requiere Node.js compatible con Angular 21.

1. Instala las dependencias: `npm install`.
2. Copia `.env.example` a `.env.local` y ajusta `API_URL` cuando se integre
   con el backend.
3. Inicia el servidor de desarrollo: `npm start`.

El registro de afiliación, la consulta de disponibilidad y la confirmación de
reservas consumen directamente `citas-api` mediante REST; no se usa BFF ni
Express. Las pantallas históricas de citas/agenda aún contienen datos heredados
del prototipo y están fuera del corte de integración S3.
