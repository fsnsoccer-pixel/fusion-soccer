import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function Login() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function iniciarSesion(e) {
    e.preventDefault()

    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      console.error(error)
      setError('Correo o contraseña incorrectos.')
      setLoading(false)
      return
    }

    navigate('/admin')
  }

  return (
    <div className="page">

      <header className="page-header">

        <button
          className="back-button"
          onClick={() => navigate('/')}
        >
          ← Volver
        </button>

        <h1>👤 Administrador</h1>

        <p>
          Acceso al panel de FUSION SOCCER
        </p>

      </header>

      <main className="page-content">

        <form
          className="login-card"
          onSubmit={iniciarSesion}
        >

          <div className="login-icon">
            ⚽
          </div>

          <h2>
            Iniciar sesión
          </h2>

          <p className="login-description">
            Ingresa con tu cuenta de administrador.
          </p>

          <label>
            Correo electrónico
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="correo@ejemplo.com"
            required
          />

          <label>
            Contraseña
          </label>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading
              ? 'Ingresando...'
              : 'Entrar al panel'}
          </button>

        </form>

      </main>

    </div>
  )
}

export default Login
