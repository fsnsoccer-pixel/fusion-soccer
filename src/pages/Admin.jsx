import { Link } from 'react-router-dom'

function Admin() {
  return (
    <div className="page admin-page">

      <header className="page-header">

        <Link to="/" className="back-button">
          ← Volver al sitio
        </Link>

        <h1>⚽ FUSION SOCCER</h1>

        <p>
          Panel de administración del campeonato
        </p>

      </header>

      <main className="page-content">

        <div className="admin-grid">

          <Link to="/admin/equipos" className="admin-card">
            <div className="admin-card-icon">
              🏟️
            </div>

            <div>
              <h2>Equipos</h2>
              <p>
                Administrar equipos del campeonato
              </p>
            </div>
          </Link>

          <Link to="/admin/jugadores" className="admin-card">
            <div className="admin-card-icon">
              👥
            </div>

            <div>
              <h2>Jugadores</h2>
              <p>
                Administrar jugadores y equipos
              </p>
            </div>
          </Link>

          <Link to="/admin/partidos" className="admin-card">
            <div className="admin-card-icon">
              ⚽
            </div>

            <div>
              <h2>Partidos</h2>
              <p>
                Programar y administrar partidos
              </p>
            </div>
          </Link>

          <Link to="/admin/goleadores" className="admin-card">
            <div className="admin-card-icon">
              🥅
            </div>

            <div>
              <h2>Goleadores</h2>
              <p>
                Registrar goles y estadísticas
              </p>
            </div>
          </Link>

        </div>

      </main>

    </div>
  )
}

export default Admin
