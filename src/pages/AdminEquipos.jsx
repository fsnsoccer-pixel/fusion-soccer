import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function AdminEquipos() {
  const [equipos, setEquipos] = useState([])
  const [nombre, setNombre] = useState('')
  const [editando, setEditando] = useState(null)
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    cargarEquipos()
  }, [])

  async function cargarEquipos() {
    setLoading(true)
    setError('')

    const { data, error } = await supabase
      .from('equipos')
      .select('id, nombre, activo, created_at')
      .order('nombre', { ascending: true })

    if (error) {
      console.error(error)
      setError('No se pudieron cargar los equipos.')
    } else {
      setEquipos(data || [])
    }

    setLoading(false)
  }

  function prepararEdicion(equipo) {
    setEditando(equipo.id)
    setNombre(equipo.nombre)
    setMensaje('')
    setError('')

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  function cancelarEdicion() {
    setEditando(null)
    setNombre('')
    setMensaje('')
    setError('')
  }

  async function guardarEquipo(e) {
    e.preventDefault()

    const nombreLimpio = nombre.trim()

    if (!nombreLimpio) {
      setError('Escribe el nombre del equipo.')
      return
    }

    setGuardando(true)
    setMensaje('')
    setError('')

    if (editando) {

      const { error } = await supabase
        .from('equipos')
        .update({
          nombre: nombreLimpio
        })
        .eq('id', editando)

      if (error) {
        console.error(error)

        if (error.code === '23505') {
          setError('Ya existe un equipo con ese nombre.')
        } else {
          setError('No se pudo actualizar el equipo.')
        }

        setGuardando(false)
        return
      }

      setMensaje('Equipo actualizado correctamente.')

    } else {

      const { error } = await supabase
        .from('equipos')
        .insert({
          nombre: nombreLimpio,
          activo: true
        })

      if (error) {
        console.error(error)

        if (error.code === '23505') {
          setError('Ya existe un equipo con ese nombre.')
        } else {
          setError('No se pudo crear el equipo.')
        }

        setGuardando(false)
        return
      }

      setMensaje('Equipo creado correctamente.')
    }

    setNombre('')
    setEditando(null)

    await cargarEquipos()

    setGuardando(false)
  }

  async function cambiarEstado(equipo) {
    setMensaje('')
    setError('')

    const nuevoEstado = !equipo.activo

    const { error } = await supabase
      .from('equipos')
      .update({
        activo: nuevoEstado
      })
      .eq('id', equipo.id)

    if (error) {
      console.error(error)
      setError('No se pudo cambiar el estado del equipo.')
      return
    }

    setMensaje(
      nuevoEstado
        ? `${equipo.nombre} está activo.`
        : `${equipo.nombre} está inactivo.`
    )

    await cargarEquipos()
  }

  return (
    <div className="page admin-page">

      <header className="page-header">

        <Link to="/admin" className="back-button">
          ← Panel administrador
        </Link>

        <h1>🏟️ Equipos</h1>

        <p>
          Administrar los equipos del Campeonato FUSION SOCCER
        </p>

      </header>

      <main className="page-content">

        <form
          className="admin-form-card"
          onSubmit={guardarEquipo}
        >

          <h2>
            {editando
              ? '✏️ Editar equipo'
              : '➕ Agregar equipo'}
          </h2>

          <label>
            Nombre del equipo
          </label>

          <div className="admin-form-row">

            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Cali"
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
                  : 'Agregar equipo'}
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


        <div className="admin-section-title">

          <div>
            <h2>
              Equipos registrados
            </h2>

            <p>
              {equipos.length} equipo
              {equipos.length !== 1 ? 's' : ''}
            </p>
          </div>

        </div>


        {loading && (
          <div className="empty-card">

            <div className="empty-icon">
              🏟️
            </div>

            <h2>
              Cargando equipos...
            </h2>

          </div>
        )}


        {!loading && equipos.length === 0 && (
          <div className="empty-card">

            <div className="empty-icon">
              🏟️
            </div>

            <h2>
              No hay equipos
            </h2>

            <p>
              Agrega el primer equipo utilizando el formulario.
            </p>

          </div>
        )}


        {!loading && equipos.length > 0 && (

          <div className="admin-list">

            {equipos.map(equipo => (

              <div
                className={`admin-list-card ${
                  equipo.activo
                    ? ''
                    : 'equipo-inactivo'
                }`}
                key={equipo.id}
              >

                <div className="admin-list-main">

                  <div className="admin-team-icon">
                    ⚽
                  </div>

                  <div>

                    <h3>
                      {equipo.nombre}
                    </h3>

                    <span
                      className={
                        equipo.activo
                          ? 'estado activo'
                          : 'estado inactivo'
                      }
                    >
                      {equipo.activo
                        ? '● Activo'
                        : '● Inactivo'}
                    </span>

                  </div>

                </div>


                <div className="admin-list-actions">

                  <button
                    className="admin-edit-button"
                    onClick={() =>
                      prepararEdicion(equipo)
                    }
                  >
                    ✏️ Editar
                  </button>

                  <button
                    className={
                      equipo.activo
                        ? 'admin-disable-button'
                        : 'admin-enable-button'
                    }
                    onClick={() =>
                      cambiarEstado(equipo)
                    }
                  >
                    {equipo.activo
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

export default AdminEquipos
