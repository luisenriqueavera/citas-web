# Agente de citas-web

- Stack real: Angular 21, TypeScript y Tailwind CSS.
- Consumir `citas-api` directamente por REST; no crear Express/BFF.
- Mantener la URL de API configurable y no hardcodear secretos.
- El backend es la autoridad para reglas de negocio, autorización y estados.
- Mantener estados loading, empty, error y success en formularios y servicios.
- Antes de implementar, localizar la HU aprobada y su DoD. Si el contrato REST no está documentado, detenerse y reportarlo.
- Verificar con `npm run lint`, `npm test -- --watch=false` y `npm run build`.
