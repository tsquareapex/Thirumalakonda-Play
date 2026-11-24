// Supabase Edge Function: send a PDF (invoice / statement / report) to a customer or supplier on WhatsApp
// using the WhatsApp Business Cloud API. Secrets stay on the server - never in the web page.
//
// Required secrets (Supabase dashboard -> Edge Functions -> Secrets):
//   WHATSAPP_TOKEN            permanent access token of your Meta system user
//   WHATSAPP_PHONE_NUMBER_ID  the "Phone number ID" of the sending number (9440026692)
// Optional:
//   WHATSAPP_TEMPLATE         approved template name (header = Document, body has 2 variables). Needed to message
//                             customers who have not written to you in the last 24 hours. Leave empty to send a plain
//                             document message (works only inside the 24-hour window, handy for testing).
//   WHATSAPP_TEMPLATE_LANG    template language code, default "en"
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });
const GRAPH = "https://graph.facebook.com/v21.0";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    // only signed-in staff may send
    const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: { user } } = await supa.auth.getUser();
    if (!user) return json({ ok: false, error: "Not signed in" }, 401);

    const token = Deno.env.get("WHATSAPP_TOKEN"), pid = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
    if (!token || !pid) return json({ ok: false, error: "WhatsApp is not configured yet (missing WHATSAPP_TOKEN / WHATSAPP_PHONE_NUMBER_ID)" });

    const { to, name, text, filename, pdf } = await req.json();
    if (!/^91\d{10}$/.test(String(to))) return json({ ok: false, error: "Invalid WhatsApp number" });
    if (!pdf || String(pdf).length > 7_000_000) return json({ ok: false, error: "PDF missing or too large" });
    const file = String(filename || "document.pdf").replace(/[^\w.\- ]/g, "_");

    // 1) upload the PDF to WhatsApp
    const bin = Uint8Array.from(atob(pdf), (c) => c.charCodeAt(0));
    const fd = new FormData();
    fd.append("messaging_product", "whatsapp");
    fd.append("type", "application/pdf");
    fd.append("file", new Blob([bin], { type: "application/pdf" }), file);
    const up = await fetch(`${GRAPH}/${pid}/media`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
    const upj = await up.json();
    if (!up.ok || !upj.id) return json({ ok: false, error: "Upload failed: " + (upj?.error?.message ?? up.status) });

    // 2) send it
    const clean = (t: string, max: number) => String(t ?? "").replace(/[\r\n\t]+/g, " ").replace(/ {2,}/g, " ").trim().slice(0, max);
    const tpl = Deno.env.get("WHATSAPP_TEMPLATE");
    const message = tpl
      ? {
        messaging_product: "whatsapp", to, type: "template",
        template: {
          name: tpl, language: { code: Deno.env.get("WHATSAPP_TEMPLATE_LANG") || "en" },
          components: [
            { type: "header", parameters: [{ type: "document", document: { id: upj.id, filename: file } }] },
            { type: "body", parameters: [{ type: "text", text: clean(name, 60) || "Customer" }, { type: "text", text: clean(text, 900) || "Please find your document attached." }] },
          ],
        },
      }
      : { messaging_product: "whatsapp", to, type: "document", document: { id: upj.id, filename: file, caption: String(text ?? "").slice(0, 1000) } };
    const r = await fetch(`${GRAPH}/${pid}/messages`, {
      method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(message),
    });
    const rj = await r.json();
    if (!r.ok) return json({ ok: false, error: rj?.error?.message ?? "WhatsApp rejected the message" });
    return json({ ok: true, id: rj?.messages?.[0]?.id });
  } catch (e) {
    return json({ ok: false, error: String((e as Error).message ?? e) });
  }
});
