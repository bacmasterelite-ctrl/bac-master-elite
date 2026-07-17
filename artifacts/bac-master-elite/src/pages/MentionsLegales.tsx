import LegalFooter from "./LegalFooter";

export default function MentionsLegales() {
  return (
    <div style={{minHeight:"100vh", display:"flex", flexDirection:"column", background:"#fff"}}>
      <main style={{flex:1, maxWidth:"720px", margin:"0 auto", width:"100%", padding:"2.5rem 1rem", color:"#1f2937"}}>
        <div style={{textAlign:"center", marginBottom:"2.5rem"}}>
          <span style={{display:"inline-block", background:"#4f46e5", color:"#fff", fontSize:"0.65rem", fontWeight:700, padding:"0.2rem 0.75rem", borderRadius:"999px", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:"0.75rem"}}>Section 1</span>
          <h1 style={{fontSize:"1.8rem", fontWeight:800, color:"#4f46e5", marginBottom:"0.25rem"}}>Mentions Légales</h1>
          <p style={{fontSize:"0.8rem", color:"#9ca3af"}}>Application BAC MASTER ELITE — Dernière mise à jour : Juillet 2026</p>
        </div>

        {[
          {
            titre: "Article 1 — Identification de l'Éditeur",
            contenu: (
              <>
                <p style={{lineHeight:1.8, marginBottom:"0.75rem"}}>L'application mobile et web <strong>BAC MASTER ELITE</strong> est éditée par :</p>
                <div style={{background:"#eef2ff", borderRadius:"0.75rem", padding:"1rem 1.25rem", fontSize:"0.9rem", lineHeight:2}}>
                  <div><strong>Dénomination :</strong> BAC MASTER ELITE</div>
                  <div><strong>Nom de l'éditeur :</strong> Dominique Ouedraogo</div>
                  <div><strong>Statut juridique :</strong> Éditeur individuel (personne physique)</div>
                  <div><strong>Adresse :</strong> Quartier Tazibouo, près du Commissariat de police 4, Daloa, Côte d'Ivoire</div>
                  <div><strong>RCCM / IDU :</strong> En cours d'immatriculation</div>
                  <div><strong>Email :</strong> <a href="mailto:bacmasterelite@gmail.com" style={{color:"#4f46e5"}}>bacmasterelite@gmail.com</a></div>
                  <div><strong>Téléphone :</strong> 05 01 74 04 25</div>
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
            contenu: (
              <>
                <p style={{lineHeight:1.8}}>L'ensemble des contenus de l'Application — cours, fiches de révision, exercices, algorithmes pédagogiques, graphismes, logos, interfaces et tous les éléments composant l'Application — sont la propriété exclusive de l'Éditeur et protégés par les lois ivoiriennes et internationales sur la propriété intellectuelle.</p>
                <p style={{lineHeight:1.8, marginTop:"0.75rem"}}>Toute reproduction, représentation, modification, publication, adaptation, totale ou partielle, sur quelque support que ce soit, est interdite sans l'autorisation préalable écrite de l'Éditeur. Toute utilisation non autorisée constitue une contrefaçon et peut donner lieu à des poursuites judiciaires.</p>
              </>
            )
          },
          {
            titre: "Article 4 — Limitation de Responsabilité",
            contenu: (
              <>
                <p style={{lineHeight:1.8}}>L'Éditeur s'efforce de fournir des informations pédagogiques exactes et actualisées. Il ne pourra être tenu responsable :</p>
                <ul style={{lineHeight:1.8, paddingLeft:"1.5rem", marginTop:"0.5rem"}}>
                  <li>Des erreurs ou omissions dans les contenus,</li>
                  <li>Des dommages directs ou indirects résultant de l'utilisation de l'Application,</li>
                  <li>Des indisponibilités temporaires ou définitives de l'Application,</li>
                  <li>De l'utilisation des informations fournies par des tiers via l'Application.</li>
                </ul>
                <p style={{lineHeight:1.8, marginTop:"0.75rem"}}>L'Éditeur se réserve le droit de modifier, suspendre ou interrompre tout contenu ou fonctionnalité de l'Application à tout moment, sans préavis.</p>
              </>
            )
          },
          {
            titre: "Article 5 — Données Personnelles et Cookies",
            contenu: (
              <>
                <p style={{lineHeight:1.8}}>L'Application est conforme au Règlement Général sur la Protection des Données (RGPD) et à la législation ivoirienne relative à la protection des données personnelles.</p>
                <p style={{lineHeight:1.8, marginTop:"0.75rem"}}>Les données collectées sont limitées à ce qui est strictement nécessaire au fonctionnement de l'Application (email, nom, progression pédagogique).</p>
                <p style={{lineHeight:1.8, marginTop:"0.75rem"}}><strong>Cookies :</strong> L'Application utilise des cookies techniques nécessaires à son bon fonctionnement. Des cookies de mesure d'audience peuvent également être utilisés. Vous pouvez à tout moment gérer vos préférences de cookies.</p>
                <p style={{lineHeight:1.8, marginTop:"0.75rem"}}>Pour plus d'informations, consultez notre <a href="/politique-confidentialite" style={{color:"#4f46e5"}}>Politique de Confidentialité</a>.</p>
              </>
            )
          },
          {
            titre: "Article 6 — Acceptation des Conditions",
            contenu: (
              <p style={{lineHeight:1.8}}>En utilisant l'Application BAC MASTER ELITE, vous acceptez pleinement les présentes Mentions Légales. Si vous n'acceptez pas ces conditions, nous vous invitons à ne pas utiliser l'Application.</p>
            )
          },
          {
            titre: "Article 7 — Droit Applicable et Juridiction",
            contenu: (
              <p style={{lineHeight:1.8}}>Les présentes Mentions Légales sont régies par le droit ivoirien. En cas de litige, une solution amiable sera recherchée avant toute procédure judiciaire. À défaut, les tribunaux compétents de la République de Côte d'Ivoire seront seuls compétents.</p>
            )
          },
          {
            titre: "Article 8 — Contact",
            contenu: (
              <div style={{background:"#eef2ff", borderRadius:"0.75rem", padding:"1rem 1.25rem", fontSize:"0.9rem", lineHeight:2}}>
                <div>Pour toute question relative aux présentes Mentions Légales, vous pouvez nous contacter :</div>
                <div><strong>Email :</strong> <a href="mailto:bacmasterelite@gmail.com" style={{color:"#4f46e5"}}>bacmasterelite@gmail.com</a></div>
                <div><strong>Formulaire de contact :</strong> <a href="/contact" style={{color:"#4f46e5"}}>Disponible sur le site</a></div>
              </div>
            )
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
