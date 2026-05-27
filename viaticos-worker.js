// ═══════════════════════════════════════════════════════════════════════════
// Cloudflare Worker — Viáticos Zapata
// Endpoints:
//   POST /createUser     — crear usuario en Supabase Auth
//   POST /deleteUser     — eliminar usuario
//   POST /resetPassword  — cambiar contraseña
//   POST /notify         — enviar Web Push a uno o varios usuarios
// ═══════════════════════════════════════════════════════════════════════════

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

// ── VAPID helpers (Web Crypto API — disponible en Cloudflare Workers) ─────────
async function vapidHeaders(audience, subject, publicKey, privateKey) {
  const now   = Math.floor(Date.now() / 1000);
  const exp   = now + 12 * 3600; // 12 horas

  const header  = btoa(JSON.stringify({ typ: "JWT", alg: "ES256" })).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");
  const payload = btoa(JSON.stringify({ aud: audience, exp, sub: subject })).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");
  const unsigned = `${header}.${payload}`;

  // Import private key (PKCS8 base64url → ArrayBuffer)
  const pkBytes = Uint8Array.from(atob(privateKey.replace(/-/g,"+").replace(/_/g,"/")), c => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8", pkBytes.buffer,
    { name: "ECDSA", namedCurve: "P-256" },
    false, ["sign"]
  );

  const sigBuffer = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    cryptoKey,
    new TextEncoder().encode(unsigned)
  );

  const sig = btoa(String.fromCharCode(...new Uint8Array(sigBuffer))).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");
  const jwt = `${unsigned}.${sig}`;

  return {
    Authorization: `vapid t=${jwt},k=${publicKey}`,
    "Content-Type": "application/octet-stream",
    "TTL": "86400",
  };
}

// ── Enviar push a un endpoint ─────────────────────────────────────────────────
async function sendPush(subscription, payload, env) {
  const sub       = typeof subscription === "string" ? JSON.parse(subscription) : subscription;
  const endpoint  = sub.endpoint;
  const audience  = new URL(endpoint).origin;
  const p256dh    = sub.keys?.p256dh;
  const auth      = sub.keys?.auth;

  if (!p256dh || !auth) throw new Error("Subscription inválida — faltan keys");

  // Cifrar payload con ECDH + AES-GCM (estándar Web Push)
  const payloadBytes = new TextEncoder().encode(JSON.stringify(payload));

  // Importar clave pública del cliente
  const clientPubRaw = Uint8Array.from(atob(p256dh.replace(/-/g,"+").replace(/_/g,"/")), c => c.charCodeAt(0));
  const clientPubKey = await crypto.subtle.importKey(
    "raw", clientPubRaw, { name: "ECDH", namedCurve: "P-256" }, false, []
  );

  // Generar par efímero del servidor
  const serverPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" }, true, ["deriveKey", "deriveBits"]
  );
  const serverPubRaw   = new Uint8Array(await crypto.subtle.exportKey("raw", serverPair.publicKey));
  const sharedBits     = await crypto.subtle.deriveBits(
    { name: "ECDH", public: clientPubKey }, serverPair.privateKey, 256
  );

  // HKDF para derivar claves
  const authBytes = Uint8Array.from(atob(auth.replace(/-/g,"+").replace(/_/g,"/")), c => c.charCodeAt(0));
  const baseKey   = await crypto.subtle.importKey("raw", sharedBits, "HKDF", false, ["deriveKey", "deriveBits"]);

  // PRK
  const prkInfo  = new Uint8Array([...new TextEncoder().encode("Content-Encoding: auth\0"), ...authBytes]);
  const prk      = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt: authBytes, info: prkInfo }, baseKey, 256
  );

  // CEK y nonce
  const salt   = crypto.getRandomValues(new Uint8Array(16));
  const cekKey = await crypto.subtle.importKey("raw", prk, "HKDF", false, ["deriveKey"]);
  const cekInfo = buildInfo("aesgcm", clientPubRaw, serverPubRaw, authBytes);
  const cek     = await crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt, info: cekInfo }, cekKey,
    { name: "AES-GCM", length: 128 }, false, ["encrypt"]
  );
  const nonceInfo  = buildInfo("nonce", clientPubRaw, serverPubRaw, authBytes);
  const nonceBits  = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt, info: nonceInfo }, cekKey, 96
  );
  const nonce = new Uint8Array(nonceBits);

  // Padding + cifrado
  const padded    = new Uint8Array([0, 0, ...payloadBytes]); // 2 bytes padding length = 0
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, cek, padded);

  // Headers
  const vapidHdrs = await vapidHeaders(audience, `mailto:${env.VAPID_SUBJECT || "admin@zapata.com.mx"}`, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
  const encKey    = toBase64url(serverPubRaw);

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      ...vapidHdrs,
      "Content-Encoding": "aesgcm",
      "Crypto-Key": `dh=${encKey};${vapidHdrs["Crypto-Key"] || ""}`.replace(/;$/, ""),
      "Encryption": `salt=${toBase64url(salt)}`,
      "Content-Length": String(encrypted.byteLength),
    },
    body: encrypted,
  });

  return res;
}

