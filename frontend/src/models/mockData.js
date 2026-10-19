/**
 * Datos iniciales de prueba representativos para la plataforma de catalogación
 * y cálculo dinámico de dificultad.
 */

export const INITIAL_USER = {
  id: 1,
  nombre: 'Sofía Valenzuela',
  email: 'sofia.valenzuela@conservatorio.cl',
  instrumento_principal: 'Piano',
  instrumentos_secundarios: ['Violín'],
  nivel_tecnico: 4.5, // Nivel Actual
  nivel_base: 4.2,    // Nivel con el que inició
  link_portafolio: 'https://soundcloud.com/sofia-valenzuela-piano',
  avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
  bio: 'Estudiante de 4to año de interpretación. Enfocada en repertorio del Clasicismo y Romanticismo temprano.'
};

export const INITIAL_OBRAS = [
  { id: 1, nombre: 'Clair de Lune (Suite Bergamasque)', autor: 'Claude Debussy', epoca: 'Impresionista' },
  { id: 2, nombre: 'Sonata para Piano No. 14 "Claro de Luna" (Op. 27 No. 2)', autor: 'Ludwig van Beethoven', epoca: 'Clásico' },
  { id: 3, nombre: 'Canon en Re Mayor (P.37)', autor: 'Johann Pachelbel', epoca: 'Barroco' },
  { id: 4, nombre: 'Asturias (Leyenda - Suite Española Op. 47)', autor: 'Isaac Albéniz', epoca: 'Romántico' },
  { id: 5, nombre: 'El Cisne (El Carnaval de los Animales)', autor: 'Camille Saint-Saëns', epoca: 'Romántico' },
  { id: 6, nombre: 'Gymnopédie No. 1', autor: 'Erik Satie', epoca: 'Impresionista' },
  { id: 7, nombre: 'Czardas', autor: 'Vittorio Monti', epoca: 'Romántico' },
  { id: 8, nombre: 'Take Five', autor: 'Paul Desmond', epoca: 'Jazz' },
  { id: 9, nombre: 'Capricho No. 24 en La menor', autor: 'Niccolò Paganini', epoca: 'Romántico' }
];

