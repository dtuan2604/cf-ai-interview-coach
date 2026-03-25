import { useEffect } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { appConfig } from '../../services/config'

const navItems = [
  { label: 'Overview', to: '/' },
  { label: 'Setup', to: '/setup' },
  { label: 'History', to: '/history' },
]

export function AppLayout() {
  useEffect(() => {
    document.title = appConfig.title
  }, [])

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Interview practice</p>
          <h1 className="brand">{appConfig.title}</h1>
        </div>
        <nav className="topnav" aria-label="Primary">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                isActive ? 'nav-link nav-link-active' : 'nav-link'
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="page-shell">
        <Outlet />
      </main>
    </div>
  )
}
