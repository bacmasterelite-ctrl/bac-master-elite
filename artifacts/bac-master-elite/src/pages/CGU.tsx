import LegalFooter from "./LegalFooter";

export default function CGU() {
  const box = {background:"#eef2ff", borderRadius:"0.75rem", padding:"1rem 1.25rem", fontSize:"0.9rem", lineHeight:2 as number, marginBottom:"0.75rem"};
  const warn = {background:"#fef3c7", border:"1px solid #f59e0b", borderRadius:"0.75rem", padding:"1rem 1.25rem", fontSize:"0.9rem", lineHeight:2 as number, marginBottom:"0.75rem"};
  const p = {lineHeight:1.8, marginBottom:"0.75rem", fontSize:"0.95rem"};
  const h2 = {fontSize:"1.1rem", fontWeight:700, color:"#4f46e5", borderBottom:"2px solid #e0e7ff", paddingBottom:"0.4rem", marginBottom:"1rem"};
  return (
    <div style={{minHeight:"100vh", display:"flex", flexDirection:"column", background:"#fff"}}>
      <main style={{flex:1, maxWidth:"720px", margin:"0 auto", width:"100%", padding:"2.5rem 1rem", color:"#1f2937"}}>
        <div style={{textAlign:"center", marginBottom:"2.5rem"}}>
          <span style={{display:"inline-block", background:"#4f46e5", color:"#fff", fontSize:"0.65rem", fontWeight:700, padding:"0.2rem 0.75rem", borderRadius:"999px", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:"0.75rem"}}>Section 2</span>
          <h1 style={{fontSize:"1.8rem", fontWeight:800, color:"#4f46e5", marginBottom:"0.25rem"}}>Conditions Générales d'Utilisation et de Vente</h1>
          <p style={{fontSize:"0.8rem", color:"#9ca3af"}}>Application BAC MASTER ELITE — Dernière mise à jour : Mai 2025</p>
        </div>

        <section style={{marginBottom:"2rem"}}><h2 style={h2}>Article 1 — Objet et Champ d'Application</h2>
          <p style={p}>Les présentes CGU/CGV régissent l'accès et l'utilisation de l'application <strong>BAC MASTER ELITE</strong>, plateforme numérique de soutien scolaire destinée aux élèves des classes de Terminale en République de Côte d'Ivoire. L'utilisation de l'Application vaut acceptation pleine et entière des présentes conditions.</p>
        </section>

        <section style={{marginBottom:"2rem"}}><h2 style={h2}>Article 2 — Public Cible et Conditions d'Accès</h2>
          <p style={p}>L'Application est exclusivement destinée aux élèves en classe de Terminale en Côte d'Ivoire, toutes séries confondues (A, C, D, etc.). L'utilisateur doit fournir des informations exactes à l'inscription. Tout compte créé avec de fausses informations pourra être suspendu sans préavis.</p>
        </section>

        <section style={{marginBottom:"2rem"}}><h2 style={h2}>Article 3 — Modèle Économique Freemium</h2>
          <div style={box}>
            <div>🆓 <strong>Accès Gratuit :</strong> Un ensemble de fonctionnalités et contenus pédagogiques de base est accessible gratuitement à tout utilisateur inscrit.</div>
            <div>💎 <strong>Accès Premium :</strong> L'accès complet aux cours, exercices avancés, fiches téléchargeables et fonctionnalités exclusives nécessite un abonnement payant ou un achat individuel.</div>
          </div>
          <p style={p}>Les tarifs sont affichés dans l'Application et peuvent évoluer sans affecter les abonnements en cours.</p>
        </section>

        <section style={{marginBottom:"2rem"}}><h2 style={h2}>Article 4 — Paiement et Sécurité des Transactions</h2>
          <p style={p}>Toutes les transactions sont gérées et sécurisées par <strong>GeniusPay</strong>, agrégateur de paiement agréé, incluant :</p>
          <div style={box}>Orange Money · MTN Mobile Money (MoMo) · Wave · Moov Money · et autres solutions Mobile Money disponibles en Côte d'Ivoire.</div>
          <p style={p}>L'Éditeur ne collecte, ne stocke ni ne traite directement aucune donnée bancaire. <strong>Les paiements sont définitifs et non remboursables</strong>, sauf erreur technique signalée sous 48h à <strong>bacmasterelite@gmail.com</strong>.</p>
        </section>

        <section style={{marginBottom:"2rem"}}><h2 style={h2}>Article 5 — Propriété Intellectuelle et Interdictions</h2>
          <div style={warn}>⚠️ <strong>AVERTISSEMENT LÉGAL :</strong> Tous les contenus (cours, exercices, algorithmes, fiches, interfaces) sont protégés par le droit de la propriété intellectuelle applicable en Côte d'Ivoire et dans l'espace OAPI/CEDEAO.</div>
          <p style={p}>Sont <strong>formellement interdits</strong> sous peine de poursuites judiciaires et résiliation immédiate :</p>
          <div style={box}>
            <div>❌ Copie ou reproduction non autorisée des contenus</div>
            <div>❌ Téléchargement illégal de ressources protégées</div>
            <div>❌ Partage d'identifiants de compte Premium entre plusieurs élèves</div>
            <div>❌ Revente ou redistribution des contenus à des tiers</div>
            <div>❌ Ingénierie inverse des algorithmes ou fonctionnalités</div>
          </div>
        </section>

        <section style={{marginBottom:"2rem"}}><h2 style={h2}>Article 6 — Limitation de Responsabilité</h2>
          <div style={warn}>📌 <strong>IMPORTANT :</strong> BAC MASTER ELITE est un outil de soutien scolaire rigoureux. Il ne constitue en aucun cas une garantie de réussite automatique au Baccalauréat ivoirien.</div>
          <p style={p}>L'Éditeur ne saurait être tenu responsable des résultats scolaires de l'utilisateur, ni des interruptions temporaires de service dues à la maintenance ou à des cas de force majeure.</p>
        </section>

        <section style={{marginBottom:"2rem"}}><h2 style={h2}>Article 7 — Résiliation</h2>
          <p style={p}>L'Éditeur peut suspendre ou résilier sans préavis tout compte violant les présentes CGU/CGV. L'utilisateur peut clôturer son compte à tout moment via <strong>bacmasterelite@gmail.com</strong>.</p>
        </section>

        <section style={{marginBottom:"2rem"}}><h2 style={h2}>Article 8 — Droit Applicable</h2>
          <p style={p}>Les présentes CGU/CGV sont régies par le droit ivoirien. Les juridictions compétentes de la République de Côte d'Ivoire sont seules compétentes en cas de litige.</p>
        </section>
      </main>
      <LegalFooter />
    </div>
  );
}