export const INITIAL_PARTITURAS = [
  {
    id: 1,
    id_obra: 1,
    nombre: 'Clair de Lune - Edición Transcripción Urtext',
    obra_nombre: 'Clair de Lune (Suite Bergamasque)',
    autor_obra: 'Claude Debussy',
    instrumentacion: 'Piano solo',
    estilo: 'Impresionista',
    arreglo: 'Original Urtext',
    arreglista: 'Claude Debussy',
    transcriptor: 'E. Klemm',
    editor: 'Henle Verlag',
    url: 'https://imslp.org/wiki/Special:ImagefromIndex/11332/himb',
    info: 'Incluye digitaciones originales y notas de fraseo para el pedal de resonancia.',
    precio: 0, // Gratis / dominio público
    dificultadEstimada: 5.0,
    dificultadCalculada: 5.2,
    totalRatings: 34,
    ratings: [
      { id_usuario: 2, nivel_usuario: 5.0, valor: 0 },
      { id_usuario: 3, nivel_usuario: 4.0, valor: 1 },
      { id_usuario: 4, nivel_usuario: 6.5, valor: -1 }
    ]
  },
  {
    id: 2,
    id_obra: 2,
    nombre: 'Sonata "Claro de Luna" - 1er y 3er Movimiento',
    obra_nombre: 'Sonata para Piano No. 14 "Claro de Luna" (Op. 27 No. 2)',
    autor_obra: 'Ludwig van Beethoven',
    instrumentacion: 'Piano solo',
    estilo: 'Clásico',
    arreglo: 'Completo',
    arreglista: 'L. v. Beethoven',
    transcriptor: 'Hans von Bülow',
    editor: 'Bärenreiter',
    url: 'https://imslp.org/wiki/Special:ImagefromIndex/51820/beeth',
    info: 'Exige gran control de matices pianissimo en el Adagio y velocidad arpegiada en el Presto Agitato.',
    precio: 4500,
    dificultadEstimada: 7.5,
    dificultadCalculada: 7.8,
    totalRatings: 48,
    ratings: [
      { id_usuario: 1, nivel_usuario: 4.5, valor: 1 },
      { id_usuario: 5, nivel_usuario: 8.0, valor: 0 }
    ]
  },
  {
    id: 3,
    id_obra: 3,
    nombre: 'Canon en Re Mayor - Arreglo para Violín y Piano',
    obra_nombre: 'Canon en Re Mayor (P.37)',
    autor_obra: 'Johann Pachelbel',
    instrumentacion: 'Violín',
    estilo: 'Barroco',
    arreglo: 'Dúo de cámara',
    arreglista: 'M. Seidel',
    transcriptor: 'M. Seidel',
    editor: 'Ediciones Armonía',
    url: 'https://imslp.org/wiki/Special:ImagefromIndex/20883/pach',
    info: 'Excelente pieza pedagógica para afianzar afinación en 1ra y 3ra posición y legato barroco.',
    precio: 2000,
    dificultadEstimada: 3.0,
    dificultadCalculada: 3.1,
    totalRatings: 56,
    ratings: [
      { id_usuario: 2, nivel_usuario: 3.2, valor: 0 },
      { id_usuario: 6, nivel_usuario: 2.8, valor: 1 }
    ]
  },
  {
    id: 4,
    id_obra: 4,
    nombre: 'Asturias (Leyenda) - Transcripción para Guitarra',
    obra_nombre: 'Asturias (Leyenda - Suite Española Op. 47)',
    autor_obra: 'Isaac Albéniz',
    instrumentacion: 'Guitarra',
    estilo: 'Romántico',
    arreglo: 'Guitarra clásica solo',
    arreglista: 'Andrés Segovia',
    transcriptor: 'Andrés Segovia',
    editor: 'Schott Music',
    url: 'https://imslp.org/wiki/Special:ImagefromIndex/03491/albeniz',
    info: 'Técnica rigurosa de trémolo rápido y cambios de registro dinámicos en rasgueos flamencos.',
    precio: 3800,
    dificultadEstimada: 7.0,
    dificultadCalculada: 6.9,
    totalRatings: 27,
    ratings: [
      { id_usuario: 7, nivel_usuario: 7.2, valor: 0 },
      { id_usuario: 8, nivel_usuario: 6.0, valor: 1 }
    ]
  },
  {
    id: 5,
    id_obra: 5,
    nombre: 'El Cisne - Versión para Violonchelo y Piano',
    obra_nombre: 'El Cisne (El Carnaval de los Animales)',
    autor_obra: 'Camille Saint-Saëns',
    instrumentacion: 'Violonchelo',
    estilo: 'Romántico',
    arreglo: 'Original',
    arreglista: 'C. Saint-Saëns',
    transcriptor: 'Durand',
    editor: 'Éditions Durand',
    url: 'https://imslp.org/wiki/Special:ImagefromIndex/62901/saintsaens',
    info: 'Línea melódica cantabile que requiere control extremo del arco y expresivo vibrato.',
    precio: 0,
    dificultadEstimada: 4.2,
    dificultadCalculada: 4.4,
    totalRatings: 19,
    ratings: [
      { id_usuario: 9, nivel_usuario: 4.5, valor: 0 }
    ]
  },
  {
    id: 6,
    id_obra: 6,
    nombre: 'Gymnopédie No. 1 - Edición Crítica',
    obra_nombre: 'Gymnopédie No. 1',
    autor_obra: 'Erik Satie',
    instrumentacion: 'Piano solo',
    estilo: 'Impresionista',
    arreglo: 'Original',
    arreglista: 'Erik Satie',
    transcriptor: 'Salabert',
    editor: 'Éditions Salabert',
    url: 'https://imslp.org/wiki/Special:ImagefromIndex/44211/satie',
    info: 'Ritmo hipnótico 3/4. Ideal para principiantes que buscan sonoridades vanguardistas.',
    precio: 0,
    dificultadEstimada: 2.3,
    dificultadCalculada: 2.5,
    totalRatings: 63,
    ratings: [
      { id_usuario: 1, nivel_usuario: 4.5, valor: -1 },
      { id_usuario: 10, nivel_usuario: 2.5, valor: 0 }
    ]
  },
  {
    id: 7,
    id_obra: 7,
    nombre: 'Czardas - Solo de Violín y Piano',
    obra_nombre: 'Czardas',
    autor_obra: 'Vittorio Monti',
    instrumentacion: 'Violín',
    estilo: 'Romántico',
    arreglo: 'Rapsodia Húngara',
    arreglista: 'Vittorio Monti',
    transcriptor: 'Ricordi',
    editor: 'G. Ricordi & C.',
    url: 'https://imslp.org/wiki/Special:ImagefromIndex/11299/monti',
    info: 'Contraste entre introducción Lento melancólico y vivacissimo con armónicos artificiales.',
    precio: 2900,
    dificultadEstimada: 7.0,
    dificultadCalculada: 7.2,
    totalRatings: 41,
    ratings: [
      { id_usuario: 11, nivel_usuario: 7.5, valor: 0 }
    ]
  },
  {
    id: 8,
    id_obra: 8,
    nombre: 'Take Five - Lead Sheet & Solo Arranged',
    obra_nombre: 'Take Five',
    autor_obra: 'Paul Desmond',
    instrumentacion: 'Piano solo',
    estilo: 'Jazz',
    arreglo: 'Jazz Trio / Piano Solo',
    arreglista: 'Dave Brubeck Quartet',
    transcriptor: 'J. Mehegan',
    editor: 'Derry Music Co.',
    url: 'https://sheetmusic.example.com/take-five-jazz.pdf',
    info: 'Compás irregular 5/4 con ostinato en la mano izquierda y síncopas características.',
    precio: 3500,
    dificultadEstimada: 5.5,
    dificultadCalculada: 5.6,
    totalRatings: 22,
    ratings: [
      { id_usuario: 12, nivel_usuario: 5.8, valor: 0 }
    ]
  },
  {
    id: 9,
    id_obra: 9,
    nombre: 'Capricho No. 24 - 11 Variaciones y Finale',
    obra_nombre: 'Capricho No. 24 en La menor',
    autor_obra: 'Niccolò Paganini',
    instrumentacion: 'Violín',
    estilo: 'Romántico',
    arreglo: 'Original Urtext',
    arreglista: 'Niccolò Paganini',
    transcriptor: 'Carl Flesch',
    editor: 'Edition Peters',
    url: 'https://imslp.org/wiki/Special:ImagefromIndex/33120/paganini',
    info: 'Pizzicato con mano izquierda, octavas paralelas, arpegios saltellato de virtuosismo cumbre.',
    precio: 6000,
    dificultadEstimada: 9.8,
    dificultadCalculada: 9.7,
    totalRatings: 85,
    ratings: [
      { id_usuario: 13, nivel_usuario: 9.5, valor: 0 }
    ]
  }
];

// Obras inicialmente en el repertorio personal del usuario (CU01)
export const INITIAL_REPERTORIO = [
  {
    ...INITIAL_PARTITURAS[0], // Clair de Lune (Dificultad 5.2)
    fecha_agregado: '2026-08-14',
    estado_dominio: 'Dominada',
    calificado: true,
    mi_calificacion: 0 // Igual a mi nivel
  },
  {
    ...INITIAL_PARTITURAS[5], // Gymnopédie No. 1 (Dificultad 2.5)
    fecha_agregado: '2026-07-20',
    estado_dominio: 'Dominada',
    calificado: true,
    mi_calificacion: -1 // Menos exigente
  },
  {
    ...INITIAL_PARTITURAS[2], // Canon en Re Mayor (Dificultad 3.1)
    fecha_agregado: '2026-09-02',
    estado_dominio: 'Dominada',
    calificado: false,
    mi_calificacion: null
  }
];

// Obras inicialmente en favoritos/guardados del usuario
export const INITIAL_FAVORITOS = [
  INITIAL_PARTITURAS[1], // Sonata Claro de Luna (Dificultad 7.8)
  INITIAL_PARTITURAS[4]  // El Cisne (Dificultad 4.4)
];
