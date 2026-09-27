import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function AdminJugadores() {
  const [equipos, setEquipos] = useState([])
  const [jugadores, setJugadores] = useState([])

  const [equipoSeleccionado, setEquipoSeleccionado] = useState('')
  const [nombre, setNombre] = useState('')

  const [editando, setEditando] = useState(null)

  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)

  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    cargarEquipos()
  }, [])

  useEffect(() => {
    if (equipoSeleccionado) {
      cargarJugadores(equipoSeleccionado)
    } else {
      setJugadores([])
    }
  }, [equipoSeleccionado])

  async function cargarEquipos() {
    setLoading(true)
    setError('')

    const { data, error } = await supabase
      .from('equipos')
      .select('id, nombre')
      .eq('activo', true)
      .order('nombre', { ascending: true })

    if (error) {
      console.error(error)
      setError('No se pudieron cargar los equipos.')
    } else {
      setEquipos(data || [])

      if (data && data.length > 0) {
        setEquipoSeleccionado(String(data[0].id))
      }
    }

    setLoading(false)
  }

  async function cargarJugadores(equipoId) {
    setError('')

    const { data, error } = await supabase
      .from('jugadores')
      .select('id, nombre, equipo_id, activo')
      .eq('equipo_id', equipoId)
      .order('nombre', { ascending: true })

    if (error) {
      console.error(error)
      setError('No se pudieron cargar los jugadores.')
      return
    }

    setJugadores(data || [])
  }

  function prepararEdicion(jugador) {
    setEditando(jugador.id)
    setNombre(jugador.nombre)
    setMensaje('')
    setError('')
  }

  function cancelarEdicion() {
    setEditando(null)
    setNombre('')
    setMensaje('')
    setError('')
  }

  async function guardarJugador(e) {
    e.preventDefault()

    const nombreLimpio = nombre.trim()

    if (!nombreLimpio) {
      setError('Escribe el nombre del jugador.')
      return
    }

    if (!equipoSeleccionado) {
      setError('Selecciona un equipo.')
      return
    }

    setGuardando(true)
    setMensaje('')
    setError('')

    if (editando) {

      const { error } = await supabase
        .from('jugadores')
        .update({
          nombre: nombreLimpio,
          equipo_id: Number(equipoSeleccionado)
        })
        .eq('id', editando)

      if (error) {
        console.error(error)
        setError('No se pudo actualizar el jugador.')
        setGuardando(false)
        return
      }

      setMensaje('Jugador actualizado correctamente.')

    } else {

      const { error } = await supabase
        .from('jugadores')
        .insert({
          nombre: nombreLimpio,
          equipo_id: Number(equipoSeleccionado),
          activo: true
        })

      if (error) {
        console.error(error)
        setError('No se pudo crear el jugador.')
        setGuardando(false)
        return
      }

      setMensaje('Jugador creado correctamente.')
    }

    setNombre('')
    setEditando(null)

    await cargarJugadores(equipoSeleccionado)

    setGuardando(false)
  }

  async function cambiarEstado(jugador) {
    setMensaje('')
    setError('')

    const { error } = await supabase
      .from('jugadores')
      .update({
        activo: !jugador.activo
      })
      .eq('id', jugador.id)

    if (error) {
      console.error(error)
      setError('No se pudo cambiar el estado del jugador.')
      return
    }

    setMensaje(
      !jugador.activo
        ? `${jugador.nombre} está activo.`
        : `${jugador.nombre} está inactivo.`
    )

    await cargarJugadores(equipoSeleccionado)
  }

  const equipoActual = equipos.find(
    equipo => String(equipo.id) === equipoSeleccionado
  )

  return (
    <div className="page admin-page">

      <header className="page-header">

        <Link to="/admin" className="back-button">
          ← Panel administrador
        </Link>

        <h1>👥 Jugadores</h1>

        <p>
          Administrar jugadores del campeonato
        </p>

      </header>

      <main className="page-content">

        <div className="admin-form-card">

          <h2>
            🏟️ Seleccionar equipo
          </h2>

          <select
            className="admin-select"
            value={equipoSeleccionado}
            onChange={(e) => {
              setEquipoSeleccionado(e.target.value)
              cancelarEdicion()
            }}
          >

            <option value="">
              Selecciona un equipo
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

        </div>


        {equipoSeleccionado && (

          <form
            className="admin-form-card"
            onSubmit={guardarJugador}
          >

            <h2>
              {editando
                ? '✏️ Editar jugador'
                : `➕ Agregar jugador a ${equipoActual?.nombre || ''}`}
            </h2>

            <label>
              Nombre del jugador
            </label>

            <div className="admin-form-row">

              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Juan Pérez"
                maxLength={100}
                disabled={guardando}
              />

              <button
                type="submit"
                className="admin-primary-button"
                disabled={guardando}
              >
                {guardando
                  ? 'Guardando...'
                  : editando
                    ? 'Guardar cambios'
                    : 'Agregar jugador'}
              </button>

              {editando && (
                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={cancelarEdicion}
                  disabled={guardando}
                >
                  Cancelar
                </button>
              )}

            </div>

            {mensaje && (
              <div className="admin-success">
                ✅ {mensaje}
              </div>
            )}

            {error && (
              <div className="admin-error">
                ⚠️ {error}
              </div>
            )}

          </form>
        )}


        {loading && (

          <div className="empty-card">

            <div className="empty-icon">
              👥
            </div>

            <h2>
              Cargando...
            </h2>

          </div>

        )}


        {!loading &&
          equipoSeleccionado &&
          jugadores.length === 0 && (

            <div className="empty-card">

              <div className="empty-icon">
                👥
              </div>

              <h2>
                No hay jugadores
              </h2>

              <p>
                Agrega el primer jugador de este equipo.
              </p>

            </div>
          )}


        {!loading &&
          jugadores.length > 0 && (

            <div className="admin-list">

              {jugadores.map(jugador => (

                <div
                  className={`admin-list-card ${
                    jugador.activo
                      ? ''
                      : 'equipo-inactivo'
                  }`}
                  key={jugador.id}
                >

                  <div className="admin-list-main">

                    <div className="admin-team-icon">
                      👤
                    </div>

                    <div>

                      <h3>
                        {jugador.nombre}
                      </h3>

                      <span
                        className={
                          jugador.activo
                            ? 'estado activo'
                            : 'estado inactivo'
                        }
                      >
                        {jugador.activo
                          ? '● Activo'
                          : '● Inactivo'}
                      </span>

                    </div>

                  </div>

                  <div className="admin-list-actions">

                    <button
                      className="admin-edit-button"
                      onClick={() =>
                        prepararEdicion(jugador)
                      }
                    >
                      ✏️ Editar
                    </button>

                    <button
                      className={
                        jugador.activo
                          ? 'admin-disable-button'
                          : 'admin-enable-button'
                      }
                      onClick={() =>
                        cambiarEstado(jugador)
                      }
                    >
                      {jugador.activo
                        ? 'Desactivar'
                        : 'Activar'}
                    </button>

                  </div>

                </div>

              ))}

            </div>
          )}

      </main>

    </div>
  )
}

export default AdminJugadores
