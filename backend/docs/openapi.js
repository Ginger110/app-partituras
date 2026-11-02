// Especificación OpenAPI 3 de la API (se sirve en /api-docs con Swagger UI y en /api-docs.json)

const DESCRIPCION = `
## Introducción
API REST de **App Partituras**, una plataforma colaborativa para catalogar partituras musicales y calcular su
**dificultad dinámica** a partir de las calificaciones de la comunidad. La usa el frontend (React) y sirve para
ejecutar las consultas del proyecto. Responde siempre en **JSON** y guarda sus datos en **MongoDB** (Atlas).

Colecciones: \`usuarios\`, \`obras\`, \`catalogos\`, \`partituras\`, \`ratings\` y \`biblioteca\` (repertorio y guardados).

## Autenticación y autorización
En esta etapa **no hay pantalla de login**: la API actúa como un *usuario demo* fijo (variable de entorno \`DEMO_USER_EMAIL\`,
por defecto \`camila.rojas@example.com\`, rol \`usuario\`). Las operaciones "de usuario" (\`/usuarios/me/**\`, subir una partitura,
calificar) se ejecutan a nombre de ese usuario.

Para demostrar la **autorización por rol** se puede enviar el encabezado \`X-Demo-Usuario: <email>\`:
* Rol **usuario**: catálogo, calificar, repertorio, favoritos, subir partituras, editar su perfil.
* Rol **moderador** (ej. \`diego.fuentes@example.com\`): además puede eliminar ratings, eliminar usuarios y ejecutar \`/admin/estructura\`.
  Sin el rol responde **403**.

> El encabezado \`X-Demo-Usuario\` es solo para demostración. En producción se reemplaza por autenticación con token (JWT):
> las contraseñas ya se guardan con hash **scrypt**.

## Errores
Todos los errores tienen la forma \`{ "error": { "codigo": "...", "mensaje": "..." } }\`.

| HTTP | Código | Significado |
|---|---|---|
| 400 | ID_INVALIDO, PARAMETRO_INVALIDO, DATOS_INVALIDOS, JSON_INVALIDO, VALIDACION_BD | Id mal formado, parámetro fuera de rango, datos faltantes o JSON inválido |
| 401 | USUARIO_NO_ENCONTRADO | El usuario indicado en \`X-Demo-Usuario\` no existe |
| 403 | SIN_PERMISO, ADMIN_DESHABILITADO | Falta el rol moderador, o las operaciones de estructura están deshabilitadas |
| 404 | *_NO_ENCONTRADA, RUTA_NO_ENCONTRADA | El recurso o la ruta no existe |
| 409 | DUPLICADO, YA_EN_REPERTORIO, YA_EN_FAVORITOS, USUARIO_DEMO_PROTEGIDO | Viola un índice único o una regla de negocio |
| 500 | ERROR_INTERNO | Error inesperado al consultar la base de datos |

## Límites y cuotas
* La API **no implementa límites propios por cliente** (rate limiting).
* La base de datos corre en MongoDB Atlas plan gratuito (M0): 512 MB de almacenamiento y un máximo de 100 operaciones por segundo.
* El servidor está en el plan gratuito de Render: tras un periodo de inactividad se suspende y la primera solicitud puede tardar más.

## Consideraciones de seguridad
* Contraseñas guardadas con hash **scrypt** (con sal); nunca se devuelven en las respuestas.
* Validación de entrada en cada endpoint: los ids se exigen como ObjectId (24 caracteres hex), los valores se validan por tipo y rango,
  y el texto de búsqueda se escapa antes de usarse como expresión regular (evita inyección de operadores de MongoDB).
* Credenciales de la base de datos en variables de entorno (\`.env\` no se sube al repositorio).
* Comunicación con Atlas cifrada (TLS). CORS configurable con \`CORS_ORIGIN\`.
* Los ids de las respuestas son strings; la API nunca expone el \`_id\` interno ni el hash de contraseña.
`;

