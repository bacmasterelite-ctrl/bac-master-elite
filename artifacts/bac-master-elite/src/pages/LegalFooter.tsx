import { Link } from "wouter";

export default function LegalFooter() {
  return (
    <footer style={{marginTop:"3rem", borderTop:"1px solid #e5e7eb", background:"#f9fafb", padding:"1.5rem 1rem"}}>
      <div style={{maxWidth:"700px", margin:"0 auto", display:"flex", flexDirection:"column", alignItems:"center", gap:"0.5rem"}}>
        <p style={{fontSize:"0.7rem", color:"#9ca3af", textTransform:"uppercase", letterSpacing:"0.05em", fontWeight:600, margin:0}}>
          BAC MASTER ELITE © {new Date().getFullYear()} — Tous droits réservés
        </p>
        <nav style={{display:"flex", flexWrap:"wrap", justifyContent:"center", gap:"0.5rem 1rem"}}>
          <Link to="/mentions-legales" style={{fontSize:"0.75rem", color:"#4f46e5", textDecoration:"underline"}}>Mentions Légales</Link>
          <span style={{fontSize:"0.75rem", color:"#d1d5db"}}>·</span>
          <Link to="/cgu" style={{fontSize:"0.75rem", color:"#4f46e5", textDecoration:"underline"}}>CGU / CGV</Link>
          <span style={{fontSize:"0.75rem", color:"#d1d5db"}}>·</span>
          <Link to="/confidentialite" style={{fontSize:"0.75rem", color:"#4f46e5", textDecoration:"underline"}}>Politique de Confidentialité</Link>
        </nav>
        <p style={{fontSize:"0.7rem", color:"#9ca3af", textAlign:"center", margin:0}}>
          Application conforme aux directives de l'ARTCI — République de Côte d'Ivoire
        </p>
      </div>
    </footer>
  );
}
