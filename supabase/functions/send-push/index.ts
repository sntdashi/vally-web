import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Web Push implementation for Deno
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function base64UrlToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

async function sendWebPush(subscription: { endpoint: string; p256dh: string; auth: string }, payload: string) {
  const audience = new URL(subscription.endpoint).origin;
  const now = Math.floor(Date.now() / 1000);

  // Build VAPID JWT
  const header = btoa(JSON.stringify({ typ: "JWT", alg: "ES256" })).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const claims = btoa(JSON.stringify({ aud: audience, exp: now + 12 * 3600, sub: "mailto:vally@love.app" })).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  const privateKeyData = base64UrlToUint8Array(VAPID_PRIVATE_KEY);
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    privateKeyData,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const signingInput = `${header}.${claims}`;
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    cryptoKey,
    new TextEncoder().encode(signingInput)
  );

  const jwt = `${signingInput}.${btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_")}`;

  // Encrypt payload
  const authBuffer = base64UrlToUint8Array(subscription.auth);
  const p256dhBuffer = base64UrlToUint8Array(subscription.p256dh);

  const serverKeyPair = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const serverPublicKey = await crypto.subtle.exportKey("raw", serverKeyPair.publicKey);
  const clientPublicKey = await crypto.subtle.importKey("raw", p256dhBuffer, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const sharedSecret = await crypto.subtle.deriveBits({ name: "ECDH", public: clientPublicKey }, serverKeyPair.privateKey, 256);

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const encoder = new TextEncoder();

  const prk = await crypto.subtle.importKey("raw", await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt: authBuffer, info: encoder.encode("Content-Encoding: auth\0") }, await crypto.subtle.importKey("raw", sharedSecret, { name: "HKDF" }, false, ["deriveBits"]), 256), { name: "HKDF" }, false, ["deriveBits"]);

  const cek = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt, info: encoder.encode("Content-Encoding: aesgcm\0") },
    prk, 128
  );
  const nonce = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt, info: encoder.encode("Content-Encoding: nonce\0") },
    prk, 96
  );

  const aesKey = await crypto.subtle.importKey("raw", cek, { name: "AES-GCM" }, false, ["encrypt"]);
  const paddedPayload = new Uint8Array([0, 0, ...encoder.encode(payload)]);
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, aesKey, paddedPayload);

  const serverPublicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(serverPublicKey))).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  const response = await fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      "Authorization": `vapid t=${jwt}, k=${VAPID_PUBLIC_KEY}`,
      "Content-Type": "application/octet-stream",
      "Content-Encoding": "aesgcm",
      "Encryption": `salt=${btoa(String.fromCharCode(...salt)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_")}`,
      "Crypto-Key": `dh=${serverPublicKeyBase64}`,
      "TTL": "60",
    },
    body: encrypted,
  });

  return response;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" } });
  }

  try {
    const { senderName, message, title } = await req.json();

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: subscriptions } = await supabase.from("push_subscriptions").select("*");

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
    }

    const payload = JSON.stringify({
      title: title || `${senderName} is here 💙`,
      body: message || `${senderName} just opened Vally`,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: "/" },
    });

    let sent = 0;
    for (const sub of subscriptions) {
      try {
        const res = await sendWebPush({ endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth }, payload);
        if (res.status === 410 || res.status === 404) {
          // Subscription expired — remove it
          await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
        } else {
          sent++;
        }
      } catch (e) {
        console.error("Push failed for", sub.endpoint, e);
      }
    }

    return new Response(JSON.stringify({ sent }), { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
  }
});