// --- helpers ---
const ref = (n) => ({ $ref: `#/components/schemas/${n}` });
const json = (schema, example) => ({ 'application/json': { schema, ...(example !== undefined ? { example } : {}) } });
const resp = (description, schema, example) => ({ description, ...(schema ? { content: json(schema, example) } : {}) });
const errResp = (description, codigo) => resp(description, ref('Error'), { error: { codigo, mensaje: description } });
const pid = (name = 'id', description = 'Id de la partitura (ObjectId de 24 caracteres hex)') =>
  ({ name, in: 'path', required: true, description, schema: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }, example: '65a104000000000000000005' });
const demo = { $ref: '#/components/parameters/XDemoUsuario' };
const body = (schema, example, description) => ({ required: true, ...(description ? { description } : {}), content: json(schema, example) });

const EJ_PARTITURA = {
  id: '65a104000000000000000005', id_obra: '65a102000000000000000004', nombre: 'Libertango - Partitura general',
  obra_nombre: 'Libertango', autor_obra: 'Astor Piazzolla', instrumentacion: 'Cuarteto de cuerdas', estilo: 'Tango',
  arreglo: 'Versión para cuarteto', arreglista: 'Lucía Herrera', transcriptor: null, editor: 'Cuerdas del Sur',
  url: 'https://partituras.example.com/pdf/libertango-general.pdf', info: 'Partitura general del arreglo para dos violines, viola y violonchelo.',
  precio: 4490, dificultadEstimada: 5.5, dificultadCalculada: 6.3, totalRatings: 1,
  dificultadSumas: { suma_ponderada: 29.5, suma_pesos: 4.56 }, creada_en: '2026-11-02T00:00:00.000Z',
};
const EJ_USUARIO = {
  id: '65a101000000000000000001', nombre: 'Camila Rojas', email: 'camila.rojas@example.com', rol: 'usuario', estilo: 'Clásico',
  nivel_tecnico: 5.5, nivel_base: 5.5, instrumento_principal: 'Piano', instrumentos_secundarios: [],
  link_portafolio: 'https://portafolio.example.com/camila', avatar_url: 'https://ui-avatars.com/api/?name=Camila+Rojas', bio: 'Estilo preferido: Clásico.',
};

const e400 = errResp('Datos o parámetros inválidos', 'DATOS_INVALIDOS');
const e403 = errResp('El usuario no tiene el rol moderador', 'SIN_PERMISO');
const e404 = (c, m) => errResp(m, c);
const e409 = errResp('Registro duplicado', 'DUPLICADO');

