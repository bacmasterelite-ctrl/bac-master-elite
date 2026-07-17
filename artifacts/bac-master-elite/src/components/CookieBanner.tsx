import { useState, useEffect } from "react";

function CookieSettingsModal({ onClose, onSave }: { onClose: () => void; onSave: (prefs: {analytics: boolean; advertising: boolean}) => void }) {
  const [analytics, setAnalytics] = useState(true);
  const [advertising, setAdvertising] = useState(true);

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0,0,0,0.6)",
      zIndex: 10000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1rem",
    }}>
      <div style={{
        background: "#fff",
        borderRadius: "1rem",
        maxWidth: "500px",
        width: "100%",
        padding: "2rem",
        color: "#1f2937",
      }}>
        <h3 style={{marginTop:0, color:"#4f46e5"}}>🍪 Paramètres des cookies</h3>
        <p style={{fontSize:"0.85rem", color:"#6b7280"}}>Vous pouvez choisir les catégories de cookies que vous souhaitez autoriser.</p>

        <div style={{marginTop:"1.5rem"}}>
          <label style={{display:"flex", alignItems:"center", gap:"0.75rem", padding:"0.5rem 0"}}>
            <input type="checkbox" checked disabled />
            <div><strong>Cookies nécessaires</strong> <span style={{fontSize:"0.7rem", color:"#9ca3af"}}>(obligatoire)</span></div>
          </label>
          <p style={{fontSize:"0.75rem", color:"#6b7280", margin:"0 0 0 2rem"}}>Essentiels au fonctionnement du site.</p>

          <label style={{display:"flex", alignItems:"center", gap:"0.75rem", padding:"0.5rem 0"}}>
            <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} />
            <div><strong>Cookies d'analyse</strong></div>
          </label>
          <p style={{fontSize:"0.75rem", color:"#6b7280", margin:"0 0 0 2rem"}}>Nous aident à améliorer le site (ex: Google Analytics).</p>

          <label style={{display:"flex", alignItems:"center", gap:"0.75rem", padding:"0.5rem 0"}}>
            <input type="checkbox" checked={advertising} onChange={(e) => setAdvertising(e.target.checked)} />
            <div><strong>Cookies publicitaires</strong></div>
          </label>
          <p style={{fontSize:"0.75rem", color:"#6b7280", margin:"0 0 0 2rem"}}>Permettent de personnaliser les annonces (ex: Google AdSense).</p>
        </div>

        <div style={{display:"flex", justifyContent:"flex-end", gap:"0.5rem", marginTop:"1.5rem"}}>
          <button onClick={onClose} style={{padding:"0.4rem 1.5rem", background:"transparent", border:"1px solid #d1d5db", borderRadius:"0.5rem", cursor:"pointer"}}>Annuler</button>
          <button onClick={() => onSave({analytics, advertising})} style={{padding:"0.4rem 1.5rem", background:"#4f46e5", color:"#fff", border:"none", borderRadius:"0.5rem", cursor:"pointer"}}>Enregistrer</button>
        </div>
      </div>
    </div>
  );
}

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const acceptAll = () => {
    localStorage.setItem("cookie-consent", "accepted");
    localStorage.setItem("cookie-preferences", JSON.stringify({
      necessary: true,
      analytics: true,
      advertising: true,
    }));
    setIsVisible(false);
  };

  const rejectAll = () => {
    localStorage.setItem("cookie-consent", "rejected");
    localStorage.setItem("cookie-preferences", JSON.stringify({
      necessary: true,
      analytics: false,
      advertising: false,
    }));
    setIsVisible(false);
  };

  const openSettings = () => {
    setShowSettings(true);
  };

  const handleSave = (prefs: {analytics: boolean; advertising: boolean}) => {
    localStorage.setItem("cookie-consent", "custom");
    localStorage.setItem("cookie-preferences", JSON.stringify({
      necessary: true,
      analytics: prefs.analytics,
      advertising: prefs.advertising,
    }));
    setShowSettings(false);
    setIsVisible(false);
  };

  return (
    <>
      {isVisible && (
        <div style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "#1f2937",
          color: "#f9fafb",
          padding: "1rem",
          zIndex: 9999,
          boxShadow: "0 -4px 12px rgba(0,0,0,0.15)",
          borderTop: "2px solid #4f46e5",
        }}>
          <div style={{
            maxWidth: "900px",
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.75rem",
          }}>
            <p style={{
              fontSize: "0.85rem",
              textAlign: "center",
              margin: 0,
              lineHeight: 1.6,
            }}>
              🍪 Nous utilisons des cookies pour améliorer votre expérience,
              analyser notre trafic et personnaliser les annonces publicitaires.
              En cliquant sur "Accepter", vous consentez à l'utilisation de tous les cookies.
              <br />
              <a href="/confidentialite#cookies" style={{color: "#818cf8", textDecoration: "underline", fontSize: "0.75rem"}}>
                En savoir plus
              </a>
            </p>
            <div style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: "0.5rem",
            }}>
              <button onClick={acceptAll} style={{
                background: "#4f46e5",
                color: "#fff",
                border: "none",
                borderRadius: "0.5rem",
                padding: "0.4rem 1.5rem",
                fontWeight: 600,
                fontSize: "0.8rem",
                cursor: "pointer",
              }}>
                Accepter tout
              </button>
              <button onClick={rejectAll} style={{
                background: "transparent",
                color: "#d1d5db",
                border: "1px solid #4b5563",
                borderRadius: "0.5rem",
                padding: "0.4rem 1.5rem",
                fontWeight: 500,
                fontSize: "0.8rem",
                cursor: "pointer",
              }}>
                Refuser tout
              </button>
              <button onClick={openSettings} style={{
                background: "transparent",
                color: "#818cf8",
                border: "none",
                borderRadius: "0.5rem",
                padding: "0.4rem 1.5rem",
                fontWeight: 500,
                fontSize: "0.8rem",
                cursor: "pointer",
                textDecoration: "underline",
              }}>
                Paramétrer
              </button>
            </div>
          </div>
        </div>
      )}
      {showSettings && (
        <CookieSettingsModal onClose={() => setShowSettings(false)} onSave={handleSave} />
      )}
    </>
  );
}
