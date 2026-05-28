// Cloudflare Worker - Viaticos Zapata
// FCM v1 API con Service Account (RS256 JWT via Web Crypto)

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { "Content-Type": "application/json", ...CORS },
  });
}

// ── RS256 JWT para Google Service Account ─────────────────────────────────────
function b64u(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf instanceof ArrayBuffer ? buf : buf.buffer)))
    .replace(/\+/g,"-").replace(/\//g,"_").replace(/=/g,"");
}

async function getAccessToken(clientEmail, privateKeyPem) {
  const now  = Math.floor(Date.now() / 1000);
  const hdr  = b64u(new TextEncoder().encode(JSON.stringify({alg:"RS256",typ:"JWT"})));
  const pay  = b64u(new TextEncoder().encode(JSON.stringify({
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  })));
  const unsigned = hdr + "." + pay;

  // Import RSA private key from PEM
  const pemBody = privateKeyPem
    .replace(/\\n/g, "\n")
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s/g, "");
  const keyBytes = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8", keyBytes.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false, ["sign"]
  );

  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey,
    new TextEncoder().encode(unsigned));
  const jwt = unsigned + "." + b64u(new Uint8Array(sig));

  // Exchange JWT for access token
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=" + jwt,
  });
  const data = await res.json();
  if (!data.access_token) throw new Error("Token error: " + JSON.stringify(data));
  return data.access_token;
}

// ── Enviar via FCM v1 ─────────────────────────────────────────────────────────
async function sendFCMv1(token, title, body, url, env) {
  const accessToken = await getAccessToken(env.FCM_CLIENT_EMAIL, env.FCM_PRIVATE_KEY);

  const res = await fetch(
    "https://fcm.googleapis.com/v1/projects/" + env.FCM_PROJECT_ID + "/messages:send",
    {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + accessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          token,
          data: { title, body, url: url || "/Viaticos/" },
          android: { priority: "high" },
          webpush: {
            headers: { TTL: "86400", Urgency: "high" },
            fcm_options: { link: url || "/Viaticos/" },
          },
        },
      }),
    }
  );

  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data;
}

// ── Supabase ──────────────────────────────────────────────────────────────────
const sbHdr = env => ({
  "apikey": env.SUPABASE_SERVICE_KEY,
  "Authorization": "Bearer " + env.SUPABASE_SERVICE_KEY,
  "Content-Type": "application/json",
});

async function getSubs(env, userIds) {
  const ids = (Array.isArray(userIds) ? userIds : [userIds])
    .map(id => "usuario_id.eq." + id).join(",");
  const r = await fetch(
    env.SUPABASE_URL + "/rest/v1/push_subscriptions?or=(" + ids + ")&select=usuario_id,subscription",
    { headers: sbHdr(env) }
  );
  return r.json();
}

// ── Router ────────────────────────────────────────────────────────────────────
export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, {status:204,headers:CORS});
    try {
      if (request.method !== "POST") return json({error:"Method not allowed"},405);
      const auth = (request.headers.get("Authorization")||"").replace("Bearer ","");
      if (auth !== env.WORKER_SECRET) return json({error:"Unauthorized"},401);

      const url  = new URL(request.url);
      const body = await request.json().catch(()=>({}));

      // /notify
      if (url.pathname === "/notify") {
        const {userIds, title, body:nb, url:nu} = body;
        if (!userIds || !title) return json({error:"userIds y title requeridos"},400);

        const subs = await getSubs(env, userIds);
        if (!subs || !subs.length) return json({sent:0, message:"Sin suscripciones activas"});

        const results = await Promise.allSettled(
          subs.map(s => sendFCMv1(s.subscription, title, nb||"", nu||"/Viaticos/", env))
        );
        const sent   = results.filter(r=>r.status==="fulfilled").length;
        const errors = results.filter(r=>r.status==="rejected").map(r=>r.reason?.message||"error");
        return json({sent, total:subs.length, errors});
      }

      // /createUser
      if (url.pathname === "/createUser") {
        const {email,password,nombre,rol,centro,gerente,division} = body;
        if (!email||!password) return json({error:"email y password requeridos"},400);
        const r1 = await fetch(env.SUPABASE_URL+"/auth/v1/admin/users",
          {method:"POST",headers:sbHdr(env),body:JSON.stringify({email,password,email_confirm:true})});
        const u = await r1.json();
        if (!r1.ok) return json({error:u.message||u.msg},400);
        await fetch(env.SUPABASE_URL+"/rest/v1/usuarios",{method:"POST",headers:sbHdr(env),
          body:JSON.stringify({id:u.id,nombre,correo:email,rol,centro,
            gerente:gerente||null,division:division||"4105",
            iniciales:nombre.split(" ").map(p=>p[0]).join("").slice(0,2).toUpperCase()})});
        return json({success:true,id:u.id});
      }

      // /deleteUser
      if (url.pathname === "/deleteUser") {
        const {userId} = body;
        if (!userId) return json({error:"userId requerido"},400);
        await fetch(env.SUPABASE_URL+"/rest/v1/usuarios?id=eq."+userId,{method:"DELETE",headers:sbHdr(env)});
        const r = await fetch(env.SUPABASE_URL+"/auth/v1/admin/users/"+userId,{method:"DELETE",headers:sbHdr(env)});
        return json({success:r.ok});
      }

      // /resetPassword
      if (url.pathname === "/resetPassword") {
        const {userId,newPassword} = body;
        if (!userId||!newPassword) return json({error:"userId y newPassword requeridos"},400);
        const r = await fetch(env.SUPABASE_URL+"/auth/v1/admin/users/"+userId,
          {method:"PUT",headers:sbHdr(env),body:JSON.stringify({password:newPassword})});
        const d = await r.json();
        return json({success:r.ok,error:d.message});
      }

      return json({error:"Endpoint no encontrado"},404);

    } catch(err) {
      return new Response(JSON.stringify({error:"Internal error",message:err.message}),
        {status:500,headers:{"Content-Type":"application/json",...CORS}});
    }
  },
};
