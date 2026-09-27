import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function Goleadores() {
  const [goleadores, setGoleadores] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    cargarGoleadores()
  }, [])

  async function cargarGoleadores() {
    setLoading(true)
    setError('')

    try {
      // 1. Cargar goles
      const { data: golesData, error: golesError } =
        await supabase
          .from('goles')
          .select('jugador_id')

      if (golesError) {
        console.error('ERROR GOLES:', golesError)
        throw golesError
      }

      // Si todavía no hay goles
      if (!golesData || golesData.length === 0) {
        setGoleadores([])
        setLoading(false)
        return
      }

      // 2. Obtener IDs de jugadores
      const idsJugadores = [
        ...new Set(
          golesData.map(gol => gol.jugador_id)
        )
      ]

      // 3. Cargar jugadores
      const { data: jugadoresData, error: jugadoresError } =
        await supabase
          .from('jugadores')
          .select('id, nombre, equipo_id')
          .in('id', idsJugadores)

      if (jugadoresError) {
        console.error(
          'ERROR JUGADORES:',
          jugadoresError
        )
        throw jugadoresError
      }

      // 4. Obtener IDs de equipos
      const idsEquipos = [
        ...new Set(
          (jugadoresData || [])
            .map(jugador => jugador.equipo_id)
            .filter(Boolean)
        )
      ]

      // 5. Cargar equipos
      let equiposData = []

      if (idsEquipos.length > 0) {
        const {
          data,
          error: equiposError
        } = await supabase
          .from('equipos')
          .select('id, nombre')
          .in('id', idsEquipos)

        if (equiposError) {
          console.error(
            'ERROR EQUIPOS:',
            equiposError
          )
          throw equiposError
        }

        equiposData = data || []
      }

      // 6. Crear mapas para encontrar rápidamente
      const jugadoresMap = {}

      ;(jugadoresData || []).forEach(jugador => {
        jugadoresMap[jugador.id] = jugador
      })

      const equiposMap = {}

      equiposData.forEach(equipo => {
        equiposMap[equipo.id] = equipo
      })

      // 7. Contar goles por jugador
      const cantidades = {}

      golesData.forEach(gol => {
        const jugador =
          jugadoresMap[gol.jugador_id]

        if (!jugador) return

        if (!cantidades[jugador.id]) {
          cantidades[jugador.id] = {
            id: jugador.id,
            nombre: jugador.nombre,
            equipo:
              equiposMap[jugador.equipo_id]?.nombre ||
              'Sin equipo',
            goles: 0
          }
        }

        cantidades[jugador.id].goles++
      })

      // 8. Ordenar
      const resultado =
        Object.values(cantidades)
          .sort((a, b) => {
            if (b.goles !== a.goles) {
              return b.goles - a.goles
            }

            return a.nombre.localeCompare(
              b.nombre
            )
          })
          .map((jugador, index) => ({
            ...jugador,
            posicion: index + 1
          }))

      setGoleadores(resultado)

    } catch (err) {
      console.error(
        'ERROR GENERAL GOLEADORES:',
        err
      )

      setError(
        'No se pudieron cargar los goleadores.'
      )

    } finally {
      setLoading(false)
    }
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

        <h1>🥅 Tabla de goleadores</h1>

        <p>
          Máximos goleadores del campeonato
        </p>

      </header>

      <main className="page-content">

        {loading && (
          <div className="empty-card">

            <div className="empty-icon">
              ⚽
            </div>

            <h2>
              Cargando goleadores...
            </h2>

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
          goleadores.length === 0 && (

            <div className="empty-card">

              <div className="empty-icon">
                🥅
              </div>

              <h2>
                Aún no hay goles registrados
              </h2>

              <p>
                Los goleadores aparecerán aquí
                cuando se registren los goles
                de los partidos.
              </p>

            </div>

          )}

        {!loading &&
          !error &&
          goleadores.length > 0 && (

            <div className="goleadores-publicos">

              {goleadores.map(jugador => (

                <div
                  className="goleador-publico-card"
                  key={jugador.id}
                >

                  <div className="goleador-posicion">

                    {jugador.posicion === 1
                      ? '🥇'
                      : jugador.posicion === 2
                      ? '🥈'
                      : jugador.posicion === 3
                      ? '🥉'
                      : jugador.posicion}

                  </div>

                  <div className="goleador-info">

                    <strong>
                      {jugador.nombre}
                    </strong>

                    <span>
                      {jugador.equipo}
                    </span>

                  </div>

                  <div className="goleador-goles">

                    <strong>
                      {jugador.goles}
                    </strong>

                    <span>
                      {jugador.goles === 1
                        ? 'gol'
                        : 'goles'}
                    </span>

                  </div>

                </div>

              ))}

            </div>

          )}

      </main>

    </div>
  )
}

export default Goleadores
