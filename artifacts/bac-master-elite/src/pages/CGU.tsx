import LegalFooter from "./LegalFooter";

export default function CGU() {
  const box = {background:"#eef2ff", borderRadius:"0.75rem", padding:"1rem 1.25rem", fontSize:"0.9rem", lineHeight:2 as number, marginBottom:"0.75rem"};
  const warn = {background:"#fef3c7", border:"1px solid #f59e0b", borderRadius:"0.75rem", padding:"1rem 1.25rem", fontSize:"0.9rem", lineHeight:2 as number, marginBottom:"0.75rem"};
  const green = {background:"#f0fdf4", border:"1px solid #86efac", borderRadius:"0.75rem", padding:"1rem 1.25rem", fontSize:"0.9rem", lineHeight:2 as number, marginBottom:"0.75rem"};
  const p = {lineHeight:1.8, marginBottom:"0.75rem", fontSize:"0.95rem"};
  const h2 = {fontSize:"1.1rem", fontWeight:700, color:"#4f46e5", borderBottom:"2px solid #e0e7ff", paddingBottom:"0.4rem", marginBottom:"1rem"};
  
  return (
    <div style={{minHeight:"100vh", display:"flex", flexDirection:"column", background:"#fff"}}>
      <main style={{flex:1, maxWidth:"720px", margin:"0 auto", width:"100%", padding:"2.5rem 1rem", color:"#1f2937"}}>
        <div style={{textAlign:"center", marginBottom:"2.5rem"}}>
          <span style={{display:"inline-block", background:"#4f46e5", color:"#fff", fontSize:"0.65rem", fontWeight:700, padding:"0.2rem 0.75rem", borderRadius:"999px", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:"0.75rem"}}>Section 2</span>
          <h1 style={{fontSize:"1.8rem", fontWeight:800, color:"#4f46e5", marginBottom:"0.25rem"}}>Conditions Générales d'Utilisation et de Vente</h1>
          <p style={{fontSize:"0.8rem", color:"#9ca3af"}}>Application BAC MASTER ELITE — Dernière mise à jour : Juillet 2026</p>
        </div>

        {/* Article 1 — Définitions */}
        <section style={{marginBottom:"2rem"}}>
          <h2 style={h2}>Article 1 — Définitions</h2>
          <p style={p}>Dans les présentes CGU/CGV, les termes suivants ont la signification ci-après :</p>
          <div style={box}>
            <div><strong>Application :</strong> désigne l'application mobile et web <strong>BAC MASTER ELITE</strong>.</div>
            <div><strong>Éditeur :</strong> désigne le créateur et exploitant de l'Application.</div>
            <div><strong>Utilisateur :</strong> désigne toute personne physique utilisant l'Application.</div>
            <div><strong>Compte Premium :</strong> désigne l'abonnement payant donnant accès à l'intégralité des contenus.</div>
            <div><strong>Contenus :</strong> désigne l'ensemble des cours, exercices, fiches et fonctionnalités de l'Application.</div>
          </div>
        </section>

        {/* Article 2 — Objet et Champ d'Application */}
        <section style={{marginBottom:"2rem"}}>
          <h2 style={h2}>Article 2 — Objet et Champ d'Application</h2>
          <p style={p}>Les présentes CGU/CGV régissent l'accès et l'utilisation de l'application <strong>BAC MASTER ELITE</strong>, plateforme numérique de soutien scolaire destinée aux élèves des classes de Terminale en République de Côte d'Ivoire. L'utilisation de l'Application vaut acceptation pleine et entière des présentes conditions.</p>
          <div style={warn}>
            <strong>⚠️ ACCEPTATION :</strong> En créant un compte ou en utilisant l'Application, vous reconnaissez avoir pris connaissance des présentes CGU/CGV et les accepter sans réserve.
          </div>
        </section>

        {/* Article 3 — Public Cible et Conditions d'Accès */}
        <section style={{marginBottom:"2rem"}}>
          <h2 style={h2}>Article 3 — Public Cible et Conditions d'Accès</h2>
          <p style={p}>L'Application est exclusivement destinée aux élèves en classe de Terminale en Côte d'Ivoire, toutes séries confondues (A, C, D, G, etc.).</p>
          <p style={p}>L'utilisateur doit :</p>
          <ul style={{lineHeight:1.8, paddingLeft:"1.5rem", marginBottom:"0.75rem"}}>
            <li>Être âgé d'au moins <strong>13 ans</strong> (ou 16 ans selon la réglementation applicable),</li>
            <li>Fournir des informations exactes et à jour lors de l'inscription,</li>
            <li>Ne pas créer plusieurs comptes pour contourner les limitations de l'offre gratuite.</li>
          </ul>
          <p style={p}>Tout compte créé avec de fausses informations pourra être suspendu sans préavis.</p>
        </section>

        {/* Article 4 — Modèle Économique Freemium */}
        <section style={{marginBottom:"2rem"}}>
          <h2 style={h2}>Article 4 — Modèle Économique Freemium</h2>
          <div style={box}>
            <div>🆓 <strong>Accès Gratuit :</strong> Un ensemble de fonctionnalités et contenus pédagogiques de base est accessible gratuitement à tout utilisateur inscrit.</div>
            <div>💎 <strong>Accès Premium :</strong> L'accès complet aux cours, exercices avancés, fiches téléchargeables et fonctionnalités exclusives nécessite un abonnement payant ou un achat individuel.</div>
          </div>
          <p style={p}>Les tarifs sont affichés dans l'Application et peuvent évoluer sans affecter les abonnements en cours. Les abonnements sont souscrits pour une durée déterminée (1 mois, 3 mois, 6 mois, 12 mois).</p>
        </section>

        {/* Article 5 — Paiement et Sécurité des Transactions */}
        <section style={{marginBottom:"2rem"}}>
          <h2 style={h2}>Article 5 — Paiement et Sécurité des Transactions</h2>
          <p style={p}>Toutes les transactions sont gérées et sécurisées par <strong>GeniusPay</strong>, agrégateur de paiement agréé, incluant :</p>
          <div style={box}>
            <div>Orange Money · MTN Mobile Money (MoMo) · Wave · Moov Money</div>
            <div>et toutes les solutions Mobile Money disponibles en Côte d'Ivoire.</div>
          </div>
          <p style={p}>L'Éditeur ne collecte, ne stocke ni ne traite directement aucune donnée bancaire.</p>
          <div style={warn}>
            <strong>💰 POLITIQUE DE REMBOURSEMENT :</strong> Les paiements sont définitifs et non remboursables, sauf erreur technique avérée signalée sous <strong>48h</strong> à <strong>bacmasterelite@gmail.com</strong>. L'Éditeur examinera chaque demande au cas par cas.
          </div>
        </section>

        {/* Article 6 — Abonnement et Résiliation */}
        <section style={{marginBottom:"2rem"}}>
          <h2 style={h2}>Article 6 — Abonnement et Résiliation</h2>
          <p style={p}><strong>Renouvellement :</strong> Les abonnements Premium sont renouvelés automatiquement à l'issue de chaque période, sauf résiliation exprimée par l'utilisateur.</p>
          <p style={p}><strong>Résiliation par l'utilisateur :</strong> L'utilisateur peut résilier son abonnement à tout moment via l'Application ou par email à <strong>bacmasterelite@gmail.com</strong>.</p>
          <p style={p}><strong>Résiliation par l'Éditeur :</strong> L'Éditeur peut suspendre ou résilier sans préavis tout compte violant les présentes CGU/CGV. Aucun remboursement ne sera effectué en cas de résiliation pour non-respect des conditions.</p>
        </section>

        {/* Article 7 — Propriété Intellectuelle et Interdictions */}
        <section style={{marginBottom:"2rem"}}>
          <h2 style={h2}>Article 7 — Propriété Intellectuelle et Interdictions</h2>
          <div style={warn}>
            <strong>⚠️ AVERTISSEMENT LÉGAL :</strong> Tous les contenus (cours, exercices, algorithmes, fiches, interfaces, graphismes) sont protégés par le droit de la propriété intellectuelle applicable en Côte d'Ivoire et dans l'espace OAPI/CEDEAO.
          </div>
          <p style={p}>Sont <strong>formellement interdits</strong> sous peine de poursuites judiciaires et résiliation immédiate :</p>
          <div style={box}>
            <div>❌ Copie ou reproduction non autorisée des contenus</div>
            <div>❌ Téléchargement illégal de ressources protégées</div>
            <div>❌ Partage d'identifiants de compte Premium entre plusieurs élèves</div>
            <div>❌ Revente ou redistribution des contenus à des tiers</div>
            <div>❌ Ingénierie inverse des algorithmes ou fonctionnalités</div>
          </div>
        </section>

        {/* Article 8 — Limitation de Responsabilité */}
        <section style={{marginBottom:"2rem"}}>
          <h2 style={h2}>Article 8 — Limitation de Responsabilité</h2>
          <div style={warn}>
            <strong>📌 IMPORTANT :</strong> BAC MASTER ELITE est un outil de soutien scolaire rigoureux. Il ne constitue en aucun cas une garantie de réussite automatique au Baccalauréat ivoirien.
          </div>
          <p style={p}>L'Éditeur ne saurait être tenu responsable :</p>
          <ul style={{lineHeight:1.8, paddingLeft:"1.5rem", marginBottom:"0.75rem"}}>
            <li>Des résultats scolaires de l'utilisateur,</li>
            <li>Des interruptions temporaires de service dues à la maintenance,</li>
            <li>Des cas de force majeure (incendie, catastrophe naturelle, panne réseau, etc.),</li>
            <li>Des dommages indirects résultant de l'utilisation de l'Application.</li>
          </ul>
        </section>

        {/* Article 9 — Données Personnelles */}
        <section style={{marginBottom:"2rem"}}>
          <h2 style={h2}>Article 9 — Données Personnelles</h2>
          <p style={p}>Les données personnelles collectées sont traitées conformément à notre <a href="/confidentialite" style={{color:"#4f46e5"}}>Politique de Confidentialité</a>, en accord avec le RGPD et la législation ivoirienne.</p>
          <div style={green}>
            <strong>🔒 ENGAGEMENT :</strong> Les données des utilisateurs ne sont jamais vendues ni transmises à des tiers à des fins commerciales.
          </div>
        </section>

        {/* Article 10 — Modification des CGU */}
        <section style={{marginBottom:"2rem"}}>
          <h2 style={h2}>Article 10 — Modification des CGU/CGV</h2>
          <p style={p}>L'Éditeur se réserve le droit de modifier les présentes CGU/CGV à tout moment. Les utilisateurs seront informés des modifications significatives par email ou via une notification dans l'Application. Les modifications entrent en vigueur dès leur publication.</p>
        </section>

        {/* Article 11 — Droit Applicable et Juridiction */}
        <section style={{marginBottom:"2rem"}}>
          <h2 style={h2}>Article 11 — Droit Applicable et Juridiction</h2>
          <p style={p}>Les présentes CGU/CGV sont régies par le droit ivoirien. En cas de litige, une solution amiable sera recherchée avant toute procédure judiciaire. À défaut, les juridictions compétentes de la République de Côte d'Ivoire sont seules compétentes.</p>
        </section>

        {/* Article 12 — Contact */}
        <section style={{marginBottom:"2rem"}}>
          <h2 style={h2}>Article 12 — Contact</h2>
          <p style={p}>Pour toute question relative aux présentes CGU/CGV :</p>
          <div style={box}>
            <div>📧 <strong>Email :</strong> <a href="mailto:bacmasterelite@gmail.com" style={{color:"#4f46e5"}}>bacmasterelite@gmail.com</a></div>
            <div>⏱️ <strong>Délai de réponse :</strong> 48 heures ouvrées</div>
          </div>
        </section>
      </main>
      <LegalFooter />
    </div>
  );
}