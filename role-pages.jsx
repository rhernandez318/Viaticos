// Viáticos — Gerente, Tesorería, Admin pages

function GerenteBandeja({ openDetail }) {
  const gerenteId = "U101";
  const teamIds = window.USUARIOS.filter(u => u.gerente === gerenteId).map(u => u.id);

  const [items, setItems] = React.useState(() =>
    window.SOLICITUDES.filter(s => s.status === "solicitado" && teamIds.includes(s.usuario))
  );
  const [filtro, setFiltro]     = React.useState("todas");
  const [busqueda, setBusqueda] = React.useState("");
  const [toast, setToast]       = React.useState(null);
  const [rechazoModal, setRechazoModal] = React.useState(null);
  const [detalleRapido, setDetalleRapido] = React.useState(null);

  const showToast = (msg, tipo = "ok") => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3200);
  };

  // ── Aprobar ────────────────────────────────────────────────────────────
  const aprobar = (id, e) => {
    e.stopPropagation();
    const s = window.SOLICITUDES.find(x => x.id === id);
    if (s) s.status = "autorizado";
    setItems(prev => prev.filter(x => x.id !== id));
    showToast(`✓ ${id} autorizado y enviado a Tesorería`);
  };

  // ── Rechazo ────────────────────────────────────────────────────────────
  const abrirRechazo = (id, e) => {
    e.stopPropagation();
    setRechazoModal({ id, motivo: "" });
  };
  const confirmarRechazo = () => {
    if (!rechazoModal.motivo.trim()) return;
    const s = window.SOLICITUDES.find(x => x.id === rechazoModal.id);
    if (s) { s.status = "rechazado"; s.motivoRechazo = rechazoModal.motivo.trim(); }
    setItems(prev => prev.filter(x => x.id !== rechazoModal.id));
    showToast(`Solicitud ${rechazoModal.id} rechazada`, "warn");
    setRechazoModal(null);
  };

  // ── Exportar CSV ───────────────────────────────────────────────────────
  const exportar = () => {
    const rows = [["Folio","Tipo","Solicitante","Centro","Concepto","Fecha","Monto","Status"]];
    items.forEach(s => {
      const u = window.findUser(s.usuario);
      rows.push([s.id, s.tipo, u.nombre, u.centro, s.concepto,
        window.fmtFecha(s.fecha), s.monto, s.status]);
    });
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(",")).join('\n');
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = `pendientes_gerente_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  // ── Filtrado ───────────────────────────────────────────────────────────
  const counts = {
    anticipo:     items.filter(s => s.tipo === "anticipo").length,
    comprobacion: items.filter(s => s.tipo === "comprobacion").length,
    reembolso:    items.filter(s => s.tipo === "reembolso").length,
  };
  const filtradas = items
    .filter(s => filtro === "todas" || s.tipo === filtro)
    .filter(s => {
      if (!busqueda.trim()) return true;
      const q = busqueda.toLowerCase();
      const u = window.findUser(s.usuario);
      return s.id.toLowerCase().includes(q) || s.concepto.toLowerCase().includes(q) || u.nombre.toLowerCase().includes(q);
    });

  return (
    <>
      {/* Toast */}
      {toast && (
        <div style={{position:"fixed",bottom:24,right:24,zIndex:300,padding:"12px 18px",
          borderRadius:"var(--r-lg)",fontWeight:500,fontSize:13,
          background: toast.tipo==="warn" ? "var(--danger-soft,#fef2f2)" : "var(--success-soft)",
          color: toast.tipo==="warn" ? "var(--danger)" : "var(--success)",
          border:`1px solid ${toast.tipo==="warn" ? "var(--danger)" : "var(--success)"}`,
          boxShadow:"0 4px 20px rgba(0,0,0,.15)"}}>
          {toast.msg}
        </div>
      )}

      {/* Modal rechazo */}
      {rechazoModal && (
        <div className="modal-overlay" onClick={() => setRechazoModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{maxWidth:480}}>
            <div className="modal-head">
              <div>
                <h2 className="modal-title">Rechazar solicitud</h2>
                <div className="card-sub" style={{marginTop:2}}>{rechazoModal.id}</div>
              </div>
              <div className="icon-btn" onClick={() => setRechazoModal(null)}><Icon name="x" size={14}/></div>
            </div>
            <div className="modal-body">
              <div style={{marginBottom:14,padding:"10px 14px",background:"var(--danger-soft,#fef2f2)",
                borderRadius:"var(--r-md)",fontSize:13,color:"var(--danger)",
                border:"1px solid var(--danger)"}}>
                El colaborador verá este motivo y podrá corregir y reenviar su solicitud.
              </div>
              <div className="field">
                <label>Motivo del rechazo *</label>
                <textarea className="input" style={{minHeight:90,resize:"vertical"}}
                  placeholder="Ej: Falta el XML de la factura de gasolina. Favor adjuntarlo y reenviar."
                  value={rechazoModal.motivo}
                  onChange={e => setRechazoModal({...rechazoModal, motivo: e.target.value})}
                />
                {!rechazoModal.motivo.trim() && (
                  <div style={{fontSize:12,color:"var(--danger)",marginTop:4}}>
                    El motivo es obligatorio para rechazar
                  </div>
                )}
              </div>
            </div>
            <div style={{padding:"14px 22px",borderTop:"1px solid var(--border)",
              display:"flex",justifyContent:"flex-end",gap:8}}>
              <button className="btn ghost" onClick={() => setRechazoModal(null)}>Cancelar</button>
              <button className="btn danger"
                style={{opacity: rechazoModal.motivo.trim() ? 1 : 0.4,
                        pointerEvents: rechazoModal.motivo.trim() ? "auto" : "none"}}
                onClick={confirmarRechazo}>
                <Icon name="x" size={13}/> Confirmar rechazo
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="page-head">
        <div>
          <h1 className="page-title">Por aprobar</h1>
          <div className="page-sub">Solicitudes de tu equipo esperando autorización</div>
        </div>
        <div className="row">
          <button className="btn" onClick={exportar}><Icon name="download" size={13}/> Exportar CSV</button>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-label">Pendientes</div>
          <div className="kpi-value">{items.length}</div>
          <div className={`kpi-delta ${items.filter(s=>Math.floor((window.HOY-s.fecha)/86400000)>2).length>0?"down":"up"}`}>
            {items.filter(s=>Math.floor((window.HOY-s.fecha)/86400000)>2).length} con +48 h
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Monto pendiente</div>
          <div className="kpi-value">{window.fmtMXN(items.reduce((a,s)=>a+s.monto,0))}</div>
          <div className="kpi-delta neutral">total a evaluar</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Anticipos</div>
          <div className="kpi-value">{counts.anticipo}</div>
          <div className="kpi-delta neutral">{counts.comprobacion} comprobaciones · {counts.reembolso} reembolsos</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Tiempo prom. respuesta</div>
          <div className="kpi-value">6.4 h</div>
          <div className="kpi-delta up">SLA: 24 h</div>
        </div>
      </div>

      {/* Barra de filtros + búsqueda */}
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,flexWrap:"wrap"}}>
        <div className="filterbar" style={{margin:0,flex:"1 1 auto"}}>
          {[
            {k:"todas",    label:"Todas"},
            {k:"anticipo", label:"Anticipos"},
            {k:"comprobacion",label:"Comprobaciones"},
            {k:"reembolso",label:"Reembolsos"},
          ].map(f => (
            <div key={f.k}
              className={`chip ${filtro===f.k?"active":""}`}
              onClick={() => setFiltro(f.k)}>
              {f.label}
              <span className="count">{f.k==="todas" ? items.length : counts[f.k]}</span>
            </div>
          ))}
        </div>
        <div className="search" style={{width:220}}>
          <Icon name="search" size={14}/>
          <input placeholder="Buscar folio, nombre…"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}/>
        </div>
      </div>

      {filtradas.length === 0 ? (
        <div className="card">
          <div className="empty">
            <div className="empty-ic"><Icon name="check" size={20}/></div>
            <div style={{fontWeight:600,fontSize:14,color:"var(--text)"}}>
              {busqueda ? "Sin resultados" : "Todo al día"}
            </div>
            <div style={{marginTop:4}}>
              {busqueda
                ? `No hay solicitudes que coincidan con "${busqueda}"`
                : "No hay solicitudes pendientes" + (filtro!=="todas" ? " en esta categoría" : "")}
            </div>
          </div>
        </div>
      ) : (
        <div className="card" style={{padding:0}}>
          <table className="t">
            <thead>
              <tr>
                <th></th>
                <th>Folio</th>
                <th>Solicitante</th>
                <th>Concepto</th>
                <th>Antigüedad</th>
                <th className="right">Monto</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map(s => {
                const u = window.findUser(s.usuario);
                const dias = Math.floor((window.HOY - s.fecha) / 86400000);
                const urgente = dias > 2;
                return (
                  <tr key={s.id} onClick={() => openDetail(s.id)} style={{cursor:"pointer"}}>
                    <td><TipoBadge tipo={s.tipo}/></td>
                    <td className="id-cell">{s.id}</td>
                    <td>
                      <div className="row">
                        <div className="avatar sm">{u.iniciales}</div>
                        <div>
                          <div style={{fontSize:13}}>{u.nombre}</div>
                          <div className="muted" style={{fontSize:11}}>{u.centro}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                      {s.concepto}
                    </td>
                    <td className="mono" style={{fontSize:12,color:urgente?"var(--danger)":"var(--text-3)"}}>
                      {dias}d · {window.fmtFecha(s.fecha)}
                    </td>
                    <td className="num">{window.fmtMXN(s.monto)}</td>
                    <td><StatusBadge status={s.status}/></td>
                    <td className="right" onClick={e => e.stopPropagation()}>
                      <div style={{display:"inline-flex",gap:6}}>
                        <button className="btn sm danger" onClick={e => abrirRechazo(s.id, e)}>
                          <Icon name="x" size={12}/> Rechazar
                        </button>
                        <button className="btn sm success" onClick={e => aprobar(s.id, e)}>
                          <Icon name="check" size={12}/> Aprobar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function TesoreriaBandeja({ openDetail }) {
  const [items, setItems] = React.useState(() => window.SOLICITUDES.filter(s => s.status === "autorizado"));
  const [selected, setSelected] = React.useState(() => new Set(window.SOLICITUDES.filter(s => s.status === "autorizado").map(s => s.id)));
  const [toast, setToast] = React.useState(null);

  const liberar = (ids) => {
    const idsArr = Array.isArray(ids) ? ids : [ids];
    idsArr.forEach(id => {
      const s = window.SOLICITUDES.find(x => x.id === id);
      if (s) s.status = "liberado";
    });
    setItems(items.filter(i => !idsArr.includes(i.id)));
    const newSel = new Set(selected);
    idsArr.forEach(id => newSel.delete(id));
    setSelected(newSel);
    const total = idsArr.reduce((a, id) => {
      const s = window.SOLICITUDES.find(x => x.id === id);
      return a + (s ? s.monto : 0);
    }, 0);
    setToast(`✓ ${idsArr.length} solicitud${idsArr.length > 1 ? "es" : ""} liberada${idsArr.length > 1 ? "s" : ""} · ${window.fmtMXN(total)} dispersados`);
    setTimeout(() => setToast(null), 3500);
  };

  const toggle = (id) => {
    const ns = new Set(selected);
    if (ns.has(id)) ns.delete(id); else ns.add(id);
    setSelected(ns);
  };

  const toggleAll = () => {
    if (selected.size === items.length) setSelected(new Set());
    else setSelected(new Set(items.map(i => i.id)));
  };

  const [filtroTeso, setFiltroTeso] = React.useState("todas");
  const [busquedaTeso, setBusquedaTeso] = React.useState("");

  const exportarSPEI = () => {
    const sel = items.filter(i => selected.has(i.id));
    const rows = [["Folio","Beneficiario","CLABE","Banco","Monto","Concepto"]];
    sel.forEach(s => {
      const u = window.findUser(s.usuario);
      rows.push([s.id, u.nombre, "••••4392", "BBVA", s.monto, s.concepto]);
    });
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(",")).join('\n');
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = `layout_spei_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  const countsTeso = {
    anticipo:     items.filter(s=>s.tipo==="anticipo").length,
    comprobacion: items.filter(s=>s.tipo==="comprobacion").length,
    reembolso:    items.filter(s=>s.tipo==="reembolso").length,
  };
  const itemsFiltrados = items
    .filter(s => filtroTeso==="todas" || s.tipo===filtroTeso)
    .filter(s => {
      if (!busquedaTeso.trim()) return true;
      const q = busquedaTeso.toLowerCase();
      const u = window.findUser(s.usuario);
      return s.id.toLowerCase().includes(q) || u.nombre.toLowerCase().includes(q) || s.concepto.toLowerCase().includes(q);
    });

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Por liberar</h1>
          <div className="page-sub">Solicitudes autorizadas listas para dispersión</div>
        </div>
        <div className="row">
          <button className="btn" onClick={exportarSPEI} disabled={selected.size===0}>
            <Icon name="download" size={13}/> Layout SPEI ({selected.size})
          </button>
          <button className="btn primary" disabled={selected.size === 0} onClick={() => liberar([...selected])}>
            <Icon name="cash" size={13}/> Liberar lote ({selected.size})
          </button>
        </div>
      </div>

      {toast && (
        <div style={{position:"fixed", bottom:24, right:24, background:"var(--success-soft)", border:"1px solid oklch(from var(--success) l c h / 0.4)", color:"var(--success)", padding:"12px 18px", borderRadius:"var(--r-lg)", zIndex:100, fontWeight:500, fontSize:13}}>
          {toast}
        </div>
      )}

      <div className="kpi-grid">
        <div className="kpi"><div className="kpi-label">Por liberar</div><div className="kpi-value">{items.length}</div><div className="kpi-delta neutral">solicitudes</div></div>
        <div className="kpi"><div className="kpi-label">Monto total</div><div className="kpi-value">{window.fmtMXN(items.reduce((a,s)=>a+s.monto,0))}</div><div className="kpi-delta up">listo para SPEI</div></div>
        <div className="kpi"><div className="kpi-label">Liberado hoy</div><div className="kpi-value">{window.fmtMXN(48230)}</div><div className="kpi-delta up">8 transferencias</div></div>
        <div className="kpi"><div className="kpi-label">Saldos abiertos</div><div className="kpi-value">{window.fmtMXN(76200)}</div><div className="kpi-delta down">deuda viva</div></div>
      </div>

      {/* Filter bar */}
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,flexWrap:"wrap"}}>
        <div className="filterbar" style={{margin:0,flex:"1 1 auto"}}>
          {[
            {k:"todas",label:"Todas"},
            {k:"anticipo",label:"Anticipos"},
            {k:"comprobacion",label:"Comprobaciones"},
            {k:"reembolso",label:"Reembolsos"},
          ].map(f=>(
            <div key={f.k} className={`chip ${filtroTeso===f.k?"active":""}`} onClick={()=>setFiltroTeso(f.k)}>
              {f.label} <span className="count">{f.k==="todas"?items.length:countsTeso[f.k]}</span>
            </div>
          ))}
        </div>
        <div className="search" style={{width:220}}>
          <Icon name="search" size={14}/>
          <input placeholder="Buscar folio, nombre…" value={busquedaTeso} onChange={e=>setBusquedaTeso(e.target.value)}/>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="card"><div className="empty"><div className="empty-ic"><Icon name="check" size={20}/></div><div style={{fontWeight:600, fontSize:14, color:"var(--text)"}}>Todo liberado</div><div style={{marginTop:4}}>No hay solicitudes pendientes de dispersión</div></div></div>
      ) : itemsFiltrados.length === 0 ? (
        <div className="card"><div className="empty"><div className="empty-ic"><Icon name="search" size={20}/></div><div style={{fontWeight:600,fontSize:14,color:"var(--text)"}}>Sin resultados</div><div style={{marginTop:4}}>Ajusta los filtros de búsqueda</div></div></div>
      ) : (
        <div className="card" style={{padding:0}}>
          <table className="t">
            <thead>
              <tr>
                <th style={{width:30}}><input type="checkbox" checked={selected.size === items.length} onChange={toggleAll}/></th>
                <th></th><th>Folio</th><th>Beneficiario</th><th>Centro</th><th>Concepto</th><th className="right">Monto</th><th>CLABE</th><th></th>
              </tr>
            </thead>
            <tbody>
              {itemsFiltrados.map(s => {
                const u = window.findUser(s.usuario);
                const c = window.findCentro(u.centro);
                return (
                  <tr key={s.id} onClick={() => openDetail(s.id)}>
                    <td onClick={e => e.stopPropagation()}><input type="checkbox" checked={selected.has(s.id)} onChange={() => toggle(s.id)}/></td>
                    <td><TipoBadge tipo={s.tipo}/></td>
                    <td className="id-cell">{s.id}</td>
                    <td>{u.nombre}</td>
                    <td className="mono muted" style={{fontSize:12}}>{c ? c.id : u.centro}</td>
                    <td className="muted">{s.concepto}</td>
                    <td className="num">{window.fmtMXN(s.monto)}</td>
                    <td className="mono muted" style={{fontSize:11}}>•••• 4392</td>
                    <td className="right" onClick={e=>e.stopPropagation()}>
                      <button className="btn sm primary" onClick={() => liberar(s.id)}><Icon name="cash" size={12}/> Liberar</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function EditModal({ title, fields, onClose, onSave }) {
  const [vals, setVals] = React.useState(() => Object.fromEntries(fields.map(f => [f.key, f.value ?? ""])));
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:560}}>
        <div className="modal-head">
          <h2 className="modal-title">{title}</h2>
          <div className="icon-btn" onClick={onClose}><Icon name="x" size={14}/></div>
        </div>
        <div className="modal-body">
          <div className="form-grid cols-2">
            {fields.map(f => (
              <div className="field" key={f.key} style={f.full ? {gridColumn:"1 / -1"} : null}>
                <label>{f.label}</label>
                {f.type === "select" ? (
                  <select className="select" value={vals[f.key]} onChange={e => setVals({...vals, [f.key]: e.target.value})}>
                    {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : (
                  <input className="input" value={vals[f.key]} onChange={e => setVals({...vals, [f.key]: e.target.value})}/>
                )}
                {f.hint && <div className="hint">{f.hint}</div>}
              </div>
            ))}
          </div>
        </div>
        <div style={{padding:"14px 22px", borderTop:"1px solid var(--border)", display:"flex", justifyContent:"flex-end", gap:8}}>
          <button className="btn ghost" onClick={onClose}>Cancelar</button>
          <button className="btn primary" onClick={() => { onSave(vals); onClose(); }}>Guardar</button>
        </div>
      </div>
    </div>
  );
}

function AdminUsuarios() {
  const [users, setUsers]   = React.useState(window.USUARIOS);
  const [editing, setEditing] = React.useState(null);
  const [filtro, setFiltro]   = React.useState("todos");
  const [busqueda, setBusqueda] = React.useState("");

  const openEdit = (u) => setEditing(u || {
    id:"", nombre:"", correo:"", rol:"usuario",
    centro: window.CENTROS[0].id, gerente: null, iniciales:""
  });

  const save = (vals) => {
    const iniciales = vals.nombre.split(" ").map(p=>p[0]).slice(0,2).join("").toUpperCase();
    const exists = users.find(u => u.id === editing.id);
    let updated;
    if (exists) {
      updated = users.map(u => u.id === editing.id ? {...u,...vals,iniciales} : u);
    } else {
      updated = [...users, {...editing,...vals, id: vals.id||`U${Date.now()}`, iniciales}];
    }
    setUsers(updated);
    window.USUARIOS = updated;
    setEditing(null);
  };

  const exportar = (lista) => {
    const rows = [["ID","Nombre","Correo","Rol","Centro","Reporta a"]];
    lista.forEach(u => {
      const g = u.gerente ? window.findUser(u.gerente) : null;
      rows.push([u.id, u.nombre, u.correo, u.rol, u.centro, g ? g.nombre : "—"]);
    });
    const csv = rows.map(r=>r.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(',')).join('\n');
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = `usuarios_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  const conteos = {
    todos:     users.length,
    usuario:   users.filter(u=>u.rol==="usuario").length,
    gerente:   users.filter(u=>u.rol==="gerente").length,
    tesoreria: users.filter(u=>u.rol==="tesoreria").length,
    admin:     users.filter(u=>u.rol==="admin").length,
  };

  const filtrados = users
    .filter(u => filtro==="todos" || u.rol===filtro)
    .filter(u => {
      if (!busqueda.trim()) return true;
      const q = busqueda.toLowerCase();
      return u.nombre.toLowerCase().includes(q) ||
             u.correo.toLowerCase().includes(q) ||
             u.id.toLowerCase().includes(q);
    });

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Usuarios</h1>
          <div className="page-sub">Catálogo de usuarios y permisos</div>
        </div>
        <div className="row">
          <button className="btn" onClick={() => exportar(filtrados)}>
            <Icon name="download" size={13}/> Exportar
          </button>
          <button className="btn primary" onClick={() => openEdit(null)}>
            <Icon name="plus" size={13}/> Agregar usuario
          </button>
        </div>
      </div>

      {editing && (
        <EditModal
          title={users.find(u=>u.id===editing.id) ? "Editar usuario" : "Nuevo usuario"}
          fields={[
            {key:"id",    label:"Clave",             value:editing.id,      hint:"Identificador único"},
            {key:"nombre",label:"Nombre completo",   value:editing.nombre,  full:true},
            {key:"correo",label:"Correo electrónico",value:editing.correo,  full:true},
            {key:"rol",   label:"Rol",               value:editing.rol,     type:"select", options:[
              {value:"usuario",   label:"Usuario"},
              {value:"gerente",   label:"Gerente"},
              {value:"tesoreria", label:"Tesorería"},
              {value:"admin",     label:"Admin"},
            ]},
            {key:"centro", label:"Centro de beneficio", value:editing.centro, type:"select",
              options: window.CENTROS.map(c=>({value:c.id, label:`${c.id} · ${c.nombre}`}))},
            {key:"gerente", label:"Reporta a", value:editing.gerente||"", type:"select",
              options:[{value:"", label:"— ninguno —"},
                ...users.filter(u=>u.rol==="gerente").map(g=>({value:g.id,label:g.nombre}))]},
          ]}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}

      <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:14, flexWrap:"wrap"}}>
        <div className="filterbar" style={{margin:0, flex:"1 1 auto"}}>
          {[
            {k:"todos",     label:"Todos"},
            {k:"usuario",   label:"Usuarios"},
            {k:"gerente",   label:"Gerentes"},
            {k:"tesoreria", label:"Tesorería"},
            {k:"admin",     label:"Admin"},
          ].map(f => (
            <div key={f.k}
              className={`chip ${filtro===f.k?"active":""}`}
              onClick={() => setFiltro(f.k)}>
              {f.label} <span className="count">{conteos[f.k]}</span>
            </div>
          ))}
        </div>
        <div className="search" style={{width:220}}>
          <Icon name="search" size={14}/>
          <input placeholder="Buscar nombre, correo, ID…"
            value={busqueda} onChange={e=>setBusqueda(e.target.value)}/>
        </div>
      </div>

      <div className="card" style={{padding:0}}>
        <table className="t">
          <thead>
            <tr>
              <th>Usuario</th><th>Correo</th><th>Rol</th>
              <th>Centro de beneficio</th><th>Reporta a</th><th></th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length===0 ? (
              <tr><td colSpan={6} style={{textAlign:"center",padding:"24px 0",color:"var(--text-3)",fontSize:12.5}}>
                Sin usuarios en esta categoría
              </td></tr>
            ) : filtrados.map(u => {
              const c = window.findCentro(u.centro);
              const g = u.gerente ? window.findUser(u.gerente) : null;
              return (
                <tr key={u.id} onClick={() => openEdit(u)} style={{cursor:"pointer"}}>
                  <td>
                    <div className="row">
                      <div className="avatar sm">{u.iniciales}</div>
                      <div>
                        <div style={{fontSize:13}}>{u.nombre}</div>
                        <div className="muted mono" style={{fontSize:11}}>{u.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="mono" style={{fontSize:12}}>{u.correo}</td>
                  <td><span className="badge tipo" style={{textTransform:"capitalize"}}>{u.rol}</span></td>
                  <td>
                    <div>{c ? c.nombre : "—"}</div>
                    <div className="muted mono" style={{fontSize:11}}>{c ? `${c.id} · ${c.depto}` : ""}</div>
                  </td>
                  <td className="muted">{g ? g.nombre : "—"}</td>
                  <td className="right" onClick={e=>{e.stopPropagation();openEdit(u);}}>
                    <button className="icon-btn" style={{display:"inline-grid"}}>
                      <Icon name="settings" size={13}/>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function AdminCentros() {
  const [centros, setCentros] = React.useState(window.CENTROS);
  const [editing, setEditing] = React.useState(null);
  const [busqueda, setBusqueda] = React.useState("");

  const openEdit = (c) => setEditing(c || {id:"", nombre:"", depto:"Operaciones"});

  const save = (vals) => {
    const exists = centros.find(c => c.id === editing.id);
    const updated = exists
      ? centros.map(c => c.id===editing.id ? {...c,...vals} : c)
      : [...centros, vals];
    setCentros(updated);
    window.CENTROS = updated;
    setEditing(null);
  };

  const exportar = () => {
    const rows = [["Clave","Nombre","Departamento","Usuarios"]];
    centrosFiltrados.forEach(c => {
      const count = window.USUARIOS.filter(u=>u.centro===c.id).length;
      rows.push([c.id, c.nombre, c.depto, count]);
    });
    const csv = rows.map(r=>r.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(',')).join('\n');
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = `centros_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  const centrosFiltrados = centros.filter(c => {
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase();
    return c.id.toLowerCase().includes(q) || c.nombre.toLowerCase().includes(q) || c.depto.toLowerCase().includes(q);
  });

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Centros de beneficio</h1>
          <div className="page-sub">Unidades organizacionales para registros contables</div>
        </div>
        <div className="row">
          <button className="btn" onClick={exportar}>
            <Icon name="download" size={13}/> Exportar
          </button>
          <button className="btn primary" onClick={() => openEdit(null)}>
            <Icon name="plus" size={13}/> Nuevo centro
          </button>
        </div>
      </div>

      {editing && (
        <EditModal
          title={centros.find(c=>c.id===editing.id) ? "Editar centro" : "Nuevo centro"}
          fields={[
            {key:"id",     label:"Clave",         value:editing.id},
            {key:"nombre", label:"Nombre",         value:editing.nombre},
            {key:"depto",  label:"Departamento",   value:editing.depto, full:true, type:"select",
              options:["Operaciones","Refacciones","Comercial","Administración","Servicio","Finanzas","TI","Marketing"].map(d=>({value:d,label:d}))},
          ]}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}

      <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:14}}>
        <div className="search" style={{width:260}}>
          <Icon name="search" size={14}/>
          <input placeholder="Buscar clave, nombre, departamento…"
            value={busqueda} onChange={e=>setBusqueda(e.target.value)}/>
        </div>
        <div className="muted" style={{fontSize:12}}>{centrosFiltrados.length} centros</div>
      </div>

      <div className="card" style={{padding:0}}>
        <table className="t">
          <thead>
            <tr><th>Clave</th><th>Nombre</th><th>Departamento</th><th className="right">Usuarios</th><th></th></tr>
          </thead>
          <tbody>
            {centrosFiltrados.map(c => {
              const count = window.USUARIOS.filter(u=>u.centro===c.id).length;
              return (
                <tr key={c.id} onClick={() => openEdit(c)} style={{cursor:"pointer"}}>
                  <td className="mono" style={{fontWeight:600}}>{c.id}</td>
                  <td>{c.nombre}</td>
                  <td><span className="badge tipo">{c.depto}</span></td>
                  <td className="num">{count}</td>
                  <td className="right" onClick={e=>{e.stopPropagation();openEdit(c);}}>
                    <button className="icon-btn" style={{display:"inline-grid"}}>
                      <Icon name="settings" size={13}/>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function AdminCatalogo() {
  const [cuentas, setCuentas] = React.useState(window.CATALOGO_GASTOS);
  const [editing, setEditing] = React.useState(null);
  const [busqueda, setBusqueda] = React.useState("");

  const openEdit = (c) => setEditing(c || {cuenta:"", nombre:"", grupo:"Transporte"});

  const save = (vals) => {
    const exists = cuentas.find(c => c.cuenta===editing.cuenta);
    const updated = exists
      ? cuentas.map(c => c.cuenta===editing.cuenta ? {...c,...vals} : c)
      : [...cuentas, vals];
    setCuentas(updated);
    window.CATALOGO_GASTOS = updated;
    setEditing(null);
  };

  const exportar = () => {
    const rows = [["Cuenta","Nombre","Grupo"]];
    cuentas.forEach(c => rows.push([c.cuenta, c.nombre, c.grupo]));
    const csv = rows.map(r=>r.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(',')).join('\n');
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = `catalogo_gastos_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  const PALABRAS_CLAVE = {
    "6122900001":"vuelo, avión, aeromexico, viva, volaris, pasaje",
    "6122900002":"caseta, peaje, capufe, autopista",
    "6122900003":"hotel, hospedaje, posada, marriott, fiesta inn",
    "6122900004":"estacionamiento, parking, parquímetro",
    "6122900005":"restaurante, comida, café, alimentos",
    "6122900006":"renta auto, hertz, sixt, avis, alamo",
    "6120800001":"pemex, gasolina, magna, premium, diesel",
    "6121200001":"(revisión manual)",
    "6122700001":"TUA, asur, aifa, oma",
  };

  const cuentasFiltradas = cuentas.filter(c => {
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase();
    return c.cuenta.includes(q) || c.nombre.toLowerCase().includes(q) || c.grupo.toLowerCase().includes(q);
  });

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Catálogo de gastos</h1>
          <div className="page-sub">Cuentas contables · empate con facturas CFDI</div>
        </div>
        <div className="row">
          <button className="btn" onClick={exportar}>
            <Icon name="download" size={13}/> Exportar
          </button>
          <button className="btn primary" onClick={() => openEdit(null)}>
            <Icon name="plus" size={13}/> Nueva cuenta
          </button>
        </div>
      </div>

      {editing && (
        <EditModal
          title={cuentas.find(c=>c.cuenta===editing.cuenta) ? "Editar cuenta" : "Nueva cuenta"}
          fields={[
            {key:"cuenta", label:"Número de cuenta", value:editing.cuenta},
            {key:"nombre", label:"Nombre",            value:editing.nombre},
            {key:"grupo",  label:"Grupo",             value:editing.grupo, full:true, type:"select",
              options:["Transporte","Hospedaje","Alimentos","Impuestos","Otros"].map(g=>({value:g,label:g}))},
          ]}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}

      <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:14}}>
        <div className="search" style={{width:260}}>
          <Icon name="search" size={14}/>
          <input placeholder="Buscar cuenta, nombre, grupo…"
            value={busqueda} onChange={e=>setBusqueda(e.target.value)}/>
        </div>
      </div>

      <div className="card" style={{padding:0}}>
        <table className="t">
          <thead>
            <tr>
              <th>Cuenta</th><th>Nombre</th><th>Grupo</th>
              <th>Palabras clave de empate</th><th className="right">Uso (mes)</th><th></th>
            </tr>
          </thead>
          <tbody>
            {cuentasFiltradas.map(c => (
              <tr key={c.cuenta} onClick={() => openEdit(c)} style={{cursor:"pointer"}}>
                <td className="mono" style={{fontWeight:600}}>{c.cuenta}</td>
                <td>{c.nombre}</td>
                <td><span className="badge tipo">{c.grupo}</span></td>
                <td className="muted" style={{fontSize:12}}>{PALABRAS_CLAVE[c.cuenta] || "—"}</td>
                <td className="num mono">{((c.cuenta.charCodeAt(7)||50)%40)+5}</td>
                <td className="right" onClick={e=>{e.stopPropagation();openEdit(c);}}>
                  <button className="icon-btn" style={{display:"inline-grid"}}>
                    <Icon name="settings" size={13}/>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Reportes() {
  const AÑOS = ["2026","2025","2024"];
  const [anio,    setAnio]    = React.useState("2026");
  const [centro,  setCentro]  = React.useState("todos");
  const [tabRep,  setTabRep]  = React.useState("aging");

  // Filtrar solicitudes por año y centro
  const solicsFiltradas = React.useMemo(() => {
    return window.SOLICITUDES.filter(s => {
      const u = window.findUser(s.usuario);
      if (!u) return false;
      const matchAnio   = String(s.fecha.getFullYear()) === anio;
      const matchCentro = centro === "todos" || u.centro === centro;
      return matchAnio && matchCentro;
    });
  }, [anio, centro]);

  // Saldos abiertos (anticipos sin comprobar)
  const ahoraSaldos = solicsFiltradas.filter(s => s.tipo==="anticipo" && s.saldoPendiente>0);

  // Aging buckets
  const buckets = {"0-15":[],"16-30":[],"31-60":[],"60+":[]};
  ahoraSaldos.forEach(s => {
    const d = Math.floor((window.HOY - s.fecha)/86400000);
    if (d<=15) buckets["0-15"].push(s);
    else if (d<=30) buckets["16-30"].push(s);
    else if (d<=60) buckets["31-60"].push(s);
    else buckets["60+"].push(s);
  });
  const sumB = k => buckets[k].reduce((a,s)=>a+s.saldoPendiente,0);

  // Top deudores
  const porUser = {};
  ahoraSaldos.forEach(s => { porUser[s.usuario]=(porUser[s.usuario]||0)+s.saldoPendiente; });
  const topDeudores = Object.entries(porUser)
    .map(([uid,m])=>({u:window.findUser(uid),monto:m}))
    .filter(d=>d.u)
    .sort((a,b)=>b.monto-a.monto);

  // Por departamento
  const porDepto = {};
  solicsFiltradas.forEach(s => {
    const u = window.findUser(s.usuario);
    const c = u ? window.findCentro(u.centro) : null;
    if (c) porDepto[c.depto]=(porDepto[c.depto]||0)+s.monto;
  });
  const deptoMax = Math.max(...Object.values(porDepto),1);

  // Por cuenta contable
  const porCuenta = {};
  solicsFiltradas.forEach(s => {
    // mock desglose: distribute monto across tipos as approximation
    const cuenta = s.tipo==="anticipo" ? "6122900001"
      : s.tipo==="reembolso" ? "6120800001" : "6122900005";
    porCuenta[cuenta]=(porCuenta[cuenta]||0)+s.monto;
  });

  // Exportar CSV según pestaña activa
  const exportar = () => {
    let rows, name;
    if (tabRep==="aging") {
      rows=[["Folio","Concepto","Usuario","Centro","Saldo","Días"]];
      ahoraSaldos.forEach(s=>{
        const u=window.findUser(s.usuario);
        const dias=Math.floor((window.HOY-s.fecha)/86400000);
        rows.push([s.id,s.concepto,u.nombre,u.centro,s.saldoPendiente,dias]);
      });
      name="reporte_aging";
    } else if (tabRep==="deudores") {
      rows=[["Usuario","Centro","Saldo pendiente"]];
      topDeudores.forEach(d=>rows.push([d.u.nombre,d.u.centro,d.monto]));
      name="reporte_deudores";
    } else {
      rows=[["Departamento","Gasto total"]];
      Object.entries(porDepto).sort((a,b)=>b[1]-a[1]).forEach(([dep,m])=>rows.push([dep,m]));
      name="reporte_departamentos";
    }
    const csv=rows.map(r=>r.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(',')).join('\n');
    const a=document.createElement("a");
    a.href="data:text/csv;charset=utf-8,"+encodeURIComponent(csv);
    a.download=`${name}_${anio}_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  const totalSaldos   = ahoraSaldos.reduce((a,s)=>a+s.saldoPendiente,0);
  const totalGasto    = solicsFiltradas.reduce((a,s)=>a+s.monto,0);
  const totalLiberado = solicsFiltradas.filter(s=>s.status==="liberado").reduce((a,s)=>a+s.monto,0);

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Reportes</h1>
          <div className="page-sub">Antigüedad de saldos, deudores y gasto por unidad</div>
        </div>
        <div className="row">
          <select className="select" value={anio} onChange={e=>setAnio(e.target.value)}>
            {AÑOS.map(a=><option key={a} value={a}>{a}</option>)}
          </select>
          <select className="select" value={centro} onChange={e=>setCentro(e.target.value)}>
            <option value="todos">Todos los centros</option>
            {window.CENTROS.map(c=><option key={c.id} value={c.id}>{c.id} · {c.nombre}</option>)}
          </select>
          <button className="btn" onClick={exportar}>
            <Icon name="download" size={13}/> Exportar CSV
          </button>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-label">Saldos abiertos</div>
          <div className="kpi-value">{window.fmtMXN(totalSaldos)}</div>
          <div className="kpi-delta down">{ahoraSaldos.length} anticipos sin comprobar</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Gasto total {anio}</div>
          <div className="kpi-value">{window.fmtMXN(totalGasto)}</div>
          <div className="kpi-delta neutral">{solicsFiltradas.length} solicitudes</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Liberado {anio}</div>
          <div className="kpi-value">{window.fmtMXN(totalLiberado)}</div>
          <div className="kpi-delta up">fondos dispersados</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Comprobado a tiempo</div>
          <div className="kpi-value">73%</div>
          <div className="kpi-delta up">objetivo 85%</div>
        </div>
      </div>

      {/* Tabs de sección */}
      <div style={{display:"flex",gap:0,borderBottom:"1px solid var(--border)",marginBottom:16}}>
        {[
          {k:"aging",    label:"Antigüedad de saldos"},
          {k:"deudores", label:"Top deudores"},
          {k:"depto",    label:"Por departamento"},
          {k:"mensual",  label:"Gasto mensual"},
        ].map(t=>(
          <div key={t.k}
            onClick={()=>setTabRep(t.k)}
            style={{padding:"8px 18px",cursor:"pointer",fontSize:13,fontWeight:500,
              borderBottom: tabRep===t.k ? "2px solid var(--accent)" : "2px solid transparent",
              color: tabRep===t.k ? "var(--text)" : "var(--text-3)",
              transition:"all .15s"}}>
            {t.label}
          </div>
        ))}
      </div>

      {/* Antigüedad */}
      {tabRep==="aging" && (
        <>
          <div className="card" style={{marginBottom:14}}>
            <div className="card-head">
              <h3 className="card-title">Antigüedad de saldos</h3>
              <div className="card-sub">Anticipos sin comprobar · {anio}{centro!=="todos"?` · ${centro}`:""}</div>
            </div>
            <div className="aging-grid">
              {[
                {k:"0-15",  label:"0–15 días",  cls:""},
                {k:"16-30", label:"16–30 días", cls:""},
                {k:"31-60", label:"31–60 días", cls:"warn"},
                {k:"60+",   label:"60+ días",   cls:"danger"},
              ].map(({k,label,cls})=>{
                const pct = totalSaldos>0 ? Math.round(sumB(k)/totalSaldos*100) : 0;
                return (
                  <div key={k} className={`aging ${cls}`}>
                    <div className="lbl">{label}</div>
                    <div className="v">{window.fmtMXN(sumB(k))}</div>
                    <div className="c">{buckets[k].length} anticipos</div>
                    <div className="bar" style={{width:`${pct}%`}}></div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="card" style={{padding:0}}>
            <table className="t">
              <thead>
                <tr><th>Folio</th><th>Concepto</th><th>Usuario</th><th className="right">Saldo</th><th>Días</th></tr>
              </thead>
              <tbody>
                {ahoraSaldos.length===0 ? (
                  <tr><td colSpan={5} style={{textAlign:"center",padding:"24px",color:"var(--text-3)"}}>Sin saldos abiertos para este filtro</td></tr>
                ) : ahoraSaldos.sort((a,b)=>a.fecha-b.fecha).map(s=>{
                  const u=window.findUser(s.usuario);
                  const dias=Math.floor((window.HOY-s.fecha)/86400000);
                  return (
                    <tr key={s.id}>
                      <td className="id-cell">{s.id}</td>
                      <td>{s.concepto}</td>
                      <td><div className="row"><div className="avatar sm">{u.iniciales}</div><span style={{fontSize:13}}>{u.nombre}</span></div></td>
                      <td className="num">{window.fmtMXN(s.saldoPendiente)}</td>
                      <td><span className={`badge ${dias>60?"rechazado":dias>30?"autorizado":"solicitado"}`}><span className="dot"></span>{dias}d</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Top deudores */}
      {tabRep==="deudores" && (
        <div className="card">
          <div className="card-head">
            <h3 className="card-title">Top deudores</h3>
            <div className="card-sub">Saldo pendiente por usuario · {anio}</div>
          </div>
          <div className="table-wrap" style={{border:"none"}}>
            <table className="t">
              <thead><tr><th>Usuario</th><th>Centro</th><th className="right">Saldo</th><th>Antigüedad</th></tr></thead>
              <tbody>
                {topDeudores.length===0 ? (
                  <tr><td colSpan={4} style={{textAlign:"center",padding:"24px",color:"var(--text-3)"}}>Sin deudores para este filtro</td></tr>
                ) : topDeudores.map(d=>{
                  const c=window.findCentro(d.u.centro);
                  const masVieja=ahoraSaldos.filter(s=>s.usuario===d.u.id).reduce((mn,s)=>Math.min(mn,s.fecha.getTime()),Infinity);
                  const dias=Math.floor((window.HOY-masVieja)/86400000);
                  return (
                    <tr key={d.u.id}>
                      <td><div className="row"><div className="avatar sm">{d.u.iniciales}</div><div style={{fontSize:13}}>{d.u.nombre}</div></div></td>
                      <td className="muted mono" style={{fontSize:12}}>{c?c.id:d.u.centro}</td>
                      <td className="num">{window.fmtMXN(d.monto)}</td>
                      <td><span className={`badge ${dias>60?"rechazado":dias>30?"autorizado":"solicitado"}`}><span className="dot"></span>{dias}d</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Por departamento */}
      {tabRep==="depto" && (
        <div className="card">
          <div className="card-head">
            <h3 className="card-title">Gasto por departamento</h3>
            <div className="card-sub">YTD {anio}{centro!=="todos"?` · ${centro}`:""}</div>
          </div>
          {Object.entries(porDepto).length===0 ? (
            <div className="muted" style={{padding:"16px 0",fontSize:12.5}}>Sin datos para este filtro</div>
          ) : Object.entries(porDepto).sort((a,b)=>b[1]-a[1]).map(([dep,m])=>(
            <div key={dep} style={{marginBottom:14}}>
              <div className="spread" style={{marginBottom:6}}>
                <span style={{fontSize:13}}>{dep}</span>
                <strong className="mono">{window.fmtMXN(m)}</strong>
              </div>
              <div style={{height:6,background:"var(--surface-3)",borderRadius:3,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${(m/deptoMax)*100}%`,background:"var(--accent)",borderRadius:3}}></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Gasto mensual */}
      {tabRep==="mensual" && (
        <div className="card">
          <div className="card-head">
            <h3 className="card-title">Gasto mensual</h3>
            <div className="card-sub">Últimos 6 meses · {anio}</div>
          </div>
          <div className="chart-bars">
            {[68,52,74,61,89,72].map((v,i)=>(
              <div key={i} className="chart-bar" style={{height:`${v}%`}}>
                <span className="v">{window.fmtMXN(v*1000)}</span>
              </div>
            ))}
          </div>
          <div className="chart-axis"><span>Dic</span><span>Ene</span><span>Feb</span><span>Mar</span><span>Abr</span><span>May</span></div>
        </div>
      )}
    </>
  );
}

function DetalleModal({ id, onClose }) {
  const s = window.SOLICITUDES.find(x => x.id === id);
  if (!s) return null;
  const u = window.findUser(s.usuario);
  const c = window.findCentro(u.centro);

  const dates = {
    solicitado: s.fecha,
    autorizado: ["autorizado","liberado","comprobado","parcial"].includes(s.status) ? new Date(s.fecha.getTime() + 86400000) : null,
    liberado: ["liberado","comprobado","parcial"].includes(s.status) ? new Date(s.fecha.getTime() + 86400000*2) : null,
    comprobado: s.status === "comprobado" ? new Date(s.fecha.getTime() + 86400000*5) : null,
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h2 className="modal-title">{s.id}</h2>
            <div className="card-sub" style={{marginTop:2}}>{s.concepto}</div>
          </div>
          <div className="row">
            <StatusBadge status={s.status}/>
            <div className="icon-btn" onClick={onClose}><Icon name="x" size={14}/></div>
          </div>
        </div>
        <div className="modal-body">
          <Stepper status={s.status} dates={dates}/>

          <div className="form-grid cols-3" style={{marginTop:24}}>
            <div className="field"><label>Solicitante</label>
              <div className="row"><div className="avatar sm">{u.iniciales}</div><div><div style={{fontSize:13}}>{u.nombre}</div><div className="muted mono" style={{fontSize:11}}>{u.correo}</div></div></div>
            </div>
            <div className="field"><label>Centro de beneficio</label><div>{c.nombre}<div className="muted mono" style={{fontSize:11}}>{c.id} · {c.depto}</div></div></div>
            <div className="field"><label>Tipo</label><div><TipoBadge tipo={s.tipo}/> <span style={{textTransform:"capitalize", marginLeft:4}}>{s.tipo}</span></div></div>
            <div className="field"><label>Monto</label><div className="mono" style={{fontSize:18, fontWeight:600}}>{window.fmtMXN(s.monto)}</div></div>
            <div className="field"><label>Fecha solicitud</label><div className="mono">{window.fmtFecha(s.fecha)}</div></div>
            <div className="field"><label>Saldo pendiente</label><div className="mono" style={{fontSize:16, fontWeight:600, color:s.saldoPendiente>0?"var(--warn)":"var(--success)"}}>{s.saldoPendiente !== undefined ? window.fmtMXN(s.saldoPendiente) : "—"}</div></div>
          </div>

          <div className="divider"></div>
          <h3 className="card-title" style={{fontSize:14, marginBottom:12}}>Bitácora</h3>
          <div className="timeline">
            <div className="tl-row">
              <div className="tl-dot done"><Icon name="check" size={11}/></div>
              <div className="tl-content">
                <div className="tl-title">{u.nombre} solicitó el anticipo</div>
                <div className="tl-meta">{window.fmtFecha(s.fecha)} · 09:42</div>
                <div className="tl-note">Reuniones con cliente. 3 días de viaje, vuelo redondo y hospedaje 2 noches.</div>
              </div>
            </div>
            {dates.autorizado && (
              <div className="tl-row">
                <div className="tl-dot done"><Icon name="check" size={11}/></div>
                <div className="tl-content">
                  <div className="tl-title">Mariana Téllez autorizó</div>
                  <div className="tl-meta">{window.fmtFecha(dates.autorizado)} · 11:18</div>
                </div>
              </div>
            )}
            {dates.liberado && (
              <div className="tl-row">
                <div className="tl-dot done"><Icon name="check" size={11}/></div>
                <div className="tl-content">
                  <div className="tl-title">Tesorería liberó fondos · SPEI</div>
                  <div className="tl-meta">{window.fmtFecha(dates.liberado)} · 16:05 · ref. SPEI 4471882</div>
                </div>
              </div>
            )}
            {!dates.autorizado && (
              <div className="tl-row">
                <div className="tl-dot">2</div>
                <div className="tl-content"><div className="tl-title muted">Esperando autorización gerencial</div></div>
              </div>
            )}
          </div>

          {/* CFDI adjuntos — visible para gerentes y tesorería */}
          {s.cfdi && s.cfdi.length > 0 && (
            <>
              <div className="divider"></div>
              <h3 className="card-title" style={{fontSize:14, marginBottom:12}}>
                Comprobantes fiscales adjuntos
                <span className="muted" style={{fontWeight:400, marginLeft:8, fontSize:12}}>
                  {s.cfdi.length} factura{s.cfdi.length>1?"s":""} · total: <strong className="mono">{window.fmtMXN(s.cfdi.reduce((a,c)=>a+(c.total||0),0))}</strong>
                </span>
              </h3>
              <div className="table-wrap" style={{border:"none", padding:0}}>
                <table className="t">
                  <thead>
                    <tr><th>UUID</th><th>Emisor</th><th>Concepto</th><th className="right">Subtotal</th><th className="right">IVA</th><th className="right">Total</th><th>Cuenta</th></tr>
                  </thead>
                  <tbody>
                    {s.cfdi.map((c, i) => {
                      const meta = window.findCuenta(c.cuenta) || {nombre: c.cuenta || "—", cuenta: c.cuenta || ""};
                      return (
                        <tr key={i}>
                          <td className="id-cell" style={{fontSize:10}}>{c.uuid || c.uuidFull || "—"}</td>
                          <td style={{fontSize:12, maxWidth:120, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{c.emisor || "—"}</td>
                          <td className="muted" style={{fontSize:12, maxWidth:160, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{c.concepto || "—"}</td>
                          <td className="num">{window.fmtMXN(c.subtotal||0)}</td>
                          <td className="num">{window.fmtMXN(c.iva||0)}</td>
                          <td className="num" style={{fontWeight:600}}>{window.fmtMXN(c.total||0)}</td>
                          <td>
                            <div style={{fontSize:12}}>{meta.nombre}</div>
                            <div className="mono muted" style={{fontSize:10}}>{meta.cuenta}</div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={5} style={{textAlign:"right", padding:"8px 10px", fontWeight:600, borderTop:"1px solid var(--border)"}}>Total facturas</td>
                      <td className="num" style={{fontWeight:600, borderTop:"1px solid var(--border)"}}>{window.fmtMXN(s.cfdi.reduce((a,c)=>a+(c.total||0),0))}</td>
                      <td style={{borderTop:"1px solid var(--border)"}}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}

          {/* Si no tiene CFDI estructurado pero tiene comprobantes */}
          {(!s.cfdi || s.cfdi.length===0) && s.comprobantes > 0 && (
            <>
              <div className="divider"></div>
              <div style={{padding:"10px 14px", background:"var(--surface-2)", borderRadius:"var(--r-md)", fontSize:13, color:"var(--text-2)"}}>
                <Icon name="file" size={14} style={{marginRight:6, verticalAlign:"middle"}}/> 
                {s.comprobantes} archivo{s.comprobantes>1?"s adjuntos":""} adjunto{s.comprobantes>1?"s":""} — el detalle de facturas se ve al abrir el XML desde el sistema de archivos
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { GerenteBandeja, TesoreriaBandeja, AdminUsuarios, AdminCentros, AdminCatalogo, Reportes, DetalleModal, EditModal });
