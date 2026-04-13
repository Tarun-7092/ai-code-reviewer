import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import styles from "./Layout.module.css";

const NAV = [
  { to: "/dashboard", icon: "▦", label: "Dashboard" },
  { to: "/review",    icon: "◈", label: "New Review" },
  { to: "/history",   icon: "≡", label: "History" },
  { to: "/profile",   icon: "◎", label: "Profile" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <span className={styles.logoMark}>CS</span>
          <span className={styles.logoText}>CodeScan</span>
        </div>

        <div className={styles.sysInfo}>
          <div className={styles.sysLine}><span>USER</span><span>{user?.name?.split(" ")[0]}</span></div>
          <div className={styles.sysLine}><span>REVIEWS</span><span>{user?.reviewCount ?? 0}</span></div>
          <div className={styles.statusDot} />
        </div>

        <nav className={styles.nav}>
          {NAV.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ""}`}
            >
              <span className={styles.navIcon}>{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <button className={styles.logoutBtn} onClick={handleLogout}>
          <span>⏻</span> Logout
        </button>
      </aside>

      <main className={styles.main}>
        <div className={styles.topbar}>
          <div className={styles.breadcrumb}>
            <span className={styles.prompt}>~/codescan</span>
            <span className={styles.cursor}>█</span>
          </div>
          <div className={styles.topbarRight}>
            <span className={styles.badge}>GROQ · llama-3.1-8b-instant</span>
          </div>
        </div>
        <div className={styles.content}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
