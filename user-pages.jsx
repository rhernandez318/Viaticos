// Viáticos — User-facing pages

function UserDashboard({ userId, openDetail, setPage }) {
  const u = window.findUser(userId);
  const c = window.findCentro(u.centro);
  const [filtro, setFiltro] = React.useState("todas");
  const [, forceRender] = React.useReducer(x => x + 1, 0);
  const mine = window.SOLICITUDES.filter(s => s.usuario === userId);
  const filtradas = filtro === "todas" ? mine : mine.filter(s => s.tipo === filtro);
  const eliminarBorrador = (id) => {
    window.BORRADORES = (window.BORRADORES || []).filter(b => b.id !== id);
    forceRender();
  };
  const anticipos = mine.filter(s => s.tipo === "anticipo");
  const pendientes = anticipos.filter(s => s.saldoPendiente > 0).reduce((a,s) => a + s.saldoPendiente, 0);
  const enProceso = mine.filter(s => ["solicitado","autorizado"].includes(s.status)).length;
  const totalAnio = mine.filter(s => s.tipo !== "anticipo" || s.status === "comprobado").reduce((a,s) => a + s.monto, 0);

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Hola, {u.nombre.split(" ")[0]}</h1>
          <div className="page-sub">{c.nombre} · {c.depto} · centro {c.id}</div>
        </div>
        <div style={{display:"flex", gap:8}}>
          <button className="btn" onClick={() => setPage("reembolsos")}><Icon name="refund" size={14}/> Reembolso</button>
          <button className="btn" onClick={() => setPage("comprobaciones")}><Icon name="receipt" size={14}/> Comprobar</button>
          <button className="btn primary" onClick={() => setPage("anticipos")}><Icon name="plus" size={14}/> Solicitar anticipo</button>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-label">Saldo por comprobar</div>
          <div className="kpi-value">{window.fmtMXN(pendientes)}</div>
          <div className="kpi-delta down">2 anticipos abiertos</div>
          <Spark values={[10,12,8,14,11,15,12,18]} />
        </div>
        <div className="kpi">
          <div className="kpi-label">En proceso</div>
          <div className="kpi-value">{enProceso}</div>
          <div className="kpi-delta neutral">solicitudes esperando autorización</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Reembolsable</div>
          <div className="kpi-value">{window.fmtMXN(1850)}</div>
          <div className="kpi-delta up">1 reembolso en flujo</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Gastado este año</div>
          <div className="kpi-value">{window.fmtMXN(totalAnio)}</div>
          <div className="kpi-delta neutral">Ene–May 2026</div>
        </div>
      </div>

      <div className="card" style={{marginBottom: 18}}>
        <div className="card-head">
          <div>
            <h3 className="card-title">Borradores ({(window.BORRADORES || []).length})</h3>
            <div className="card-sub">Solicitudes guardadas sin enviar</div>
          </div>
          <button className="btn sm" onClick={() => setPage("anticipos")}><Icon name="plus" size={12}/> Nuevo</button>
        </div>
        {(window.BORRADORES || []).length === 0 ? (
          <div className="muted" style={{fontSize:12.5, padding:"4px 0"}}>No tienes borradores. Al guardar uno aparecerá aquí.</div>
        ) : (
          <div style={{display:"flex", flexDirection:"column", gap:8}}>
            {(window.BORRADORES || []).map(b => (
              <div key={b.id} className="file-chip">
                <div className="icon-box">{b.tipo === "anticipo" ? "ANT" : "CMP"}</div>
                <div className="meta">
                  <div className="name">{b.concepto || "Sin concepto"}</div>
                  <div className="sz">{b.id} · {window.fmtFecha(b.fecha)}</div>
                </div>
                <div style={{display:"flex", gap:6}}>
                  <button className="btn sm" onClick={() => setPage(b.tipo === "anticipo" ? "anticipos" : "comprobaciones")}>Continuar</button>
                  <button className="icon-btn" onClick={() => eliminarBorrador(b.id)} title="Eliminar borrador"><Icon name="x" size={13}/></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card" style={{marginBottom: 18}}>
        <div className="card-head">
          <div>
            <h3 className="card-title">Solicitud activa</h3>
            <div className="card-sub">ANT-2026-0142 · Visita comercial Monterrey</div>
          </div>
          <button className="btn ghost" onClick={() => openDetail("ANT-2026-0142")}>Ver detalle <Icon name="chevR" size={12}/></button>
        </div>
        <Stepper status="solicitado" dates={{ solicitado: window.diasAtras(2) }} />
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <h3 className="card-title">Mis solicitudes recientes</h3>
            <div className="card-sub">Últimos 90 días</div>
          </div>
          <div className="row">
            <div className={`chip ${filtro === "todas" ? "active" : ""}`} onClick={() => setFiltro("todas")}>Todas <span className="count">{mine.length}</span></div>
            <div className={`chip ${filtro === "anticipo" ? "active" : ""}`} onClick={() => setFiltro("anticipo")}>Anticipos <span className="count">{mine.filter(s => s.tipo === "anticipo").length}</span></div>
            <div className={`chip ${filtro === "comprobacion" ? "active" : ""}`} onClick={() => setFiltro("comprobacion")}>Comprobaciones <span className="count">{mine.filter(s => s.tipo === "comprobacion").length}</span></div>
            <div className={`chip ${filtro === "reembolso" ? "active" : ""}`} onClick={() => setFiltro("reembolso")}>Reembolsos <span className="count">{mine.filter(s => s.tipo === "reembolso").length}</span></div>
            <button className="btn sm" onClick={() => {
              const rows = [["Folio","Tipo","Concepto","Fecha","Monto","Saldo","Status"]];
              filtradas.forEach(s => rows.push([s.id, s.tipo, s.concepto, window.fmtFecha(s.fecha), s.monto, s.saldoPendiente ?? "-", s.status]));
              const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join('\n');
              const a = document.createElement("a");
              a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
              a.download = `mis_solicitudes_${new Date().toISOString().slice(0,10)}.csv`;
              a.click();
            }}><Icon name="download" size={12}/> Exportar</button>
          </div>
        </div>
        <div className="table-wrap" style={{border:"none", padding:0}}>
          <table className="t">
            <thead>
              <tr>
                <th style={{width:30}}></th>
                <th>Folio</th>
                <th>Concepto</th>
                <th>Fecha</th>
                <th className="right">Monto</th>
                <th className="right">Saldo</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtradas.length === 0 && (
                <tr><td colSpan={8} style={{textAlign:"center", padding:"24px 0", color:"var(--text-3)", fontSize:12.5}}>Sin solicitudes en esta categoría</td></tr>
              )}
              {filtradas.slice(0,8).map(s => (
                <tr key={s.id} onClick={() => openDetail(s.id)}>
                  <td><TipoBadge tipo={s.tipo}/></td>
                  <td className="id-cell">{s.id}</td>
                  <td>{s.concepto}</td>
                  <td className="muted mono" style={{fontSize:12}}>{window.fmtFecha(s.fecha)}</td>
                  <td className="num">{window.fmtMXN(s.monto)}</td>
                  <td className="num">{s.saldoPendiente !== undefined ? window.fmtMXN(s.saldoPendiente) : "—"}</td>
                  <td><StatusBadge status={s.status}/></td>
                  <td className="right"><Icon name="chevR" size={14} style={{color:"var(--text-3)"}}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function SolicitarAnticipo({ setPage }) {
  const [toast, setToast] = React.useState(null);
  const [form, setForm] = React.useState({
    concepto: "Visita comercial Monterrey - 3 días",
    centro: window.CENTROS[0].id,
    salida: "14 may 2026",
    regreso: "16 may 2026",
    destino: "Monterrey, NL",
    monto: "8,500.00",
    notas: "Reuniones con cliente Aceros del Norte. Hospedaje 2 noches y vuelo redondo.",
  });
  const [desglose, setDesglose] = React.useState([
    { id: 1, nombre: "Pasajes (vuelo)", monto: 4800, cuenta: "6122900001" },
    { id: 2, nombre: "Hospedaje",       monto: 2400, cuenta: "6122900003" },
    { id: 3, nombre: "Comidas",         monto: 900,  cuenta: "6122900005" },
    { id: 4, nombre: "Transporte local",monto: 400,  cuenta: "6122900004" },
  ]);
  const updField = (k, v) => setForm({ ...form, [k]: v });
  const updDesg = (id, k, v) => setDesglose(desglose.map(d => d.id === id ? { ...d, [k]: v } : d));
  const addDesg = () => setDesglose([...desglose, { id: Date.now(), nombre: "Nuevo concepto", monto: 0, cuenta: "6122900005" }]);
  const delDesg = (id) => setDesglose(desglose.filter(d => d.id !== id));
  const totalDesg = desglose.reduce((a, d) => a + (parseFloat(d.monto) || 0), 0);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };
  window.BORRADORES = window.BORRADORES || [];

  const handleEnviar = () => {
    if (!form.concepto.trim()) { showToast("⚠ Escribe un concepto para continuar"); return; }
    if (!form.destino.trim())  { showToast("⚠ Indica el destino del viaje"); return; }
    if (totalDesg <= 0)        { showToast("⚠ Agrega al menos un concepto con monto"); return; }
    const id = "ANT-" + new Date().getFullYear() + "-" + String(Date.now()).slice(-4);
    const nueva = {
      id, tipo:"anticipo", concepto: form.concepto.trim(),
      usuario: "U001", monto: totalDesg,
      fecha: new Date(), status:"solicitado",
      saldoPendiente: totalDesg, comprobantes: 0,
    };
    window.SOLICITUDES.unshift(nueva);
    showToast("✓ Anticipo " + id + " enviado a tu gerente");
    setTimeout(() => setPage && setPage("dash"), 1400);
  };
  const handleBorrador = () => {
    const id = `BOR-${Date.now().toString().slice(-6)}`;
    window.BORRADORES.push({ id, ...form, desglose, fecha: new Date(), tipo: "anticipo" });
    showToast(`✓ Borrador ${id} guardado · velo en "Mis anticipos"`);
  };
  const handleCancelar = () => setPage && setPage("dash");

  return (
    <>
      {toast && <div style={{position:"fixed", bottom:24, right:24, background:"var(--success-soft)", border:"1px solid oklch(from var(--success) l c h / 0.4)", color:"var(--success)", padding:"12px 18px", borderRadius:"var(--r-lg)", zIndex:100, fontWeight:500, fontSize:13}}>{toast}</div>}
      <div className="page-head">
        <div>
          <h1 className="page-title">Nueva solicitud de anticipo</h1>
          <div className="page-sub">Captura los datos del viaje y monto solicitado</div>
        </div>
        <div className="row">
          <button className="btn ghost" onClick={handleCancelar}>Cancelar</button>
          <button className="btn" onClick={handleBorrador}>Guardar borrador</button>
          <button className="btn primary" onClick={handleEnviar}>Enviar a aprobación</button>
        </div>
      </div>

      <div className="two-col">
        <div className="card">
          <h3 className="card-title" style={{marginBottom:18}}>Datos del anticipo</h3>
          <div className="form-grid cols-2">
            <div className="field"><label>Concepto / motivo</label><input className="input" value={form.concepto} onChange={e => updField("concepto", e.target.value)}/></div>
            <div className="field"><label>Centro de beneficio</label><select className="select" value={form.centro} onChange={e => updField("centro", e.target.value)}>{window.CENTROS.map(c => <option key={c.id} value={c.id}>{c.id} · {c.nombre}</option>)}</select></div>
            <div className="field"><label>Fecha salida</label><input className="input" value={form.salida} onChange={e => updField("salida", e.target.value)}/></div>
            <div className="field"><label>Fecha regreso</label><input className="input" value={form.regreso} onChange={e => updField("regreso", e.target.value)}/></div>
            <div className="field"><label>Destino</label><input className="input" value={form.destino} onChange={e => updField("destino", e.target.value)}/></div>
            <div className="field"><label>Monto solicitado (MXN)</label><input className="input mono" value={form.monto} onChange={e => updField("monto", e.target.value)}/></div>
            <div className="field" style={{gridColumn:"1 / -1"}}><label>Notas para tu gerente (opcional)</label><textarea className="textarea" value={form.notas} onChange={e => updField("notas", e.target.value)}/></div>
          </div>

          <div className="divider"></div>

          <div className="spread" style={{marginBottom:10}}>
            <div className="label-tag">Desglose estimado · total {window.fmtMXN(totalDesg)}</div>
            <button className="btn sm" onClick={addDesg}><Icon name="plus" size={12}/> Agregar línea</button>
          </div>
          <div style={{display:"flex", flexDirection:"column", gap:8}}>
            {desglose.map(d => (
              <div key={d.id} style={{display:"grid", gridTemplateColumns:"1fr 200px 130px 30px", gap:8, alignItems:"center"}}>
                <input className="input" value={d.nombre} onChange={e => updDesg(d.id, "nombre", e.target.value)} placeholder="Concepto"/>
                <select className="select" value={d.cuenta} onChange={e => updDesg(d.id, "cuenta", e.target.value)}>
                  {window.CATALOGO_GASTOS.map(c => <option key={c.cuenta} value={c.cuenta}>{c.cuenta} · {c.nombre}</option>)}
                </select>
                <input className="input mono" style={{textAlign:"right"}} value={d.monto} onChange={e => updDesg(d.id, "monto", e.target.value)} placeholder="0.00"/>
                <button className="icon-btn" onClick={() => delDesg(d.id)} title="Eliminar"><Icon name="x" size={13}/></button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="card" style={{marginBottom:14}}>
            <h3 className="card-title">Flujo de aprobación</h3>
            <div className="card-sub" style={{marginBottom:14}}>Esta solicitud seguirá:</div>
            <div className="timeline">
              <div className="tl-row"><div className="tl-dot done"><Icon name="check" size={12}/></div><div className="tl-content"><div className="tl-title">Tú</div><div className="tl-meta">Solicitas el anticipo</div></div></div>
              <div className="tl-row"><div className="tl-dot">2</div><div className="tl-content"><div className="tl-title">Mariana Téllez · Gerente</div><div className="tl-meta">Autorización gerencial</div></div></div>
              <div className="tl-row"><div className="tl-dot">3</div><div className="tl-content"><div className="tl-title">Tesorería</div><div className="tl-meta">Liberación de fondos</div></div></div>
            </div>
          </div>
          <div className="card">
            <h3 className="card-title">Política aplicable</h3>
            <div className="card-sub" style={{marginBottom:10}}>Tope viáticos nacionales</div>
            <ul style={{paddingLeft:18, color:"var(--text-2)", fontSize:12.5, lineHeight:1.7, margin:0}}>
              <li>Hospedaje hasta $2,800/noche</li>
              <li>Comidas hasta $450/día</li>
              <li>Comprobación máx. 10 días naturales después del regreso</li>
              <li>Sin XML no se libera comprobación</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

function CompUploader({ onAdd }) {
  const [files, setFiles] = React.useState([]);
  const [drag, setDrag] = React.useState(false);
  const inputRef = React.useRef(null);

  const guessCuenta = (text) => {
    const n = (text || "").toLowerCase();
    let conf = 0.95;
    if (/(aeromexico|volaris|viva|aerobus|vuelo|avi[oó]n|pasaje a[eé]reo|transporte a[eé]reo)/.test(n)) return ["6122900001", conf];
    if (/(caseta|peaje|capufe|autopista|cuota carret)/.test(n)) return ["6122900002", conf];
    if (/(hotel|hospedaje|posada|marriott|fiesta inn|holiday|city express|hilton|sheraton|noche)/.test(n)) return ["6122900003", conf];
    if (/(estacionamiento|parking|parqu[ií]metro|pension auto|valet)/.test(n)) return ["6122900004", conf];
    if (/(restaurante|aliment|comida|desayuno|cena|cafeter[ií]a|caf[eé] |consumo en|men[uú])/.test(n)) return ["6122900005", conf];
    if (/(hertz|sixt|avis|alamo|enterprise|renta de auto|arrendamiento de veh)/.test(n)) return ["6122900006", conf];
    if (/(pemex|gasolina|magna|premium|diesel|combustible|gas natural)/.test(n)) return ["6120800001", conf];
    if (/(tua|tarifa de uso|aeropuerto|asur|aifa|oma|gap aeropuertos)/.test(n)) return ["6122700001", conf];
    return ["6121200001", 0.55]; // No deducibles / manual
  };

  const parseCFDI = (xmlText) => {
    try {
      const doc = new DOMParser().parseFromString(xmlText, "application/xml");
      if (doc.querySelector("parsererror")) return null;
      // Buscar el nodo Comprobante (puede llevar prefijo cfdi:)
      const comp = doc.querySelector("Comprobante") || doc.documentElement;
      const total = parseFloat(comp.getAttribute("Total") || comp.getAttribute("total") || "0");
      const subtotal = parseFloat(comp.getAttribute("SubTotal") || comp.getAttribute("subTotal") || comp.getAttribute("subtotal") || "0");
      const fechaAttr = comp.getAttribute("Fecha") || comp.getAttribute("fecha");
      const fecha = fechaAttr ? new Date(fechaAttr) : new Date();

      const emisorEl = doc.querySelector("Emisor");
      const emisor = emisorEl ? (emisorEl.getAttribute("Nombre") || emisorEl.getAttribute("nombre") || emisorEl.getAttribute("Rfc") || "") : "";
      const rfc = emisorEl ? (emisorEl.getAttribute("Rfc") || emisorEl.getAttribute("rfc") || "") : "";

      // Conceptos: tomar todas las descripciones
      const conceptos = Array.from(doc.querySelectorAll("Concepto"))
        .map(c => c.getAttribute("Descripcion") || c.getAttribute("descripcion") || "")
        .filter(Boolean);
      const conceptoStr = conceptos.join(" · ").slice(0, 120) || "—";
      const claveProdServ = Array.from(doc.querySelectorAll("Concepto"))
        .map(c => c.getAttribute("ClaveProdServ") || c.getAttribute("claveProdServ") || "")
        .filter(Boolean)
        .join(" ");

      // IVA: sumar Traslados con Impuesto = 002
      let iva = 0;
      doc.querySelectorAll("Traslado").forEach(t => {
        const imp = t.getAttribute("Impuesto") || t.getAttribute("impuesto");
        if (imp === "002" || imp === "IVA") iva += parseFloat(t.getAttribute("Importe") || t.getAttribute("importe") || "0") || 0;
      });
      if (!iva && total && subtotal) iva = Math.round((total - subtotal) * 100) / 100;

      // UUID del TimbreFiscalDigital
      const tfd = doc.querySelector("TimbreFiscalDigital");
      let uuid = tfd ? (tfd.getAttribute("UUID") || tfd.getAttribute("uuid")) : "";
      if (uuid) uuid = uuid.toUpperCase().slice(0, 8) + "-" + uuid.toUpperCase().slice(9, 13);

      // Empate: usar emisor + conceptos + claveprodserv + RFC
      const matchText = `${emisor} ${conceptoStr} ${claveProdServ} ${rfc}`;
      const [cuenta, conf] = guessCuenta(matchText);

      return {
        uuid: uuid || "Sin UUID",
        emisor: emisor || rfc || "Emisor desconocido",
        concepto: conceptoStr,
        subtotal: Math.round(subtotal * 100) / 100,
        iva: Math.round(iva * 100) / 100,
        total: Math.round(total * 100) / 100,
        fecha, cuenta, confianza: conf,
      };
    } catch (err) {
      console.error("CFDI parse error", err);
      return null;
    }
  };

  const readAsText = (file) => new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsText(file);
  });

  const processFiles = async (fileList) => {
    const arr = Array.from(fileList);
    const xmls = arr.filter(f => f.name.toLowerCase().endsWith(".xml"));
    const pdfs = arr.filter(f => f.name.toLowerCase().endsWith(".pdf"));
    setFiles(prev => [...prev, ...arr.map(f => ({ name: f.name, size: f.size, type: f.name.toLowerCase().endsWith(".xml") ? "XML" : f.name.toLowerCase().endsWith(".pdf") ? "PDF" : "?" }))]);

    const newItems = [];
    for (const f of xmls) {
      const text = await readAsText(f);
      const parsed = parseCFDI(text);
      if (parsed) {
        newItems.push({ id: `C-${Date.now()}-${Math.floor(Math.random()*10000)}`, ...parsed });
      } else {
        // XML inválido o no CFDI: stub manual
        newItems.push({
          id: `C-${Date.now()}-${Math.floor(Math.random()*10000)}`,
          uuid: "XML inválido", emisor: f.name.replace(/\.[^.]+$/, ""),
          concepto: "Captura manual requerida", subtotal: 0, iva: 0, total: 0,
          fecha: new Date(), cuenta: "6121200001", confianza: 0.3,
        });
      }
    }
    if (newItems.length) onAdd(newItems);

    if (xmls.length === 0 && pdfs.length > 0) {
      const stubs = pdfs.map(f => ({
        id: `C-${Date.now()}-${Math.floor(Math.random()*10000)}`,
        uuid: "PDF sin XML", emisor: f.name.replace(/\.[^.]+$/, ""),
        concepto: "Capturar manualmente · adjunta el XML para auto-llenar",
        subtotal: 0, iva: 0, total: 0, fecha: new Date(),
        cuenta: "6121200001", confianza: 0.4,
      }));
      onAdd(stubs);
    }
  };

  const onDrop = (e) => {
    e.preventDefault(); setDrag(false);
    if (e.dataTransfer.files) processFiles(e.dataTransfer.files);
  };

  return (
    <>
      <div
        className={`dropzone ${drag ? "drag" : ""}`}
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        style={{cursor:"pointer"}}
      >
        <div className="dropzone-icon"><Icon name="upload" size={20}/></div>
        <div className="dropzone-title">Arrastra XML + PDF de cada factura</div>
        <div className="dropzone-sub">El sistema extrae RFC, fecha, monto e IVA automáticamente · Acepta múltiples archivos</div>
        <div style={{marginTop:14}}>
          <button className="btn" onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}>Seleccionar archivos</button>
        </div>
        <input ref={inputRef} type="file" multiple accept=".xml,.pdf,application/xml,application/pdf,text/xml"
          style={{display:"none"}}
          onChange={(e) => { if (e.target.files) processFiles(e.target.files); e.target.value = ""; }}
        />
      </div>
      {files.length > 0 && (
        <div style={{marginTop:14, display:"flex", gap:10, flexWrap:"wrap"}}>
          {files.map((f, i) => (
            <div key={i} className="file-chip" style={{flex:"1 1 240px"}}>
              <div className="icon-box">{f.type}</div>
              <div className="meta">
                <div className="name">{f.name}</div>
                <div className="sz">{(f.size/1024).toFixed(1)} KB · procesado</div>
              </div>
              <Icon name="check" size={14} style={{color:"var(--success)"}}/>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function NuevaComprobacion({ setPage, userId = "U001" }) {
  // pendientes como estado para que se actualice al enviar
  const [pendientes, setPendientes] = React.useState(() =>
    window.SOLICITUDES.filter(s =>
      s.tipo === "anticipo" && s.usuario === userId &&
      ["autorizado","liberado"].includes(s.status) && s.saldoPendiente > 0
    )
  );
  const [anticipoSel, setAnticipoSel] = React.useState(null);
  const [items, setItems] = React.useState([]);   // vacío — usuario sube sus propias facturas
  const [editId, setEditId] = React.useState(null);
  const [toast, setToast] = React.useState(null);
  const [enviado, setEnviado] = React.useState(false);  // bloquea doble envío

  if (!anticipoSel) {
    return (
      <>
        <div className="page-head">
          <div>
            <h1 className="page-title">Comprobaciones</h1>
            <div className="page-sub">Selecciona el anticipo del que vas a comprobar gastos</div>
          </div>
          <button className="btn ghost" onClick={() => setPage && setPage("dash")}>Cancelar</button>
        </div>

        <div className="card" style={{marginBottom:14}}>
          <div className="card-head">
            <div>
              <h3 className="card-title">Anticipos pendientes de comprobar ({pendientes.length})</h3>
              <div className="card-sub">Anticipos autorizados o liberados con saldo abierto</div>
            </div>
          </div>
          {pendientes.length === 0 ? (
            <div className="muted" style={{fontSize:12.5, padding:"4px 0"}}>No tienes anticipos pendientes de comprobar.</div>
          ) : (
            <div className="table-wrap" style={{border:"none"}}>
              <table className="t">
                <thead><tr><th>Folio</th><th>Concepto</th><th>Fecha</th><th className="right">Anticipo</th><th className="right">Saldo</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {pendientes.map(a => (
                    <tr key={a.id} onClick={() => setAnticipoSel(a)}>
                      <td className="id-cell">{a.id}</td>
                      <td>{a.concepto}</td>
                      <td className="muted mono" style={{fontSize:12}}>{window.fmtFecha(a.fecha)}</td>
                      <td className="num">{window.fmtMXN(a.monto)}</td>
                      <td className="num"><strong>{window.fmtMXN(a.saldoPendiente)}</strong></td>
                      <td><StatusBadge status={a.status}/></td>
                      <td className="right"><button className="btn sm primary">Comprobar <Icon name="chevR" size={12}/></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <h3 className="card-title">¿Sin anticipo previo?</h3>
              <div className="card-sub">Si pagaste de tu bolsa sin pedir anticipo, solicita un reembolso.</div>
            </div>
            <button className="btn" onClick={() => setPage && setPage("reembolsos")}><Icon name="refund" size={13}/> Ir a reembolsos</button>
          </div>
        </div>
      </>
    );
  }
  const updItem = (id, k, v) => setItems(items.map(i => i.id === id ? { ...i, [k]: k === "total" || k === "subtotal" || k === "iva" ? parseFloat(v) || 0 : v } : i));
  const delItem = (id) => setItems(items.filter(i => i.id !== id));
  const total = items.reduce((a,i) => a + i.total, 0);
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };
  const handleEnviar = () => {
    if (enviado) return;                              // bloqueo de doble envío
    if (items.length === 0) {
      showToast("⚠ Agrega al menos un comprobante antes de enviar");
      return;
    }
    const totalComp = items.reduce((a, i) => a + (i.total || 0), 0);
    const id = "CMP-" + new Date().getFullYear() + "-" + String(Date.now()).slice(-4);

    // Registrar la comprobación en SOLICITUDES
    const nueva = {
      id,
      tipo: "comprobacion",
      concepto: "Comprobación " + anticipoSel.id,
      usuario: userId,
      monto: totalComp,
      fecha: new Date(),
      status: "solicitado",
      anticipoRef: anticipoSel.id,
      comprobantes: items.length,
      cfdi: items,
      saldoPendiente: 0,
    };
    window.SOLICITUDES.unshift(nueva);

    // Marcar el anticipo como comprobado parcial si sobra saldo
    const antic = window.SOLICITUDES.find(s => s.id === anticipoSel.id);
    if (antic) {
      const nuevoSaldo = Math.max(0, (antic.saldoPendiente || 0) - totalComp);
      antic.saldoPendiente = Math.round(nuevoSaldo * 100) / 100;
      antic.status = nuevoSaldo <= 0 ? "comprobado" : "parcial";
      antic.comprobantes = (antic.comprobantes || 0) + items.length;
    }

    // Actualizar la lista de pendientes para que desaparezca el anticipo comprobado
    setPendientes(prev =>
      prev.filter(p => p.id !== anticipoSel.id || (antic && antic.saldoPendiente > 0))
    );

    setEnviado(true);
    showToast("✓ Comprobación " + id + " enviada a autorización");
    setTimeout(() => setPage && setPage("dash"), 1400);
  };
  const handleBorrador = () => {
    const id = `BOR-${Date.now().toString().slice(-6)}`;
    window.BORRADORES = window.BORRADORES || [];
    window.BORRADORES.push({ id, concepto: "Comprobación en captura", fecha: new Date(), tipo: "comprobacion", items });
    showToast(`✓ Borrador ${id} guardado · velo en "Comprobaciones"`);
  };
  const handleCancelar = () => setPage && setPage("dash");

  return (
    <>
      {toast && (
        <div style={{position:"fixed", bottom:24, right:24, background:"var(--success-soft)", border:"1px solid oklch(from var(--success) l c h / 0.4)", color:"var(--success)", padding:"12px 18px", borderRadius:"var(--r-lg)", zIndex:100, fontWeight:500, fontSize:13}}>
          {toast}
        </div>
      )}
      <div className="page-head">
        <div>
          <button className="btn sm ghost" onClick={() => setAnticipoSel(null)} style={{marginBottom:8}}><Icon name="chevR" size={11} style={{transform:"rotate(180deg)"}}/> Volver a anticipos</button>
          <h1 className="page-title">Comprobar {anticipoSel.id}</h1>
          <div className="page-sub">{anticipoSel.concepto} · saldo {window.fmtMXN(anticipoSel.saldoPendiente)}</div>
        </div>
        <div className="row">
          <button className="btn ghost" onClick={handleCancelar}>Cancelar</button>
          <button className="btn" onClick={handleBorrador}>Guardar borrador</button>
          <button className="btn primary"
            style={{opacity: enviado ? 0.5 : 1, pointerEvents: enviado ? "none" : "auto"}}
            onClick={handleEnviar}>
            {enviado ? "Enviado ✓" : "Enviar a autorización"}
          </button>
        </div>
      </div>

      <div className="two-col">
        <div>
          <div className="card" style={{marginBottom:14}}>
            <h3 className="card-title" style={{marginBottom:14}}>Sube tus comprobantes</h3>
            <CompUploader onAdd={(newItems) => { setItems([...items, ...newItems]); showToast(`✓ ${newItems.length} archivo${newItems.length>1?"s":""} procesado${newItems.length>1?"s":""}`); }}/>
          </div>

          <div className="card">
            <div className="card-head">
              <div>
                <h3 className="card-title">Comprobantes detectados</h3>
                <div className="card-sub">{items.length} facturas · IVA y cuenta sugeridos automáticamente</div>
              </div>
              <div className="row">
                <span className="muted" style={{fontSize:12}}>Total comprobado</span>
                <strong className="mono" style={{fontSize:16}}>{window.fmtMXN(total)}</strong>
              </div>
            </div>
            <div className="table-wrap" style={{border:"none"}}>
              <table className="t">
                <thead>
                  <tr>
                    <th>UUID</th>
                    <th>Emisor</th>
                    <th>Concepto</th>
                    <th className="right">Total</th>
                    <th>Cuenta sugerida</th>
                    <th>Confianza</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(c => {
                    const cuenta = window.findCuenta(c.cuenta);
                    const editing = editId === c.id;
                    if (editing) {
                      return (
                        <tr key={c.id} style={{background:"var(--surface-2)"}}>
                          <td className="id-cell">{c.uuid}</td>
                          <td><input className="input" value={c.emisor} onChange={e => updItem(c.id, "emisor", e.target.value)}/></td>
                          <td><input className="input" value={c.concepto} onChange={e => updItem(c.id, "concepto", e.target.value)}/></td>
                          <td><input className="input mono" style={{textAlign:"right"}} value={c.total} onChange={e => updItem(c.id, "total", e.target.value)}/></td>
                          <td>
                            <select className="select" value={c.cuenta} onChange={e => updItem(c.id, "cuenta", e.target.value)}>
                              {window.CATALOGO_GASTOS.map(g => <option key={g.cuenta} value={g.cuenta}>{g.cuenta} · {g.nombre}</option>)}
                            </select>
                          </td>
                          <td><span className="muted" style={{fontSize:11}}>—</span></td>
                          <td className="right">
                            <div style={{display:"inline-flex", gap:4}}>
                              <button className="icon-btn" onClick={() => setEditId(null)} title="Guardar"><Icon name="check" size={13}/></button>
                              <button className="icon-btn" onClick={() => delItem(c.id)} title="Eliminar"><Icon name="x" size={13}/></button>
                            </div>
                          </td>
                        </tr>
                      );
                    }
                    return (
                      <tr key={c.id}>
                        <td className="id-cell">{c.uuid}</td>
                        <td>{c.emisor}</td>
                        <td className="muted">{c.concepto}</td>
                        <td className="num">{window.fmtMXN(c.total)}</td>
                        <td>
                          <div style={{display:"flex", flexDirection:"column", gap:2}}>
                            <span style={{fontSize:12.5}}>{cuenta.nombre}</span>
                            <span className="mono muted" style={{fontSize:11}}>{cuenta.cuenta}</span>
                          </div>
                        </td>
                        <td>
                          <div className={`conf ${c.confianza < 0.9 ? "warn" : ""}`}>
                            <div className="meter"><div className="fill" style={{width: `${c.confianza*100}%`}}></div></div>
                            {Math.round(c.confianza*100)}%
                          </div>
                        </td>
                        <td className="right">
                          <button className="icon-btn" onClick={() => setEditId(c.id)} title="Editar"><Icon name="settings" size={13}/></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div>
          <div className="card" style={{marginBottom:14}}>
            <h3 className="card-title">Resumen</h3>
            <div className="divider" style={{margin:"12px 0"}}></div>
            <div className="spread"><span className="muted">Anticipo recibido</span><strong className="mono">{window.fmtMXN(anticipoSel.monto)}</strong></div>
            <div className="spread" style={{marginTop:8}}><span className="muted">Total comprobado</span><strong className="mono">{window.fmtMXN(total)}</strong></div>
            <div className="divider"></div>
            <div className="spread">
              <span style={{fontWeight:600}}>Saldo a devolver</span>
              <strong className="mono" style={{fontSize:18, color:"var(--accent)"}}>{window.fmtMXN(anticipoSel.monto - total)}</strong>
            </div>
            <div className="card-sub" style={{marginTop:6}}>El usuario debe depositar este monto a tesorería</div>
          </div>

          <div className="card">
            <h3 className="card-title">Por cuenta contable</h3>
            <div className="divider" style={{margin:"12px 0"}}></div>
            {(() => {
              const groups = {};
              items.forEach(c => { groups[c.cuenta] = (groups[c.cuenta] || 0) + c.total; });
              return Object.entries(groups).map(([cuenta, monto]) => {
                const meta = window.findCuenta(cuenta);
                return (
                  <div key={cuenta} className="spread" style={{padding:"6px 0"}}>
                    <div>
                      <div style={{fontSize:13}}>{meta.nombre}</div>
                      <div className="mono muted" style={{fontSize:11}}>{cuenta}</div>
                    </div>
                    <strong className="mono">{window.fmtMXN(monto)}</strong>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>
    </>
  );
}

function Reembolsos({ userId }) {
  const [solicitudes, setSolicitudes] = React.useState(
    () => window.SOLICITUDES.filter(s => s.tipo === "reembolso")
  );
  const [filtro, setFiltro]   = React.useState("todas");
  const [busqueda, setBusqueda] = React.useState("");
  const [mostrarForm, setMostrarForm] = React.useState(false);
  const [toast, setToast] = React.useState(null);
  const [form, setForm] = React.useState({
    concepto: "", fecha: "", destino: "", notas: "",
  });
  const [desglose, setDesglose] = React.useState([
    { id: 1, nombre: "", monto: 0, cuenta: "6122900005" },
  ]);
  const [archivos, setArchivos] = React.useState([]);
  const [errores, setErrores] = React.useState({});

  const showToast = (msg, tipo="ok") => { setToast({msg,tipo}); setTimeout(()=>setToast(null),3000); };

  const updDesg = (id,k,v) => setDesglose(desglose.map(d => d.id===id ? {...d,[k]:v} : d));
  const addDesg = () => setDesglose([...desglose, {id:Date.now(),nombre:"",monto:0,cuenta:"6122900005"}]);
  const delDesg = id => setDesglose(desglose.filter(d => d.id!==id));
  const totalDesg = desglose.reduce((a,d)=>a+(parseFloat(d.monto)||0),0);

  const validar = () => {
    const e = {};
    if (!form.concepto.trim()) e.concepto = "Requerido";
    if (!form.fecha.trim()) e.fecha = "Requerido";
    if (desglose.every(d=>!(parseFloat(d.monto)>0))) e.desglose = "Agrega al menos un concepto con monto";
    if (archivos.length===0) e.archivos = "Adjunta al menos un comprobante (XML o PDF)";
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const enviar = () => {
    if (!validar()) return;
    const id = "REE-" + Date.now().toString().slice(-6);
    const montoFinal = totalDesg > 0 ? totalDesg : archivos.reduce((a,c)=>a+(c.total||0),0);
    const nuevo = {
      id, tipo:"reembolso", concepto: form.concepto.trim(),
      usuario: userId, monto: montoFinal,
      fecha: new Date(), status:"solicitado", comprobantes: archivos.length,
      notas: form.notas,
      cfdi: archivos,
    };
    window.SOLICITUDES.unshift(nuevo);
    setSolicitudes(prev => [nuevo, ...prev]);
    setMostrarForm(false);
    setForm({concepto:"",fecha:"",destino:"",notas:""});
    setDesglose([{id:1,nombre:"",monto:0,cuenta:"6122900005"}]);
    setArchivos([]);
    showToast(`✓ Reembolso ${id} enviado a aprobación`);
  };

  const exportar = () => {
    const rows = [["Folio","Concepto","Fecha","Monto","Status","Comprobantes"]];
    solicitudesFiltradas.forEach(r =>
      rows.push([r.id, r.concepto, window.fmtFecha(r.fecha), r.monto, r.status, r.comprobantes + " archivos"])
    );
    const csv = rows.map(r=>r.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(',')).join('\n');
    const a = document.createElement("a"); a.href="data:text/csv;charset=utf-8,"+encodeURIComponent(csv);
    a.download=`reembolsos_${new Date().toISOString().slice(0,10)}.csv`; a.click();
  };

  const enFlujo = solicitudes.filter(s=>["solicitado","autorizado"].includes(s.status));
  const liberados = solicitudes.filter(s=>s.status==="liberado");

  const solicitudesFiltradas = solicitudes
    .filter(s => filtro==="todas" || s.status===filtro)
    .filter(s => {
      if (!busqueda.trim()) return true;
      const q = busqueda.toLowerCase();
      return s.id.toLowerCase().includes(q) || s.concepto.toLowerCase().includes(q);
    });

  return (
    <>
      {toast && (
        <div style={{position:"fixed",bottom:24,right:24,zIndex:300,padding:"12px 18px",
          borderRadius:"var(--r-lg)",fontWeight:500,fontSize:13,
          background:"var(--success-soft)",color:"var(--success)",
          border:"1px solid var(--success)",boxShadow:"0 4px 20px rgba(0,0,0,.15)"}}>
          {toast.msg}
        </div>
      )}

      <div className="page-head">
        <div>
          <h1 className="page-title">Reembolsos</h1>
          <div className="page-sub">Gastos que pagaste de tu bolsa sin anticipo previo</div>
        </div>
        <button className="btn primary" onClick={()=>{setMostrarForm(!mostrarForm);setErrores({})}}>
          <Icon name="plus" size={14}/>
          {mostrarForm ? "Cancelar" : "Nuevo reembolso"}
        </button>
      </div>

      {/* Formulario nuevo reembolso */}
      {mostrarForm && (
        <div className="card" style={{marginBottom:18,border:"1px solid var(--accent)",borderRadius:"var(--r-lg)"}}>
          <h3 className="card-title" style={{marginBottom:16}}>Nuevo reembolso</h3>
          <div className="form-grid cols-2" style={{marginBottom:14}}>
            <div className="field">
              <label>Concepto / motivo *</label>
              <input className={`input ${errores.concepto?"error":""}`} value={form.concepto}
                placeholder="Ej: Comida con cliente sin anticipo"
                onChange={e=>setForm({...form,concepto:e.target.value})}/>
              {errores.concepto && <div style={{color:"var(--danger)",fontSize:12,marginTop:3}}>{errores.concepto}</div>}
            </div>
            <div className="field">
              <label>Fecha del gasto *</label>
              <input className={`input ${errores.fecha?"error":""}`} type="date" value={form.fecha}
                onChange={e=>setForm({...form,fecha:e.target.value})}/>
              {errores.fecha && <div style={{color:"var(--danger)",fontSize:12,marginTop:3}}>{errores.fecha}</div>}
            </div>
            <div className="field">
              <label>Lugar / destino</label>
              <input className="input" value={form.destino} placeholder="Ciudad, establecimiento"
                onChange={e=>setForm({...form,destino:e.target.value})}/>
            </div>
            <div className="field">
              <label>Notas adicionales</label>
              <input className="input" value={form.notas} placeholder="Opcional"
                onChange={e=>setForm({...form,notas:e.target.value})}/>
            </div>
          </div>

          <div className="divider"></div>
          <div className="spread" style={{marginBottom:10}}>
            <div className="label-tag">Desglose de gastos · total {window.fmtMXN(totalDesg)}</div>
            <button className="btn sm" onClick={addDesg}><Icon name="plus" size={12}/> Agregar línea</button>
          </div>
          {errores.desglose && <div style={{color:"var(--danger)",fontSize:12,marginBottom:8}}>{errores.desglose}</div>}
          <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
            {desglose.map(d=>(
              <div key={d.id} style={{display:"grid",gridTemplateColumns:"1fr 200px 120px 30px",gap:8,alignItems:"center"}}>
                <input className="input" value={d.nombre} placeholder="Descripción"
                  onChange={e=>updDesg(d.id,"nombre",e.target.value)}/>
                <select className="select" value={d.cuenta} onChange={e=>updDesg(d.id,"cuenta",e.target.value)}>
                  {window.CATALOGO_GASTOS.map(c=><option key={c.cuenta} value={c.cuenta}>{c.cuenta} · {c.nombre}</option>)}
                </select>
                <input className="input mono" style={{textAlign:"right"}} value={d.monto} placeholder="0.00"
                  type="number" min="0" step="0.01"
                  onChange={e=>updDesg(d.id,"monto",e.target.value)}/>
                <button className="icon-btn" onClick={()=>delDesg(d.id)} title="Eliminar"><Icon name="x" size={13}/></button>
              </div>
            ))}
          </div>

          <div className="divider"></div>

          {/* Lector de XML/PDF igual que en Comprobaciones */}
          <div style={{marginBottom:14}}>
            <div className="spread" style={{marginBottom:10}}>
              <label style={{fontWeight:500,fontSize:13}}>Comprobantes fiscales *</label>
              {errores.archivos && <span style={{color:"var(--danger)",fontSize:12}}>{errores.archivos}</span>}
            </div>
            <CompUploader onAdd={(newItems) => {
              setArchivos(prev => [...prev, ...newItems]);
              // Sync desglose from parsed items — replace if empty, append otherwise
              setDesglose(prev => {
                const isEmpty = prev.length===1 && !prev[0].nombre && !(parseFloat(prev[0].monto)>0);
                const lineas = newItems.map((it,i) => ({
                  id: Date.now()+i,
                  nombre: it.concepto || it.emisor,
                  monto: it.total,
                  cuenta: it.cuenta,
                }));
                return isEmpty ? lineas : [...prev, ...lineas];
              });
            }}/>
          </div>

          {archivos.length > 0 && (
            <div style={{marginBottom:14}}>
              <div className="card-sub" style={{marginBottom:10}}>{archivos.length} factura{archivos.length>1?"s":""} procesada{archivos.length>1?"s":""} · total detectado: <strong className="mono">{window.fmtMXN(archivos.reduce((a,c)=>a+(c.total||0),0))}</strong></div>
              <div className="table-wrap" style={{border:"none",padding:0}}>
                <table className="t">
                  <thead><tr><th>UUID</th><th>Emisor</th><th>Concepto</th><th className="right">Total</th><th>Cuenta</th><th>Conf.</th><th></th></tr></thead>
                  <tbody>
                    {archivos.map((c,i) => {
                      const meta = window.findCuenta(c.cuenta) || {nombre:c.cuenta,cuenta:c.cuenta};
                      return (
                        <tr key={i}>
                          <td className="id-cell">{c.uuid||"—"}</td>
                          <td style={{fontSize:12}}>{c.emisor||"—"}</td>
                          <td className="muted" style={{fontSize:12}}>{c.concepto||"—"}</td>
                          <td className="num">{window.fmtMXN(c.total||0)}</td>
                          <td>
                            <div style={{fontSize:12}}>{meta.nombre}</div>
                            <div className="mono muted" style={{fontSize:10}}>{meta.cuenta}</div>
                          </td>
                          <td>
                            {c.confianza != null ? (
                              <div className={`conf ${c.confianza<0.9?"warn":""}`}>
                                <div className="meter"><div className="fill" style={{width:`${(c.confianza||0)*100}%`}}></div></div>
                                {Math.round((c.confianza||0)*100)}%
                              </div>
                            ) : <span className="muted" style={{fontSize:11}}>manual</span>}
                          </td>
                          <td className="right">
                            <button className="icon-btn" onClick={()=>setArchivos(prev=>prev.filter((_,j)=>j!==i))} title="Quitar"><Icon name="x" size={12}/></button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div style={{display:"flex",justifyContent:"flex-end",gap:8}}>
            <button className="btn ghost" onClick={()=>{setMostrarForm(false);setErrores({});setArchivos([]);}}>Cancelar</button>
            <button className="btn primary" onClick={enviar}>
              <Icon name="arrowR" size={14}/> Enviar a aprobación · {window.fmtMXN(totalDesg)}
            </button>
          </div>
        </div>
      )}

      <div className="kpi-grid" style={{gridTemplateColumns:"repeat(3, 1fr)"}}>
        <div className="kpi">
          <div className="kpi-label">En flujo</div>
          <div className="kpi-value">{window.fmtMXN(enFlujo.reduce((a,s)=>a+s.monto,0))}</div>
          <div className="kpi-delta neutral">{enFlujo.length} solicitudes</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Reembolsado este año</div>
          <div className="kpi-value">{window.fmtMXN(liberados.reduce((a,s)=>a+s.monto,0))}</div>
          <div className="kpi-delta up">{liberados.length} solicitudes pagadas</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Total registradas</div>
          <div className="kpi-value">{solicitudes.length}</div>
          <div className="kpi-delta neutral">todos los periodos</div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <h3 className="card-title">Mis reembolsos</h3>
          </div>
          <div className="row">
            <div className="search" style={{width:200}}>
              <Icon name="search" size={14}/>
              <input placeholder="Buscar…" value={busqueda} onChange={e=>setBusqueda(e.target.value)}/>
            </div>
            <button className="btn sm" onClick={exportar}><Icon name="download" size={12}/> Exportar</button>
          </div>
        </div>

        <div className="filterbar" style={{marginBottom:12}}>
          {[
            {k:"todas",label:"Todas"},
            {k:"solicitado",label:"En proceso"},
            {k:"autorizado",label:"Autorizadas"},
            {k:"liberado",label:"Pagadas"},
            {k:"rechazado",label:"Rechazadas"},
          ].map(f=>(
            <div key={f.k} className={`chip ${filtro===f.k?"active":""}`} onClick={()=>setFiltro(f.k)}>
              {f.label} <span className="count">{f.k==="todas"?solicitudes.length:solicitudes.filter(s=>s.status===f.k).length}</span>
            </div>
          ))}
        </div>

        <div className="table-wrap" style={{border:"none"}}>
          <table className="t">
            <thead>
              <tr>
                <th>Folio</th>
                <th>Concepto</th>
                <th>Fecha</th>
                <th className="right">Monto</th>
                <th>Status</th>
                <th>Comprobantes</th>
              </tr>
            </thead>
            <tbody>
              {solicitudesFiltradas.length===0 ? (
                <tr><td colSpan={6} style={{textAlign:"center",padding:"24px 0",color:"var(--text-3)",fontSize:12.5}}>
                  Sin reembolsos en esta categoría
                </td></tr>
              ) : solicitudesFiltradas.map(r => (
                <tr key={r.id}>
                  <td className="id-cell">{r.id}</td>
                  <td>
                    <div>{r.concepto}</div>
                    {r.motivoRechazo && (
                      <div style={{color:"var(--danger)",fontSize:11.5,marginTop:2}}>⚠ {r.motivoRechazo}</div>
                    )}
                  </td>
                  <td className="muted mono" style={{fontSize:12}}>{window.fmtFecha(r.fecha)}</td>
                  <td className="num">{window.fmtMXN(r.monto)}</td>
                  <td><StatusBadge status={r.status}/></td>
                  <td className="muted mono" style={{fontSize:12}}>{r.comprobantes} archivos</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

Object.assign(window, { UserDashboard, SolicitarAnticipo, NuevaComprobacion, Reembolsos });
