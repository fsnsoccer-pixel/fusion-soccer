
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import logosEquipos from '../logosEquipos'

function Fechas() {
  const [partidos, setPartidos] = useState([])
  const [equipos, setEquipos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [jornadaAbierta, setJornadaAbierta] = useState(null)
  const [finalesAbiertas, setFinalesAbiertas] = useState(false)

  useEffect(() => {
    cargarCalendario()
  }, [])

  async function cargarCalendario() {
    setLoading(true)
    setError(null)

    const { data: partidosData, error: partidosError } =
      await supabase
        .from('partidos')
        .select('*')
        .order('jornada', { ascending: true })
        .order('fecha', { ascending: true })

    if (partidosError) {
      console.error(partidosError)
      setError('No se pudo cargar el calendario.')
      setLoading(false)
      return
    }

    const { data: equiposData, error: equiposError } =
      await supabase
        .from('equipos')
        .select('id, nombre')
        .eq('activo', true)
        .order('nombre')

    if (equiposError) {
      console.error(equiposError)
      setError('No se pudieron cargar los equipos.')
      setLoading(false)
      return
    }

    setPartidos(partidosData || [])
    setEquipos(equiposData || [])
    setLoading(false)
  }

  function obtenerEquipo(id) {
    return equipos.find(equipo => equipo.id === id)
  }

  function formatearFecha(fecha) {
    if (!fecha) return ''

    const fechaLocal = new Date(`${fecha}T00:00:00`)

    return fechaLocal.toLocaleDateString('es-CO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  // Separar jornadas normales y fases finales
  const partidosJornadas = partidos.filter(
    partido =>
      partido.jornada !== null &&
      partido.jornada >= 1 &&
      partido.jornada <= 10
  )

  const partidosFinales = partidos.filter(
    partido => partido.jornada === null
  )

  // Agrupar jornadas
  const partidosPorJornada = partidosJornadas.reduce(
    (grupos, partido) => {
      const jornada = partido.jornada

      if (!grupos[jornada]) {
        grupos[jornada] = []
      }

      grupos[jornada].push(partido)

      return grupos
    },
    {}
  )

  // Verificar si las 10 jornadas están completas
  const diezJornadasCompletas = Array.from(
    { length: 10 },
    (_, index) => index + 1
  ).every(jornada => {
    const partidosJornada = partidosPorJornada[jornada]

    return (
      partidosJornada &&
      partidosJornada.length > 0 &&
      partidosJornada.every(partido => partido.jugado === true)
    )
  })

  // Identificar semifinales y final
  function identificarFase(partido, index) {
    const texto = [
      partido.nombre,
      partido.fase,
      partido.tipo,
      partido.descripcion
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    // Primero identificar semifinales
    if (texto.includes('semifinal')) {
      return 'Semifinal'
    }

    // Después identificar la gran final
    if (
      texto.includes('gran final') ||
      texto.includes('final')
    ) {
      return 'Final'
    }

    // Respaldo si no existe identificación
    return index < 2 ? 'Semifinal' : 'Final'
  }

  // Separar semifinales y gran final
  const semifinales = partidosFinales.filter(partido => {
    const texto = [
      partido.nombre,
      partido.fase,
      partido.tipo,
      partido.descripcion
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return texto.includes('semifinal')
  })

  const finales = partidosFinales.filter(partido => {
    const texto = [
      partido.nombre,
      partido.fase,
      partido.tipo,
      partido.descripcion
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return (
      texto.includes('gran final') ||
      texto.includes('final')
    ) && !texto.includes('semifinal')
  })

  // Componente visual de partido
  function Partido({ partido }) {
    const local = obtenerEquipo(partido.local_id)
    const visitante = obtenerEquipo(partido.visitante_id)

    return (
      <div className="fecha-match">

        <div className="partido-fecha">
          {formatearFecha(partido.fecha)}
        </div>

        <div className="partido-equipos">

          <div className="fecha-team local">

            {local && logosEquipos[local.nombre] && (
              <img
                src={logosEquipos[local.nombre]}
                alt=""
                className="equipo-icono"
              />
            )}

            <span>
              {local?.nombre || 'Equipo local'}
            </span>

          </div>

          <div className="fecha-vs">
            {partido.jugado === true
              ? `${partido.goles_local} - ${partido.goles_visitante}`
              : 'VS'}
          </div>

          <div className="fecha-team visitante">

            {visitante && logosEquipos[visitante.nombre] && (
              <img
                src={logosEquipos[visitante.nombre]}
                alt=""
                className="equipo-icono"
              />
            )}

            <span>
              {visitante?.nombre || 'Equipo visitante'}
            </span>

          </div>

        </div>

      </div>
    )
  }

  return (
    <div className="page">

      <header className="page-header">

        <Link to="/" className="back-button">
          ← Inicio
        </Link>

        <h1>📅 Fechas</h1>

        <p>
          Calendario del Campeonato FUSION SOCCER
        </p>

      </header>

      <main className="page-content">

        {loading && (
          <div className="empty-card">
            <div className="empty-icon">📅</div>
            <h2>Cargando calendario...</h2>
            <p>Estamos consultando las fechas.</p>
          </div>
        )}

        {!loading && error && (
          <div className="empty-card error-card">
            <div className="empty-icon">⚠️</div>
            <h2>Ocurrió un problema</h2>
            <p>{error}</p>
          </div>
        )}

        {!loading &&
          !error &&
          partidos.length === 0 && (
            <div className="empty-card">
              <div className="empty-icon">📅</div>
              <h2>No hay fechas disponibles</h2>
              <p>Todavía no hay partidos registrados.</p>
            </div>
          )}

        {!loading && !error && partidos.length > 0 && (

          <div className="fechas-acordeon">

            {/* FASES FINALES */}

            {partidosFinales.length > 0 && (

              <section className={`fecha-acordeon fases-finales ${finalesAbiertas ? 'fecha-abierta' : ''
                }`}>

                <button
                  type="button"
                  className="fecha-acordeon-header"
                  onClick={() =>
                    setFinalesAbiertas(!finalesAbiertas)
                  }
                  aria-expanded={finalesAbiertas}
                >

                  <div className="fecha-header-left">

                    <div className="fecha-chevron">
                      {finalesAbiertas ? '▴' : '▾'}
                    </div>

                    <div className="fecha-info">
                      <h2>🏆 Fases finales</h2>
                      <p>
                        Semifinales y gran final
                      </p>
                    </div>

                  </div>

                  {diezJornadasCompletas && (
                    <div className="fecha-estado">
                      ✓ Clasificación
                    </div>
                  )}

                </button>

                {finalesAbiertas && (
                  <div className="fecha-acordeon-partidos">

                    {/* GRAN FINAL PRIMERO */}

                    {finales.length > 0 && (
                      <>
                        <div className="fase-titulo">
                          🏆 GRAN FINAL
                        </div>

                        {finales.map(partido => (
                          <Partido
                            key={partido.id}
                            partido={partido}
                          />
                        ))}
                      </>
                    )}

                    {/* SEMIFINALES DESPUÉS */}

                    {semifinales.length > 0 && (
                      <>
                        <div className="fase-titulo">
                          ⚔️ SEMIFINALES
                        </div>

                        {semifinales.map(partido => (
                          <Partido
                            key={partido.id}
                            partido={partido}
                          />
                        ))}
                      </>
                    )}

                  </div>
                )}
              </section>
            )}

            {/* JORNADAS NORMALES */}

            {Object.entries(partidosPorJornada)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([jornada, partidosJornada]) => {

                const abierta = jornadaAbierta === jornada

                const partidosJugados =
                  partidosJornada.filter(
                    partido => partido.jugado === true
                  ).length

                const jornadaCompleta =
                  partidosJornada.length > 0 &&
                  partidosJugados === partidosJornada.length

                return (
                  <section
                    className={`fecha-acordeon ${abierta ? 'fecha-abierta' : ''
                      }`}
                    key={jornada}
                  >

                    <button
                      type="button"
                      className="fecha-acordeon-header"
                      onClick={() =>
                        setJornadaAbierta(
                          abierta ? null : jornada
                        )
                      }
                      aria-expanded={abierta}
                    >

                      <div className="fecha-header-left">

                        <div className="fecha-chevron">
                          {abierta ? '▴' : '▾'}
                        </div>

                        <div className="fecha-info">
                          <h2>Jornada {jornada}</h2>

                          <p>
                            {partidosJugados} de{' '}
                            {partidosJornada.length} partidos
                          </p>
                        </div>

                      </div>

                      {jornadaCompleta && (
                        <div className="fecha-estado">
                          ✓ Completa
                        </div>
                      )}

                    </button>

                    {abierta && (
                      <div className="fecha-acordeon-partidos">

                        {partidosJornada.map(partido => (
                          <Partido
                            key={partido.id}
                            partido={partido}
                          />
                        ))}

                      </div>
                    )}

                  </section>
                )
              })}

          </div>
        )}

      </main>

    </div>
  )
}

export default Fechas
