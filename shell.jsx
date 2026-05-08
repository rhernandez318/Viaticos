// Viáticos — Shell components: sidebar, topbar, role switcher

const NAV = {
  usuario: [
    { id: "dash",      label: "Mi resumen",         icon: "dashboard" },
    { id: "anticipos", label: "Mis anticipos",      icon: "wallet" },
    { id: "comprobaciones", label: "Comprobaciones", icon: "receipt" },
    { id: "reembolsos", label: "Reembolsos",        icon: "refund" },
  ],
  gerente: [
    { id: "bandeja",         label: "Por aprobar",       icon: "inbox", badge: 7 },
    { id: "equipo",          label: "Mi equipo",         icon: "users" },
    { id: "historial",       label: "Historial",         icon: "history" },
    { id: "reportes",        label: "Reportes",          icon: "chart" },
    { id: "__sep_gerente",   label: "─── Mis solicitudes", icon: "sparkle", sep: true },
    { id: "mis-solicitudes", label: "Mi resumen",        icon: "dashboard" },
    { id: "anticipos",       label: "Solicitar anticipo", icon: "wallet" },
    { id: "reembolsos",      label: "Reembolso",         icon: "refund" },
    { id: "comprobaciones",  label: "Comprobaciones",    icon: "receipt" },
  ],
  tesoreria: [
    { id: "liberacion", label: "Por liberar",       icon: "cash", badge: 4 },
    { id: "pagados",   label: "Pagados",            icon: "check" },
    { id: "deudores",  label: "Deudores",           icon: "flag" },
    { id: "reportes",  label: "Reportes",           icon: "chart" },
  ],
  admin: [
    { id: "usuarios",  label: "Usuarios",           icon: "users" },
    { id: "centros",   label: "Centros de beneficio", icon: "home" },
    { id: "catalogo",  label: "Catálogo de gastos", icon: "book" },
    { id: "reportes",  label: "Reportes",           icon: "chart" },
    { id: "ajustes",   label: "Ajustes",            icon: "settings" },
  ],
};

const ROLE_LABELS = {
  usuario: "Usuario",
  gerente: "Gerente",
  tesoreria: "Tesorería",
  admin: "Admin",
};

const ROLE_USERS = {
  usuario: "U001",
  gerente: "U101",
  tesoreria: "T001",
  admin: "A001",
};

function Sidebar({ role, page, setPage, onLogout }) {
  const items = NAV[role];
  const userId = ROLE_USERS[role];
  const u = window.findUser(userId);
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">V</div>
        <div>
          <div className="brand-name">Viáticos</div>
          <div className="brand-sub">Control de gastos</div>
        </div>
      </div>

      <div className="nav-section">{ROLE_LABELS[role]}</div>
      {items.map(it => {
        if (it.sep) return (
          <div key={it.id} className="nav-section" style={{marginTop:8, opacity:0.5, fontSize:9}}>Mis solicitudes</div>
        );
        return (
          <div key={it.id}
               className={`nav-item ${page === it.id ? "active" : ""}`}
               onClick={() => setPage(it.id)}>
            <Icon name={it.icon} />
            <span>{it.label}</span>
            {it.badge ? <span className="badge-num">{it.badge}</span> : null}
          </div>
        );
      })}

      <div className="nav-section">General</div>
      <div className={`nav-item ${page === "perfil" ? "active" : ""}`} onClick={() => setPage("perfil")}>
        <Icon name="settings" />
        <span>Mi perfil</span>
      </div>

      <div className="user-card">
        <div className="avatar">{u.iniciales}</div>
        <div style={{flex: 1, minWidth: 0}}>
          <div className="user-card-name" style={{whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{u.nombre}</div>
          <div className="user-card-role">{ROLE_LABELS[role]}</div>
        </div>
        <div className="icon-btn" title="Cerrar sesión" onClick={onLogout} style={{cursor:"pointer"}}><Icon name="logout" size={14} /></div>
      </div>
    </aside>
  );
}

function Topbar({ role, setRole, crumbs, onNew, isAdmin }) {
  return (
    <div className="topbar">
      <div className="crumbs">
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="sep">/</span>}
            {i === crumbs.length - 1 ? <strong>{c}</strong> : <span>{c}</span>}
          </React.Fragment>
        ))}
      </div>
      <div className="topbar-right">
        <div className="search">
          <Icon name="search" size={14} />
          <input placeholder="Buscar folio, usuario, RFC…" />
          <span className="kbd">⌘K</span>
        </div>
        {/* Selector de rol solo visible para admin */}
        {isAdmin && (
          <div className="segmented" title="Ver como rol">
            {Object.keys(ROLE_LABELS).map(r => (
              <button key={r} className={role === r ? "on" : ""} onClick={() => setRole(r)}>
                {ROLE_LABELS[r]}
              </button>
            ))}
          </div>
        )}
        <div className="icon-btn" title="Notificaciones"><Icon name="bell" size={15} /></div>
        {onNew && <button className="btn primary" onClick={onNew}><Icon name="plus" size={14}/> Nueva solicitud</button>}
      </div>
    </div>
  );
}

// Stepper component: status flow
function Stepper({ status, dates }) {
  const steps = [
    { key: "solicitado", label: "Solicitado" },
    { key: "autorizado", label: "Autorizado" },
    { key: "liberado", label: "Liberado" },
    { key: "comprobado", label: "Comprobado" },
  ];
  if (status === "rechazado") {
    return (
      <div className="stepper">
        <div className="step done"><div className="dot">1</div><div className="label">Solicitado</div></div>
        <div className="step rejected"><div className="dot">✕</div><div className="label">Rechazado</div></div>
      </div>
    );
  }
  const order = { solicitado: 0, autorizado: 1, liberado: 2, comprobado: 3, parcial: 2 };
  const cur = order[status] ?? 0;
  return (
    <div className="stepper">
      {steps.map((s, i) => {
        const cls = i < cur ? "done" : (i === cur ? "active" : "");
        return (
          <div key={s.key} className={`step ${cls}`}>
            <div className="dot">{i < cur ? "✓" : i + 1}</div>
            <div className="label">{s.label}</div>
            {dates && dates[s.key] && <div className="meta">{window.fmtFecha(dates[s.key])}</div>}
          </div>
        );
      })}
    </div>
  );
}

// Status badge
function StatusBadge({ status }) {
  const map = {
    solicitado: "Solicitado",
    autorizado: "Autorizado",
    liberado: "Liberado",
    comprobado: "Comprobado",
    rechazado: "Rechazado",
    parcial: "Parcial",
  };
  return <span className={`badge ${status}`}><span className="dot"></span>{map[status] || status}</span>;
}

function TipoBadge({ tipo }) {
  const map = { anticipo: "ANT", comprobacion: "CMP", reembolso: "REE" };
  return <span className="badge tipo">{map[tipo] || tipo}</span>;
}

// Sparkline
function Spark({ values, color = "var(--accent)" }) {
  const w = 80, h = 36;
  const max = Math.max(...values), min = Math.min(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg className="spark" width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" points={pts} />
    </svg>
  );
}

Object.assign(window, { Sidebar, Topbar, Stepper, StatusBadge, TipoBadge, Spark, NAV, ROLE_LABELS, ROLE_USERS });
