import LegalFooter from "./LegalFooter";

export default function MentionsLegales() {
  return (
    <div style={{minHeight:"100vh", display:"flex", flexDirection:"column", background:"#fff"}}>
      <main style={{flex:1, maxWidth:"720px", margin:"0 auto", width:"100%", padding:"2.5rem 1rem", color:"#1f2937"}}>
        <div style={{textAlign:"center", marginBottom:"2.5rem"}}>
          <span style={{display:"inline-block", background:"#4f46e5", color:"#fff", fontSize:"0.65rem", fontWeight:700, padding:"0.2rem 0.75rem", borderRadius:"999px", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:"0.75rem"}}>Section 1</span>
          <h1 style={{fontSize:"1.8rem", fontWeight:800, color:"#4f46e5", marginBottom:"0.25rem"}}>Mentions Légales</h1>
          <p style={{fontSize:"0.8rem", color:"#9ca3af"}}>Application BAC MASTER ELITE — Dernière mise à jour : Mai 2025</p>
        </div>

        {[
          {
            titre: "Article 1 — Identification de l'Éditeur",
            contenu: (
              <>
                <p style={{lineHeight:1.8, marginBottom:"0.75rem"}}>L'application mobile et web <strong>BAC MASTER ELITE</strong> est éditée à titre personnel par son créateur, personne physique résidant en République de Côte d'Ivoire, ci-après dénommé « l'Éditeur ».</p>
                <div style={{background:"#eef2ff", borderRadius:"0.75rem", padding:"1rem 1.25rem", fontSize:"0.9rem", lineHeight:2}}>
                  <div><strong>Dénomination :</strong> BAC MASTER ELITE</div>
                  <div><strong>Statut juridique :</strong> Éditeur individuel (personne physique)</div>
                  <div><strong>RCCM / IDU :</strong> <em style={{color:"#9ca3af"}}>En cours d'immatriculation</em></div>
                  <div><strong>Contact :</strong> <a href="mailto:bacmasterelite@gmail.com" style={{color:"#4f46e5"}}>bacmasterelite@gmail.com</a></div>
                </div>
              </>
            )
          },
          {
            titre: "Article 2 — Hébergement",
            contenu: (
              <>
                <p style={{lineHeight:1.8, marginBottom:"0.75rem"}}>L'Application est hébergée par les prestataires techniques suivants :</p>
                <div style={{background:"#eef2ff", borderRadius:"0.75rem", padding:"1rem 1.25rem", fontSize:"0.9rem", lineHeight:2}}>
                  <div><strong>Front-end :</strong> Vercel Inc. — 340 Pine Street, Suite 701, San Francisco, CA 94104, États-Unis</div>
                  <div><strong>Base de données :</strong> Supabase Inc. — <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" style={{color:"#4f46e5"}}>supabase.com</a></div>
                </div>
              </>
            )
          },
          {
            titre: "Article 3 — Propriété Intellectuelle",
            contenu: <p style={{lineHeight:1.8}}>L'ensemble des contenus de l'Application — cours, fiches de révision, exercices, algorithmes pédagogiques, graphismes et interfaces — sont la propriété exclusive de l'Éditeur et protégés par les lois ivoiriennes et internationales. Toute reproduction non autorisée est interdite sous peine de poursuites judiciaires.</p>
          },
          {
            titre: "Article 4 — Responsabilité",
            contenu: <p style={{lineHeight:1.8}}>L'Éditeur s'efforce de fournir des informations pédagogiques exactes et actualisées. Il ne pourra être tenu responsable des erreurs ou omissions dans les contenus, ni des dommages résultant de l'utilisation de l'Application. L'Éditeur se réserve le droit de modifier ou supprimer tout contenu à tout moment.</p>
          },
          {
            titre: "Article 5 — Droit Applicable",
            contenu: <p style={{lineHeight:1.8}}>Les présentes Mentions Légales sont régies par le droit ivoirien. Tout litige relève de la compétence exclusive des juridictions compétentes de la République de Côte d'Ivoire.</p>
          }
        ].map((art, i) => (
          <section key={i} style={{marginBottom:"2rem"}}>
            <h2 style={{fontSize:"1.1rem", fontWeight:700, color:"#4f46e5", borderBottom:"2px solid #e0e7ff", paddingBottom:"0.4rem", marginBottom:"1rem"}}>{art.titre}</h2>
            {art.contenu}
          </section>
        ))}
      </main>
      <LegalFooter />
    </div>
  );
}
