import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function Posiciones() {
  const [posiciones, setPosiciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    cargarTabla()
  }, [])

  async function cargarTabla() {
    setLoading(true)
    setError('')

    const [
      { data: equipos, error: equiposError },
      { data: partidos, error: partidosError }
    ] = await Promise.all([
      supabase
        .from('equipos')
        .select('id, nombre')
        .eq('activo', true)
        .order('nombre'),

      supabase
        .from('partidos')
        .select(`
          id,
          local_id,
          visitante_id,
          goles_local,
          goles_visitante,
          jornada
        `)
        .order('jornada')
    ])

    if (equiposError) {
      console.error(equiposError)
      setError('No se pudieron cargar los equipos.')
      setLoading(false)
      return
    }

    if (partidosError) {
      console.error(partidosError)
      setError('No se pudieron cargar los partidos.')
      setLoading(false)
      return
    }

    const tabla = {}

    // Crear estadísticas iniciales
    equipos.forEach(equipo => {
      tabla[equipo.id] = {
        id: equipo.id,
        equipo: equipo.nombre,
        pj: 0,
        pg: 0,
        pe: 0,
        pp: 0,
        gf: 0,
        gc: 0,
        dg: 0,
        pts: 0
      }
    })

    // Procesar partidos
    partidos.forEach(partido => {
      const local = tabla[partido.local_id]
      const visitante = tabla[partido.visitante_id]

      if (!local || !visitante) return

      const golesLocal =
        Number(partido.goles_local) || 0

      const golesVisitante =
        Number(partido.goles_visitante) || 0

      /*
       * IMPORTANTE:
       * Por ahora consideramos jugado un partido
       * cuando tiene un resultado diferente de 0-0.
       */
      if (
        golesLocal === 0 &&
        golesVisitante === 0
      ) {
        return
      }

      local.pj++
      visitante.pj++

      local.gf += golesLocal
      local.gc += golesVisitante

      visitante.gf += golesVisitante
      visitante.gc += golesLocal

      if (golesLocal > golesVisitante) {
        local.pg++
        visitante.pp++

        local.pts += 3

      } else if (
        golesLocal < golesVisitante
      ) {
        visitante.pg++
        local.pp++

        visitante.pts += 3

      } else {
        local.pe++
        visitante.pe++

        local.pts++
        visitante.pts++
      }
    })

    // Calcular diferencia de goles
    Object.values(tabla).forEach(equipo => {
      equipo.dg = equipo.gf - equipo.gc
    })

    // Convertir a array y ordenar
    const tablaOrdenada =
      Object.values(tabla).sort((a, b) => {

        // Primero puntos
        if (b.pts !== a.pts) {
          return b.pts - a.pts
        }

        // Después diferencia de goles
        if (b.dg !== a.dg) {
          return b.dg - a.dg
        }

        // Después goles a favor
        if (b.gf !== a.gf) {
          return b.gf - a.gf
        }

        // Finalmente nombre
        return a.equipo.localeCompare(
          b.equipo
        )
      })

    // Agregar posición
    const resultado = tablaOrdenada.map(
      (equipo, index) => ({
        ...equipo,
        posicion: index + 1
      })
    )

    setPosiciones(resultado)
    setLoading(false)
  }

  return (
    <div className="page">

      <header className="page-header">

        <Link
          to="/"
          className="back-button"
        >
          ← Volver
        </Link>

        <h1>🏆 Tabla de posiciones</h1>

        <p>
          Clasificación actual del campeonato
        </p>

      </header>

      <main className="page-content">

        {loading && (
          <div className="empty-card">

            <div className="empty-icon">
              ⚽
            </div>

            <h2>
              Calculando posiciones...
            </h2>

          </div>
        )}

        {error && (
          <div className="admin-error">
            ⚠️ {error}
          </div>
        )}

        {!loading && !error && (

          <div className="tabla-posiciones-wrapper">

            <div className="tabla-posiciones">

              <div className="tabla-header">

                <span>#</span>
                <span>Equipo</span>
                <span>PJ</span>
                <span>PG</span>
                <span>PE</span>
                <span>PP</span>
                <span>GF</span>
                <span>GC</span>
                <span>DG</span>
                <span>PTS</span>

              </div>

              {posiciones.map(equipo => (

                <div
                  className={`tabla-fila ${
                    equipo.posicion === 1
                      ? 'primero'
                      : ''
                  }`}
                  key={equipo.id}
                >

                  <span className="posicion">
                    {equipo.posicion}
                  </span>

                  <span className="nombre-equipo">
                    {equipo.posicion === 1 && '🥇 '}
                    {equipo.posicion === 2 && '🥈 '}
                    {equipo.posicion === 3 && '🥉 '}

                    {equipo.equipo}
                  </span>

                  <span>
                    {equipo.pj}
                  </span>

                  <span>
                    {equipo.pg}
                  </span>

                  <span>
                    {equipo.pe}
                  </span>

                  <span>
                    {equipo.pp}
                  </span>

                  <span>
                    {equipo.gf}
                  </span>

                  <span>
                    {equipo.gc}
                  </span>

                  <span
                    className={
                      equipo.dg > 0
                        ? 'dg-positivo'
                        : equipo.dg < 0
                        ? 'dg-negativo'
                        : ''
                    }
                  >
                    {equipo.dg > 0
                      ? `+${equipo.dg}`
                      : equipo.dg}
                  </span>

                  <strong className="puntos">
                    {equipo.pts}
                  </strong>

                </div>

              ))}

            </div>

            <div className="tabla-leyenda">

              <span>
                <strong>PJ</strong> Partidos jugados
              </span>

              <span>
                <strong>PG</strong> Partidos ganados
              </span>

              <span>
                <strong>PE</strong> Partidos empatados
              </span>

              <span>
                <strong>PP</strong> Partidos perdidos
              </span>

              <span>
                <strong>GF</strong> Goles a favor
              </span>

              <span>
                <strong>GC</strong> Goles en contra
              </span>

              <span>
                <strong>DG</strong> Diferencia de goles
              </span>

              <span>
                <strong>PTS</strong> Puntos
              </span>

            </div>

          </div>

        )}

      </main>

    </div>
  )
}

export default Posiciones
