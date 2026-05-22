import LegalFooter from "./LegalFooter";

export default function Confidentialite() {
  const box = {background:"#eef2ff", borderRadius:"0.75rem", padding:"1rem 1.25rem", fontSize:"0.9rem", lineHeight:2 as number, marginBottom:"0.75rem"};
  const green = {background:"#f0fdf4", border:"1px solid #86efac", borderRadius:"0.75rem", padding:"1rem 1.25rem", fontSize:"0.9rem", lineHeight:2 as number, marginBottom:"0.75rem"};
  const p = {lineHeight:1.8, marginBottom:"0.75rem", fontSize:"0.95rem"};
  const h2 = {fontSize:"1.1rem", fontWeight:700, color:"#4f46e5", borderBottom:"2px solid #e0e7ff", paddingBottom:"0.4rem", marginBottom:"1rem"};
  return (
    <div style={{minHeight:"100vh", display:"flex", flexDirection:"column", background:"#fff"}}>
      <main style={{flex:1, maxWidth:"720px", margin:"0 auto", width:"100%", padding:"2.5rem 1rem", color:"#1f2937"}}>
        <div style={{textAlign:"center", marginBottom:"2.5rem"}}>
          <span style={{display:"inline-block", background:"#4f46e5", color:"#fff", fontSize:"0.65rem", fontWeight:700, padding:"0.2rem 0.75rem", borderRadius:"999px", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:"0.75rem"}}>Section 3</span>
          <h1 style={{fontSize:"1.8rem", fontWeight:800, color:"#4f46e5", marginBottom:"0.25rem"}}>Politique de Confidentialité</h1>
          <p style={{fontSize:"0.8rem", color:"#9ca3af"}}>Conforme aux directives ARTCI — Mise à jour : Mai 2025</p>
        </div>

        <section style={{marginBottom:"2rem"}}><h2 style={h2}>Article 1 — Cadre Légal et Engagement</h2>
          <p style={p}><strong>BAC MASTER ELITE</strong> s'engage à protéger la vie privée de ses utilisateurs conformément aux exigences de l'<strong>Autorité de Régulation des Télécommunications/TIC de Côte d'Ivoire (ARTCI)</strong> et aux dispositions légales applicables en matière de protection des données personnelles.</p>
        </section>

        <section style={{marginBottom:"2rem"}}><h2 style={h2}>Article 2 — Données Collectées à l'Inscription</h2>
          <div style={box}>
            <div>👤 <strong>Nom et Prénom</strong> — identification de l'utilisateur</div>
            <div>📧 <strong>Adresse e-mail</strong> — connexion et communications</div>
            <div>📚 <strong>Série du Baccalauréat</strong> (A, C, D...) — personnalisation du contenu pédagogique</div>
          </div>
          <p style={p}>Ces données ne sont jamais utilisées à des fins commerciales ou publicitaires.</p>
        </section>

        <section style={{marginBottom:"2rem"}}><h2 style={h2}>Article 3 — Données de Progression Pédagogique</h2>
          <div style={box}>
            <div>📊 <strong>Scores aux quiz et exercices</strong></div>
            <div>📖 <strong>Fiches de révision consultées</strong></div>
            <div>⏱️ <strong>Temps de session et progression par matière</strong></div>
          </div>
          <p style={p}><strong>Finalité exclusive :</strong> personnalisation de l'expérience pédagogique et suivi de progression. Ces données ne sont en aucun cas transmises à des tiers.</p>
        </section>

        <section style={{marginBottom:"2rem"}}><h2 style={h2}>Article 4 — Conservation et Sécurité</h2>
          <p style={p}>Les données sont conservées pendant la durée de vie du compte et supprimées dans un délai de <strong>30 jours</strong> après toute demande de clôture. La sécurité est assurée via les infrastructures de <strong>Supabase</strong>.</p>
        </section>

        <section style={{marginBottom:"2rem"}}><h2 style={h2}>Article 5 — Vos Droits</h2>
          <div style={green}>
            <div>✅ <strong>Droit d'accès</strong> — obtenir une copie de vos données</div>
            <div>✅ <strong>Droit de rectification</strong> — corriger des données inexactes</div>
            <div>✅ <strong>Droit à l'effacement</strong> — suppression définitive du compte et de toutes les données</div>
          </div>
          <p style={p}>Pour exercer ces droits : <strong>bacmasterelite@gmail.com</strong> — Délai de traitement : <strong>30 jours maximum</strong>.</p>
        </section>

        <section style={{marginBottom:"2rem"}}><h2 style={h2}>Article 6 — Cookies</h2>
          <p style={p}>L'Application utilise uniquement des cookies techniques strictement nécessaires à son fonctionnement (authentification, session). Aucun cookie publicitaire n'est utilisé.</p>
        </section>

        <section style={{marginBottom:"2rem"}}><h2 style={h2}>Article 7 — Modifications</h2>
          <p style={p}>L'Éditeur peut modifier cette politique à tout moment. Les utilisateurs seront informés de toute modification substantielle par e-mail ou notification dans l'Application.</p>
        </section>

        <section style={{marginBottom:"2rem"}}><h2 style={h2}>Article 8 — Contact</h2>
          <div style={box}>📧 <strong>bacmasterelite@gmail.com</strong></div>
        </section>
      </main>
      <LegalFooter />
    </div>
  );
}
