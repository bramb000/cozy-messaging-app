import styles from './Sidebar.module.css'
import NavItem from './NavItem'
import UserPanel from './UserPanel'
import OnlineCount from './OnlineCount'

export default function Sidebar() {
  return (
    <aside className={`sidebar ${styles.sidebar}`}>
      <div className="nav-logo">
        <span className="nav-logo-icon">🌾</span>
        <div className="nav-logo-text">
          Cozy<br />Corner
        </div>
      </div>

      <nav className="nav-items">
        <span className="nav-section-label">Rooms</span>
        <NavItem href="/chat" icon="💬" label="Chat Room" />
        <NavItem href="/voice" icon="🎙️" label="Voice Room" />
        <NavItem href="/world" icon="🗺️" label="World" />

        <span className="nav-section-label">You</span>
        <NavItem href="/profile" icon="🪴" label="My Profile" />
        <NavItem href="/avatar" icon="🎨" label="Customize Avatar" />
      </nav>

      <div className="nav-footer">
        <OnlineCount />
        <UserPanel />
      </div>
    </aside>
  )
}
