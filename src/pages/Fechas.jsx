import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function Fechas() {
  const [partidos, setPartidos] = useState([])
  const [equipos, setEquipos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [jornadaAbierta, setJornadaAbierta] = useState(null)

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

  // Agrupar partidos por jornada
  const partidosPorJornada = partidos.reduce((grupos, partido) => {
    const jornada = partido.jornada

    if (!grupos[jornada]) {
      grupos[jornada] = []
    }

    grupos[jornada].push(partido)

    return grupos
  }, {})

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

            <div className="empty-icon">
              📅
            </div>

            <h2>
              Cargando calendario...
            </h2>

            <p>
              Estamos consultando las fechas.
            </p>

          </div>
        )}

        {!loading && error && (
          <div className="empty-card error-card">

            <div className="empty-icon">
              ⚠️
            </div>

            <h2>
              Ocurrió un problema
            </h2>

            <p>
              {error}
            </p>

          </div>
        )}

        {!loading &&
          !error &&
          partidos.length === 0 && (
            <div className="empty-card">

              <div className="empty-icon">
                📅
              </div>

              <h2>
                No hay fechas disponibles
              </h2>

              <p>
                Todavía no hay partidos registrados.
              </p>

            </div>
          )}

        {!loading &&
          !error &&
          partidos.length > 0 && (

            <div className="fechas-acordeon">

              {Object.entries(partidosPorJornada).map(
                ([jornada, partidosJornada]) => {

                  const abierta =
                    jornadaAbierta === jornada

                  const fecha =
                    partidosJornada[0]?.fecha

                  return (
                    <section
                      className={`fecha-acordeon ${
                        abierta ? 'fecha-abierta' : ''
                      }`}
                      key={jornada}
                    >

                      {/* CABECERA */}

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

                        <div className="fecha-icon">
                          📅
                        </div>

                        <div className="fecha-info">

                          <h2>
                            Fecha {jornada}
                          </h2>

                          <p>
                            {formatearFecha(fecha)}
                          </p>

                        </div>

                        <div className="fecha-flecha">
                          {abierta ? '▲' : '▼'}
                        </div>

                      </button>


                      {/* PARTIDOS */}

                      {abierta && (

                        <div className="fecha-acordeon-partidos">

                          {partidosJornada.map(partido => {

                            const local =
                              obtenerEquipo(
                                partido.local_id
                              )

                            const visitante =
                              obtenerEquipo(
                                partido.visitante_id
                              )

                            return (
                              <div
                                className="fecha-match"
                                key={partido.id}
                              >

                                <div className="fecha-team local">
                                  {local?.nombre ||
                                    'Equipo local'}
                                </div>

                                <div className="fecha-vs">
                                  {partido.jugado
                                    ? `${partido.goles_local} - ${partido.goles_visitante}`
                                    : 'VS'
                                  }
                                </div>

                                <div className="fecha-team visitante">
                                  {visitante?.nombre ||
                                    'Equipo visitante'}
                                </div>

                              </div>
                            )
                          })}

                        </div>

                      )}

                    </section>
                  )
                }
              )}

            </div>
          )}

      </main>

    </div>
  )
}

export default Fechas
