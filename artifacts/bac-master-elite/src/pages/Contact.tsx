import { useState } from "react";
import LegalFooter from "./LegalFooter";

export default function Contact() {
  const [envoye, setEnvoye] = useState(false);
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sujet = encodeURIComponent(`Contact BAC MASTER ELITE - ${nom}`);
    const corps = encodeURIComponent(`Nom: ${nom}\nEmail: ${email}\n\nMessage:\n${message}`);
    window.location.href = `mailto:bacmasterelite@gmail.com?subject=${sujet}&body=${corps}`;
    setEnvoye(true);
  };

  const inputStyle = {
    width: "100%",
    padding: "0.75rem 1rem",
    borderRadius: "0.5rem",
    border: "1px solid #e0e7ff",
    fontSize: "0.95rem",
    marginBottom: "1rem",
    boxSizing: "border-box" as const,
  };

  return (
    <div style={{minHeight:"100vh", display:"flex", flexDirection:"column", background:"#fff"}}>
      <main style={{flex:1, maxWidth:"720px", margin:"0 auto", width:"100%", padding:"2.5rem 1rem", color:"#1f2937"}}>
        <div style={{textAlign:"center", marginBottom:"2.5rem"}}>
          <span style={{display:"inline-block", background:"#4f46e5", color:"#fff", fontSize:"0.65rem", fontWeight:700, padding:"0.2rem 0.75rem", borderRadius:"999px", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:"0.75rem"}}>Contact</span>
          <h1 style={{fontSize:"1.8rem", fontWeight:800, color:"#4f46e5", marginBottom:"0.25rem"}}>Nous Contacter</h1>
          <p style={{fontSize:"0.9rem", color:"#6b7280"}}>Une question, une suggestion ? Écrivez-nous.</p>
        </div>

        <div style={{background:"#eef2ff", borderRadius:"0.75rem", padding:"1rem 1.25rem", fontSize:"0.9rem", lineHeight:2, marginBottom:"2rem"}}>
          <div>📧 <strong>Email :</strong> <a href="mailto:bacmasterelite@gmail.com" style={{color:"#4f46e5"}}>bacmasterelite@gmail.com</a></div>
          <div>📱 <strong>Téléphone :</strong> 05 01 74 04 25</div>
          <div>📍 <strong>Localisation :</strong> Daloa, Côte d'Ivoire</div>
          <div>⏱️ <strong>Délai de réponse :</strong> 48 heures ouvrées</div>
        </div>

        {envoye ? (
          <div style={{background:"#f0fdf4", border:"1px solid #86efac", borderRadius:"0.75rem", padding:"1.5rem", textAlign:"center"}}>
            <p style={{fontSize:"1rem", color:"#166534", fontWeight:600}}>✅ Votre client email s'est ouvert avec votre message pré-rempli.</p>
            <p style={{fontSize:"0.9rem", color:"#166534", marginTop:"0.5rem"}}>Il ne reste plus qu'à cliquer sur "Envoyer" dans votre application email.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label style={{fontSize:"0.85rem", fontWeight:600, color:"#374151"}}>Nom complet</label>
            <input
              type="text"
              required
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              style={inputStyle}
              placeholder="Votre nom"
            />
            <label style={{fontSize:"0.85rem", fontWeight:600, color:"#374151"}}>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              placeholder="votre@email.com"
            />
            <label style={{fontSize:"0.85rem", fontWeight:600, color:"#374151"}}>Message</label>
            <textarea
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{...inputStyle, minHeight:"120px", resize:"vertical" as const}}
              placeholder="Votre message..."
            />
            <button
              type="submit"
              style={{
                background:"#4f46e5",
                color:"#fff",
                border:"none",
                borderRadius:"0.5rem",
                padding:"0.75rem 2rem",
                fontSize:"0.95rem",
                fontWeight:600,
                cursor:"pointer",
                width:"100%",
              }}
            >
              Envoyer le message
            </button>
          </form>
        )}
      </main>
      <LegalFooter />
    </div>
  );
}
