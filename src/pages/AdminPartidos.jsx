import React, { Fragment, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import logosEquipos from '../logosEquipos'



function AdminPartidos() {
  const [partidos, setPartidos] = useState([])
  const [equipos, setEquipos] = useState([])
  const [jugadores, setJugadores] = useState([])

  const [jornadaAbierta, setJornadaAbierta] = useState(null)
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

  const [partidosFases, setPartidosFases] = useState([])
  const [fechasSemifinales, setFechasSemifinales] = useState({
    ida1: '',
    vuelta1: '',
    ida2: '',
    vuelta2: ''
  })
  const [fechaFinal, setFechaFinal] = useState('')
  const [generandoFases, setGenerandoFases] = useState(false)

  useEffect(() => {
    cargarDatos()
  }, [])

  // =========================================================
  // CARGAR DATOS
  // =========================================================

  async function cargarDatos() {
    setLoading(true)
    setError('')

    try {
      const [
        { data: partidosData, error: partidosError },
        { data: equiposData, error: equiposError },
        { data: jugadoresData, error: jugadoresError },
        { data: fasesData, error: fasesError }
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
          jugado,
          fase,
          numero_partido
        `)
          .or('fase.eq.REGULAR,fase.is.null')
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
          .order('nombre', { ascending: true }),

        supabase
          .from('partidos')
          .select('*')
          .in('fase', ['SEMIFINAL', 'FINAL'])
          .order('numero_partido', { ascending: true })
      ])

      if (partidosError) throw partidosError
      if (equiposError) throw equiposError
      if (jugadoresError) throw jugadoresError
      if (fasesError) throw fasesError

      setPartidos(partidosData || [])
      setEquipos(equiposData || [])
      setJugadores(jugadoresData || [])
      setPartidosFases(fasesData || [])

    } catch (err) {
      console.error('ERROR CARGANDO DATOS:', err)
      setError(`No se pudieron cargar los datos: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // =========================================================
  // FUNCIONES GENERALES
  // =========================================================

  function obtenerLogoEquipo(equipo) {
    if (!equipo?.nombre) return null

    const nombre = equipo.nombre.trim()

    // Buscar coincidencia exacta
    if (logosEquipos[nombre]) {
      return logosEquipos[nombre]
    }

    // Buscar ignorando mayúsculas y minúsculas
    const clave = Object.keys(logosEquipos).find(
      key => key.trim().toLowerCase() === nombre.toLowerCase()
    )

    return clave ? logosEquipos[clave] : null
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
      !Number.isInteger(visitante) ||
      local < 0 ||
      visitante < 0
    ) {
      setError('Los goles deben ser números enteros y no negativos.')
      return
    }

    setGuardando(true)
    setError('')
    setMensaje('')

    try {
      const { data, error } = await supabase
        .from('partidos')
        .update({
          goles_local: local,
          goles_visitante: visitante,
          jugado: true
        })
        .eq('id', partido.id)
        .select()
        .single()

      if (error) throw error

      // Actualizar partidos de fase regular
      setPartidos(prev =>
        prev.map(item =>
          item.id === partido.id
            ? { ...item, ...data }
            : item
        )
      )

      // Actualizar semifinales y final
      setPartidosFases(prev =>
        prev.map(item =>
          item.id === partido.id
            ? { ...item, ...data }
            : item
        )
      )

      setPartidoEditando(null)
      setGolesLocal(0)
      setGolesVisitante(0)

      setMensaje(
        `✅ Resultado guardado: ${local} - ${visitante}`
      )

    } catch (err) {
      console.error('ERROR GUARDANDO RESULTADO:', err)
      setError(`No se pudo guardar el resultado: ${err.message}`)
    } finally {
      setGuardando(false)
    }
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
  // CLASIFICACIÓN
  // =========================================================

  function calcularClasificacion() {
    const tabla = equipos.map(equipo => ({
      ...equipo,
      pj: 0,
      pts: 0,
      gf: 0,
      gc: 0,
      dg: 0
    }))

    partidos
      .filter(p => p.jugado)
      .forEach(partido => {
        const local = tabla.find(
          e => e.id === partido.local_id
        )

        const visitante = tabla.find(
          e => e.id === partido.visitante_id
        )

        if (!local || !visitante) return

        const gl = Number(partido.goles_local || 0)
        const gv = Number(partido.goles_visitante || 0)

        local.pj++
        visitante.pj++

        local.gf += gl
        local.gc += gv

        visitante.gf += gv
        visitante.gc += gl

        if (gl > gv) {
          local.pts += 3
        } else if (gl < gv) {
          visitante.pts += 3
        } else {
          local.pts++
          visitante.pts++
        }
      })

    return tabla
      .map(e => ({
        ...e,
        dg: e.gf - e.gc
      }))
      .sort((a, b) =>
        b.pts - a.pts ||
        b.dg - a.dg ||
        b.gf - a.gf
      )
  }

  // =========================================================
  // GENERAR SEMIFINALES
  // =========================================================

  async function generarSemifinales() {
    const regulares = partidos.filter(
      p => p.jugado
    )

    if (regulares.length !== 30) {
      setError(
        'Debes completar los 30 partidos de fase regular.'
      )
      return
    }

    if (partidosFases.some(p => p.fase === 'SEMIFINAL')) {
      setError('Las semifinales ya están generadas.')
      return
    }

    const fechas = Object.values(fechasSemifinales)

    if (fechas.some(fecha => !fecha)) {
      setError('Debes seleccionar las cuatro fechas.')
      return
    }

    const clasificacion = calcularClasificacion()

    const primero = clasificacion[0]
    const segundo = clasificacion[1]
    const tercero = clasificacion[2]
    const cuarto = clasificacion[3]

    if (!cuarto) {
      setError('No hay suficientes equipos clasificados.')
      return
    }

    setGenerandoFases(true)
    setError('')
    setMensaje('')

    const registros = [
      {
        fase: 'SEMIFINAL',
        numero_partido: 1,
        fecha: fechasSemifinales.ida1,
        local_id: primero.id,
        visitante_id: cuarto.id
      },
      {
        fase: 'SEMIFINAL',
        numero_partido: 2,
        fecha: fechasSemifinales.vuelta1,
        local_id: cuarto.id,
        visitante_id: primero.id
      },
      {
        fase: 'SEMIFINAL',
        numero_partido: 3,
        fecha: fechasSemifinales.ida2,
        local_id: segundo.id,
        visitante_id: tercero.id
      },
      {
        fase: 'SEMIFINAL',
        numero_partido: 4,
        fecha: fechasSemifinales.vuelta2,
        local_id: tercero.id,
        visitante_id: segundo.id
      }
    ].map(p => ({
      ...p,
      goles_local: 0,
      goles_visitante: 0,
      jugado: false
    }))

    const { data, error } = await supabase
      .from('partidos')
      .insert(registros)
      .select()

    if (error) {
      console.error(error)
      setError(`Error generando semifinales: ${error.message}`)
    } else {
      setPartidosFases(prev => [...prev, ...data])
      setMensaje('Semifinales generadas correctamente.')
    }

    setGenerandoFases(false)
  }

  // =========================================================
  // GENERAR FINAL
  // =========================================================

  async function generarFinal() {
    const semifinales = partidosFases
      .filter(p => p.fase === 'SEMIFINAL')

    if (
      semifinales.length !== 4 ||
      semifinales.some(p => !p.jugado)
    ) {
      setError('Debes completar las cuatro semifinales.')
      return
    }

    if (!fechaFinal) {
      setError('Selecciona la fecha de la final.')
      return
    }

    // Los ganadores se determinan por el marcador global
    const ganador = (ida, vuelta) => {
      const globalLocal =
        Number(ida.goles_local) +
        Number(vuelta.goles_visitante)

      const globalVisitante =
        Number(ida.goles_visitante) +
        Number(vuelta.goles_local)

      if (globalLocal === globalVisitante) {
        return null
      }

      return globalLocal > globalVisitante
        ? ida.local_id
        : ida.visitante_id
    }

    const ganador1 = ganador(
      semifinales.find(p => p.numero_partido === 1),
      semifinales.find(p => p.numero_partido === 2)
    )

    const ganador2 = ganador(
      semifinales.find(p => p.numero_partido === 3),
      semifinales.find(p => p.numero_partido === 4)
    )

    if (!ganador1 || !ganador2) {
      setError(
        'Hay una semifinal empatada en el global. Debes resolver la clasificación antes de generar la final.'
      )
      return
    }

    setGuardando(true)
    setError('')

    const { data, error } = await supabase
      .from('partidos')
      .insert({
        fase: 'FINAL',
        numero_partido: 5,
        fecha: fechaFinal,
        local_id: ganador1,
        visitante_id: ganador2,
        goles_local: 0,
        goles_visitante: 0,
        jugado: false
      })
      .select()
      .single()

    if (error) {
      console.error(error)
      setError(`Error generando final: ${error.message}`)
    } else {
      setPartidosFases(prev => [...prev, data])
      setMensaje('Gran final generada correctamente.')
    }

    setGuardando(false)
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
          Administrar Partidos
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


            {/* =====================================================
    FASES FINALES
===================================================== */}

            <section className="jornada-admin jornada-abierta">

              <div className="jornada-admin-header">
                <div className="jornada-admin-title">
                  <span className="jornada-icon">🏆</span>
                  <div>
                    <strong>Fases finales</strong>
                    <span>Semifinales y gran final</span>
                  </div>
                </div>
              </div>

              <div className="jornada-admin-content">

                <h3>Clasificación</h3>

                {partidos.filter(p => p.jugado).length === 30 && (
                  calcularClasificacion().slice(0, 4).map((equipo, index) => (
                    <div
                      key={equipo.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        width: '100%',
                        gap: '10px',
                        padding: '10px 12px',
                        boxSizing: 'border-box'
                      }}
                    >
                      <span style={{ width: '20px', flexShrink: 0 }}>
                        {index + 1}.
                      </span>

                      <img
                        src={obtenerLogoEquipo(equipo)}
                        alt={equipo.nombre}
                        style={{
                          width: '34px',
                          height: '34px',
                          objectFit: 'contain',
                          flexShrink: 0
                        }}
                      />

                      <strong style={{
                        flex: 1,
                        textAlign: 'left',
                        whiteSpace: 'nowrap'
                      }}>
                        {equipo.nombre}
                      </strong>

                      <span style={{
                        whiteSpace: 'nowrap',
                        marginLeft: 'auto'
                      }}>
                        {equipo.pts} pts
                      </span>
                    </div>
                  ))
                )}

                {!partidosFases.some(p => p.fase === 'SEMIFINAL') && (
                  <div className="nuevo-partido-form">

                    <h3>Programar semifinales</h3>

                    {[
                      ['ida1', 'Semifinal 1 - Ida'],
                      ['vuelta1', 'Semifinal 1 - Vuelta'],
                      ['ida2', 'Semifinal 2 - Ida'],
                      ['vuelta2', 'Semifinal 2 - Vuelta']
                    ].map(([campo, titulo]) => (
                      <div key={campo}>
                        <label>{titulo}</label>
                        <input
                          type="date"
                          value={fechasSemifinales[campo]}
                          onChange={e =>
                            setFechasSemifinales(prev => ({
                              ...prev,
                              [campo]: e.target.value
                            }))
                          }
                        />
                      </div>
                    ))}

                    <button
                      className="admin-primary-button"
                      onClick={generarSemifinales}
                      disabled={generandoFases}
                    >
                      {generandoFases ? 'Generando...' : 'Generar semifinales'}
                    </button>

                  </div>
                )}

                {partidosFases.map(partido => {

                  const local = obtenerEquipo(partido.local_id)
                  const visitante = obtenerEquipo(partido.visitante_id)

                  const editando = partidoEditando === partido.id

                  const mostrandoEstadisticas =
                    partidoEstadisticas?.id === partido.id

                  return (
                    <div className="admin-partido-card" key={partido.id}>

                      <h3>
                        {partido.fase === 'FINAL'
                          ? '🏆 GRAN FINAL'
                          : `⚽ SEMIFINAL ${Math.ceil(partido.numero_partido / 2)} - ${partido.numero_partido % 2 === 1 ? 'IDA' : 'VUELTA'}`}
                      </h3>

                      <div className="admin-partido-fecha">
                        📅 {formatearFecha(partido.fecha)}
                      </div>

                      {!editando && !mostrandoEstadisticas && (
                        <>
                          <div className="admin-partido-equipos">

                            <div className="admin-equipo admin-local">

                              {obtenerLogoEquipo(local) && (
                                <img
                                  src={obtenerLogoEquipo(local)}
                                  alt={local?.nombre || 'Equipo'}
                                  className="admin-equipo-logo"
                                />
                              )}

                              <span className="admin-equipo-nombre">
                                {local?.nombre || 'Equipo'}
                              </span>

                            </div>

                            <div className="admin-resultado">
                              <span>{partido.goles_local ?? 0}</span>
                              <small>-</small>
                              <span>{partido.goles_visitante ?? 0}</span>
                            </div>

                            <div className="admin-equipo admin-visitante">

                              {obtenerLogoEquipo(visitante) && (
                                <img
                                  src={obtenerLogoEquipo(visitante)}
                                  alt={visitante?.nombre || 'Equipo'}
                                  className="admin-equipo-logo"
                                />
                              )}

                              <span className="admin-equipo-nombre">
                                {visitante?.nombre || 'Equipo'}
                              </span>

                            </div>

                          </div>

                          <div className="admin-partido-actions">

                            <button
                              className="admin-result-button"
                              onClick={() => abrirResultado(partido)}
                            >
                              📝 Registrar resultado
                            </button>

                            <button
                              className="admin-goals-button"
                              onClick={() => abrirEstadisticas(partido)}
                            >
                              ⚽ Gestionar estadísticas
                            </button>

                          </div>
                        </>
                      )}

                      {editando && (
                        <div className="resultado-editor">

                          <div className="resultado-inputs">

                            <div className="resultado-equipo">
                              <label>{local?.nombre}</label>
                              <input
                                type="number"
                                min="0"
                                step="1"
                                value={golesLocal}
                                onChange={e => setGolesLocal(e.target.value)}
                              />
                            </div>

                            <div className="resultado-guion">-</div>

                            <div className="resultado-equipo">
                              <label>{visitante?.nombre}</label>
                              <input
                                type="number"
                                min="0"
                                step="1"
                                value={golesVisitante}
                                onChange={e => setGolesVisitante(e.target.value)}
                              />
                            </div>

                          </div>

                          <div className="resultado-actions">
                            <button
                              className="admin-primary-button"
                              onClick={() => guardarResultado(partido)}
                              disabled={guardando}
                            >
                              Guardar resultado
                            </button>

                            <button
                              className="admin-secondary-button"
                              onClick={cancelarResultado}
                            >
                              Cancelar
                            </button>
                          </div>

                        </div>
                      )}

                      {/* MISMO EDITOR DE ESTADÍSTICAS */}

                      {mostrandoEstadisticas && (
                        <div className="estadisticas-editor">

                          <h3>⚽ Estadísticas del partido</h3>

                          <p>
                            {local?.nombre} - {visitante?.nombre}
                          </p>

                          <div className="estadisticas-tabla">

                            <div className="estadisticas-fila estadisticas-cabecera">
                              <div>Jugador</div>
                              <div>⚽</div>
                              <div>🟨</div>
                              <div>🟥</div>
                            </div>

                            {[local, visitante].map(equipo => (
                              <Fragment key={equipo?.id}>

                                <div className="estadisticas-equipo-titulo">
                                  {equipo?.nombre}
                                </div>

                                {obtenerJugadoresEquipo(equipo?.id).map(jugador => {

                                  const stats =
                                    estadisticasSeleccionadas[jugador.id] || {
                                      goles: 0,
                                      amarillas: 0,
                                      rojas: 0
                                    }

                                  return (
                                    <div className="estadisticas-fila" key={jugador.id}>

                                      <div className="estadisticas-jugador">
                                        {jugador.nombre}
                                      </div>

                                      {['goles', 'amarillas', 'rojas'].map(tipo => (
                                        <div className="estadistica-control" key={tipo}>

                                          <button
                                            type="button"
                                            onClick={() =>
                                              cambiarEstadistica(
                                                jugador.id,
                                                tipo,
                                                stats[tipo] - 1
                                              )
                                            }
                                          >
                                            −
                                          </button>

                                          <input
                                            type="number"
                                            min="0"
                                            value={stats[tipo]}
                                            onChange={e =>
                                              cambiarEstadistica(
                                                jugador.id,
                                                tipo,
                                                e.target.value
                                              )
                                            }
                                          />

                                          <button
                                            type="button"
                                            onClick={() =>
                                              cambiarEstadistica(
                                                jugador.id,
                                                tipo,
                                                stats[tipo] + 1
                                              )
                                            }
                                          >
                                            +
                                          </button>

                                        </div>
                                      ))}

                                    </div>
                                  )
                                })}

                              </Fragment>
                            ))}

                          </div>

                          <div className="resultado-actions">

                            <button
                              className="admin-primary-button"
                              onClick={() => guardarEstadisticas(partido)}
                              disabled={guardando}
                            >
                              Guardar estadísticas
                            </button>

                            <button
                              className="admin-secondary-button"
                              onClick={cerrarEstadisticas}
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

                {partidosFases.filter(p => p.fase === 'SEMIFINAL').length === 4 &&
                  partidosFases
                    .filter(p => p.fase === 'SEMIFINAL')
                    .every(p => p.jugado) &&
                  !partidosFases.some(p => p.fase === 'FINAL') && (

                    <div className="nuevo-partido-form">

                      <h3>🏆 Programar gran final</h3>

                      <label>Fecha de la final</label>

                      <input
                        type="date"
                        value={fechaFinal}
                        onChange={e => setFechaFinal(e.target.value)}
                      />

                      <button
                        className="admin-primary-button"
                        onClick={generarFinal}
                        disabled={guardando}
                      >
                        Generar final
                      </button>

                    </div>
                  )}

              </div>

            </section>

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
                  className={`jornada-admin ${abierta
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

                                        {obtenerLogoEquipo(local) && (
                                          <img
                                            src={obtenerLogoEquipo(local)}
                                            alt={local?.nombre || 'Equipo'}
                                            className="admin-equipo-logo"
                                          />
                                        )}

                                        <span className="admin-equipo-nombre">
                                          {local?.nombre || 'Equipo'}
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

                                        {obtenerLogoEquipo(visitante) && (
                                          <img
                                            src={obtenerLogoEquipo(visitante)}
                                            alt={visitante?.nombre || 'Equipo'}
                                            className="admin-equipo-logo"
                                          />
                                        )}

                                        <span className="admin-equipo-nombre">
                                          {visitante?.nombre || 'Equipo'}
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