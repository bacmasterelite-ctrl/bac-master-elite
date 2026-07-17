import LegalFooter from "./LegalFooter";

export default function Confidentialite() {
  const box = {background:"#eef2ff", borderRadius:"0.75rem", padding:"1rem 1.25rem", fontSize:"0.9rem", lineHeight:2 as number, marginBottom:"0.75rem"};
  const green = {background:"#f0fdf4", border:"1px solid #86efac", borderRadius:"0.75rem", padding:"1rem 1.25rem", fontSize:"0.9rem", lineHeight:2 as number, marginBottom:"0.75rem"};
  const yellow = {background:"#fef9e7", border:"1px solid #fcd34d", borderRadius:"0.75rem", padding:"1rem 1.25rem", fontSize:"0.9rem", lineHeight:2 as number, marginBottom:"0.75rem"};
  const p = {lineHeight:1.8, marginBottom:"0.75rem", fontSize:"0.95rem"};
  const h2 = {fontSize:"1.1rem", fontWeight:700, color:"#4f46e5", borderBottom:"2px solid #e0e7ff", paddingBottom:"0.4rem", marginBottom:"1rem"};
  
  return (
    <div style={{minHeight:"100vh", display:"flex", flexDirection:"column", background:"#fff"}}>
      <main style={{flex:1, maxWidth:"720px", margin:"0 auto", width:"100%", padding:"2.5rem 1rem", color:"#1f2937"}}>
        <div style={{textAlign:"center", marginBottom:"2.5rem"}}>
          <span style={{display:"inline-block", background:"#4f46e5", color:"#fff", fontSize:"0.65rem", fontWeight:700, padding:"0.2rem 0.75rem", borderRadius:"999px", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:"0.75rem"}}>Section 3</span>
          <h1 style={{fontSize:"1.8rem", fontWeight:800, color:"#4f46e5", marginBottom:"0.25rem"}}>Politique de Confidentialité</h1>
          <p style={{fontSize:"0.8rem", color:"#9ca3af"}}>Conforme au RGPD et aux directives ARTCI — Mise à jour : Juillet 2026</p>
        </div>

        <section style={{marginBottom:"2rem"}}>
          <h2 style={h2}>Article 1 — Cadre Légal et Engagement</h2>
          <p style={p}><strong>BAC MASTER ELITE</strong> s'engage à protéger la vie privée de ses utilisateurs conformément :</p>
          <ul style={{lineHeight:1.8, paddingLeft:"1.5rem", marginBottom:"0.75rem"}}>
            <li>Au <strong>Règlement Général sur la Protection des Données (RGPD)</strong> de l'Union Européenne,</li>
            <li>À la <strong>Loi n°2013-450 du 19 juin 2013</strong> relative à la protection des données personnelles en Côte d'Ivoire,</li>
            <li>Aux directives de l'<strong>Autorité de Régulation des Télécommunications/TIC (ARTCI)</strong>.</li>
          </ul>
        </section>

        <section style={{marginBottom:"2rem"}}>
          <h2 style={h2}>Article 2 — Base Légale du Traitement</h2>
          <p style={p}>Le traitement de vos données personnelles repose sur les bases légales suivantes :</p>
          <ul style={{lineHeight:1.8, paddingLeft:"1.5rem"}}>
            <li><strong>Votre consentement</strong> explicite lors de l'inscription,</li>
            <li><strong>L'exécution du contrat</strong> d'utilisation de l'Application,</li>
            <li><strong>L'intérêt légitime</strong> de l'Éditeur à améliorer ses services.</li>
          </ul>
        </section>

        <section style={{marginBottom:"2rem"}}>
          <h2 style={h2}>Article 3 — Données Collectées à l'Inscription</h2>
          <div style={box}>
            <div>👤 <strong>Nom et Prénom</strong> — identification de l'utilisateur</div>
            <div>📧 <strong>Adresse e-mail</strong> — connexion et communications</div>
            <div>📚 <strong>Série du Baccalauréat</strong> (A, C, D, etc.) — personnalisation du contenu</div>
          </div>
          <p style={p}>Ces données ne sont jamais utilisées à des fins commerciales ou publicitaires sans votre consentement explicite.</p>
        </section>

        <section style={{marginBottom:"2rem"}}>
          <h2 style={h2}>Article 4 — Données de Progression Pédagogique</h2>
          <div style={box}>
            <div>📊 <strong>Scores aux quiz et exercices</strong></div>
            <div>📖 <strong>Fiches de révision consultées</strong></div>
            <div>⏱️ <strong>Temps de session et progression par matière</strong></div>
            <div>📈 <strong>Historique des performances</strong></div>
          </div>
          <p style={p}><strong>Finalité exclusive :</strong> personnalisation de l'expérience pédagogique et suivi de progression. Ces données ne sont en aucun cas transmises à des tiers.</p>
        </section>

        <section style={{marginBottom:"2rem"}}>
          <h2 style={h2}>Article 5 — Sous-traitants et Transferts de Données</h2>
          <p style={p}>Les données sont hébergées par les prestataires suivants :</p>
          <div style={box}>
            <div><strong>Hébergement (Front-end) :</strong> Vercel Inc. — 340 Pine Street, Suite 701, San Francisco, CA 94104, États-Unis</div>
            <div><strong>Base de données :</strong> Supabase Inc. — <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" style={{color:"#4f46e5"}}>supabase.com</a></div>
          </div>
          <p style={p}>Ces prestataires sont situés hors de Côte d'Ivoire. Les transferts de données sont encadrés par les clauses contractuelles types de l'Union Européenne.</p>
        </section>

        <section style={{marginBottom:"2rem"}}>
          <h2 style={h2}>Article 6 — Conservation et Sécurité</h2>
          <p style={p}>Les données sont conservées pendant la durée de votre utilisation active de l'Application. En cas d'inactivité prolongée (1 an), votre compte pourra être suspendu.</p>
          <p style={p}>À la clôture de votre compte, les données sont supprimées dans un délai <strong>maximum de 30 jours</strong>.</p>
          <div style={green}>
            <strong>🔒 Mesures de sécurité :</strong>
            <ul style={{paddingLeft:"1.5rem"}}>
              <li>Chiffrement des données en transit (HTTPS)</li>
              <li>Authentification sécurisée</li>
              <li>Accès restreint aux données</li>
              <li>Hébergement sécurisé (Vercel / Supabase)</li>
            </ul>
          </div>
        </section>

        <section style={{marginBottom:"2rem"}}>
          <h2 style={h2}>Article 7 — Vos Droits</h2>
          <p style={p}>Conformément à la réglementation, vous disposez des droits suivants :</p>
          <div style={green}>
            <div>✅ <strong>Droit d'accès</strong> — obtenir une copie de vos données</div>
            <div>✅ <strong>Droit de rectification</strong> — corriger des données inexactes</div>
            <div>✅ <strong>Droit à l'effacement</strong> — suppression de votre compte et de vos données</div>
            <div>✅ <strong>Droit à la portabilité</strong> — recevoir vos données dans un format structuré</div>
            <div>✅ <strong>Droit d'opposition</strong> — vous opposer au traitement de vos données</div>
            <div>✅ <strong>Droit de retirer votre consentement</strong> — à tout moment</div>
          </div>
          <p style={p}>Pour exercer ces droits : <strong style={{color:"#4f46e5"}}>bacmasterelite@gmail.com</strong> — Délai de traitement : <strong>30 jours maximum</strong>.</p>
        </section>

        <section style={{marginBottom:"2rem"}}>
          <h2 style={h2}>Article 8 — Cookies</h2>
          <p style={p}>L'Application utilise différents types de cookies :</p>
          <div style={box}>
            <div>🍪 <strong>Cookies techniques :</strong> nécessaires au fonctionnement (authentification, session)</div>
            <div>📊 <strong>Cookies de mesure d'audience :</strong> pour améliorer l'application (Google Analytics)</div>
            <div>📢 <strong>Cookies publicitaires :</strong> pour la monétisation (Google AdSense, si applicable)</div>
          </div>
          <p style={p}>Vous pouvez gérer vos préférences de cookies via la bannière de consentement affichée lors de votre première visite.</p>
        </section>

        <section style={{marginBottom:"2rem"}}>
          <h2 style={h2}>Article 9 — Modifications</h2>
          <p style={p}>L'Éditeur peut modifier cette politique à tout moment. Les utilisateurs seront informés de toute modification substantielle par e-mail ou notification dans l'Application. La date de la dernière mise à jour est indiquée en haut de cette page.</p>
        </section>

        <section style={{marginBottom:"2rem"}}>
          <h2 style={h2}>Article 10 — Contact</h2>
          <p style={p}>Pour toute question relative à cette Politique de Confidentialité ou à vos données personnelles :</p>
          <div style={box}>
            <div>📧 <strong>Email :</strong> <a href="mailto:bacmasterelite@gmail.com" style={{color:"#4f46e5"}}>bacmasterelite@gmail.com</a></div>
            <div>📝 <strong>Formulaire de contact :</strong> <a href="/contact" style={{color:"#4f46e5"}}>Disponible sur le site</a></div>
            <div>⏱️ <strong>Délai de réponse :</strong> 48 heures ouvrées</div>
          </div>
        </section>
      </main>
      <LegalFooter />
    </div>
  );
}
