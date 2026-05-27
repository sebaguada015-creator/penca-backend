// /api/diagnostico.js
// Endpoint para verificar que la API-Football funciona y encontrar el league ID correcto del Mundial 2026
// Llamarlo una vez después de subir el proyecto: https://tu-app.vercel.app/api/diagnostico

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const API_FOOTBALL_KEY = process.env.API_FOOTBALL_KEY;
  
  if (!API_FOOTBALL_KEY) {
    return res.status(500).json({ 
      ok: false, 
      error: 'Falta API_FOOTBALL_KEY en variables de entorno' 
    });
  }
  
  try {
    // Buscar la liga "World Cup" en API-Football
    const url = 'https://v3.football.api-sports.io/leagues?search=world+cup';
    const apiRes = await fetch(url, {
      headers: { 'x-apisports-key': API_FOOTBALL_KEY }
    });
    
    if (!apiRes.ok) {
      return res.status(500).json({
        ok: false,
        error: `API-Football respondió: ${apiRes.status}`,
        detalle: await apiRes.text()
      });
    }
    
    const data = await apiRes.json();
    const ligas = (data.response || []).map(item => ({
      id: item.league.id,
      nombre: item.league.name,
      tipo: item.league.type,
      pais: item.country?.name,
      temporadas: item.seasons?.map(s => s.year)
    }));
    
    // Filtrar las que parecen ser el Mundial
    const mundial = ligas.filter(l => 
      l.nombre.toLowerCase().includes('world cup') &&
      l.tipo === 'Cup' &&
      l.temporadas?.includes(2026)
    );
    
    return res.status(200).json({
      ok: true,
      mensaje: 'API-Football responde correctamente',
      ligasEncontradas: ligas.length,
      candidatosMundial2026: mundial,
      todasLasLigas: ligas
    });
    
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
}
