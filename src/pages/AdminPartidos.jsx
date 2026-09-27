import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function AdminPartidos() {
  const [partidos, setPartidos] = useState([])
  const [equipos, setEquipos] = useState([])
  const [jugadores, setJugadores] = useState([])

  const [jornadaAbierta, setJornadaAbierta] = useState(1)
  const [partidoEditando, setPartidoEditando] = useState(null)
  const [jornadaAgregando, setJornadaAgregando] = useState(null)
  const [partidoGoleadores, setPartidoGoleadores] = useState(null)

  const [goleadoresSeleccionados, setGoleadoresSeleccionados] = useState({})

  const [golesLocal, setGolesLocal] = useState(0)
  const [golesVisitante, setGolesVisitante] = useState(0)

  const [fechaNuevoPartido, setFechaNuevoPartido] = useState('')
  const [localNuevoPartido, setLocalNuevoPartido] = useState('')
  const [visitanteNuevoPartido, setVisitanteNuevoPartido] = useState('')

  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)

  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    cargarDatos()
  }, [])

  async function cargarDatos() {
    setLoading(true)
    setError('')

    const [
      { data: partidosData, error: partidosError },
      { data: equiposData, error: equiposError },
      { data: jugadoresData, error: jugadoresError }
    ] = await Promise.all([
      supabase
        .from('partidos')
        .select(`
          id,
          fecha,
          jornada,
          local_id,
          visitante_id,
          goles_local,
          goles_visitante
        `)
        .order('jornada', { ascending: true })
        .order('fecha', { ascending: true })
        .order('id', { ascending: true }),

      supabase
        .from('equipos')
        .select('id, nombre')
        .eq('activo', true)
        .order('nombre', { ascending: true }),

      supabase
        .from('jugadores')
        .select('id, nombre, equipo_id')
        .eq('activo', true)
        .order('nombre', { ascending: true })
    ])

    if (partidosError) {
      console.error('ERROR PARTIDOS:', partidosError)
      setError('No se pudieron cargar los partidos.')
      setLoading(false)
      return
    }

    if (equiposError) {
      console.error('ERROR EQUIPOS:', equiposError)
      setError('No se pudieron cargar los equipos.')
      setLoading(false)
      return
    }

    if (jugadoresError) {
      console.error('ERROR JUGADORES:', jugadoresError)
      setError('No se pudieron cargar los jugadores.')
      setLoading(false)
      return
    }

    setPartidos(partidosData || [])
    setEquipos(equiposData || [])
    setJugadores(jugadoresData || [])

    setLoading(false)
  }

  function obtenerEquipo(id) {
    return equipos.find(
      equipo => equipo.id === id
    )
  }

  function obtenerPartidosJornada(jornada) {
    return partidos.filter(
      partido => partido.jornada === jornada
    )
  }

  function obtenerJugadoresEquipo(equipoId) {
    return jugadores.filter(
      jugador => jugador.equipo_id === equipoId
    )
  }

  function cambiarJornada(jornada) {
    if (jornadaAbierta === jornada) {
      setJornadaAbierta(null)
    } else {
      setJornadaAbierta(jornada)
    }

    setPartidoEditando(null)
    setJornadaAgregando(null)
    setPartidoGoleadores(null)

    limpiarFormularioNuevoPartido()

    setError('')
    setMensaje('')
  }

  function formatearFecha(fecha) {
    if (!fecha) return ''

    const fechaObj = new Date(`${fecha}T00:00:00`)

    return fechaObj.toLocaleDateString(
      'es-CO',
      {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      }
    )
  }

  function abrirResultado(partido) {
    setPartidoEditando(partido.id)

    setGolesLocal(partido.goles_local ?? 0)
    setGolesVisitante(partido.goles_visitante ?? 0)

    setJornadaAgregando(null)
    setPartidoGoleadores(null)

    setError('')
    setMensaje('')
  }

  function cancelarResultado() {
    setPartidoEditando(null)

    setGolesLocal(0)
    setGolesVisitante(0)

    setError('')
  }

  async function guardarResultado(partido) {
    const local = Number(golesLocal)
    const visitante = Number(golesVisitante)

    if (
      !Number.isInteger(local) ||
      !Number.isInteger(visitante)
    ) {
      setError('Los goles deben ser números enteros.')
      return
    }

    if (local < 0 || visitante < 0) {
      setError('Los goles no pueden ser negativos.')
      return
    }

    setGuardando(true)
    setError('')
    setMensaje('')

    const { error } = await supabase
  .from('partidos')
  .update({
    goles_local: local,
    goles_visitante: visitante,
    jugado: true
  })
  .eq('id', partido.id)
    if (error) {
      console.error(error)

      setError('No se pudo guardar el resultado.')

      setGuardando(false)
      return
    }

    setPartidos(prev =>
      prev.map(item =>
        item.id === partido.id
          ? {
              ...item,
              goles_local: local,
              goles_visitante: visitante,
              jugado: true
            }
          : item
      )
    )

    setMensaje(
      `Resultado guardado: ${local} - ${visitante}`
    )

    setPartidoEditando(null)

    setGuardando(false)
  }

  function abrirAgregarPartido(jornada) {
    setJornadaAgregando(jornada)
    setPartidoEditando(null)
    setPartidoGoleadores(null)

    limpiarFormularioNuevoPartido()

    setError('')
    setMensaje('')
  }

  function limpiarFormularioNuevoPartido() {
    setFechaNuevoPartido('')
    setLocalNuevoPartido('')
    setVisitanteNuevoPartido('')
  }

  function cancelarAgregarPartido() {
    setJornadaAgregando(null)

    limpiarFormularioNuevoPartido()

    setError('')
  }

  async function agregarPartido(jornada) {
    const partidosJornada =
      obtenerPartidosJornada(jornada)

    if (partidosJornada.length >= 3) {
      setError(
        'Esta jornada ya tiene 3 partidos.'
      )
      return
    }

    if (!fechaNuevoPartido) {
      setError('Selecciona una fecha.')
      return
    }

    if (!localNuevoPartido) {
      setError('Selecciona el equipo local.')
      return
    }

    if (!visitanteNuevoPartido) {
      setError('Selecciona el equipo visitante.')
      return
    }

    if (
      localNuevoPartido === visitanteNuevoPartido
    ) {
      setError(
        'El equipo local y visitante deben ser diferentes.'
      )
      return
    }

    setGuardando(true)
    setError('')
    setMensaje('')

    const { data, error } = await supabase
      .from('partidos')
      .insert({
        fecha: fechaNuevoPartido,
        jornada: jornada,
        local_id: Number(localNuevoPartido),
        visitante_id: Number(visitanteNuevoPartido),
        goles_local: 0,
        goles_visitante: 0
      })
      .select()
      .single()

    if (error) {
      console.error(error)

      setError(
        'No se pudo agregar el partido.'
      )

      setGuardando(false)
      return
    }

    setPartidos(prev =>
      [...prev, data].sort((a, b) => {
        if (a.jornada !== b.jornada) {
          return a.jornada - b.jornada
        }

        if (a.fecha !== b.fecha) {
          return a.fecha.localeCompare(b.fecha)
        }

        return a.id - b.id
      })
    )

    limpiarFormularioNuevoPartido()

    setJornadaAgregando(null)

    setMensaje(
      `✅ Partido agregado a la Jornada ${jornada}.`
    )

    setGuardando(false)
  }

