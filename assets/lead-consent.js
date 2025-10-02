/* VistaIFS lead + consent bundle v11
   - Shows simple cookie/consent banner
   - Sends consent + lead events to Google Apps Script endpoint
   - Adds floating "Privacy • Cookies" links
   - (Optional) loads Tawk.to chat AFTER consent (replace YOUR_TAWK_PROPERTY_ID)
*/
(function(){
  const ENDPOINT = "https://script.google.com/macros/s/AKfycbwO2FmLWx5Fo4EbFykMJO3XcQaIGHTD_HEl1MPnPWje7UOZK3WvQZYpeoK8gcNZe9za/exec";
  const CONSENT_KEY = "vista_consent";
  const CONSENT_VERSION = "2025-09-11-v1";

  function $(sel, root){ return (root||document).querySelector(sel); }
  function $all(sel, root){ return Array.from((root||document).querySelectorAll(sel)); }

  function parseUTM(){
    const p = new URLSearchParams(location.search);
    const keys = ["utm_source","utm_medium","utm_campaign","utm_term","utm_content"];
    const out = {};
    keys.forEach(k => out[k] = p.get(k) || "");
    return out;
  }

  function saveConsent(){
    const meta = { v: CONSENT_VERSION, t: Date.now() };
    document.cookie = `${CONSENT_KEY}=${encodeURIComponent(JSON.stringify(meta))}; Max-Age=${60*60*24*365}; Path=/; SameSite=Lax`;
  }
  function getConsent(){
    const m = document.cookie.match(new RegExp(`${CONSENT_KEY}=([^;]+)`));
    if(!m) return null;
    try { return JSON.parse(decodeURIComponent(m[1])); } catch(e){ return {v:""}; }
  }

  async function ping(endpoint, payload){
    try{
      await fetch(endpoint, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify(payload),
        mode: "no-cors"
      });
    }catch(e){ /* ignore */ }
  }

  function showBanner(){
    if(getConsent()) return;
    const bar = document.createElement("div");
    bar.setAttribute("id","vista-consent-bar");
    bar.style.cssText = [
      "position:fixed;left:0;right:0;bottom:0;z-index:999999;",
      "background:#0f172a;color:#fff;padding:14px 16px;",
      "display:flex;flex-wrap:wrap;gap:12px;align-items:center;",
      "box-shadow:0 -4px 16px rgba(0,0,0,.2);font:14px/1.4 system-ui,Segoe UI,Roboto,Helvetica,Arial"
    ].join("");
    bar.innerHTML = `
      <div style="flex:1;min-width:260px">
        We use cookies to improve your experience, capture anonymous analytics, and save your preferences.
        See our <a href="/privacy.html" style="color:#93c5fd">Privacy Policy</a> and
        <a href="/cookie-policy.html" style="color:#93c5fd">Cookie Policy</a>.
      </div>
      <div style="display:flex;gap:8px">
        <button id="vista-consent-accept" style="background:#16a34a;border:0;color:#fff;padding:10px 14px;border-radius:8px;cursor:pointer;">Accept</button>
        <a href="/privacy.html" style="color:#93c5fd;padding:10px 8px">Learn more</a>
      </div>`;
    document.body.appendChild(bar);
    $("#vista-consent-accept", bar).addEventListener("click", ()=>{
      saveConsent();
      // Send consent event
      const utm = parseUTM();
      ping(ENDPOINT, {
        type: "consent",
        consent: true,
        page_url: location.href,
        referrer: document.referrer || "",
        timestamp: new Date().toISOString(),
        ...utm
      });
      bar.remove();
      loadChatIfAny();
    });
  }

  function addFloatingLinks(){
    const box = document.createElement("div");
    box.style.cssText = "position:fixed;left:12px;bottom:12px;z-index:999998;background:#f8fafc;border:1px solid #e2e8f0;padding:6px 10px;border-radius:999px;font:12px system-ui,Segoe UI,Roboto;box-shadow:0 2px 8px rgba(0,0,0,.06)";
    box.innerHTML = `<a href="/privacy.html" style="color:#0f172a;text-decoration:none;margin-right:8px">Privacy</a> • <a href="/cookie-policy.html" style="color:#0f172a;text-decoration:none;margin-left:8px">Cookies</a>`;
    document.body.appendChild(box);
  }

  function attachLeadCapture(){
    // Any form with data-lead-form or id="lead-form"
    const forms = $all("form[data-lead-form], form#lead-form");
    if(!forms.length) return;
    forms.forEach(f => {
      f.addEventListener("submit", e => {
        try{
          const fd = new FormData(f);
          const utm = parseUTM();
          const payload = {
            type: "lead",
            timestamp: new Date().toISOString(),
            page_url: location.href,
            referrer: document.referrer || "",
            full_name: fd.get("full_name") || fd.get("name") || "",
            email: fd.get("email") || "",
            phone: fd.get("phone") || "",
            company: fd.get("company") || "",
            message: fd.get("message") || "",
            ...utm
          };
          ping(ENDPOINT, payload);
        }catch(err){ /* ignore */ }
      }, {capture:true});
    });
  }

  function loadChatIfAny(){
    // only after consent
    if(!getConsent()) return;
    const TAWK_ID = "YOUR_TAWK_PROPERTY_ID"; // replace when you have it
    if(TAWK_ID && TAWK_ID !== "YOUR_TAWK_PROPERTY_ID"){
      const s1 = document.createElement("script");
      s1.async = true;
      s1.src = `https://embed.tawk.to/${TAWK_ID}/1`;
      s1.charset = 'UTF-8';
      s1.setAttribute('crossorigin','*');
      document.body.appendChild(s1);
    }
  }

  document.addEventListener("DOMContentLoaded", function(){
    addFloatingLinks();
    attachLeadCapture();
    if(!getConsent()) showBanner(); else loadChatIfAny();
  });
})();