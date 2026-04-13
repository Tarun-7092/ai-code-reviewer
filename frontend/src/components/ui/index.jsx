import styles from "./ui.module.css";

export const Card = ({ children, className = "", style }) => (
  <div className={`${styles.card} ${className}`} style={style}>{children}</div>
);

export const CardHeader = ({ title, subtitle, action }) => (
  <div className={styles.cardHeader}>
    <div>
      <div className={styles.cardTitle}>{title}</div>
      {subtitle && <div className={styles.cardSubtitle}>{subtitle}</div>}
    </div>
    {action && <div>{action}</div>}
  </div>
);

export const Badge = ({ children, variant = "default" }) => (
  <span className={`${styles.badge} ${styles[`badge_${variant}`]}`}>{children}</span>
);

export const ScoreRing = ({ score, size = 80 }) => {
  const color = score >= 70 ? "var(--green)" : score >= 50 ? "var(--amber)" : "var(--red)";
  const grade = score >= 90 ? "A+" : score >= 80 ? "A" : score >= 70 ? "B" : score >= 60 ? "C" : score >= 50 ? "D" : "F";
  const r = (size / 2) - 6;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <div className={styles.scoreRing} style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} stroke="rgba(255,255,255,0.06)" strokeWidth="5" fill="none" />
        <circle
          cx={size/2} cy={size/2} r={r}
          stroke={color} strokeWidth="5" fill="none"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>
      <div className={styles.scoreLabel} style={{ color }}>
        <span className={styles.scoreNum}>{score}</span>
        <span className={styles.scoreGrade}>{grade}</span>
      </div>
    </div>
  );
};

export const Spinner = ({ size = 20 }) => (
  <div className={styles.spinner} style={{ width: size, height: size }} />
);

export const Input = ({ label, error, ...props }) => (
  <div className={styles.field}>
    {label && <label className={styles.label}>{label}</label>}
    <input className={`${styles.input} ${error ? styles.inputError : ""}`} {...props} />
    {error && <span className={styles.fieldError}>{error}</span>}
  </div>
);

export const Button = ({ children, variant = "primary", loading, icon, ...props }) => (
  <button
    className={`${styles.btn} ${styles[`btn_${variant}`]}`}
    disabled={loading || props.disabled}
    {...props}
  >
    {loading ? <Spinner size={14} /> : icon ? <span>{icon}</span> : null}
    {children}
  </button>
);

export const SeverityBadge = ({ severity }) => {
  const map = { critical: "red", warning: "amber", suggestion: "blue" };
  return <Badge variant={map[severity] || "default"}>{severity}</Badge>;
};

export const StatCard = ({ label, value, sub, accent }) => (
  <Card className={styles.statCard} style={accent ? { borderColor: accent, background: `${accent}08` } : {}}>
    <div className={styles.statValue} style={accent ? { color: accent } : {}}>{value}</div>
    <div className={styles.statLabel}>{label}</div>
    {sub && <div className={styles.statSub}>{sub}</div>}
  </Card>
);

export const Alert = ({ type = "info", children }) => (
  <div className={`${styles.alert} ${styles[`alert_${type}`]}`}>{children}</div>
);