function buildInfo(type, clientPub, serverPub, auth) {
  const context = new Uint8Array([
    ...new TextEncoder().encode("P-256\0"),
    0, clientPub.length, ...clientPub,
    0, serverPub.length, ...serverPub,
  ]);
  return new Uint8Array([
    ...new TextEncoder().encode(`Content-Encoding: ${type}\0`),
    ...context,
  ]);
}

function toBase64url(arr) {
  return btoa(String.fromCharCode(...arr)).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");
}

// ── Supabase helpers ──────────────────────────────────────────────────────────
function sbHeaders(env) {
  return {
    "apikey": env.SUPABASE_SERVICE_KEY,
    "Authorization": `Bearer ${env.SUPABASE_SERVICE_KEY}`,
    "Content-Type": "application/json",
  };
}

async function getSubscriptions(env, userIds) {
  const ids = Array.isArray(userIds) ? userIds : [userIds];
  const filter = ids.map(id => `usuario_id.eq.${id}`).join(",");
  const url = `${env.SUPABASE_URL}/rest/v1/push_subscriptions?or=(${filter})&select=usuario_id,subscription`;
  const res = await fetch(url, { headers: sbHeaders(env) });
  return res.json();
}

// ── Router principal ──────────────────────────────────────────────────────────
export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS });
    }
    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }

    // Verificar token de autorización
    const auth = request.headers.get("Authorization") || "";
    if (!auth.startsWith("Bearer ") || auth.slice(7) !== env.WORKER_SECRET) {
      return json({ error: "Unauthorized" }, 401);
    }

    const url  = new URL(request.url);
    const body = await request.json().catch(() => ({}));

    // ── POST /notify ─────────────────────────────────────────────────────────
    if (url.pathname === "/notify") {
      const { userIds, title, body: notifBody, tag, url: notifUrl } = body;
      if (!userIds || !title) return json({ error: "userIds y title requeridos" }, 400);

      const ids   = Array.isArray(userIds) ? userIds : [userIds];
      const subs  = await getSubscriptions(env, ids);

      if (!subs || subs.length === 0) {
        return json({ sent: 0, message: "Sin suscripciones activas" });
      }

      const payload = {
        title,
        body:  notifBody || "",
        tag:   tag  || "viaticos",
        icon:  "/Viaticos/icons/icon-192.png",
        badge: "/Viaticos/icons/icon-192.png",
        data:  { url: notifUrl || "/Viaticos/" },
        requireInteraction: true,
        vibrate: [200, 100, 200],
      };

      const results = await Promise.allSettled(
        subs.map(s => sendPush(s.subscription, payload, env))
      );

      const sent   = results.filter(r => r.status === "fulfilled" && r.value?.ok).length;
      const errors = results
        .filter(r => r.status === "rejected" || !r.value?.ok)
        .map(r => r.reason?.message || "error");

      return json({ sent, total: subs.length, errors });
    }

    // ── POST /createUser ─────────────────────────────────────────────────────
    if (url.pathname === "/createUser") {
      const { email, password, nombre, rol, centro, gerente, division } = body;
      if (!email || !password) return json({ error: "email y password requeridos" }, 400);

      const res = await fetch(`${env.SUPABASE_URL}/auth/v1/admin/users`, {
        method: "POST",
        headers: sbHeaders(env),
        body: JSON.stringify({ email, password, email_confirm: true }),
      });
      const user = await res.json();
      if (!res.ok) return json({ error: user.message || user.msg }, 400);

      const uid = user.id;
      await fetch(`${env.SUPABASE_URL}/rest/v1/usuarios`, {
        method: "POST",
        headers: sbHeaders(env),
        body: JSON.stringify({ id: uid, nombre, correo: email, rol, centro, gerente: gerente || null, division: division || "4105", iniciales: nombre.split(" ").map(p=>p[0]).join("").slice(0,2).toUpperCase() }),
      });

      return json({ success: true, id: uid });
    }

    // ── POST /deleteUser ─────────────────────────────────────────────────────
    if (url.pathname === "/deleteUser") {
      const { userId } = body;
      if (!userId) return json({ error: "userId requerido" }, 400);

      await fetch(`${env.SUPABASE_URL}/rest/v1/usuarios?id=eq.${userId}`, {
        method: "DELETE", headers: sbHeaders(env),
      });
      const res = await fetch(`${env.SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
        method: "DELETE", headers: sbHeaders(env),
      });
      return json({ success: res.ok });
    }

    // ── POST /resetPassword ──────────────────────────────────────────────────
    if (url.pathname === "/resetPassword") {
      const { userId, newPassword } = body;
      if (!userId || !newPassword) return json({ error: "userId y newPassword requeridos" }, 400);

      const res = await fetch(`${env.SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
        method: "PUT",
        headers: sbHeaders(env),
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await res.json();
      return json({ success: res.ok, error: data.message });
    }

    return json({ error: "Endpoint no encontrado" }, 404);
  },
};
