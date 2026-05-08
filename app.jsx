// Viáticos — Main app + tweaks integration

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "lime",
  "density": "comfortable",
  "theme": "dark",
  "role": "usuario",
  "showAdvanced": true
}/*EDITMODE-END*/;

// ── Modo desarrollo — cambiar a false antes de producción ───────────────────
const DEV_MODE = true;  // true = TweaksPanel visible para todos, false = solo admin

const ACCENTS = {
  lime:    { v: "oklch(0.85 0.18 130)", v2: "oklch(0.78 0.18 130)", soft: "oklch(0.85 0.18 130 / 0.14)", fg: "#0a0b0f" },
  cyan:    { v: "oklch(0.82 0.14 215)", v2: "oklch(0.75 0.14 215)", soft: "oklch(0.82 0.14 215 / 0.14)", fg: "#0a0b0f" },
  magenta: { v: "oklch(0.74 0.21 340)", v2: "oklch(0.68 0.21 340)", soft: "oklch(0.74 0.21 340 / 0.14)", fg: "#ffffff" },
  amber:   { v: "oklch(0.83 0.16 70)",  v2: "oklch(0.76 0.16 70)",  soft: "oklch(0.83 0.16 70 / 0.14)",  fg: "#0a0b0f" },
};

function applyTokens(t) {
  const root = document.documentElement;
  const a = ACCENTS[t.accent] || ACCENTS.lime;
  root.style.setProperty("--accent", a.v);
  root.style.setProperty("--accent-2", a.v2);
  root.style.setProperty("--accent-soft", a.soft);
  root.style.setProperty("--accent-fg", a.fg);
  root.dataset.density = t.density;
  root.dataset.theme = t.theme;
}

// Página por defecto para cada rol
const DEFAULT_PAGE = {
  usuario:  "dash",
  gerente:  "bandeja",
  tesoreria:"liberacion",
  admin:    "usuarios",
};

// Páginas válidas por rol — cualquier página fuera de esta lista
// cae al default en lugar de renderizar null (pantalla negra)
const VALID_PAGES = {
  usuario:  ["dash","anticipos","comprobaciones","reembolsos","perfil"],
  gerente:  ["bandeja","equipo","historial","reportes","perfil","mis-solicitudes","anticipos","reembolsos","comprobaciones"],
  tesoreria:["liberacion","pagados","deudores","reportes","perfil"],
  admin:    ["usuarios","centros","catalogo","reportes","ajustes","perfil"],
};

function resolveContent(role, page, userId, setDetailId, setPage, onLogout) {
  // Perfil — disponible para todos
  if (page === "perfil") return <window.PerfilPage userId={userId} onLogout={onLogout}/>;

  if (role === "usuario") {
    if (page === "dash")           return <UserDashboard userId={userId} openDetail={setDetailId} setPage={setPage}/>;
    if (page === "anticipos")      return <SolicitarAnticipo setPage={setPage}/>;
    if (page === "comprobaciones") return <NuevaComprobacion setPage={setPage}/>;
    if (page === "reembolsos")     return <Reembolsos userId={userId}/>;
    // fallback
    return <UserDashboard userId={userId} openDetail={setDetailId} setPage={setPage}/>;
  }

  if (role === "gerente") {
    if (page === "bandeja")          return <GerenteBandeja openDetail={setDetailId}/>;
    if (page === "reportes")         return <Reportes/>;
    if (page === "equipo")           return <GerenteEquipo/>;
    if (page === "historial")        return <GerenteHistorial openDetail={setDetailId}/>;
    if (page === "mis-solicitudes")  return <UserDashboard userId={userId} openDetail={setDetailId} setPage={setPage}/>;
    if (page === "anticipos")        return <SolicitarAnticipo setPage={setPage}/>;
    if (page === "reembolsos")       return <Reembolsos userId={userId}/>;
    if (page === "comprobaciones")   return <NuevaComprobacion setPage={setPage} userId={userId}/>;
    return <GerenteBandeja openDetail={setDetailId}/>;
  }

  if (role === "tesoreria") {
    if (page === "liberacion") return <TesoreriaBandeja openDetail={setDetailId}/>;
    if (page === "pagados")    return <TesoreriaPagados openDetail={setDetailId}/>;
    if (page === "deudores")   return <Reportes/>;
    if (page === "reportes")   return <Reportes/>;
    return <TesoreriaBandeja openDetail={setDetailId}/>;
  }

  if (role === "admin") {
    if (page === "usuarios")  return <AdminUsuarios/>;
    if (page === "centros")   return <AdminCentros/>;
    if (page === "catalogo")  return <AdminCatalogo/>;
    if (page === "reportes")  return <Reportes/>;
    if (page === "ajustes")   return <AdminAjustes/>;
    return <AdminUsuarios/>;
  }

  return null;
}

