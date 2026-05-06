export default function Merci() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        maxWidth: '500px',
        width: '90%',
        padding: '40px',
        textAlign: 'center'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          background: '#4caf50',
          borderRadius: '50%',
          margin: '0 auto 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '50px'
        }}>
          🎉
        </div>
        
        <h1 style={{ color: '#333', fontSize: '28px', marginBottom: '10px' }}>
          Merci pour votre inscription !
        </h1>
        
        <p style={{ color: '#666', fontSize: '16px', marginBottom: '30px' }}>
          Félicitations, vous faites maintenant partie de l'aventure BAC Master Elite.
        </p>
        
        <div style={{
          background: '#f0fdf4',
          borderLeft: '4px solid #4caf50',
          padding: '15px',
          margin: '20px 0',
          textAlign: 'left',
          color: '#166534',
          borderRadius: '8px'
        }}>
          <strong>✓ Ce qui vous attend :</strong><br />
          • Un email de confirmation va vous être envoyé<br />
          • Vous aurez accès à tous nos services<br />
          • Notre équipe reste à votre disposition
        </div>

        <a href="/" style={{
          display: 'inline-block',
          background: '#667eea',
          color: 'white',
          textDecoration: 'none',
          padding: '12px 30px',
          borderRadius: '30px',
          fontWeight: '600',
          marginTop: '20px'
        }}>
          Retour à l'accueil
        </a>
        
        <p style={{ marginTop: '25px', fontSize: '12px', color: '#999' }}>
          Si vous ne recevez pas d'email dans quelques minutes,<br />
          vérifiez vos spams ou contactez-nous.
        </p>
      </div>
    </div>
  );
}
