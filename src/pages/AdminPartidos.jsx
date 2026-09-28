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
  const [partidoEstadisticas, setPartidoEstadisticas] = useState(null)

  const [estadisticasSeleccionadas, setEstadisticasSeleccionadas] =
    useState({})

  const [golesLocal, setGolesLocal] = useState(0)
  const [golesVisitante, setGolesVisitante] = useState(0)

  const [fechaNuevoPartido, setFechaNuevoPartido] = useState('')
  const [localNuevoPartido, setLocalNuevoPartido] = useState('')
  const [visitanteNuevoPartido, setVisitanteNuevoPartido] =
    useState('')

  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)

  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    cargarDatos()
  }, [])

  // =========================================================
  // CARGAR DATOS
  // =========================================================

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
          goles_visitante,
          jugado
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

  // =========================================================
  // FUNCIONES GENERALES
  // =========================================================

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

  function obtenerJugadoresPartido(partido) {
    return [
      ...obtenerJugadoresEquipo(partido.local_id),
      ...obtenerJugadoresEquipo(partido.visitante_id)
    ]
  }

  function cambiarJornada(jornada) {
    if (jornadaAbierta === jornada) {
      setJornadaAbierta(null)
    } else {
      setJornadaAbierta(jornada)
    }

    cerrarTodosLosEditores()

    limpiarFormularioNuevoPartido()

    setError('')
    setMensaje('')
  }

  function cerrarTodosLosEditores() {
    setPartidoEditando(null)
    setJornadaAgregando(null)
    setPartidoEstadisticas(null)
    setEstadisticasSeleccionadas({})
  }

  function formatearFecha(fecha) {
    if (!fecha) return ''

    const fechaObj = new Date(
      `${fecha}T00:00:00`
    )

    return fechaObj.toLocaleDateString(
      'es-CO',
      {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      }
    )
  }

  // =========================================================
  // RESULTADO
  // =========================================================

  function abrirResultado(partido) {
    setPartidoEditando(partido.id)

    setGolesLocal(
      partido.goles_local ?? 0
    )

    setGolesVisitante(
      partido.goles_visitante ?? 0
    )

    setJornadaAgregando(null)
    setPartidoEstadisticas(null)

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
      setError(
        'Los goles deben ser números enteros.'
      )
      return
    }

    if (
      local < 0 ||
      visitante < 0
    ) {
      setError(
        'Los goles no pueden ser negativos.'
      )
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
      console.error(
        'ERROR GUARDANDO RESULTADO:',
        error
      )

      setError(
        'No se pudo guardar el resultado.'
      )

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

  // =========================================================
  // AGREGAR PARTIDO
  // =========================================================

  function abrirAgregarPartido(jornada) {
    setJornadaAgregando(jornada)
    setPartidoEditando(null)
    setPartidoEstadisticas(null)

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
      setError(
        'Selecciona una fecha.'
      )
      return
    }

    if (!localNuevoPartido) {
      setError(
        'Selecciona el equipo local.'
      )
      return
    }

    if (!visitanteNuevoPartido) {
      setError(
        'Selecciona el equipo visitante.'
      )
      return
    }

    if (
      localNuevoPartido ===
      visitanteNuevoPartido
    ) {
      setError(
        'El equipo local y visitante deben ser diferentes.'
      )
      return
    }

    setGuardando(true)
    setError('')
    setMensaje('')

    const { data, error } =
      await supabase
        .from('partidos')
        .insert({
          fecha: fechaNuevoPartido,
          jornada: jornada,
          local_id:
            Number(localNuevoPartido),
          visitante_id:
            Number(visitanteNuevoPartido),
          goles_local: 0,
          goles_visitante: 0
        })
        .select()
        .single()

    if (error) {
      console.error(
        'ERROR AGREGANDO PARTIDO:',
        error
      )

      setError(
        'No se pudo agregar el partido.'
      )

      setGuardando(false)
      return
    }

    setPartidos(prev =>
      [...prev, data].sort((a, b) => {
        if (
          a.jornada !== b.jornada
        ) {
          return (
            a.jornada - b.jornada
          )
        }

        if (a.fecha !== b.fecha) {
          return a.fecha.localeCompare(
            b.fecha
          )
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

  // =========================================================
  // ESTADÍSTICAS DEL PARTIDO
  // GOLES + AMARILLAS + ROJAS
  // =========================================================

  async function abrirEstadisticas(partido) {
    setPartidoEstadisticas(partido)

    setPartidoEditando(null)
    setJornadaAgregando(null)

    setEstadisticasSeleccionadas({})

    setError('')
    setMensaje('')

    // -----------------------------------------
    // Cargar goles
    // -----------------------------------------

    const {
      data: golesData,
      error: golesError
    } = await supabase
      .from('goles')
      .select('jugador_id')
      .eq('partido_id', partido.id)

    if (golesError) {
      console.error(
        'ERROR CARGANDO GOLES:',
        golesError
      )

      setError(
        'No se pudieron cargar los goles.'
      )

      return
    }

    // -----------------------------------------
    // Cargar tarjetas
    // -----------------------------------------

    const {
      data: tarjetasData,
      error: tarjetasError
    } = await supabase
      .from('estadisticas_partido')
      .select(`
        jugador_id,
        amarillas,
        rojas
      `)
      .eq('partido_id', partido.id)

    if (tarjetasError) {
      console.error(
        'ERROR CARGANDO TARJETAS:',
        tarjetasError
      )

      setError(
        'No se pudieron cargar las tarjetas.'
      )

      return
    }

    // -----------------------------------------
    // Construir información
    // -----------------------------------------

    const cantidades = {}

    // Goles
    for (
      const gol of golesData || []
    ) {
      if (!cantidades[gol.jugador_id]) {
        cantidades[gol.jugador_id] = {
          goles: 0,
          amarillas: 0,
          rojas: 0
        }
      }

      cantidades[
        gol.jugador_id
      ].goles++
    }

    // Tarjetas
    for (
      const tarjeta of tarjetasData || []
    ) {
      if (!cantidades[tarjeta.jugador_id]) {
        cantidades[
          tarjeta.jugador_id
        ] = {
          goles: 0,
          amarillas: 0,
          rojas: 0
        }
      }

      cantidades[
        tarjeta.jugador_id
      ].amarillas =
        tarjeta.amarillas || 0

      cantidades[
        tarjeta.jugador_id
      ].rojas =
        tarjeta.rojas || 0
    }

    setEstadisticasSeleccionadas(
      cantidades
    )
  }

  // =========================================================
  // CAMBIAR ESTADÍSTICA
  // =========================================================

  function cambiarEstadistica(
    jugadorId,
    tipo,
    cantidad
  ) {
    const valor = parseInt(
      cantidad,
      10
    )

    const cantidadFinal =
      Number.isNaN(valor)
        ? 0
        : Math.max(0, valor)

    setEstadisticasSeleccionadas(
      prev => ({
        ...prev,

        [jugadorId]: {
          goles:
            prev[jugadorId]?.goles ||
            0,

          amarillas:
            prev[jugadorId]
              ?.amarillas || 0,

          rojas:
            prev[jugadorId]?.rojas ||
            0,

          [tipo]: cantidadFinal
        }
      })
    )
  }

  // =========================================================
  // GUARDAR TODAS LAS ESTADÍSTICAS
  // =========================================================

  async function guardarEstadisticas(
    partido
  ) {
    if (guardando) return

    setGuardando(true)
    setError('')
    setMensaje('')

    try {
      const jugadoresPartido =
        obtenerJugadoresPartido(
          partido
        )

      // ---------------------------------------
      // Preparar goles
      // ---------------------------------------

      const registrosGoles = []

      for (
        const jugador of jugadoresPartido
      ) {
        const estadisticas =
          estadisticasSeleccionadas[
            jugador.id
          ]

        const goles =
          Number(
            estadisticas?.goles
          ) || 0

        for (
          let i = 0;
          i < goles;
          i++
        ) {
          registrosGoles.push({
            partido_id:
              partido.id,

            jugador_id:
              jugador.id,

            jornada:
              partido.jornada
          })
        }
      }

      // ---------------------------------------
      // Validar goles
      // ---------------------------------------

      const golesLocal =
        Number(
          partido.goles_local
        ) || 0

      const golesVisitante =
        Number(
          partido.goles_visitante
        ) || 0

      const totalEsperado =
        golesLocal +
        golesVisitante

      const totalRegistrado =
        registrosGoles.length

      if (
        totalRegistrado !==
        totalEsperado
      ) {
        setError(
          `El resultado es ${golesLocal} - ${golesVisitante}. Debes asignar exactamente ${totalEsperado} gol${
            totalEsperado === 1
              ? ''
              : 'es'
          }. Actualmente tienes ${totalRegistrado}.`
        )

        setGuardando(false)
        return
      }

      // ---------------------------------------
      // Eliminar goles anteriores
      // ---------------------------------------

      const {
        error: deleteGolesError
      } = await supabase
        .from('goles')
        .delete()
        .eq(
          'partido_id',
          partido.id
        )

      if (deleteGolesError) {
        console.error(
          'ERROR ELIMINANDO GOLES:',
          deleteGolesError
        )

        setError(
          `No se pudieron actualizar los goles: ${deleteGolesError.message}`
        )

        setGuardando(false)
        return
      }

      // ---------------------------------------
      // Insertar goles
      // ---------------------------------------

      if (
        registrosGoles.length >
        0
      ) {
        const {
          error: insertGolesError
        } = await supabase
          .from('goles')
          .insert(
            registrosGoles
          )

        if (insertGolesError) {
          console.error(
            'ERROR INSERTANDO GOLES:',
            insertGolesError
          )

          setError(
            `No se pudieron guardar los goles: ${insertGolesError.message}`
          )

          setGuardando(false)
          return
        }
      }
      // ---------------------------------------
      // Preparar tarjetas
      // ---------------------------------------

      const registrosTarjetas =
        []

      for (
        const jugador of jugadoresPartido
      ) {
        const estadisticas =
          estadisticasSeleccionadas[
            jugador.id
          ]

        const amarillas =
          Number(
            estadisticas?.amarillas
          ) || 0

        const rojas =
          Number(
            estadisticas?.rojas
          ) || 0

        if (
          amarillas > 0 ||
          rojas > 0
        ) {
          registrosTarjetas.push({
            partido_id:
              partido.id,

            jugador_id:
              jugador.id,

            amarillas,
            rojas
          })
        }
      }

      // ---------------------------------------
// Guardar tarjetas
// ---------------------------------------

if (registrosTarjetas.length > 0) {
  const {
    error: guardarTarjetasError
  } = await supabase
    .from('estadisticas_partido')
    .upsert(
      registrosTarjetas,
      {
        onConflict: 'partido_id,jugador_id'
      }
    )

  if (guardarTarjetasError) {
    console.error(
      'ERROR GUARDANDO TARJETAS:',
      guardarTarjetasError
    )

    setError(
      `No se pudieron guardar las tarjetas: ${guardarTarjetasError.message}`
    )

    setGuardando(false)
    return
  }
}


      // ---------------------------------------
      // Éxito
      // ---------------------------------------

      setMensaje(
        '✅ Estadísticas del partido guardadas correctamente.'
      )

      setPartidoEstadisticas(
        null
      )

      setEstadisticasSeleccionadas(
        {}
      )

    } catch (err) {
      console.error(
        'ERROR GENERAL ESTADÍSTICAS:',
        err
      )

      setError(
        'Ocurrió un error al guardar las estadísticas.'
      )

    } finally {
      setGuardando(false)
    }
  }

  function cerrarEstadisticas() {
    setPartidoEstadisticas(
      null
    )

    setEstadisticasSeleccionadas(
      {}
    )

    setError('')
  }

  // =========================================================
  // RENDER
  // =========================================================

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
          Administrar las 10 jornadas
          del campeonato
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
              (_, index) =>
                index + 1
            ).map(jornada => {

              const partidosJornada =
                obtenerPartidosJornada(
                  jornada
                )

              const abierta =
                jornadaAbierta ===
                jornada

              const completa =
                partidosJornada.length >=
                3

              const agregando =
                jornadaAgregando ===
                jornada

              return (

                <section
                  className={`jornada-admin ${
                    abierta
                      ? 'jornada-abierta'
                      : ''
                  }`}
                  key={jornada}
                >

                  {/* CABECERA JORNADA */}

                  <button
                    className="jornada-admin-header"
                    onClick={() =>
                      cambiarJornada(
                        jornada
                      )
                    }
                  >

                    <div className="jornada-admin-title">

                      <span className="jornada-icon">
                        {abierta
                          ? '▼'
                          : '▶'}
                      </span>

                      <div>

                        <strong>
                          Jornada {jornada}
                        </strong>

                        <span>
                          {
                            partidosJornada.length
                          }{' '}
                          de 3 partidos
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

                      {/* SIN PARTIDOS */}

                      {partidosJornada.length ===
                        0 && (

                        <div className="sin-partidos">
                          No hay partidos
                          registrados para
                          esta jornada.
                        </div>

                      )}

                      {/* PARTIDOS */}

                      {partidosJornada.map(
                        partido => {

                          const local =
                            obtenerEquipo(
                              partido.local_id
                            )

                          const visitante =
                            obtenerEquipo(
                              partido.visitante_id
                            )

                          const editando =
                            partidoEditando ===
                            partido.id

                          const mostrandoEstadisticas =
                            partidoEstadisticas?.id ===
                            partido.id

                          return (

                            <div
                              className="admin-partido-card"
                              key={
                                partido.id
                              }
                            >

                              {/* FECHA */}

                              <div className="admin-partido-fecha">
                                📅{' '}
                                {formatearFecha(
                                  partido.fecha
                                )}
                              </div>

                              {/* VISTA NORMAL */}

                              {!editando &&
                                !mostrandoEstadisticas && (

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
                                        {
                                          partido.goles_local
                                        }
                                      </span>

                                      <small>
                                        -
                                      </small>

                                      <span>
                                        {
                                          partido.goles_visitante
                                        }
                                      </span>

                                    </div>

                                    <div className="admin-equipo admin-visitante">

                                      <span>
                                        {visitante?.nombre ||
                                          'Equipo'}
                                      </span>

                                    </div>

                                  </div>

                                  <div className="admin-partido-actions">

                                    <button
                                      className="admin-result-button"
                                      onClick={() =>
                                        abrirResultado(
                                          partido
                                        )
                                      }
                                    >
                                      📝 Registrar resultado
                                    </button>

                                    <button
                                      className="admin-goals-button"
                                      onClick={() =>
                                        abrirEstadisticas(
                                          partido
                                        )
                                      }
                                    >
                                      ⚽ Gestionar estadísticas
                                    </button>

                                  </div>

                                </>

                              )}

                              {/* EDITAR RESULTADO */}

                              {editando && (

                                <div className="resultado-editor">

                                  <div className="resultado-editor-title">
                                    📝 Registrar resultado
                                  </div>

                                  <div className="resultado-inputs">

                                    <div className="resultado-equipo">

                                      <label>
                                        {
                                          local?.nombre ||
                                          'Local'
                                        }
                                      </label>

                                      <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={
                                          golesLocal
                                        }
                                        onChange={e =>
                                          setGolesLocal(
                                            e.target
                                              .value
                                          )
                                        }
                                      />

                                    </div>

                                    <div className="resultado-guion">
                                      -
                                    </div>

                                    <div className="resultado-equipo">

                                      <label>
                                        {
                                          visitante?.nombre ||
                                          'Visitante'
                                        }
                                      </label>

                                      <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={
                                          golesVisitante
                                        }
                                        onChange={e =>
                                          setGolesVisitante(
                                            e.target
                                              .value
                                          )
                                        }
                                      />

                                    </div>

                                  </div>

                                  <div className="resultado-actions">

                                    <button
                                      className="admin-primary-button"
                                      onClick={() =>
                                        guardarResultado(
                                          partido
                                        )
                                      }
                                      disabled={
                                        guardando
                                      }
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
                                      disabled={
                                        guardando
                                      }
                                    >
                                      Cancelar
                                    </button>

                                  </div>

                                </div>

                              )}

                              {/* ESTADÍSTICAS */}

                              {mostrandoEstadisticas && (

                                <div className="estadisticas-editor">

                                  <div className="estadisticas-editor-header">

                                    <div>

                                      <h3>
                                        ⚽ Estadísticas del partido
                                      </h3>

                                      <p>
                                        {
                                          local?.nombre
                                        }{' '}
                                        {
                                          partido.goles_local
                                        }{' '}
                                        -{' '}
                                        {
                                          partido.goles_visitante
                                        }{' '}
                                        {
                                          visitante?.nombre
                                        }
                                      </p>

                                    </div>

                                  </div>

                                  <div className="estadisticas-tabla">

                                    {/* CABECERA */}

                                    <div className="estadisticas-fila estadisticas-cabecera">

                                      <div>
                                        Jugador
                                      </div>

                                      <div>
                                        ⚽
                                      </div>

                                      <div>
                                        🟨
                                      </div>

                                      <div>
                                        🟥
                                      </div>

                                    </div>

                                    {/* LOCAL */}

                                    <div className="estadisticas-equipo-titulo">
                                      🏠{' '}
                                      {local?.nombre}
                                    </div>

                                    {obtenerJugadoresEquipo(
                                      partido.local_id
                                    ).map(
                                      jugador => {

                                        const estadisticas =
                                          estadisticasSeleccionadas[
                                            jugador.id
                                          ] || {
                                            goles: 0,
                                            amarillas: 0,
                                            rojas: 0
                                          }

                                        return (

                                          <div
                                            className="estadisticas-fila"
                                            key={
                                              jugador.id
                                            }
                                          >

                                            <div className="estadisticas-jugador">
                                              {
                                                jugador.nombre
                                              }
                                            </div>

                                            {/* GOLES */}

                                            <div className="estadistica-control">

                                              <button
                                                type="button"
                                                onClick={() =>
                                                  cambiarEstadistica(
                                                    jugador.id,
                                                    'goles',
                                                    estadisticas.goles -
                                                      1
                                                  )
                                                }
                                              >
                                                −
                                              </button>

                                              <input
                                                type="number"
                                                min="0"
                                                value={
                                                  estadisticas.goles
                                                }
                                                onChange={e =>
                                                  cambiarEstadistica(
                                                    jugador.id,
                                                    'goles',
                                                    e.target
                                                      .value
                                                  )
                                                }
                                              />

                                              <button
                                                type="button"
                                                onClick={() =>
                                                  cambiarEstadistica(
                                                    jugador.id,
                                                    'goles',
                                                    estadisticas.goles +
                                                      1
                                                  )
                                                }
                                              >
                                                +
                                              </button>

                                            </div>

                                            {/* AMARILLAS */}

                                            <div className="estadistica-control">

                                              <button
                                                type="button"
                                                onClick={() =>
                                                  cambiarEstadistica(
                                                    jugador.id,
                                                    'amarillas',
                                                    estadisticas.amarillas -
                                                      1
                                                  )
                                                }
                                              >
                                                −
                                              </button>

                                              <input
                                                type="number"
                                                min="0"
                                                value={
                                                  estadisticas.amarillas
                                                }
                                                onChange={e =>
                                                  cambiarEstadistica(
                                                    jugador.id,
                                                    'amarillas',
                                                    e.target
                                                      .value
                                                  )
                                                }
                                              />

                                              <button
                                                type="button"
                                                onClick={() =>
                                                  cambiarEstadistica(
                                                    jugador.id,
                                                    'amarillas',
                                                    estadisticas.amarillas +
                                                      1
                                                  )
                                                }
                                              >
                                                +
                                              </button>

                                            </div>

                                            {/* ROJAS */}

                                            <div className="estadistica-control">

                                              <button
                                                type="button"
                                                onClick={() =>
                                                  cambiarEstadistica(
                                                    jugador.id,
                                                    'rojas',
                                                    estadisticas.rojas -
                                                      1
                                                  )
                                                }
                                              >
                                                −
                                              </button>

                                              <input
                                                type="number"
                                                min="0"
                                                value={
                                                  estadisticas.rojas
                                                }
                                                onChange={e =>
                                                  cambiarEstadistica(
                                                    jugador.id,
                                                    'rojas',
                                                    e.target
                                                      .value
                                                  )
                                                }
                                              />

                                              <button
                                                type="button"
                                                onClick={() =>
                                                  cambiarEstadistica(
                                                    jugador.id,
                                                    'rojas',
                                                    estadisticas.rojas +
                                                      1
                                                  )
                                                }
                                              >
                                                +
                                              </button>

                                            </div>

                                          </div>

                                        )
                                      }
                                    )}

                                    {/* VISITANTE */}

                                    <div className="estadisticas-equipo-titulo">
                                      ✈️{' '}
                                      {
                                        visitante?.nombre
                                      }
                                    </div>

                                    {obtenerJugadoresEquipo(
                                      partido.visitante_id
                                    ).map(
                                      jugador => {

                                        const estadisticas =
                                          estadisticasSeleccionadas[
                                            jugador.id
                                          ] || {
                                            goles: 0,
                                            amarillas: 0,
                                            rojas: 0
                                          }

                                        return (

                                          <div
                                            className="estadisticas-fila"
                                            key={
                                              jugador.id
                                            }
                                          >

                                            <div className="estadisticas-jugador">
                                              {
                                                jugador.nombre
                                              }
                                            </div>

                                            {/* GOLES */}

                                            <div className="estadistica-control">

                                              <button
                                                type="button"
                                                onClick={() =>
                                                  cambiarEstadistica(
                                                    jugador.id,
                                                    'goles',
                                                    estadisticas.goles -
                                                      1
                                                  )
                                                }
                                              >
                                                −
                                              </button>

                                              <input
                                                type="number"
                                                min="0"
                                                value={
                                                  estadisticas.goles
                                                }
                                                onChange={e =>
                                                  cambiarEstadistica(
                                                    jugador.id,
                                                    'goles',
                                                    e.target
                                                      .value
                                                  )
                                                }
                                              />

                                              <button
                                                type="button"
                                                onClick={() =>
                                                  cambiarEstadistica(
                                                    jugador.id,
                                                    'goles',
                                                    estadisticas.goles +
                                                      1
                                                  )
                                                }
                                              >
                                                +
                                              </button>

                                            </div>

                                            {/* AMARILLAS */}

                                            <div className="estadistica-control">

                                              <button
                                                type="button"
                                                onClick={() =>
                                                  cambiarEstadistica(
                                                    jugador.id,
                                                    'amarillas',
                                                    estadisticas.amarillas -
                                                      1
                                                  )
                                                }
                                              >
                                                −
                                              </button>

                                              <input
                                                type="number"
                                                min="0"
                                                value={
                                                  estadisticas.amarillas
                                                }
                                                onChange={e =>
                                                  cambiarEstadistica(
                                                    jugador.id,
                                                    'amarillas',
                                                    e.target
                                                      .value
                                                  )
                                                }
                                              />

                                              <button
                                                type="button"
                                                onClick={() =>
                                                  cambiarEstadistica(
                                                    jugador.id,
                                                    'amarillas',
                                                    estadisticas.amarillas +
                                                      1
                                                  )
                                                }
                                              >
                                                +
                                              </button>

                                            </div>

                                            {/* ROJAS */}

                                            <div className="estadistica-control">

                                              <button
                                                type="button"
                                                onClick={() =>
                                                  cambiarEstadistica(
                                                    jugador.id,
                                                    'rojas',
                                                    estadisticas.rojas -
                                                      1
                                                  )
                                                }
                                              >
                                                −
                                              </button>

                                              <input
                                                type="number"
                                                min="0"
                                                value={
                                                  estadisticas.rojas
                                                }
                                                onChange={e =>
                                                  cambiarEstadistica(
                                                    jugador.id,
                                                    'rojas',
                                                    e.target
                                                      .value
                                                  )
                                                }
                                              />

                                              <button
                                                type="button"
                                                onClick={() =>
                                                  cambiarEstadistica(
                                                    jugador.id,
                                                    'rojas',
                                                    estadisticas.rojas +
                                                      1
                                                  )
                                                }
                                              >
                                                +
                                              </button>

                                            </div>

                                          </div>

                                        )
                                      }
                                    )}

                                  </div>

                                  {/* BOTONES */}

                                  <div className="resultado-actions">

                                    <button
                                      className="admin-primary-button"
                                      onClick={() =>
                                        guardarEstadisticas(
                                          partido
                                        )
                                      }
                                      disabled={
                                        guardando
                                      }
                                    >
                                      {guardando
                                        ? 'Guardando...'
                                        : '💾 Guardar estadísticas'}
                                    </button>

                                    <button
                                      className="admin-secondary-button"
                                      onClick={
                                        cerrarEstadisticas
                                      }
                                      disabled={
                                        guardando
                                      }
                                    >
                                      Cancelar
                                    </button>

                                  </div>

                                </div>

                              )}

                            </div>

                          )
                        }
                      )}

                      {/* AGREGAR PARTIDO */}

                      {!completa &&
                        !agregando && (

                        <button
                          className="admin-add-match-button"
                          onClick={() =>
                            abrirAgregarPartido(
                              jornada
                            )
                          }
                        >
                          ➕ Agregar partido
                        </button>

                      )}

                      {/* FORMULARIO NUEVO PARTIDO */}

                      {agregando && (

                        <div className="nuevo-partido-form">

                          <h3>
                            ➕ Agregar partido —
                            Jornada{' '}
                            {jornada}
                          </h3>

                          <label>
                            📅 Fecha
                          </label>

                          <input
                            type="date"
                            value={
                              fechaNuevoPartido
                            }
                            onChange={e =>
                              setFechaNuevoPartido(
                                e.target
                                  .value
                              )
                            }
                          />

                          <label>
                            🏠 Equipo local
                          </label>

                          <select
                            value={
                              localNuevoPartido
                            }
                            onChange={e =>
                              setLocalNuevoPartido(
                                e.target
                                  .value
                              )
                            }
                          >

                            <option value="">
                              Seleccionar equipo
                            </option>

                            {equipos.map(
                              equipo => (

                                <option
                                  key={
                                    equipo.id
                                  }
                                  value={
                                    equipo.id
                                  }
                                >
                                  {
                                    equipo.nombre
                                  }
                                </option>

                              )
                            )}

                          </select>

                          <label>
                            ✈️ Equipo visitante
                          </label>

                          <select
                            value={
                              visitanteNuevoPartido
                            }
                            onChange={e =>
                              setVisitanteNuevoPartido(
                                e.target
                                  .value
                              )
                            }
                          >

                            <option value="">
                              Seleccionar equipo
                            </option>

                            {equipos.map(
                              equipo => (

                                <option
                                  key={
                                    equipo.id
                                  }
                                  value={
                                    equipo.id
                                  }
                                >
                                  {
                                    equipo.nombre
                                  }
                                </option>

                              )
                            )}

                          </select>

                          <div className="resultado-actions">

                            <button
                              className="admin-primary-button"
                              onClick={() =>
                                agregarPartido(
                                  jornada
                                )
                              }
                              disabled={
                                guardando
                              }
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
                              disabled={
                                guardando
                              }
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