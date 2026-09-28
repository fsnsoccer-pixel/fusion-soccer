import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true)
  const [usuario, setUsuario] = useState(null)

  useEffect(() => {
    verificarSesion()
  }, [])

  async function verificarSesion() {
    const {
      data: { user },
      error
    } = await supabase.auth.getUser()

    if (error || !user) {
      setUsuario(null)
    } else {
      setUsuario(user)
    }

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="empty-card">
        <div className="empty-icon">
          🔐
        </div>

        <h2>
          Verificando acceso...
        </h2>

        <p>
          Comprobando tu sesión.
        </p>
      </div>
    )
  }

  if (!usuario) {
    return (
      <Navigate
        to="/login"
        replace
      />
    )
  }

  return children
}

export default ProtectedRoute
