# citas-web

Frontend Angular para la gestión de citas de la FCV. Fue importado desde el
proyecto de diseño `fcv-citas`.

## Ejecución local

Requiere Node.js compatible con Angular 21.

1. Instala las dependencias: `npm install`.
2. Copia `.env.example` a `.env.local` y ajusta `API_URL` cuando se integre
   con el backend.
3. Inicia el servidor de desarrollo: `npm start`.

La implementación actual usa `FcvDataService` como fuente de datos simulada.
La posterior integración debe consumir la API REST de `citas-api` directamente,
sin un BFF ni Express.