const paths = {
  '/partituras': {
    get: {
      tags: ['Partituras'], summary: 'Buscar y filtrar el catálogo',
      description: 'Consulta con operadores `$regex` (búsqueda), `$in` (instrumentos y estilos), `$lte` (dificultad máxima) y `$gt`/igualdad (precio). Reemplaza al JOIN partitura-obra de la Etapa 1: el nombre y compositor de la obra viajan dentro de cada partitura.',
      parameters: [
        { name: 'q', in: 'query', description: 'Texto a buscar en título, obra, compositor o instrumentación (sin distinguir mayúsculas)', schema: { type: 'string' }, example: 'libertango' },
        { name: 'instrumentos', in: 'query', description: 'Instrumentaciones separadas por coma', schema: { type: 'string' }, example: 'Piano solo,Dos pianos' },
        { name: 'estilos', in: 'query', description: 'Estilos separados por coma', schema: { type: 'string' }, example: 'Tango,Jazz' },
        { name: 'maxDificultad', in: 'query', description: 'Dificultad calculada máxima (1 a 10)', schema: { type: 'number', minimum: 1, maximum: 10 }, example: 6 },
        { name: 'tipoPrecio', in: 'query', schema: { type: 'string', enum: ['todos', 'gratis', 'pago'], default: 'todos' } },
        { name: 'orden', in: 'query', schema: { type: 'string', enum: ['popularidad', 'dificultad_asc', 'dificultad_desc', 'recientes'], default: 'popularidad' } },
      ],
      responses: { 200: resp('Lista de partituras', { type: 'array', items: ref('Partitura') }, [EJ_PARTITURA]), 400: errResp('Parámetro inválido', 'PARAMETRO_INVALIDO'), 500: errResp('Error del servidor', 'ERROR_INTERNO') },
    },
    post: {
      tags: ['Partituras'], summary: 'Subir una partitura (CU03)',
      description: 'Publica una partitura asociada a una **obra nueva** (`modo: obra_nueva`) o a una **obra existente** (`modo: existente`). Publicar cuenta como un primer rating "igual a mi nivel" del usuario. (INSERT de la Etapa 1)',
      parameters: [demo],
      requestBody: body({ type: 'object', required: ['instrumentacion', 'url'], properties: {
        modo: { type: 'string', enum: ['obra_nueva', 'existente'] }, id_obra: { type: 'string', description: 'Requerido si modo = existente' },
        nombre_obra: { type: 'string' }, autor_obra: { type: 'string' }, nombre_partitura: { type: 'string' }, estilo: { type: 'string' },
        instrumentacion: { type: 'string' }, arreglo: { type: 'string' }, arreglista: { type: 'string' }, transcriptor: { type: 'string' },
        editor: { type: 'string' }, url: { type: 'string' }, info: { type: 'string' }, precio: { type: 'integer', minimum: 0 }, dificultadEstimada: { type: 'number', minimum: 1, maximum: 10 },
      } }, { modo: 'obra_nueva', nombre_obra: 'Nocturno Op. 9 No. 2', autor_obra: 'Frédéric Chopin', estilo: 'Romántico', instrumentacion: 'Piano solo', url: 'https://imslp.org/nocturno.pdf', precio: 0, dificultadEstimada: 6.5 }),
      responses: { 201: resp('Partitura creada', { type: 'object', properties: { partitura: ref('Partitura'), obra_creada: { type: 'boolean' }, obra_id: { type: 'string' } } }),
        400: e400, 404: e404('OBRA_NO_ENCONTRADA', 'No existe la obra seleccionada'), 401: errResp('Usuario demo inexistente', 'USUARIO_NO_ENCONTRADO') },
    },
  },
  '/partituras/facetas': { get: {
    tags: ['Partituras'], summary: 'Opciones de filtro con conteos',
    description: 'Consulta con **GROUP BY** (`$group` dentro de `$facet`): cuántas partituras hay por instrumentación y por estilo, y un resumen de precios. Alimenta el panel de filtros.',
    responses: { 200: resp('Facetas', ref('Facetas'), { instrumentaciones: [{ valor: 'Piano solo', cantidad: 2 }], estilos: [{ valor: 'Tango', cantidad: 3 }], precio: { total: 13, minimo: 2490, maximo: 5990, promedio: 3790 } }) } } },
  '/partituras/{id}': {
    get: { tags: ['Partituras'], summary: 'Ficha de una partitura', parameters: [pid()],
      responses: { 200: resp('Partitura', ref('Partitura'), EJ_PARTITURA), 400: errResp('Id inválido', 'ID_INVALIDO'), 404: e404('PARTITURA_NO_ENCONTRADA', 'No existe una partitura con ese id') } },
    delete: { tags: ['Partituras'], summary: 'Eliminar una partitura', description: 'DELETE de la Etapa 1. Como MongoDB no tiene claves foráneas, la API elimina también sus ratings, sus entradas de biblioteca y la quita de los catálogos.', parameters: [pid()],
      responses: { 200: resp('Eliminada', { type: 'object', properties: { mensaje: { type: 'string' }, limpieza: { type: 'object' } } }, { mensaje: 'Partitura eliminada.', limpieza: { ratings: 1, biblioteca: 2, catalogos: 1 } }), 400: errResp('Id inválido', 'ID_INVALIDO'), 404: e404('PARTITURA_NO_ENCONTRADA', 'No existe una partitura con ese id') } },
  },
  '/partituras/{id}/precio': { put: { tags: ['Partituras'], summary: 'Actualizar el precio', description: 'UPDATE de la Etapa 1.', parameters: [pid()],
    requestBody: body({ type: 'object', required: ['precio'], properties: { precio: { type: 'integer', minimum: 0 } } }, { precio: 8000 }),
    responses: { 200: resp('Precio actualizado', null), 400: e400, 404: e404('PARTITURA_NO_ENCONTRADA', 'No existe una partitura con ese id') } } },
  '/partituras/{id}/ratings': {
    get: { tags: ['Ratings'], summary: 'Ratings de una partitura', description: 'Incluye un resumen calculado con **GROUP BY** (`$group`): total, promedio y conteo por valor.', parameters: [pid()],
      responses: { 200: resp('Resumen y detalle', { type: 'object', properties: { resumen: { type: 'object' }, ratings: { type: 'array', items: ref('Rating') } } },
        { resumen: { total: 2, promedio_valor: 0, menos_exigente: 1, igual: 0, mas_exigente: 1 }, ratings: [{ id: '65a105000000000000000001', id_usuario: '65a101000000000000000001', usuario: 'Camila Rojas', id_partitura: '65a104000000000000000001', valor: 1, nivel_usuario: 5.5 }] }),
        404: e404('PARTITURA_NO_ENCONTRADA', 'No existe una partitura con ese id') } },
    post: { tags: ['Ratings'], summary: 'Calificar la dificultad (CU02)', description: 'Registra cuán exigente le resultó la partitura **respecto del nivel actual del usuario**: `-1` menos exigente, `0` igual, `1` más exigente. El nivel del usuario se guarda en el rating como foto histórica. Si ya había calificado, el rating se reemplaza. La dificultad calculada se recalcula con un promedio bayesiano ponderado por nivel. (INSERT de la Etapa 1)',
      parameters: [pid(), demo],
      requestBody: body({ type: 'object', required: ['valor'], properties: { valor: { type: 'integer', enum: [-1, 0, 1] } } }, { valor: 1 }),
      responses: { 201: resp('Rating creado', { type: 'object', properties: { partitura: ref('Partitura'), rating: ref('Rating'), dificultadPrevia: { type: 'number' }, dificultadNueva: { type: 'number' } } }), 200: resp('Rating reemplazado', null), 400: e400, 404: e404('PARTITURA_NO_ENCONTRADA', 'No existe una partitura con ese id') } },
  },
  '/ratings/{id}': { delete: { tags: ['Ratings'], summary: 'Eliminar un rating (moderación)', description: 'Solo rol **moderador**. Recalcula la dificultad de la partitura.',
    parameters: [pid('id', 'Id del rating'), demo], responses: { 200: resp('Rating eliminado', null), 400: errResp('Id inválido', 'ID_INVALIDO'), 403: e403, 404: e404('RATING_NO_ENCONTRADO', 'No existe un rating con ese id') } } },
  '/obras': { get: { tags: ['Catálogos y obras'], summary: 'Listar obras', responses: { 200: resp('Obras', { type: 'array', items: ref('Obra') }, [{ id: '65a102000000000000000001', nombre: 'Clair de lune', autor: 'Claude Debussy', epoca: 'Impresionista' }]) } } },
  '/catalogos': { get: { tags: ['Catálogos y obras'], summary: 'Listar catálogos', responses: { 200: resp('Catálogos', { type: 'array', items: ref('Catalogo') }) } } },
  '/catalogos/{id}': { get: { tags: ['Catálogos y obras'], summary: 'Catálogo con sus partituras completas',
    description: 'Consulta con **JOIN** (`$lookup`): trae los documentos completos de las partituras del catálogo (con precio y dificultad), que no se copian dentro del catálogo porque cambian seguido.',
    parameters: [pid('id', 'Id del catálogo')], responses: { 200: resp('Catálogo', ref('Catalogo')), 400: errResp('Id inválido', 'ID_INVALIDO'), 404: e404('CATALOGO_NO_ENCONTRADO', 'No existe un catálogo con ese id') } } },
  '/usuarios': { post: { tags: ['Usuarios'], summary: 'Crear un usuario', description: 'INSERT de la Etapa 1. La contraseña se guarda con hash scrypt.',
    requestBody: body({ type: 'object', required: ['nombre', 'email', 'contrasena'], properties: { nombre: { type: 'string' }, email: { type: 'string' }, contrasena: { type: 'string', minLength: 8 }, nivel_tecnico: { type: 'number', minimum: 1, maximum: 10 }, estilo: { type: 'string' }, instrumento_principal: { type: 'string' }, link_portafolio: { type: 'string' } } },
      { nombre: 'Ana Prueba', email: 'ana@prueba.cl', contrasena: 'clave12345', nivel_tecnico: 3 }),
    responses: { 201: resp('Usuario creado', ref('Usuario'), EJ_USUARIO), 400: e400, 409: e409 } } },
  '/usuarios/me': {
    get: { tags: ['Usuarios'], summary: 'Perfil del usuario actual', parameters: [demo], responses: { 200: resp('Usuario', ref('Usuario'), EJ_USUARIO), 401: errResp('Usuario demo inexistente', 'USUARIO_NO_ENCONTRADO') } },
    put: { tags: ['Usuarios'], summary: 'Editar el perfil', parameters: [demo],
      requestBody: body({ type: 'object', properties: { nombre: { type: 'string' }, email: { type: 'string' }, instrumento_principal: { type: 'string' }, link_portafolio: { type: 'string' }, bio: { type: 'string' }, instrumentos_secundarios: { type: 'array', items: { type: 'string' } } } }, { nombre: 'Camila Rojas', instrumento_principal: 'Piano' }),
      responses: { 200: resp('Usuario actualizado', ref('Usuario')), 400: e400, 409: errResp('El correo ya está en uso', 'DUPLICADO') } },
  },
  '/usuarios/me/repertorio': {
    get: { tags: ['Repertorio y favoritos'], summary: 'Mi repertorio', description: 'Consulta con **JOIN** (`$lookup`) entre `biblioteca` y `partituras`.', parameters: [demo], responses: { 200: resp('Partituras del repertorio', { type: 'array', items: ref('ItemRepertorio') }) } },
    post: { tags: ['Repertorio y favoritos'], summary: 'Añadir al repertorio (CU01)', description: 'Marca la partitura como aprendida y **recalcula el nivel técnico** del usuario a partir de su repertorio.', parameters: [demo],
      requestBody: body({ type: 'object', required: ['partituraId'], properties: { partituraId: { type: 'string' } } }, { partituraId: '65a104000000000000000007' }),
      responses: { 201: resp('Añadida', { type: 'object', properties: { item: ref('ItemRepertorio'), usuario: ref('Usuario'), nivelAnterior: { type: 'number' }, nuevoNivel: { type: 'number' }, delta: { type: 'number' } } }), 400: e400, 404: e404('PARTITURA_NO_ENCONTRADA', 'No existe una partitura con ese id'), 409: errResp('Ya está en el repertorio', 'YA_EN_REPERTORIO') } },
  },
  '/usuarios/me/repertorio/{partituraId}': { delete: { tags: ['Repertorio y favoritos'], summary: 'Quitar del repertorio', description: 'Recalcula el nivel técnico.', parameters: [pid('partituraId'), demo],
    responses: { 200: resp('Quitada', null), 400: errResp('Id inválido', 'ID_INVALIDO'), 404: e404('NO_ESTA_EN_REPERTORIO', 'La partitura no está en tu repertorio') } } },
  '/usuarios/me/favoritos': {
    get: { tags: ['Repertorio y favoritos'], summary: 'Mis favoritos', parameters: [demo], responses: { 200: resp('Partituras guardadas', { type: 'array', items: ref('Partitura') }) } },
    post: { tags: ['Repertorio y favoritos'], summary: 'Guardar en favoritos', parameters: [demo],
      requestBody: body({ type: 'object', required: ['partituraId'], properties: { partituraId: { type: 'string' } } }, { partituraId: '65a104000000000000000002' }),
      responses: { 201: resp('Guardada', ref('Partitura')), 400: e400, 404: e404('PARTITURA_NO_ENCONTRADA', 'No existe una partitura con ese id'), 409: errResp('Ya está en favoritos', 'YA_EN_FAVORITOS') } },
  },
  '/usuarios/me/favoritos/{partituraId}': { delete: { tags: ['Repertorio y favoritos'], summary: 'Quitar de favoritos', parameters: [pid('partituraId'), demo],
    responses: { 200: resp('Quitada', null), 400: errResp('Id inválido', 'ID_INVALIDO'), 404: e404('NO_ESTA_EN_FAVORITOS', 'La partitura no está en tus favoritos') } } },
  '/usuarios/{id}/nivel': { put: { tags: ['Usuarios'], summary: 'Actualizar el nivel técnico de un usuario', description: 'UPDATE de la Etapa 1. Los ratings ya emitidos no cambian (guardan una foto del nivel).', parameters: [pid('id', 'Id del usuario')],
    requestBody: body({ type: 'object', required: ['nivel_tecnico'], properties: { nivel_tecnico: { type: 'number', minimum: 1, maximum: 10 } } }, { nivel_tecnico: 6.5 }),
    responses: { 200: resp('Usuario actualizado', ref('Usuario')), 400: e400, 404: e404('USUARIO_NO_ENCONTRADO', 'No existe un usuario con ese id') } } },
  '/usuarios/{id}': { delete: { tags: ['Usuarios'], summary: 'Eliminar un usuario (moderador)', description: 'DELETE de la Etapa 1, **en cascada** como en el modelo relacional: elimina sus obras, catálogos y las partituras de esas obras, sus ratings y su biblioteca. No permite eliminar al usuario demo.',
    parameters: [pid('id', 'Id del usuario'), demo], responses: { 200: resp('Eliminado', null), 403: e403, 404: e404('USUARIO_NO_ENCONTRADO', 'No existe un usuario con ese id'), 409: errResp('Es el usuario demo', 'USUARIO_DEMO_PROTEGIDO') } } },
  '/admin/estructura': { post: { tags: ['Administración'], summary: 'Equivalentes de ALTER y DROP (moderador)', description: 'Solo rol moderador y con `ENABLE_ADMIN=true`.\n\n* `alter1` — ALTER TABLE ADD COLUMN: agrega `fecha_registro` a los usuarios.\n* `alter2` — ALTER TABLE MODIFY: convierte `precio` a Decimal128.\n* `drop` — DROP TABLE: elimina la colección `ratings` (se restaura con `npm run seed`).', parameters: [demo],
    requestBody: body({ type: 'object', required: ['tipo'], properties: { tipo: { type: 'string', enum: ['alter1', 'alter2', 'drop'] } } }, { tipo: 'alter1' }),
    responses: { 200: resp('Operación ejecutada', null), 400: e400, 403: e403 } } },
};

