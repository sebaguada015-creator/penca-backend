// /api/actualizar-resultados.js
// Esta función la llama Vercel automáticamente cada 20 minutos (cron)
// También se puede llamar manualmente desde la app HTML
// 
// Qué hace:
// 1. Pregunta a API-Football si hay partidos del Mundial 2026 EN VIVO o terminados HOY
// 2. Para cada partido, guarda el resultado en JSONBin
// 3. La app HTML lee esos resultados de JSONBin (como hace ahora)

const LEAGUE_ID = 1; // ID del Mundial en API-Football (se confirma con primera llamada de prueba)
const SEASON = 2026;

// Mapeo de nombres de equipos: lo que devuelve API-Football → lo que usa la app HTML
const MAPEO_NOMBRES = {
  'Mexico': 'México',
  'South Africa': 'Sudáfrica',
  'South Korea': 'Corea del Sur',
  'Czech Republic': 'Rep. Checa',
  'Canada': 'Canadá',
  'Bosnia and Herzegovina': 'Bosnia y H.',
  'Qatar': 'Catar',
  'Switzerland': 'Suiza',
  'Brazil': 'Brasil',
  'Morocco': 'Marruecos',
  'Haiti': 'Haití',
  'Scotland': 'Escocia',
  'USA': 'EE.UU.',
  'United States': 'EE.UU.',
  'Paraguay': 'Paraguay',
  'Australia': 'Australia',
  'Turkey': 'Turquía',
  'Türkiye': 'Turquía',
  'Germany': 'Alemania',
  'Curacao': 'Curazao',
  'Ivory Coast': 'Costa de Marfil',
  'Cote d\'Ivoire': 'Costa de Marfil',
  'Ecuador': 'Ecuador',
  'Netherlands': 'Países Bajos',
  'Japan': 'Japón',
  'Sweden': 'Suecia',
  'Tunisia': 'Túnez',
  'Belgium': 'Bélgica',
  'Egypt': 'Egipto',
  'Iran': 'Irán',
  'New Zealand': 'Nueva Zelanda',
  'Spain': 'España',
  'Cape Verde': 'Cabo Verde',
  'Saudi Arabia': 'Arabia Saudita',
  'Uruguay': 'Uruguay',
  'France': 'Francia',
  'Senegal': 'Senegal',
  'Iraq': 'Irak',
  'Norway': 'Noruega',
  'Argentina': 'Argentina',
  'Algeria': 'Argelia',
  'Austria': 'Austria',
  'Jordan': 'Jordania',
  'Portugal': 'Portugal',
  'DR Congo': 'Rep. Dem. Congo',
  'Congo DR': 'Rep. Dem. Congo',
  'Uzbekistan': 'Uzbekistán',
  'Colombia': 'Colombia',
  'England': 'Inglaterra',
  'Croatia': 'Croacia',
  'Ghana': 'Ghana',
  'Panama': 'Panamá'
};

function normalizar(nombre) {
  return MAPEO_NOMBRES[nombre] || nombre;
}

// Genera los 72 partidos de fase de grupos exactamente como están en la app HTML
// para poder matchear por equipos y obtener el ID del partido
function generarPartidos() {
  const GRUPOS = {
    A: ['México', 'Sudáfrica', 'Corea del Sur', 'Rep. Checa'],
    B: ['Canadá', 'Bosnia y H.', 'Catar', 'Suiza'],
    C: ['Brasil', 'Marruecos', 'Haití', 'Escocia'],
    D: ['EE.UU.', 'Paraguay', 'Australia', 'Turquía'],
    E: ['Alemania', 'Curazao', 'Costa de Marfil', 'Ecuador'],
    F: ['Países Bajos', 'Japón', 'Suecia', 'Túnez'],
    G: ['Bélgica', 'Egipto', 'Irán', 'Nueva Zelanda'],
    H: ['España', 'Cabo Verde', 'Arabia Saudita', 'Uruguay'],
    I: ['Francia', 'Senegal', 'Irak', 'Noruega'],
    J: ['Argentina', 'Argelia', 'Austria', 'Jordania'],
    K: ['Portugal', 'Rep. Dem. Congo', 'Uzbekistán', 'Colombia'],
    L: ['Inglaterra', 'Croacia', 'Ghana', 'Panamá']
  };
  
  const partidos = [];
  let id = 1;
  for (const [letra, equipos] of Object.entries(GRUPOS)) {
    const [e1, e2, e3, e4] = equipos;
    partidos.push({ id: id++, grupo: letra, local: e1, visit: e2 });
    partidos.push({ id: id++, grupo: letra, local: e3, visit: e4 });
    partidos.push({ id: id++, grupo: letra, local: e1, visit: e3 });
    partidos.push({ id: id++, grupo: letra, local: e4, visit: e2 });
    partidos.push({ id: id++, grupo: letra, local: e4, visit: e1 });
    partidos.push({ id: id++, grupo: letra, local: e2, visit: e3 });
  }
  return partidos;
}

