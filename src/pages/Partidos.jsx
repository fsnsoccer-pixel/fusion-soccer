import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function Partidos() {
  const [partidos, setPartidos] = useState([])
  const [equipos, setEquipos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [jornadaAbierta, setJornadaAbierta] = useState(null)

  useEffect(() => {
    cargarPartidos()
  }, [])

  async function cargarPartidos() {
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
      setError('No se pudieron cargar los partidos.')
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
      month: 'long'
    })
  }

  // Agrupar los partidos por jornada
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

        <h1>⚽ Partidos</h1>

        <p>
          Calendario y resultados del campeonato
        </p>

      </header>

      <main className="page-content">

        {loading && (
          <div className="empty-card">
            <div className="empty-icon">⚽</div>

            <h2>Cargando partidos...</h2>

            <p>
              Estamos consultando el campeonato.
            </p>
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

              <div className="empty-icon">
                📅
              </div>

              <h2>No hay partidos</h2>

              <p>
                Todavía no hay partidos registrados.
              </p>

            </div>
          )}

        {!loading &&
          !error &&
          partidos.length > 0 && (

            <div className="jornadas">

              {Object.entries(partidosPorJornada).map(
                ([jornada, partidosJornada]) => {

                  const abierta =
                    jornadaAbierta === jornada

                  const fechaJornada =
                    partidosJornada[0]?.fecha

                  return (
                    <section
                      className={`jornada ${
                        abierta ? 'jornada-abierta' : ''
                      }`}
                      key={jornada}
                    >

                      {/* UNA SOLA CABECERA POR JORNADA */}

                      <button
                        type="button"
                        className="jornada-header"
                        onClick={() =>
                          setJornadaAbierta(
                            abierta ? null : jornada
                          )
                        }
                        aria-expanded={abierta}
                      >

                        <span className="jornada-icon">
                          ⚽
                        </span>

                        <div className="jornada-info">

                          <h2>
                            Fecha {jornada}
                          </h2>

                          <p>
                            {formatearFecha(
                              fechaJornada
                            )}
                          </p>

                        </div>

                        <span className="jornada-arrow">
                          {abierta ? '▲' : '▼'}
                        </span>

                      </button>

                      {/* PARTIDOS SOLO SI ESTÁ ABIERTA */}

                      {abierta && (
                        <div className="jornada-partidos">

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
                              <article
  className="match-card"
  key={partido.id}
>

  <div className="team team-local">

    <span className="team-name">
      {local?.nombre ||
        'Equipo local'}
    </span>

    <span className="score">
      {partido.jugado
        ? partido.goles_local
        : '-'}
    </span>

  </div>

  <div className="match-status">

    <span>
      {partido.jugado
        ? 'FINAL'
        : 'VS'}
    </span>

  </div>

  <div className="team team-visitor">

    <span className="score">
      {partido.jugado
        ? partido.goles_visitante
        : '-'}
    </span>

    <span className="team-name">
      {visitante?.nombre ||
        'Equipo visitante'}
    </span>

  </div>

</article>

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

export default Partidos
