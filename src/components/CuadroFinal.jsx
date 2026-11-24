
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import logosEquipos from '../logosEquipos'

function CuadroFinal() {
  const [partidos, setPartidos] = useState([])
  const [equipos, setEquipos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarDatos()
  }, [])

  async function cargarDatos() {
    setLoading(true)

    const { data: partidosData, error: partidosError } =
      await supabase
        .from('partidos')
        .select('*')
        .is('jornada', null)
        .order('fecha', { ascending: true })

    const { data: equiposData, error: equiposError } =
      await supabase
        .from('equipos')
        .select('id, nombre')
        .eq('activo', true)

    if (partidosError || equiposError) {
      console.error(partidosError || equiposError)
      setLoading(false)
      return
    }

    setPartidos(partidosData || [])
    setEquipos(equiposData || [])
    setLoading(false)
  }

  function obtenerEquipo(id) {
    return equipos.find(
      equipo => String(equipo.id) === String(id)
    )
  }

  function identificarFase(partido) {
    return String(partido.fase || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
  }

  const semifinales = partidos.filter(partido =>
    identificarFase(partido).includes('semi')
  )

  const finales = partidos.filter(partido =>
    identificarFase(partido).includes('final') &&
    !identificarFase(partido).includes('semi')
  )

  function obtenerGanador(partido) {
    if (!partido || partido.jugado !== true) return null

    const local = Number(partido.goles_local)
    const visitante = Number(partido.goles_visitante)

    if (local === visitante) return null

    return local > visitante
      ? obtenerEquipo(partido.local_id)
      : obtenerEquipo(partido.visitante_id)
  }

  function EquipoCuadro({ equipo, partido, lado }) {
    const esGanador = obtenerGanador(partido)

    const idEquipo = lado === 'local'
      ? partido?.local_id
      : partido?.visitante_id

    const ganador = esGanador &&
      String(esGanador.id) === String(idEquipo)

    return (
      <div className={`cuadro-equipo ${ganador ? 'cuadro-ganador' : ''}`}>

        {equipo && logosEquipos[equipo.nombre] && (
          <img
            src={logosEquipos[equipo.nombre]}
            alt=""
            className="cuadro-logo"
          />
        )}

        <span>
          {equipo?.nombre || 'Por clasificar'}
        </span>

        {partido?.jugado === true && (
          <strong>
            {lado === 'local'
              ? partido.goles_local
              : partido.goles_visitante}
          </strong>
        )}

      </div>
    )
  }

  function PartidoCuadro({ partido }) {
    const local = obtenerEquipo(partido.local_id)
    const visitante = obtenerEquipo(partido.visitante_id)

    return (
  <div className="cuadro-partido">

    {/* FECHA DEL PARTIDO */}
    <div className="cuadro-fecha">
      📅 {partido.fecha
        ? new Date(`${partido.fecha}T00:00:00`).toLocaleDateString('es-CO', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })
        : 'Fecha por definir'}
    </div>

    <EquipoCuadro
      equipo={local}
      partido={partido}
      lado="local"
    />

    <EquipoCuadro
      equipo={visitante}
      partido={partido}
      lado="visitante"
    />

  </div>
)
  }

  if (loading) {
    return (
      <section className="cuadro-final-section">
        <p>Cargando fases finales...</p>
      </section>
    )
  }

  if (semifinales.length === 0 && finales.length === 0) {
    return null
  }

  return (
    <section className="cuadro-final-section">

      <div className="cuadro-titulo">
        <span>🏆</span>
        <div>
          <h2>Camino a la Gran Final</h2>
          <p>FUSION SOCCER CUP</p>
        </div>
      </div>

      <div className="cuadro-contenido">

        <div className="cuadro-columna">

          <h3>⚔️ SEMIFINALES</h3>

          {semifinales.map((partido, index) => (
            <PartidoCuadro
              key={partido.id}
              partido={partido}
            />
          ))}

        </div>

        <div className="cuadro-conector">
          <span>➜</span>
          <span>➜</span>
        </div>

        <div className="cuadro-columna cuadro-columna-final">

          <h3>🏆 GRAN FINAL</h3>

          {finales.length > 0 ? (
            finales.map(partido => (
              <PartidoCuadro
                key={partido.id}
                partido={partido}
              />
            ))
          ) : (
            <div className="cuadro-partido">
              <div className="cuadro-equipo">
                <span>Ganador semifinal 1</span>
              </div>
              <div className="cuadro-equipo">
                <span>Ganador semifinal 2</span>
              </div>
            </div>
          )}

          {finales.some(partido => obtenerGanador(partido)) && (
            <div className="cuadro-campeon">
              🏆 CAMPEÓN

              <strong>
                {obtenerGanador(
                  finales.find(partido => obtenerGanador(partido))
                )?.nombre}
              </strong>
            </div>
          )}

        </div>

      </div>

    </section>
  )
}

export default CuadroFinal