function buscarIdPartido(partidos, equipoA, equipoB) {
  const a = normalizar(equipoA);
  const b = normalizar(equipoB);
  // Buscar en cualquier orden
  return partidos.find(p =>
    (p.local === a && p.visit === b) ||
    (p.local === b && p.visit === a)
  );
}

export default async function handler(req, res) {
  // Permitir llamadas desde el navegador (CORS)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  const API_FOOTBALL_KEY = process.env.API_FOOTBALL_KEY;
  const JSONBIN_API_KEY = process.env.JSONBIN_API_KEY;
  const JSONBIN_BIN_ID = process.env.JSONBIN_BIN_ID;
  
  if (!API_FOOTBALL_KEY || !JSONBIN_API_KEY || !JSONBIN_BIN_ID) {
    return res.status(500).json({
      ok: false,
      error: 'Faltan variables de entorno. Configurar API_FOOTBALL_KEY, JSONBIN_API_KEY, JSONBIN_BIN_ID en Vercel.'
    });
  }
  
  try {
    // 1. Pedir a API-Football los partidos del Mundial 2026 que están terminados o en vivo HOY
    const hoy = new Date().toISOString().split('T')[0]; // formato YYYY-MM-DD
    const url = `https://v3.football.api-sports.io/fixtures?league=${LEAGUE_ID}&season=${SEASON}&date=${hoy}`;
    
    const apiRes = await fetch(url, {
      headers: { 'x-apisports-key': API_FOOTBALL_KEY }
    });
    
    if (!apiRes.ok) {
      throw new Error(`API-Football error: ${apiRes.status}`);
    }
    
    const apiData = await apiRes.json();
    const fixtures = apiData.response || [];
    
    if (fixtures.length === 0) {
      return res.status(200).json({
        ok: true,
        mensaje: 'No hay partidos hoy',
        partidosActualizados: 0
      });
    }
    
    // 2. Cargar resultados actuales de JSONBin
    const jsonbinUrl = `https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`;
    const binRes = await fetch(jsonbinUrl, {
      headers: { 'X-Master-Key': JSONBIN_API_KEY, 'X-Bin-Meta': 'false' }
    });
    
    if (!binRes.ok) throw new Error('JSONBin read error');
    
    const binData = await binRes.json();
    const datos = binData.record || binData;
    datos.predicciones = datos.predicciones || {};
    datos.resultados = datos.resultados || {};
    
    // 3. Procesar cada partido y matchear con nuestro ID interno
    const partidosApp = generarPartidos();
    let actualizados = 0;
    const debug = [];
    
    for (const fixture of fixtures) {
      const status = fixture.fixture?.status?.short; // 'NS'=no empezó, 'LIVE','HT','FT'=terminado, etc.
      // Solo guardamos si está en vivo o terminó
      if (!['LIVE', '1H', '2H', 'HT', 'ET', 'BT', 'P', 'SUSP', 'INT', 'FT', 'AET', 'PEN'].includes(status)) {
        continue;
      }
      
      const equipoLocal = fixture.teams?.home?.name;
      const equipoVisit = fixture.teams?.away?.name;
      const golesLocal = fixture.goals?.home;
      const golesVisit = fixture.goals?.away;
      
      if (golesLocal === null || golesVisit === null) continue;
      
      const partido = buscarIdPartido(partidosApp, equipoLocal, equipoVisit);
      if (!partido) {
        debug.push(`No matcheado: ${equipoLocal} vs ${equipoVisit}`);
        continue;
      }
      
      // Acomodar orden (en API-Football puede venir invertido respecto a la app)
      let local, visit;
      if (normalizar(equipoLocal) === partido.local) {
        local = golesLocal;
        visit = golesVisit;
      } else {
        local = golesVisit;
        visit = golesLocal;
      }
      
      datos.resultados[partido.id] = { local, visit, status };
      actualizados++;
      debug.push(`${partido.local} ${local}-${visit} ${partido.visit} (${status})`);
    }
    
    // 4. Si hubo cambios, guardar en JSONBin
    if (actualizados > 0) {
      datos.updatedAt = new Date().toISOString();
      datos.fuente = 'cron-api-football';
      const putRes = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': JSONBIN_API_KEY
        },
        body: JSON.stringify(datos)
      });
      if (!putRes.ok) throw new Error('JSONBin write error');
    }
    
    return res.status(200).json({
      ok: true,
      mensaje: `${actualizados} partidos actualizados`,
      partidosActualizados: actualizados,
      partidosConsultados: fixtures.length,
      detalle: debug
    });
    
  } catch (e) {
    return res.status(500).json({
      ok: false,
      error: e.message
    });
  }
}
