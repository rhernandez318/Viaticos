import webpush from "web-push";

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
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/push_subscriptions?or=(${filter})&select=usuario_id,subscription`,
    { headers: sbHeaders(env) }
  );
  return res.json();
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS });
    }
    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }

    const auth = request.headers.get("Authorization") || "";
    if (auth.slice(7) !== env.WORKER_SECRET) {
      return json({ error: "Unauthorized" }, 401);
    }

    const url  = new URL(request.url);
    const body = await request.json().catch(() => ({}));

    // ── /notify ──────────────────────────────────────────────────────────────
    if (url.pathname === "/notify") {
      const { userIds, title, body: notifBody, tag, url: notifUrl } = body;
      if (!userIds || !title) return json({ error: "userIds y title requeridos" }, 400);

      webpush.setVapidDetails(
        env.VAPID_SUBJECT,
        env.VAPID_PUBLIC_KEY,
        env.VAPID_PRIVATE_KEY
      );

      const subs = await getSubscriptions(env, userIds);
      if (!subs || subs.length === 0) {
        return json({ sent: 0, message: "Sin suscripciones activas" });
      }

      const payload = JSON.stringify({
        title,
        body:    notifBody || "",
        tag:     tag || "viaticos",
        icon:    "/Viaticos/icons/icon-192.png",
        badge:   "/Viaticos/icons/icon-192.png",
        url:     notifUrl || "/Viaticos/",
        requireInteraction: true,
        vibrate: [200, 100, 200],
      });

      const results = await Promise.allSettled(
        subs.map(s => {
          const sub = typeof s.subscription === "string"
            ? JSON.parse(s.subscription)
            : s.subscription;
          return webpush.sendNotification(sub, payload);
        })
      );

      const sent   = results.filter(r => r.status === "fulfilled").length;
      const errors = results
        .filter(r => r.status === "rejected")
        .map(r => r.reason?.message || "error");

      return json({ sent, total: subs.length, errors });
    }

    // ── /createUser ──────────────────────────────────────────────────────────
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

      await fetch(`${env.SUPABASE_URL}/rest/v1/usuarios`, {
        method: "POST",
        headers: sbHeaders(env),
        body: JSON.stringify({
          id: user.id, nombre, correo: email, rol, centro,
          gerente: gerente || null,
          division: division || "4105",
          iniciales: nombre.split(" ").map(p => p[0]).join("").slice(0,2).toUpperCase(),
        }),
      });

      return json({ success: true, id: user.id });
    }

    // ── /deleteUser ──────────────────────────────────────────────────────────
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

    // ── /resetPassword ───────────────────────────────────────────────────────
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
