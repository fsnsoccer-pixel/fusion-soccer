import { Routes, Route, Link } from 'react-router-dom'

import Partidos from './pages/Partidos'
import Fechas from './pages/Fechas'
import Posiciones from './pages/Posiciones'
import Goleadores from './pages/Goleadores'
import Admin from './pages/Admin'
import Login from './pages/Login'
import AdminEquipos from './pages/AdminEquipos'
import AdminJugadores from './pages/AdminJugadores'
import AdminPartidos from './pages/AdminPartidos'
import EstadisticasPartidos from "./pages/EstadisticasPartidos";





function Inicio() {
  return (
    <div className="app">

      <header className="header">
        <div className="header-content">

          <Link to="/" className="logo">

            <img
              src="/fussion.jpeg"
              alt="Fusion Soccer"
              className="logo-image"
            />

            <span>FUSION SOCCER</span>

          </Link>

          <div className="header-actions">

  <Link
    to="/login"
    className="login-header-button"
  >
    👤 Iniciar sesión
  </Link>

  <div className="social-icons">

    <a
      href="https://api.whatsapp.com/send?phone=573108366617&text=Hola+FusionSoccer"
      target="_blank"
      rel="noopener noreferrer"
      className="social whatsapp"
      aria-label="WhatsApp"
    >
      <i className="fa-brands fa-whatsapp"></i>
    </a>

    <a
      href="https://www.instagram.com/fusionsoccer7/?hl=es"
      target="_blank"
      rel="noopener noreferrer"
      className="social instagram"
      aria-label="Instagram"
    >
      <i className="fa-brands fa-instagram"></i>
    </a>

    <a
      href="https://www.tiktok.com/@fusionsoccer7"
      target="_blank"
      rel="noopener noreferrer"
      className="social tiktok"
      aria-label="TikTok"
    >
      <i className="fa-brands fa-tiktok"></i>
    </a>

    <a
      href="https://www.facebook.com/Fusionsoccer/"
      target="_blank"
      rel="noopener noreferrer"
      className="social facebook"
      aria-label="Facebook"
    >
      <i className="fa-brands fa-facebook-f"></i>
    </a>

    <a
      href="https://www.youtube.com/@FusionSoccer-c5t"
      target="_blank"
      rel="noopener noreferrer"
      className="social youtube"
      aria-label="YouTube"
    >
      <i className="fa-brands fa-youtube"></i>
    </a>

  </div>

</div>


        </div>
      </header>

      <main className="main">

        <section className="hero">

          <p className="eyebrow">
            CAMPEONATO
          </p>

          <h1>Fusion Soccer</h1>

          <p className="description">
            Toda la información del campeonato en un solo lugar.
          </p>

        </section>

        <section className="menu">

          <Link to="/partidos" className="menu-card">
            <span className="icon">⚽</span>
            <span>Partidos</span>
          </Link>

          <Link to="/fechas" className="menu-card">
            <span className="icon">📅</span>
            <span>Fechas</span>
          </Link>

          <Link to="/posiciones" className="menu-card">
            <span className="icon">🏆</span>
            <span>Posiciones</span>
          </Link>

          <Link to="/goleadores" className="menu-card">
            <span className="icon">🥅</span>
            <span>Goleadores</span>
          </Link>

          <Link to="/estadisticas" className="menu-card">
    <span className="icon">📊</span>
    <span>Estadísticas</span>
  </Link>

        </section>

      </main>

      <footer className="footer">
        <p>© 2026 Fusion Soccer</p>
      </footer>

    </div>
  )
}

function App() {
  return (
    <Routes>

      <Route
        path="/"
        element={<Inicio />}
      />

      <Route
        path="/partidos"
        element={<Partidos />}
      />

      <Route
        path="/fechas"
        element={<Fechas />}
      />

      <Route
        path="/posiciones"
        element={<Posiciones />}
      />

      <Route
        path="/goleadores"
        element={<Goleadores />}
      />

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/admin"
        element={<Admin />}
      />

      <Route
        path="/admin/goleadores"
        element={<Goleadores />}
      />

      <Route
        path="/admin/equipos"
        element={<AdminEquipos />}
      />

      <Route
        path="/admin/jugadores"
        element={<AdminJugadores />}
      />

      <Route
        path="/admin/partidos"
        element={<AdminPartidos />}
      />

     <Route
  path="/estadisticas"
  element={<EstadisticasPartidos />}
/>

    </Routes>
    
  )
}

export default App