async function abrirGoleadores(partido) {
  setPartidoGoleadores(partido)
  setPartidoEditando(null)
  setJornadaAgregando(null)

  setGoleadoresSeleccionados({})
  setError('')
  setMensaje('')

  const { data, error } = await supabase
    .from('goles')
    .select('jugador_id')
    .eq('partido_id', partido.id)

  if (error) {
    console.error('ERROR CARGANDO GOLEADORES:', error)
    setError('No se pudieron cargar los goleadores.')
    return
  }

  const cantidades = {}

  for (const gol of data || []) {
    cantidades[gol.jugador_id] =
      (cantidades[gol.jugador_id] || 0) + 1
  }

  setGoleadoresSeleccionados(cantidades)
}

function cambiarCantidadGoles(jugadorId, cantidad) {
  const valor = parseInt(cantidad, 10)

  setGoleadoresSeleccionados(prev => ({
    ...prev,
    [jugadorId]: Number.isNaN(valor)
      ? 0
      : Math.max(0, valor)
  }))
}


async function guardarGoleadores(partido) {
  if (guardando) return

  setGuardando(true)
  setError('')
  setMensaje('')

  try {
    const jugadoresLocal =
      obtenerJugadoresEquipo(partido.local_id)

    const jugadoresVisitante =
      obtenerJugadoresEquipo(partido.visitante_id)

    const jugadoresPartido = [
      ...jugadoresLocal,
      ...jugadoresVisitante
    ]

    const registros = []

    for (const jugador of jugadoresPartido) {
      const cantidad =
        Number(goleadoresSeleccionados[jugador.id]) || 0

      for (let i = 0; i < cantidad; i++) {
        registros.push({
          partido_id: partido.id,
          jugador_id: jugador.id,
          jornada: partido.jornada
        })
      }
    }

    const golesLocal =
      Number(partido.goles_local) || 0

    const golesVisitante =
      Number(partido.goles_visitante) || 0

    const totalEsperado =
      golesLocal + golesVisitante

    const totalRegistrado =
      registros.length

    if (totalRegistrado !== totalEsperado) {
      setError(
        `El resultado es ${golesLocal} - ${golesVisitante}, por lo tanto debes asignar exactamente ${totalEsperado} gol${totalEsperado === 1 ? '' : 'es'} a los jugadores. Actualmente tienes ${totalRegistrado}.`
      )

      return
    }

    /*
     * Primero eliminamos los registros anteriores
     * de este partido.
     */
    const { error: deleteError } = await supabase
      .from('goles')
      .delete()
      .eq('partido_id', partido.id)

    if (deleteError) {
      console.error(
        'ERROR ELIMINANDO GOLES:',
        deleteError
      )

      setError(
        `No se pudieron actualizar los goleadores: ${deleteError.message}`
      )

      return
    }

    /*
     * Si es 0-0 no necesitamos insertar nada.
     */
    if (registros.length > 0) {
      const { error: insertError } = await supabase
        .from('goles')
        .insert(registros)

      if (insertError) {
        console.error(
          'ERROR INSERTANDO GOLES:',
          insertError
        )

        setError(
          `No se pudieron guardar los goleadores: ${insertError.message}`
        )

        return
      }
    }

    /*
     * Actualizamos la información local
     * para que la interfaz quede sincronizada.
     */
    setMensaje(
      '✅ Goleadores actualizados correctamente.'
    )

    setPartidoGoleadores(null)
    setGoleadoresSeleccionados({})

    /*
     * Recargamos los datos desde Supabase.
     * Así evitamos que la pantalla quede
     * con información anterior.
     */
    await cargarDatos()

  } catch (err) {
    console.error(
      'ERROR GENERAL GOLEADORES:',
      err
    )

    setError(
      'Ocurrió un error al actualizar los goleadores.'
    )

  } finally {
    setGuardando(false)
  }
}



  function cerrarGoleadores() {
    setPartidoGoleadores(null)
    setGoleadoresSeleccionados({})

    setError('')
  }

 

  return (
    <div className="page admin-page">

      <header className="page-header">

        <Link
          to="/admin"
          className="back-button"
        >
          ← Panel administrador
        </Link>

        <h1>⚽ Partidos</h1>

        <p>
          Administrar las 10 jornadas del campeonato
        </p>

      </header>

      <main className="page-content">

        {loading && (
          <div className="empty-card">

            <div className="empty-icon">
              ⚽
            </div>

            <h2>
              Cargando partidos...
            </h2>

          </div>
        )}

        {error && (
          <div className="admin-error">
            ⚠️ {error}
          </div>
        )}

        {mensaje && (
          <div className="admin-success">
            {mensaje}
          </div>
        )}

        {!loading && (

          <div className="jornadas-admin">

            {Array.from(
              { length: 10 },
              (_, index) => index + 1
            ).map(jornada => {

              const partidosJornada =
                obtenerPartidosJornada(jornada)

              const abierta =
                jornadaAbierta === jornada

              const completa =
                partidosJornada.length >= 3

              const agregando =
                jornadaAgregando === jornada

              return (

                <section
                  className={`jornada-admin ${
                    abierta
                      ? 'jornada-abierta'
                      : ''
                  }`}
                  key={jornada}
                >

                  <button
                    className="jornada-admin-header"
                    onClick={() =>
                      cambiarJornada(jornada)
                    }
                  >

                    <div className="jornada-admin-title">

                      <span className="jornada-icon">
                        {abierta ? '▼' : '▶'}
                      </span>

                      <div>

                        <strong>
                          Jornada {jornada}
                        </strong>

                        <span>
                          {partidosJornada.length} de 3 partidos
                        </span>

                      </div>

                    </div>

                    {completa && (
                      <span className="jornada-completa">
                        ✓ Completa
                      </span>
                    )}

                  </button>

                  {abierta && (

                    <div className="jornada-admin-content">

                      {partidosJornada.length === 0 && (
                        <div className="sin-partidos">
                          No hay partidos registrados
                          para esta jornada.
                        </div>
                      )}

                      {partidosJornada.map(partido => {

                        const local =
                          obtenerEquipo(partido.local_id)

                        const visitante =
                          obtenerEquipo(
                            partido.visitante_id
                          )

                        const editando =
                          partidoEditando === partido.id

                        const mostrandoGoleadores =
                          partidoGoleadores?.id === partido.id

                        return (

                          <div
                            className="admin-partido-card"
                            key={partido.id}
                          >

                            <div className="admin-partido-fecha">
                              📅 {formatearFecha(
                                partido.fecha
                              )}
                            </div>

                            {!editando && !mostrandoGoleadores && (

                              <>

                                <div className="admin-partido-equipos">

                                  <div className="admin-equipo admin-local">
                                    <span>
                                      {local?.nombre ||
                                        'Equipo'}
                                    </span>
                                  </div>

                                  <div className="admin-resultado">

                                    <span>
                                      {partido.goles_local}
                                    </span>

                                    <small>
                                      -
                                    </small>

                                    <span>
                                      {partido.goles_visitante}
                                    </span>

                                  </div>

                                  <div className="admin-equipo admin-visitante">
                                    <span>
                                      {visitante?.nombre ||
                                        'Equipo'}
                                    </span>
                                  </div>

                                </div>

                                <button
                                  className="admin-result-button"
                                  onClick={() =>
                                    abrirResultado(partido)
                                  }
                                >
                                  📝 Registrar resultado
                                </button>

                                <button
                                  className="admin-goals-button"
                                  onClick={() =>
                                    abrirGoleadores(partido)
                                  }
                                >
                                  ⚽ Gestionar goleadores
                                </button>

                              </>

                            )}

                            {editando && (

                              <div className="resultado-editor">

                                <div className="resultado-editor-title">
                                  📝 Registrar resultado
                                </div>

                                <div className="resultado-inputs">

                                  <div className="resultado-equipo">

                                    <label>
                                      {local?.nombre ||
                                        'Local'}
                                    </label>

                                    <input
                                      type="number"
                                      min="0"
                                      step="1"
                                      value={golesLocal}
                                      onChange={(e) =>
                                        setGolesLocal(
                                          e.target.value
                                        )
                                      }
                                    />

                                  </div>

                                  <div className="resultado-guion">
                                    -
                                  </div>

                                  <div className="resultado-equipo">

                                    <label>
                                      {visitante?.nombre ||
                                        'Visitante'}
                                    </label>

                                    <input
                                      type="number"
                                      min="0"
                                      step="1"
                                      value={golesVisitante}
                                      onChange={(e) =>
                                        setGolesVisitante(
                                          e.target.value
                                        )
                                      }
                                    />

                                  </div>

                                </div>

                                {error && (
                                  <div className="admin-error">
                                    ⚠️ {error}
                                  </div>
                                )}

                                <div className="resultado-actions">

                                  <button
                                    className="admin-primary-button"
                                    onClick={() =>
                                      guardarResultado(partido)
                                    }
                                    disabled={guardando}
                                  >
                                    {guardando
                                      ? 'Guardando...'
                                      : '💾 Guardar resultado'}
                                  </button>

                                  <button
                                    className="admin-secondary-button"
                                    onClick={
                                      cancelarResultado
                                    }
                                    disabled={guardando}
                                  >
                                    Cancelar
                                  </button>

                                </div>

                              </div>

                            )}

                            {mostrandoGoleadores && (

  <div className="goleadores-editor">

    <div className="goleadores-editor-title">
      ⚽ Registrar goleadores
    </div>

    <div className="goleadores-resultado">

      <strong>
        {local?.nombre}
      </strong>

      <span>
        {partido.goles_local} - {partido.goles_visitante}
      </span>

      <strong>
        {visitante?.nombre}
      </strong>

    </div>


    {/* LOCAL */}

    <div className="goleadores-equipo">

      <h4>
        🏠 {local?.nombre}
      </h4>

      {obtenerJugadoresEquipo(partido.local_id).map(
        jugador => (

          <div
            className="goleador-cantidad"
            key={jugador.id}
          >

            <span className="goleador-nombre">
              {jugador.nombre}
            </span>

            <div className="goleador-contador">

              <button
                type="button"
                onClick={() =>
                  cambiarCantidadGoles(
                    jugador.id,
                    (goleadoresSeleccionados[jugador.id] || 0) - 1
                  )
                }
              >
                −
              </button>

              <input
                type="number"
                min="0"
                value={
                  goleadoresSeleccionados[jugador.id] || 0
                }
                onChange={(e) =>
                  cambiarCantidadGoles(
                    jugador.id,
                    e.target.value
                  )
                }
              />

              <button
                type="button"
                onClick={() =>
                  cambiarCantidadGoles(
                    jugador.id,
                    (goleadoresSeleccionados[jugador.id] || 0) + 1
                  )
                }
              >
                +
              </button>

            </div>

          </div>

        )
      )}

    </div>


    {/* VISITANTE */}

    <div className="goleadores-equipo">

      <h4>
        ✈️ {visitante?.nombre}
      </h4>

      {obtenerJugadoresEquipo(
        partido.visitante_id
      ).map(jugador => (

        <div
          className="goleador-cantidad"
          key={jugador.id}
        >

          <span className="goleador-nombre">
            {jugador.nombre}
          </span>

          <div className="goleador-contador">

            <button
              type="button"
              onClick={() =>
                cambiarCantidadGoles(
                  jugador.id,
                  (goleadoresSeleccionados[jugador.id] || 0) - 1
                )
              }
            >
              −
            </button>

            <input
              type="number"
              min="0"
              value={
                goleadoresSeleccionados[jugador.id] || 0
              }
              onChange={(e) =>
                cambiarCantidadGoles(
                  jugador.id,
                  e.target.value
                )
              }
            />

            <button
              type="button"
              onClick={() =>
                cambiarCantidadGoles(
                  jugador.id,
                  (goleadoresSeleccionados[jugador.id] || 0) + 1
                )
              }
            >
              +
            </button>

          </div>

        </div>

      ))}

    </div>


    <div className="resultado-actions">

      <button
        className="admin-primary-button"
        onClick={() =>
          guardarGoleadores(partido)
        }
        disabled={guardando}
      >
        {guardando
          ? 'Guardando...'
          : '💾 Guardar goleadores'}
      </button>

      <button
        className="admin-secondary-button"
        onClick={cerrarGoleadores}
        disabled={guardando}
      >
        Cancelar
      </button>

    </div>

  </div>

)}


                          </div>

                        )
                      })}

                      {!completa && !agregando && (

                        <button
                          className="admin-add-match-button"
                          onClick={() =>
                            abrirAgregarPartido(jornada)
                          }
                        >
                          ➕ Agregar partido
                        </button>

                      )}

                      {agregando && (

                        <div className="nuevo-partido-form">

                          <h3>
                            ➕ Agregar partido — Jornada {jornada}
                          </h3>

                          <label>
                            📅 Fecha
                          </label>

                          <input
                            type="date"
                            value={fechaNuevoPartido}
                            onChange={(e) =>
                              setFechaNuevoPartido(
                                e.target.value
                              )
                            }
                          />

                          <label>
                            🏠 Equipo local
                          </label>

                          <select
                            value={localNuevoPartido}
                            onChange={(e) =>
                              setLocalNuevoPartido(
                                e.target.value
                              )
                            }
                          >

                            <option value="">
                              Seleccionar equipo
                            </option>

                            {equipos.map(equipo => (

                              <option
                                key={equipo.id}
                                value={equipo.id}
                              >
                                {equipo.nombre}
                              </option>

                            ))}

                          </select>

                          <label>
                            ✈️ Equipo visitante
                          </label>

                          <select
                            value={visitanteNuevoPartido}
                            onChange={(e) =>
                              setVisitanteNuevoPartido(
                                e.target.value
                              )
                            }
                          >

                            <option value="">
                              Seleccionar equipo
                            </option>

                            {equipos.map(equipo => (

                              <option
                                key={equipo.id}
                                value={equipo.id}
                              >
                                {equipo.nombre}
                              </option>

                            ))}

                          </select>

                          {error && (
                            <div className="admin-error">
                              ⚠️ {error}
                            </div>
                          )}

                          <div className="resultado-actions">

                            <button
                              className="admin-primary-button"
                              onClick={() =>
                                agregarPartido(jornada)
                              }
                              disabled={guardando}
                            >
                              {guardando
                                ? 'Guardando...'
                                : '💾 Guardar partido'}
                            </button>

                            <button
                              className="admin-secondary-button"
                              onClick={
                                cancelarAgregarPartido
                              }
                              disabled={guardando}
                            >
                              Cancelar
                            </button>

                          </div>

                        </div>

                      )}

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

export default AdminPartidos