const schemas = {
  Error: { type: 'object', properties: { error: { type: 'object', properties: { codigo: { type: 'string' }, mensaje: { type: 'string' } } } } },
  Partitura: { type: 'object', example: EJ_PARTITURA, properties: {
    id: { type: 'string' }, id_obra: { type: 'string' }, nombre: { type: 'string' }, obra_nombre: { type: 'string' }, autor_obra: { type: 'string' },
    instrumentacion: { type: 'string' }, estilo: { type: 'string' }, arreglo: { type: 'string', nullable: true }, arreglista: { type: 'string', nullable: true },
    transcriptor: { type: 'string', nullable: true }, editor: { type: 'string', nullable: true }, url: { type: 'string' }, info: { type: 'string' }, precio: { type: 'integer' },
    dificultadEstimada: { type: 'number' }, dificultadCalculada: { type: 'number' }, totalRatings: { type: 'integer' },
    dificultadSumas: { type: 'object', properties: { suma_ponderada: { type: 'number' }, suma_pesos: { type: 'number' } } }, creada_en: { type: 'string', format: 'date-time', nullable: true } } },
  ItemRepertorio: { allOf: [ref('Partitura'), { type: 'object', properties: { fecha_agregado: { type: 'string', example: '2026-11-02' }, estado_dominio: { type: 'string', example: 'Dominada' }, calificado: { type: 'boolean' }, mi_calificacion: { type: 'integer', nullable: true, enum: [-1, 0, 1] } } }] },
  Usuario: { type: 'object', example: EJ_USUARIO, properties: { id: { type: 'string' }, nombre: { type: 'string' }, email: { type: 'string' }, rol: { type: 'string', enum: ['usuario', 'moderador'] }, estilo: { type: 'string', nullable: true }, nivel_tecnico: { type: 'number' }, nivel_base: { type: 'number' }, instrumento_principal: { type: 'string' }, instrumentos_secundarios: { type: 'array', items: { type: 'string' } }, link_portafolio: { type: 'string', nullable: true }, avatar_url: { type: 'string', nullable: true }, bio: { type: 'string' } } },
  Obra: { type: 'object', properties: { id: { type: 'string' }, nombre: { type: 'string' }, autor: { type: 'string' }, epoca: { type: 'string', nullable: true }, info: { type: 'string', nullable: true }, anno: { type: 'integer', nullable: true }, version: { type: 'string', nullable: true }, autor_version: { type: 'string', nullable: true } } },
  Catalogo: { type: 'object', properties: { id: { type: 'string' }, nombre: { type: 'string' }, instrumento: { type: 'string' }, estilo: { type: 'string' }, autor: { type: 'string' }, subido_por: { type: 'object', properties: { id: { type: 'string' }, nombre: { type: 'string' } } }, partituras: { type: 'array', items: { type: 'object' } } } },
  Rating: { type: 'object', properties: { id: { type: 'string' }, id_usuario: { type: 'string' }, usuario: { type: 'string' }, id_partitura: { type: 'string' }, valor: { type: 'integer', enum: [-1, 0, 1] }, nivel_usuario: { type: 'number' } } },
  Facetas: { type: 'object', properties: { instrumentaciones: { type: 'array', items: { type: 'object', properties: { valor: { type: 'string' }, cantidad: { type: 'integer' } } } }, estilos: { type: 'array', items: { type: 'object', properties: { valor: { type: 'string' }, cantidad: { type: 'integer' } } } }, precio: { type: 'object' } } },
};

module.exports = {
  openapi: '3.0.3',
  info: { title: 'API App Partituras', version: '2.0.0', description: DESCRIPCION },
  servers: [{ url: '/api', description: 'Servidor actual' }],
  tags: [{ name: 'Partituras' }, { name: 'Ratings' }, { name: 'Repertorio y favoritos' }, { name: 'Catálogos y obras' }, { name: 'Usuarios' }, { name: 'Administración' }],
  paths,
  components: {
    schemas,
    parameters: { XDemoUsuario: { name: 'X-Demo-Usuario', in: 'header', required: false, description: 'Solo demostración: email del usuario que realiza la acción (por defecto, el usuario demo). Ej: diego.fuentes@example.com (moderador)', schema: { type: 'string' } } },
  },
};