// ── Páginas stub para rutas que antes no tenían contenido ─────────────────
function GerenteEquipo() {
  const gerenteId = "U101";
  const equipo = window.USUARIOS.filter(u => u.gerente === gerenteId);
  return (
    <>
      <div className="page-head">
        <div><h1 className="page-title">Mi equipo</h1>
          <div className="page-sub">{equipo.length} colaboradores a tu cargo</div>
        </div>
      </div>
      <div className="card" style={{padding:0}}>
        <table className="t">
          <thead><tr><th>Colaborador</th><th>Centro</th><th>Correo</th><th className="right">Anticipos abiertos</th><th className="right">Saldo pendiente</th></tr></thead>
          <tbody>
            {equipo.map(u => {
              const c = window.findCentro(u.centro);
              const abiertos = window.SOLICITUDES.filter(s => s.usuario===u.id && s.tipo==="anticipo" && s.saldoPendiente>0);
              const saldo = abiertos.reduce((a,s)=>a+s.saldoPendiente,0);
              return (
                <tr key={u.id}>
                  <td><div className="row"><div className="avatar sm">{u.iniciales}</div><div><div style={{fontSize:13}}>{u.nombre}</div><div className="muted mono" style={{fontSize:11}}>{u.id}</div></div></div></td>
                  <td className="muted">{c?c.nombre:u.centro}</td>
                  <td className="muted mono" style={{fontSize:12}}>{u.correo}</td>
                  <td className="num">{abiertos.length}</td>
                  <td className="num" style={{color:saldo>0?"var(--warn)":"var(--text-3)"}}>{window.fmtMXN(saldo)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function GerenteHistorial({ openDetail }) {
  const gerenteId = "U101";
  const teamIds = window.USUARIOS.filter(u => u.gerente===gerenteId).map(u=>u.id);
  const [filtro, setFiltro] = React.useState("todas");
  const all = window.SOLICITUDES.filter(s => teamIds.includes(s.usuario));
  const filtradas = filtro==="todas" ? all : all.filter(s=>s.status===filtro);
  return (
    <>
      <div className="page-head">
        <div><h1 className="page-title">Historial</h1>
          <div className="page-sub">Todas las solicitudes de tu equipo</div>
        </div>
      </div>
      <div className="filterbar">
        {[["todas","Todas"],["solicitado","Solicitadas"],["autorizado","Autorizadas"],["liberado","Liberadas"],["rechazado","Rechazadas"],["comprobado","Comprobadas"]].map(([k,l])=>(
          <div key={k} className={`chip ${filtro===k?"active":""}`} onClick={()=>setFiltro(k)}>
            {l} <span className="count">{k==="todas"?all.length:all.filter(s=>s.status===k).length}</span>
          </div>
        ))}
      </div>
      <div className="card" style={{padding:0}}>
        <table className="t">
          <thead><tr><th></th><th>Folio</th><th>Solicitante</th><th>Concepto</th><th>Fecha</th><th className="right">Monto</th><th>Status</th></tr></thead>
          <tbody>
            {filtradas.length===0
              ? <tr><td colSpan={7} style={{textAlign:"center",padding:"24px",color:"var(--text-3)"}}>Sin solicitudes en esta categoría</td></tr>
              : filtradas.map(s=>{
                const u=window.findUser(s.usuario);
                return (
                  <tr key={s.id} onClick={()=>openDetail(s.id)} style={{cursor:"pointer"}}>
                    <td><TipoBadge tipo={s.tipo}/></td>
                    <td className="id-cell">{s.id}</td>
                    <td><div className="row"><div className="avatar sm">{u.iniciales}</div><span style={{fontSize:13}}>{u.nombre}</span></div></td>
                    <td>{s.concepto}</td>
                    <td className="muted mono" style={{fontSize:12}}>{window.fmtFecha(s.fecha)}</td>
                    <td className="num">{window.fmtMXN(s.monto)}</td>
                    <td><StatusBadge status={s.status}/></td>
                  </tr>
                );
              })
            }
          </tbody>
        </table>
      </div>
    </>
  );
}

function TesoreriaPagados({ openDetail }) {
  const pagados = window.SOLICITUDES.filter(s => s.status==="liberado");
  const [busqueda, setBusqueda] = React.useState("");
  const filtrados = pagados.filter(s => {
    if (!busqueda.trim()) return true;
    const q=busqueda.toLowerCase();
    const u=window.findUser(s.usuario);
    return s.id.toLowerCase().includes(q)||u.nombre.toLowerCase().includes(q)||s.concepto.toLowerCase().includes(q);
  });
  const exportar = () => {
    const rows=[["Folio","Tipo","Beneficiario","Concepto","Fecha","Monto"]];
    filtrados.forEach(s=>{const u=window.findUser(s.usuario);rows.push([s.id,s.tipo,u.nombre,s.concepto,window.fmtFecha(s.fecha),s.monto]);});
    const csv=rows.map(r=>r.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(',')).join('\n');
    const a=document.createElement("a");a.href="data:text/csv;charset=utf-8,"+encodeURIComponent(csv);
    a.download=`pagados_${new Date().toISOString().slice(0,10)}.csv`;a.click();
  };
  return (
    <>
      <div className="page-head">
        <div><h1 className="page-title">Pagados</h1>
          <div className="page-sub">Solicitudes liberadas · {pagados.length} registros · {window.fmtMXN(pagados.reduce((a,s)=>a+s.monto,0))}</div>
        </div>
        <button className="btn" onClick={exportar}><Icon name="download" size={13}/> Exportar</button>
      </div>
      <div className="card" style={{padding:0}}>
        <div style={{padding:"12px 16px 0",display:"flex",gap:10}}>
          <div className="search" style={{width:260}}>
            <Icon name="search" size={14}/>
            <input placeholder="Buscar folio, nombre…" value={busqueda} onChange={e=>setBusqueda(e.target.value)}/>
          </div>
        </div>
        <table className="t">
          <thead><tr><th></th><th>Folio</th><th>Beneficiario</th><th>Concepto</th><th>Fecha</th><th className="right">Monto</th></tr></thead>
          <tbody>
            {filtrados.length===0
              ? <tr><td colSpan={6} style={{textAlign:"center",padding:"24px",color:"var(--text-3)"}}>Sin resultados</td></tr>
              : filtrados.map(s=>{
                const u=window.findUser(s.usuario);
                return (
                  <tr key={s.id} onClick={()=>openDetail(s.id)} style={{cursor:"pointer"}}>
                    <td><TipoBadge tipo={s.tipo}/></td>
                    <td className="id-cell">{s.id}</td>
                    <td><div className="row"><div className="avatar sm">{u.iniciales}</div><span style={{fontSize:13}}>{u.nombre}</span></div></td>
                    <td className="muted">{s.concepto}</td>
                    <td className="muted mono" style={{fontSize:12}}>{window.fmtFecha(s.fecha)}</td>
                    <td className="num">{window.fmtMXN(s.monto)}</td>
                  </tr>
                );
              })
            }
          </tbody>
        </table>
      </div>
    </>
  );
}

function AdminAjustes() {
  return (
    <>
      <div className="page-head">
        <div><h1 className="page-title">Ajustes</h1>
          <div className="page-sub">Configuración general del sistema</div>
        </div>
      </div>
      <div className="two-col">
        <div className="card">
          <h3 className="card-title" style={{marginBottom:16}}>Políticas de viáticos</h3>
          <div className="form-grid cols-2">
            <div className="field"><label>Hospedaje máximo por noche</label><input className="input mono" defaultValue="$2,800.00"/></div>
            <div className="field"><label>Comidas máximo por día</label><input className="input mono" defaultValue="$450.00"/></div>
            <div className="field"><label>Días máx. para comprobar</label><input className="input mono" defaultValue="10"/></div>
            <div className="field"><label>Monto para aprobación doble</label><input className="input mono" defaultValue="$20,000.00"/></div>
          </div>
          <div style={{marginTop:18,display:"flex",justifyContent:"flex-end",gap:8}}>
            <button className="btn ghost">Cancelar</button>
            <button className="btn primary">Guardar cambios</button>
          </div>
        </div>
        <div className="card">
          <h3 className="card-title" style={{marginBottom:16}}>Notificaciones del sistema</h3>
          <div className="spread" style={{padding:"8px 0"}}><span style={{fontSize:13}}>Alertar gerente cuando solicitud &gt;48 h sin respuesta</span><input type="checkbox" defaultChecked/></div>
          <div className="spread" style={{padding:"8px 0"}}><span style={{fontSize:13}}>Recordatorio comprobación a 10 días</span><input type="checkbox" defaultChecked/></div>
          <div className="spread" style={{padding:"8px 0"}}><span style={{fontSize:13}}>Reporte semanal a tesorería</span><input type="checkbox" defaultChecked/></div>
          <div className="spread" style={{padding:"8px 0"}}><span style={{fontSize:13}}>Alerta saldo pendiente &gt;60 días</span><input type="checkbox" defaultChecked/></div>
        </div>
      </div>
    </>
  );
}

// ── Pantalla de Login ────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [correo, setCorreo]   = React.useState("");
  const [pwd, setPwd]         = React.useState("");
  const [error, setError]     = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [showPwd, setShowPwd] = React.useState(false);
  const [screen, setScreen]   = React.useState("login"); // "login" | "recovery" | "token" | "newpwd"
  const [recCorreo, setRecCorreo] = React.useState("");
  const [recToken, setRecToken]   = React.useState("");
  const [recPwd, setRecPwd]       = React.useState("");
  const [recPwd2, setRecPwd2]     = React.useState("");
  const [recMsg, setRecMsg]       = React.useState("");
  const [sentToken, setSentToken] = React.useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    setError("");
    if (!correo.trim() || !pwd) { setError("Ingresa tu correo y contraseña"); return; }
    setLoading(true);
    setTimeout(() => {
      const user = window.checkPassword(correo.trim(), pwd);
      if (user) {
        onLogin(user);
      } else {
        setError("Correo o contraseña incorrectos");
        setLoading(false);
      }
    }, 600);
  };

  const handleSendToken = (e) => {
    e.preventDefault();
    setRecMsg("");
    const u = window.findUserByEmail(recCorreo.trim());
    if (!u) { setRecMsg("No encontramos una cuenta con ese correo"); return; }
    const token = window.generateToken(recCorreo.trim());
    setSentToken(token);
    // En producción se enviaría por email — aquí lo mostramos en pantalla
    setRecMsg("TOKEN_SENT:" + token);
    setScreen("token");
  };

  const handleVerifyToken = (e) => {
    e.preventDefault();
    if (window.verifyToken(recCorreo.trim(), recToken.trim())) {
      setScreen("newpwd");
      setRecMsg("");
    } else {
      setRecMsg("Código incorrecto o expirado");
    }
  };

  const handleNewPwd = (e) => {
    e.preventDefault();
    if (recPwd.length < 4) { setRecMsg("La contraseña debe tener al menos 4 caracteres"); return; }
    if (recPwd !== recPwd2) { setRecMsg("Las contraseñas no coinciden"); return; }
    const u = window.findUserByEmail(recCorreo.trim());
    if (u) { u.password = recPwd; }
    delete window.AUTH_TOKENS[recCorreo.trim()];
    setRecMsg("ok");
    setTimeout(() => { setScreen("login"); setRecMsg(""); setRecCorreo(""); setRecToken(""); setRecPwd(""); setRecPwd2(""); }, 1800);
  };

  const cardStyle = {
    width: 400, background: "var(--color-bg, var(--surface-1, #18191c))",
    border: "1px solid var(--border)", borderRadius: 16, padding: "36px 40px",
    boxShadow: "0 24px 64px rgba(0,0,0,.45)"
  };
  const inputStyle = {
    width:"100%", padding:"10px 12px", fontSize:14,
    border:"1px solid var(--border)", borderRadius:8,
    background:"var(--surface-2,rgba(255,255,255,.06))", color:"var(--text)",
    fontFamily:"inherit", outline:"none", boxSizing:"border-box"
  };
  const btnStyle = {
    width:"100%", padding:"11px", fontSize:14, fontWeight:600, cursor:"pointer",
    border:"none", borderRadius:8, background:"var(--accent)", color:"var(--accent-fg,#0a0b0f)",
    fontFamily:"inherit", marginTop:4
  };
  const linkStyle = {
    background:"none", border:"none", color:"var(--accent)", fontSize:12,
    cursor:"pointer", fontFamily:"inherit", padding:0, textDecoration:"underline"
  };

  const wrapStyle = {
    position:"fixed", inset:0, display:"flex", alignItems:"center", justifyContent:"center",
    background:"var(--surface-0,#111214)", zIndex:500
  };

  if (screen === "recovery" || screen === "token" || screen === "newpwd") {
    return (
      <div style={wrapStyle}>
        <div style={cardStyle}>
          <div style={{marginBottom:28}}>
            <div style={{fontSize:11,fontWeight:600,letterSpacing:"0.12em",textTransform:"uppercase",color:"var(--accent)",marginBottom:6}}>Viáticos</div>
            <h1 style={{fontSize:22,fontWeight:700,margin:"0 0 4px",letterSpacing:"-0.02em"}}>
              {screen==="recovery" ? "Recuperar contraseña" : screen==="token" ? "Verificar código" : "Nueva contraseña"}
            </h1>
            <p style={{fontSize:13,color:"var(--text-2,rgba(255,255,255,.5))",margin:0}}>
              {screen==="recovery" && "Ingresa tu correo para recibir un código"}
              {screen==="token" && `Código enviado a ${recCorreo}`}
              {screen==="newpwd" && "Crea tu nueva contraseña"}
            </p>
          </div>

          {screen === "recovery" && (
            <form onSubmit={handleSendToken} style={{display:"flex",flexDirection:"column",gap:14}}>
              <input style={inputStyle} type="email" placeholder="tu@correo.com"
                value={recCorreo} onChange={e=>setRecCorreo(e.target.value)} autoFocus/>
              {recMsg && !recMsg.startsWith("TOKEN_SENT") && (
                <div style={{fontSize:12,color:"var(--danger,#e24b4a)"}}>{recMsg}</div>
              )}
              <button style={btnStyle} type="submit">Enviar código de recuperación</button>
            </form>
          )}

          {screen === "token" && (
            <form onSubmit={handleVerifyToken} style={{display:"flex",flexDirection:"column",gap:14}}>
              {/* Simulación: mostramos el token en pantalla */}
              <div style={{padding:"10px 14px",background:"rgba(255,255,255,.07)",borderRadius:8,fontSize:13}}>
                <div style={{fontSize:11,opacity:.6,marginBottom:4}}>Código de recuperación (demo — en prod llega por email):</div>
                <div style={{fontFamily:"monospace",fontSize:22,fontWeight:700,letterSpacing:"0.15em",color:"var(--accent)"}}>{sentToken}</div>
              </div>
              <input style={{...inputStyle,fontFamily:"monospace",letterSpacing:"0.15em",textAlign:"center",fontSize:18}}
                placeholder="XXXXXXXX" maxLength={8}
                value={recToken} onChange={e=>setRecToken(e.target.value.toUpperCase())} autoFocus/>
              {recMsg && <div style={{fontSize:12,color:"var(--danger,#e24b4a)"}}>{recMsg}</div>}
              <button style={btnStyle} type="submit">Verificar código</button>
            </form>
          )}

          {screen === "newpwd" && (
            <form onSubmit={handleNewPwd} style={{display:"flex",flexDirection:"column",gap:14}}>
              <input style={inputStyle} type="password" placeholder="Nueva contraseña (mín. 4 caracteres)"
                value={recPwd} onChange={e=>setRecPwd(e.target.value)} autoFocus/>
              <input style={inputStyle} type="password" placeholder="Confirmar contraseña"
                value={recPwd2} onChange={e=>setRecPwd2(e.target.value)}/>
              {recMsg === "ok"
                ? <div style={{fontSize:13,color:"var(--success,#1d9e75)",fontWeight:500}}>✓ Contraseña actualizada. Iniciando sesión…</div>
                : recMsg && <div style={{fontSize:12,color:"var(--danger,#e24b4a)"}}>{recMsg}</div>
              }
              <button style={btnStyle} type="submit">Guardar contraseña</button>
            </form>
          )}

          <div style={{marginTop:20,textAlign:"center"}}>
            <button style={linkStyle} onClick={()=>{setScreen("login");setRecMsg("");}}>← Volver al inicio de sesión</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={wrapStyle}>
      <div style={cardStyle}>
        <div style={{marginBottom:32}}>
          <div style={{fontSize:11,fontWeight:600,letterSpacing:"0.12em",textTransform:"uppercase",color:"var(--accent)",marginBottom:8}}>Casa Zapata</div>
          <h1 style={{fontSize:26,fontWeight:700,margin:"0 0 6px",letterSpacing:"-0.03em"}}>Viáticos</h1>
          <p style={{fontSize:13,color:"var(--text-2,rgba(255,255,255,.5))",margin:0}}>Control de gastos de viaje</p>
        </div>

        <form onSubmit={handleLogin} style={{display:"flex",flexDirection:"column",gap:16}}>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            <label style={{fontSize:12,fontWeight:500,color:"var(--text-2,rgba(255,255,255,.6))"}}>Correo electrónico</label>
            <input style={inputStyle} type="email" placeholder="tu@casazapata.mx"
              value={correo} onChange={e=>{setCorreo(e.target.value);setError("");}}
              autoComplete="email" autoFocus/>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
              <label style={{fontSize:12,fontWeight:500,color:"var(--text-2,rgba(255,255,255,.6))"}}>Contraseña</label>
              <button type="button" style={linkStyle}
                onClick={()=>{setScreen("recovery");setRecCorreo(correo);}}>
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            <div style={{position:"relative"}}>
              <input style={{...inputStyle,paddingRight:40}}
                type={showPwd?"text":"password"} placeholder="••••••••"
                value={pwd} onChange={e=>{setPwd(e.target.value);setError("");}}
                autoComplete="current-password"/>
              <button type="button"
                onClick={()=>setShowPwd(v=>!v)}
                style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",
                  background:"none",border:"none",color:"var(--text-3,rgba(255,255,255,.35))",cursor:"pointer",padding:4}}>
                <Icon name={showPwd?"eye":"eye"} size={15}/>
              </button>
            </div>
          </div>

          {error && (
            <div style={{padding:"8px 12px",background:"rgba(226,75,74,.12)",border:"1px solid rgba(226,75,74,.4)",
              borderRadius:8,fontSize:13,color:"#e24b4a"}}>
              {error}
            </div>
          )}

          <button style={{...btnStyle,opacity:loading?0.7:1}} type="submit" disabled={loading}>
            {loading ? "Verificando…" : "Iniciar sesión"}
          </button>
        </form>

        <div style={{marginTop:24,padding:"14px 0 0",borderTop:"1px solid var(--border)",
          fontSize:11,color:"var(--text-3,rgba(255,255,255,.3))",textAlign:"center"}}>
          Contraseña inicial: <span style={{fontFamily:"monospace",color:"var(--text-2,rgba(255,255,255,.5))"}}>1234</span>
        </div>
      </div>
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────────
function App() {
  const [t, setTweak]       = window.useTweaks(TWEAK_DEFAULTS);
  const [detailId, setDetailId] = React.useState(null);
  const [session, setSession]   = React.useState(null); // { user } | null

  const [page, setPage] = React.useState(() => DEFAULT_PAGE[TWEAK_DEFAULTS.role] || "dash");

  React.useEffect(() => { applyTokens(t); }, [t]);

  // ── Login / logout ────────────────────────────────────────────────────────
  const handleLogin = (user) => {
    // Map role from user data to tweak role key
    const roleMap = { usuario:"usuario", gerente:"gerente", tesoreria:"tesoreria", admin:"admin" };
    const role = roleMap[user.rol] || "usuario";
    setSession({ user });
    setPage(DEFAULT_PAGE[role] || "dash");
    setTweak("role", role);
  };

  const handleLogout = () => {
    setSession(null);
    setPage("dash");
  };

  if (!session) {
    return <LoginScreen onLogin={handleLogin}/>;
  }

  // Rol SIEMPRE viene del usuario logueado — no se puede cambiar desde la UI
  const role   = session.user.rol;   // "usuario" | "gerente" | "tesoreria" | "admin"
  const userId = session.user.id;
  const isAdmin = role === "admin";
  const isMobileUserView = role === "usuario" && t.density === "mobile";

  const validPages = VALID_PAGES[role] || [];
  const activePage = validPages.includes(page) ? page : DEFAULT_PAGE[role];

  const PAGE_LABELS = {
    dash:"Mi resumen", anticipos:"Mis anticipos", comprobaciones:"Comprobaciones", reembolsos:"Reembolsos",
    bandeja:"Por aprobar", equipo:"Mi equipo", historial:"Historial", reportes:"Reportes",
    liberacion:"Por liberar", pagados:"Pagados", deudores:"Deudores",
    usuarios:"Usuarios", centros:"Centros de beneficio", catalogo:"Catálogo de gastos", ajustes:"Ajustes",
    perfil:"Mi perfil",
  };
  const crumbs = ["Viáticos", window.ROLE_LABELS[role], PAGE_LABELS[activePage] || activePage];

  // Solo admin puede cambiar de perspectiva (para soporte / supervisión)
  const handleSetRole = (r) => {
    if (!isAdmin && !DEV_MODE) return;
    setPage(DEFAULT_PAGE[r] || "dash");
    setTweak("role", r);
  };

  // Admin puede operar como cualquier rol; los demás usan su rol fijo
  const activeRole = (isAdmin || DEV_MODE) ? (t.role || role) : role;

  const content = resolveContent(activeRole, activePage, userId, setDetailId, setPage, handleLogout);

  return (
    <>
      {isMobileUserView ? (
        <MobileApp userId={userId} onLogout={handleLogout}/>
      ) : (
        <div className="app">
          <Sidebar role={activeRole} page={activePage} setPage={setPage} onLogout={handleLogout}/>
          <div className="main">
            <Topbar role={activeRole} setRole={handleSetRole} crumbs={crumbs} isAdmin={isAdmin || DEV_MODE}
              onNew={activeRole === "usuario" ? () => setPage("anticipos") : null}/>
            <div className="content">{content}</div>
          </div>
        </div>
      )}

      {detailId && <DetalleModal id={detailId} onClose={() => setDetailId(null)}/>}

      {/* TweaksPanel: siempre en DEV_MODE, solo admin en producción */}
      {(isAdmin || DEV_MODE) && (
        <window.TweaksPanel title="Tweaks · Admin">
          <window.TweakSection title="Apariencia">
            <window.TweakRadio label="Tema" value={t.theme} onChange={v=>setTweak("theme",v)}
              options={[{value:"dark",label:"Oscuro"},{value:"light",label:"Claro"}]}/>
            <window.TweakColor label="Color primario" value={t.accent} onChange={v=>setTweak("accent",v)}
              options={[{value:"lime",color:"#c5f24d"},{value:"cyan",color:"#5ec8e6"},{value:"magenta",color:"#e858a6"},{value:"amber",color:"#f3b95a"}]}/>
            <window.TweakSelect label="Densidad" value={t.density} onChange={v=>setTweak("density",v)}
              options={[{value:"comfortable",label:"Cómoda"},{value:"compact",label:"Compacta"}]}/>
          </window.TweakSection>
          <window.TweakSection title="Ver como rol">
            <window.TweakSelect label="Perspectiva" value={t.role||role} onChange={handleSetRole}
              options={[{value:"usuario",label:"Usuario"},{value:"gerente",label:"Gerente"},
                {value:"tesoreria",label:"Tesorería"},{value:"admin",label:"Admin"}]}/>
          </window.TweakSection>
          <window.TweakSection title="Reportes">
            <window.TweakToggle label="Reportes avanzados" value={t.showAdvanced} onChange={v=>setTweak("showAdvanced",v)}/>
          </window.TweakSection>
        </window.TweaksPanel>
      )}
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App/>);
