// Viáticos — Mobile (usuario en celular)

function MobileApp({ userId, onLogout }) {
  const [tab, setTab] = React.useState("home");
  const u = window.findUser(userId);
  const c = window.findCentro(u.centro);
  const mine = window.SOLICITUDES.filter(s => s.usuario === userId);
  const saldo = mine.filter(s => s.tipo === "anticipo" && s.saldoPendiente > 0).reduce((a,s)=>a+s.saldoPendiente, 0);

  return (
    <div className="phone-wrap">
      <div className="phone">
        <div className="phone-notch"></div>
        <div className="phone-status"><span>9:41</span><span>●●● ◐ 88%</span></div>
        <div className="phone-screen">
          {tab === "home" && (
            <div className="m-pad">
              <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14}}>
                <div>
                  <div style={{fontSize:11, color:"var(--text-3)", textTransform:"uppercase", letterSpacing:"0.06em"}}>Hola</div>
                  <div style={{fontFamily:"var(--f-display)", fontSize:20, fontWeight:600, letterSpacing:"-0.02em"}}>{u.nombre.split(" ")[0]}</div>
                </div>
                <div className="avatar lg">{u.iniciales}</div>
              </div>

              <div className="m-balance">
                <div className="m-balance-l">Saldo por comprobar</div>
                <div className="m-balance-v">{window.fmtMXN(saldo)}</div>
                <div style={{fontSize:11.5, opacity:0.7, marginTop:6}}>{c.nombre} · {c.id}</div>
              </div>

              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14}}>
                <div className="m-card" style={{textAlign:"center", margin:0}}>
                  <div style={{width:36,height:36,borderRadius:10,background:"var(--accent-soft)",margin:"0 auto 8px",display:"grid",placeItems:"center",color:"var(--accent)"}}><Icon name="plus" size={18}/></div>
                  <div style={{fontSize:12, fontWeight:500}}>Anticipo</div>
                </div>
                <div className="m-card" style={{textAlign:"center", margin:0}}>
                  <div style={{width:36,height:36,borderRadius:10,background:"var(--info-soft)",margin:"0 auto 8px",display:"grid",placeItems:"center",color:"var(--info)"}}><Icon name="receipt" size={18}/></div>
                  <div style={{fontSize:12, fontWeight:500}}>Comprobar</div>
                </div>
                <div className="m-card" style={{textAlign:"center", margin:0}}>
                  <div style={{width:36,height:36,borderRadius:10,background:"var(--warn-soft)",margin:"0 auto 8px",display:"grid",placeItems:"center",color:"var(--warn)"}}><Icon name="refund" size={18}/></div>
                  <div style={{fontSize:12, fontWeight:500}}>Reembolso</div>
                </div>
                <div className="m-card" style={{textAlign:"center", margin:0}}>
                  <div style={{width:36,height:36,borderRadius:10,background:"var(--success-soft)",margin:"0 auto 8px",display:"grid",placeItems:"center",color:"var(--success)"}}><Icon name="upload" size={18}/></div>
                  <div style={{fontSize:12, fontWeight:500}}>Subir XML</div>
                </div>
              </div>

              <div style={{fontSize:11, textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--text-3)", marginBottom:8, fontWeight:600}}>Activas</div>
              {mine.filter(s => s.status !== "comprobado" && s.status !== "rechazado").slice(0,4).map(s => (
                <div key={s.id} className="m-card">
                  <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6}}>
                    <div>
                      <div style={{fontSize:13, fontWeight:500}}>{s.concepto}</div>
                      <div className="mono muted" style={{fontSize:10.5, marginTop:2}}>{s.id}</div>
                    </div>
                    <StatusBadge status={s.status}/>
                  </div>
                  <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:10}}>
                    <span className="mono" style={{fontSize:14, fontWeight:600}}>{window.fmtMXN(s.monto)}</span>
                    <span className="muted mono" style={{fontSize:11}}>{window.fmtFecha(s.fecha)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "scan" && (
            <div className="m-pad">
              <h2 style={{fontFamily:"var(--f-display)", fontSize:22, fontWeight:600, letterSpacing:"-0.02em", marginTop:0}}>Subir factura</h2>
              <div className="dropzone" style={{padding:30}}>
                <div className="dropzone-icon"><Icon name="upload" size={20}/></div>
                <div className="dropzone-title">Toma foto o sube XML+PDF</div>
                <div className="dropzone-sub">Detectamos RFC, monto e IVA</div>
                <div style={{display:"flex", gap:8, justifyContent:"center", marginTop:14}}>
                  <button className="btn primary sm">📷 Cámara</button>
                  <button className="btn sm">Archivos</button>
                </div>
              </div>

              <div style={{marginTop:14}}>
                <div className="file-chip" style={{marginBottom:8}}>
                  <div className="icon-box">XML</div>
                  <div className="meta"><div className="name">factura_pemex.xml</div><div className="sz">UUID AA92-4F1B</div></div>
                  <Icon name="check" size={14} style={{color:"var(--success)"}}/>
                </div>
                <div className="m-card">
                  <div style={{fontSize:11, textTransform:"uppercase", letterSpacing:"0.06em", color:"var(--text-3)", marginBottom:8, fontWeight:600}}>Detectado</div>
                  <div className="spread" style={{padding:"4px 0"}}><span className="muted">Emisor</span><strong style={{fontSize:13}}>Pemex Estación 4421</strong></div>
                  <div className="spread" style={{padding:"4px 0"}}><span className="muted">Total</span><strong className="mono">$1,259.76</strong></div>
                  <div className="spread" style={{padding:"4px 0"}}><span className="muted">IVA</span><strong className="mono">$173.76</strong></div>
                  <div className="spread" style={{padding:"4px 0"}}><span className="muted">Cuenta sugerida</span><strong style={{fontSize:13}}>Gasolina · 6120800001</strong></div>
                </div>
                <button className="btn primary" style={{width:"100%", justifyContent:"center", marginTop:12}}>Confirmar y agregar</button>
              </div>
            </div>
          )}

          {tab === "list" && (
            <div className="m-pad">
              <h2 style={{fontFamily:"var(--f-display)", fontSize:22, fontWeight:600, letterSpacing:"-0.02em", marginTop:0}}>Mis solicitudes</h2>
              {mine.map(s => (
                <div key={s.id} className="m-card">
                  <div style={{display:"flex", justifyContent:"space-between", marginBottom:6}}>
                    <TipoBadge tipo={s.tipo}/>
                    <StatusBadge status={s.status}/>
                  </div>
                  <div style={{fontSize:13, fontWeight:500}}>{s.concepto}</div>
                  <div className="mono muted" style={{fontSize:10.5, marginTop:2}}>{s.id}</div>
                  <div className="spread" style={{marginTop:8}}>
                    <span className="mono" style={{fontSize:14, fontWeight:600}}>{window.fmtMXN(s.monto)}</span>
                    <span className="muted mono" style={{fontSize:11}}>{window.fmtFecha(s.fecha)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "profile" && (
            <div className="m-pad">
              <div style={{textAlign:"center", padding:"20px 0"}}>
                <div className="avatar lg" style={{margin:"0 auto 12px", width:64, height:64, fontSize:22}}>{u.iniciales}</div>
                <div style={{fontFamily:"var(--f-display)", fontSize:18, fontWeight:600}}>{u.nombre}</div>
                <div className="muted" style={{fontSize:12, marginTop:2}}>{u.correo}</div>
              </div>
              <div className="m-card">
                <div className="spread" style={{padding:"6px 0"}}><span className="muted">Centro</span><strong style={{fontSize:13}}>{c.id}</strong></div>
                <div className="spread" style={{padding:"6px 0"}}><span className="muted">Departamento</span><strong style={{fontSize:13}}>{c.depto}</strong></div>
                <div className="spread" style={{padding:"6px 0"}}><span className="muted">Gerente</span><strong style={{fontSize:13}}>Mariana Téllez</strong></div>
              </div>
              <button className="btn" style={{width:"100%", justifyContent:"center", marginTop:14}} onClick={onLogout}><Icon name="logout" size={14}/> Cerrar sesión</button>
            </div>
          )}
        </div>
        <div className="phone-tabs">
          {[
            {id:"home", label:"Inicio", icon:"dashboard"},
            {id:"scan", label:"Subir", icon:"upload"},
            {id:"list", label:"Solicitudes", icon:"receipt"},
            {id:"profile", label:"Perfil", icon:"settings"},
          ].map(t => (
            <div key={t.id} className={`phone-tab ${tab === t.id ? "on" : ""}`} onClick={() => setTab(t.id)}>
              <div className="icw"><Icon name={t.icon} size={16}/></div>
              <span>{t.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PerfilPage({ userId, onLogout }) {
  const u = window.findUser(userId);
  const c = window.findCentro(u.centro);
  const g = u.gerente ? window.findUser(u.gerente) : null;
  const mine = window.SOLICITUDES.filter(s => s.usuario === userId);
  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Mi perfil</h1>
          <div className="page-sub">Información de tu cuenta y configuración</div>
        </div>
        <button className="btn" onClick={onLogout}><Icon name="logout" size={13}/> Cerrar sesión</button>
      </div>

      <div className="two-col">
        <div className="card">
          <div className="row" style={{gap:16, marginBottom:18}}>
            <div className="avatar lg" style={{width:64, height:64, fontSize:22}}>{u.iniciales}</div>
            <div>
              <div style={{fontFamily:"var(--f-display)", fontSize:20, fontWeight:600, letterSpacing:"-0.02em"}}>{u.nombre}</div>
              <div className="muted" style={{fontSize:13}}>{u.correo}</div>
              <div style={{marginTop:6}}><span className="badge tipo" style={{textTransform:"capitalize"}}>{u.rol}</span></div>
            </div>
          </div>
          <div className="divider"></div>
          <div className="form-grid cols-2">
            <div className="field"><label>Nombre completo</label><input className="input" defaultValue={u.nombre}/></div>
            <div className="field"><label>Correo electrónico</label><input className="input" defaultValue={u.correo}/></div>
            <div className="field"><label>Centro de beneficio</label><input className="input" disabled value={`${c.id} · ${c.nombre}`}/></div>
            <div className="field"><label>Reporta a</label><input className="input" disabled value={g ? g.nombre : "—"}/></div>
            <div className="field"><label>CLABE bancaria</label><input className="input mono" defaultValue="012 180 01234567 4392"/></div>
            <div className="field"><label>Banco</label><input className="input" defaultValue="BBVA México"/></div>
          </div>
          <div style={{marginTop:18, display:"flex", justifyContent:"flex-end", gap:8}}>
            <button className="btn ghost">Cancelar</button>
            <button className="btn primary">Guardar cambios</button>
          </div>
        </div>

        <div>
          <div className="card" style={{marginBottom:14}}>
            <h3 className="card-title">Resumen de actividad</h3>
            <div className="divider" style={{margin:"12px 0"}}></div>
            <div className="spread" style={{padding:"6px 0"}}><span className="muted">Solicitudes totales</span><strong className="mono">{mine.length}</strong></div>
            <div className="spread" style={{padding:"6px 0"}}><span className="muted">Anticipos abiertos</span><strong className="mono">{mine.filter(s => s.tipo === "anticipo" && s.saldoPendiente > 0).length}</strong></div>
            <div className="spread" style={{padding:"6px 0"}}><span className="muted">Saldo por comprobar</span><strong className="mono">{window.fmtMXN(mine.filter(s => s.tipo === "anticipo" && s.saldoPendiente > 0).reduce((a,s)=>a+s.saldoPendiente,0))}</strong></div>
          </div>
          <div className="card">
            <h3 className="card-title">Notificaciones</h3>
            <div className="divider" style={{margin:"12px 0"}}></div>
            <div className="spread" style={{padding:"8px 0"}}><span style={{fontSize:13}}>Email cuando autoricen mis solicitudes</span><input type="checkbox" defaultChecked/></div>
            <div className="spread" style={{padding:"8px 0"}}><span style={{fontSize:13}}>Recordatorio de comprobación (10 días)</span><input type="checkbox" defaultChecked/></div>
            <div className="spread" style={{padding:"8px 0"}}><span style={{fontSize:13}}>Resumen semanal</span><input type="checkbox"/></div>
          </div>
        </div>
      </div>
    </>
  );
}

window.PerfilPage = PerfilPage;
