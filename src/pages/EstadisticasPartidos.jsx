import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import * as XLSX from 'xlsx'

function EstadisticasPartidos() {
  const [partidos, setPartidos] = useState([])
  const [equipos, setEquipos] = useState([])
  const [jugadores, setJugadores] = useState([])
  const [goles, setGoles] = useState([])
  const [estadisticas, setEstadisticas] = useState([])

  const [partidosAbiertos, setPartidosAbiertos] = useState({})
  const [jornadasAbiertas, setJornadasAbiertas] = useState({})

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    cargarDatos()
  }, [])

  async function cargarDatos() {
    setLoading(true)
    setError(null)

    try {
      const { data: partidosData, error: partidosError } =
        await supabase
          .from('partidos')
          .select('*')
          .order('jornada', { ascending: true })
          .order('fecha', { ascending: true })

      const { data: equiposData, error: equiposError } =
        await supabase
          .from('equipos')
          .select('*')

      const { data: jugadoresData, error: jugadoresError } =
        await supabase
          .from('jugadores')
          .select('*')

      const { data: golesData, error: golesError } =
        await supabase
          .from('goles')
          .select('*')

      const { data: estadisticasData, error: estadisticasError } =
        await supabase
          .from('estadisticas_partido')
          .select('*')

      if (partidosError) throw partidosError
      if (equiposError) throw equiposError
      if (jugadoresError) throw jugadoresError
      if (golesError) throw golesError
      if (estadisticasError) throw estadisticasError

      setPartidos(partidosData || [])
      setEquipos(equiposData || [])
      setJugadores(jugadoresData || [])
      setGoles(golesData || [])
      setEstadisticas(estadisticasData || [])

    } catch (err) {
      console.error('ERROR COMPLETO:', err)

      setError(
        err?.message ||
        'No se pudieron cargar las estadísticas.'
      )
    } finally {
      setLoading(false)
    }
  }

  function obtenerEquipo(id) {
    return equipos.find(equipo => equipo.id === id)
  }

  function obtenerJugador(id) {
    return jugadores.find(jugador => jugador.id === id)
  }

  function obtenerNombreJugador(jugador) {
    if (!jugador) return 'Jugador desconocido'

    return (
      jugador.nombre_completo ||
      jugador.nombre ||
      jugador.nombres ||
      jugador.nombre_jugador ||
      'Jugador desconocido'
    )
  }

  function obtenerNumeroJugador(jugador) {
    if (!jugador) return ''

    const numero =
      jugador.numero ||
      jugador.dorsal ||
      jugador.numero_camiseta ||
      jugador.camiseta

    return numero ? `#${numero}` : ''
  }

  function formatearFecha(fecha) {
    if (!fecha) return ''

    const fechaLocal = new Date(`${fecha}T00:00:00`)

    return fechaLocal.toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  function obtenerGolesPartido(partidoId) {
    return goles.filter(
      gol => gol.partido_id === partidoId
    )
  }

  function obtenerEstadisticasPartido(partidoId) {
    return estadisticas.filter(
      estadistica =>
        estadistica.partido_id === partidoId
    )
  }

  /*
   * Determina a qué equipo pertenece el jugador.
   *
   * Se intenta primero con equipo_id.
   * Si no existe, también contemplamos equipoId por seguridad.
   */
  function obtenerEquipoJugador(jugador) {
    if (!jugador) return null

    const equipoId =
      jugador.equipo_id ??
      jugador.equipoId

    if (!equipoId) return null

    return obtenerEquipo(equipoId)
  }

  function jugadorPerteneceAEquipo(jugador, equipoId) {
    if (!jugador || !equipoId) return false

    const jugadorEquipoId =
      jugador.equipo_id ??
      jugador.equipoId

    return String(jugadorEquipoId) === String(equipoId)
  }

  function obtenerGolesEquipo(golesPartido, equipoId) {
    return golesPartido.filter(gol => {
      const jugador = obtenerJugador(gol.jugador_id)

      return jugadorPerteneceAEquipo(
        jugador,
        equipoId
      )
    })
  }

  function obtenerTarjetasEquipo(
    estadisticasPartido,
    equipoId,
    tipo
  ) {
    return estadisticasPartido.filter(item => {
      const jugador = obtenerJugador(item.jugador_id)

      if (
        !jugadorPerteneceAEquipo(
          jugador,
          equipoId
        )
      ) {
        return false
      }

      return Number(item[tipo] || 0) > 0
    })
  }

  /*
   * Agrupa todos los partidos por jornada.
   */
  function obtenerJornadas() {
    const grupos = {}

    partidos.forEach(partido => {
      const jornada = partido.jornada ?? 'Sin jornada'

      if (!grupos[jornada]) {
        grupos[jornada] = []
      }

      grupos[jornada].push(partido)
    })

    return Object.entries(grupos)
      .sort(([a], [b]) => {
        const numeroA = Number(a)
        const numeroB = Number(b)

        if (
          !Number.isNaN(numeroA) &&
          !Number.isNaN(numeroB)
        ) {
          return numeroA - numeroB
        }

        return String(a).localeCompare(String(b))
      })
      .map(([jornada, partidosJornada]) => ({
        jornada,
        partidos: partidosJornada
      }))
  }

  function togglePartido(partidoId) {
    setPartidosAbiertos(prev => ({
      ...prev,
      [partidoId]: !prev[partidoId]
    }))
  }

  function toggleJornada(jornada) {
    setJornadasAbiertas(prev => ({
      ...prev,
      [jornada]: !prev[jornada]
    }))
  }

  function exportarExcel() {
    const filas = []

    partidos.forEach(partido => {
      const local = obtenerEquipo(partido.local_id)
      const visitante = obtenerEquipo(partido.visitante_id)

      const golesPartido =
        obtenerGolesPartido(partido.id)

      const estadisticasPartido =
        obtenerEstadisticasPartido(partido.id)

      const base = {
        Jornada: partido.jornada || '',
        Fecha: partido.fecha || '',
        'Equipo local': local?.nombre || '',
        'Goles local': partido.goles_local ?? '',
        'Equipo visitante': visitante?.nombre || '',
        'Goles visitante': partido.goles_visitante ?? '',
        'Partido jugado': partido.jugado ? 'Sí' : 'No'
      }

      if (
        golesPartido.length === 0 &&
        estadisticasPartido.length === 0
      ) {
        filas.push({
          ...base,
          Equipo: '',
          Tipo: '',
          Jugador: '',
          Camiseta: '',
          Cantidad: ''
        })
      }

      golesPartido.forEach(gol => {
        const jugador =
          obtenerJugador(gol.jugador_id)

        const equipoJugador =
          obtenerEquipoJugador(jugador)

        filas.push({
          ...base,
          Equipo: equipoJugador?.nombre || '',
          Tipo: 'Gol',
          Jugador:
            obtenerNombreJugador(jugador),
          Camiseta:
            obtenerNumeroJugador(jugador),
          Cantidad: 1
        })
      })

      estadisticasPartido.forEach(estadistica => {
        const jugador =
          obtenerJugador(
            estadistica.jugador_id
          )

        const equipoJugador =
          obtenerEquipoJugador(jugador)

        if (estadistica.amarillas > 0) {
          filas.push({
            ...base,
            Equipo: equipoJugador?.nombre || '',
            Tipo: 'Tarjeta amarilla',
            Jugador:
              obtenerNombreJugador(jugador),
            Camiseta:
              obtenerNumeroJugador(jugador),
            Cantidad:
              estadistica.amarillas
          })
        }

        if (estadistica.rojas > 0) {
          filas.push({
            ...base,
            Equipo: equipoJugador?.nombre || '',
            Tipo: 'Tarjeta roja',
            Jugador:
              obtenerNombreJugador(jugador),
            Camiseta:
              obtenerNumeroJugador(jugador),
            Cantidad:
              estadistica.rojas
          })
        }
      })
    })

    const hoja =
      XLSX.utils.json_to_sheet(filas)

    const libro =
      XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(
      libro,
      hoja,
      'Estadisticas'
    )

    XLSX.writeFile(
      libro,
      'estadisticas_partidos.xlsx'
    )
  }

  function renderEventoJugador({
    icono,
    jugador,
    cantidad,
    clase
  }) {
    return (
      <div
        className={`evento-jugador ${clase}`}
        key={`${clase}-${jugador.id}`}
      >
        <span>{icono}</span>

        <div className="evento-jugador-info">
          <strong>
            {obtenerNombreJugador(jugador)}
          </strong>

          <small>
            {obtenerNumeroJugador(jugador)}
          </small>
        </div>

        {cantidad > 1 && (
          <span className="evento-cantidad">
            x{cantidad}
          </span>
        )}
      </div>
    )
  }

  function renderEquipoEstadisticas({
    equipo,
    golesEquipo,
    amarillas,
    rojas
  }) {
    return (
      <div className="estadisticas-equipo">

        <div className="estadisticas-equipo-header">
          <div className="estadisticas-equipo-icon">
            ⚽
          </div>

          <div>
            <h3>
              {equipo?.nombre || 'Equipo'}
            </h3>

            <span>
              Estadísticas del equipo
            </span>
          </div>
        </div>

        <div className="estadisticas-eventos">

          {/* GOLES */}
          <div className="estadisticas-tipo">

            <div className="estadisticas-tipo-header gol-header">
              <span>⚽</span>
              <strong>Goleadores</strong>
            </div>

            {golesEquipo.length === 0 ? (
              <p className="sin-estadisticas">
                Sin goles registrados.
              </p>
            ) : (
              <div className="eventos-grid">
                {golesEquipo.map(gol => {
                  const jugador =
                    obtenerJugador(
                      gol.jugador_id
                    )

                  return renderEventoJugador({
                    icono: '⚽',
                    jugador,
                    cantidad: 1,
                    clase: 'gol'
                  })
                })}
              </div>
            )}

          </div>

          {/* AMARILLAS */}
          <div className="estadisticas-tipo">

            <div className="estadisticas-tipo-header amarilla-header">
              <span>🟨</span>
              <strong>Tarjetas amarillas</strong>
            </div>

            {amarillas.length === 0 ? (
              <p className="sin-estadisticas">
                Sin tarjetas amarillas.
              </p>
            ) : (
              <div className="eventos-grid">
                {amarillas.map(item => {
                  const jugador =
                    obtenerJugador(
                      item.jugador_id
                    )

                  return renderEventoJugador({
                    icono: '🟨',
                    jugador,
                    cantidad:
                      Number(
                        item.amarillas
                      ),
                    clase: 'amarilla'
                  })
                })}
              </div>
            )}

          </div>

          {/* ROJAS */}
          <div className="estadisticas-tipo">

            <div className="estadisticas-tipo-header roja-header">
              <span>🟥</span>
              <strong>Tarjetas rojas</strong>
            </div>

            {rojas.length === 0 ? (
              <p className="sin-estadisticas">
                Sin tarjetas rojas.
              </p>
            ) : (
              <div className="eventos-grid">
                {rojas.map(item => {
                  const jugador =
                    obtenerJugador(
                      item.jugador_id
                    )

                  return renderEventoJugador({
                    icono: '🟥',
                    jugador,
                    cantidad:
                      Number(
                        item.rojas
                      ),
                    clase: 'roja'
                  })
                })}
              </div>
            )}

          </div>

        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <section className="estadisticas-partidos-page">
        <div className="empty-card">
          <div className="empty-icon">
            📊
          </div>

          <h2>
            Cargando estadísticas...
          </h2>

          <p>
            Estamos consultando los partidos
            y sus estadísticas.
          </p>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="estadisticas-partidos-page">
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

          <button
            type="button"
            onClick={cargarDatos}
          >
            Intentar nuevamente
          </button>

        </div>
      </section>
    )
  }

  const jornadas = obtenerJornadas()

  return (
    <section className="estadisticas-partidos-page">

      {/* ENCABEZADO */}

      <div className="estadisticas-partidos-header">

  <div>
    <h1>📊 Estadísticas de partidos</h1>

    <p>
      Goles y tarjetas de todos los partidos.
    </p>
  </div>

  <div className="estadisticas-header-actions">

    <Link
      to="/"
      className="volver-inicio-button"
    >
      🏠 Volver al inicio
    </Link>

    <button
      type="button"
      className="exportar-excel-button"
      onClick={exportarExcel}
      disabled={partidos.length === 0}
    >
      📥 Exportar a Excel
    </button>

  </div>

</div>


      {partidos.length === 0 ? (

        <div className="empty-card">

          <div className="empty-icon">
            📅
          </div>

          <h2>
            No hay partidos
          </h2>

          <p>
            Todavía no hay partidos registrados.
          </p>

        </div>

      ) : (

        <div className="estadisticas-jornadas">

          {jornadas.map(({ jornada, partidos: partidosJornada }) => {

            const jornadaAbierta =
              jornadasAbiertas[jornada] ?? false

            return (
              <section
                className={`estadisticas-jornada-bloque ${
                  jornadaAbierta
                    ? 'jornada-estadisticas-abierta'
                    : ''
                }`}
                key={jornada}
              >

                {/* HEADER JORNADA */}

                <button
                  type="button"
                  className="estadisticas-jornada-header"
                  onClick={() =>
                    toggleJornada(jornada)
                  }
                >

                  <div className="estadisticas-jornada-icon">
                    📅
                  </div>

                  <div className="estadisticas-jornada-info">

                    <h2>
                      Jornada {jornada}
                    </h2>

                    <p>
                      {partidosJornada.length}{' '}
                      {partidosJornada.length === 1
                        ? 'partido'
                        : 'partidos'}
                    </p>

                  </div>

                  <span className="estadisticas-jornada-arrow">
                    {jornadaAbierta
                      ? '▲'
                      : '▼'}
                  </span>

                </button>

                {/* PARTIDOS DE LA JORNADA */}

                {jornadaAbierta && (

                  <div className="estadisticas-jornada-partidos">

                    {partidosJornada.map(partido => {

                      const local =
                        obtenerEquipo(
                          partido.local_id
                        )

                      const visitante =
                        obtenerEquipo(
                          partido.visitante_id
                        )

                      const golesPartido =
                        obtenerGolesPartido(
                          partido.id
                        )

                      const estadisticasPartido =
                        obtenerEstadisticasPartido(
                          partido.id
                        )

                      const golesLocal =
                        obtenerGolesEquipo(
                          golesPartido,
                          partido.local_id
                        )

                      const golesVisitante =
                        obtenerGolesEquipo(
                          golesPartido,
                          partido.visitante_id
                        )

                      const amarillasLocal =
                        obtenerTarjetasEquipo(
                          estadisticasPartido,
                          partido.local_id,
                          'amarillas'
                        )

                      const amarillasVisitante =
                        obtenerTarjetasEquipo(
                          estadisticasPartido,
                          partido.visitante_id,
                          'amarillas'
                        )

                      const rojasLocal =
                        obtenerTarjetasEquipo(
                          estadisticasPartido,
                          partido.local_id,
                          'rojas'
                        )

                      const rojasVisitante =
                        obtenerTarjetasEquipo(
                          estadisticasPartido,
                          partido.visitante_id,
                          'rojas'
                        )

                      const abierto =
                        partidosAbiertos[
                          partido.id
                        ]

                      return (
                        <article
                          className={`estadisticas-partido-card ${
                            abierto
                              ? 'estadisticas-partido-abierto'
                              : ''
                          }`}
                          key={partido.id}
                        >

                          {/* RESULTADO */}

                          <button
                            type="button"
                            className="estadisticas-partido-header"
                            onClick={() =>
                              togglePartido(
                                partido.id
                              )
                            }
                          >

                            <div className="estadisticas-fecha">
                              {formatearFecha(
                                partido.fecha
                              )}
                            </div>

                            <div className="estadisticas-resultado">

                              <div className="estadisticas-equipo-resultado local">
                                <strong>
                                  {local?.nombre ||
                                    'Equipo local'}
                                </strong>

                                <span>
                                  {partido.jugado
                                    ? partido.goles_local
                                    : '-'}
                                </span>
                              </div>

                              <div className="estadisticas-final">
                                {partido.jugado
                                  ? 'FINAL'
                                  : 'VS'}
                              </div>

                              <div className="estadisticas-equipo-resultado visitante">
                                <span>
                                  {partido.jugado
                                    ? partido.goles_visitante
                                    : '-'}
                                </span>

                                <strong>
                                  {visitante?.nombre ||
                                    'Equipo visitante'}
                                </strong>
                              </div>

                            </div>

                            <span className="estadisticas-flecha">
                              {abierto
                                ? '▲'
                                : '▼'}
                            </span>

                          </button>

                          {/* INFORMACIÓN */}

                          {abierto && (

                            <div className="estadisticas-partido-contenido">

                              <div className="estadisticas-equipos-grid">

                                {renderEquipoEstadisticas({
                                  equipo: local,
                                  golesEquipo:
                                    golesLocal,
                                  amarillas:
                                    amarillasLocal,
                                  rojas:
                                    rojasLocal
                                })}

                                {renderEquipoEstadisticas({
                                  equipo: visitante,
                                  golesEquipo:
                                    golesVisitante,
                                  amarillas:
                                    amarillasVisitante,
                                  rojas:
                                    rojasVisitante
                                })}

                              </div>

                            </div>
                          )}

                        </article>
                      )
                    })}

                  </div>
                )}

              </section>
            )
          })}

        </div>
      )}

    </section>
  )
}

export default EstadisticasPartidos
