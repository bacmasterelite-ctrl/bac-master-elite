export default function ConfirmationPage() {
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
          justifyContent: 'center'
        }}>
          <svg viewBox="0 0 24 24" style={{ width: '50px', height: '50px', fill: 'white' }}>
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
          </svg>
        </div>
        
        <h1 style={{ color: '#333', fontSize: '28px', marginBottom: '10px' }}>
          Inscription confirmée !
        </h1>
        <p style={{ color: '#666', fontSize: '16px', marginBottom: '30px' }}>
          Félicitations, votre compte a été créé avec succès.
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
          <strong>✓ Votre inscription est validée</strong><br />
          Vous pouvez dès maintenant accéder à tous les services
        </div>

        <a href="https://bac-master-elite.com" style={{
          display: 'inline-block',
          background: '#667eea',
          color: 'white',
          textDecoration: 'none',
          padding: '12px 30px',
          borderRadius: '30px',
          fontWeight: '600',
          marginTop: '20px'
        }}>
          Accéder à mon compte
        </a>
        
        <p style={{ marginTop: '25px', fontSize: '12px', color: '#999' }}>
          Un email de confirmation vous a été envoyé.<br />
          Conservez vos identifiants en lieu sûr.
        </p>
      </div>
    </div>
  );
}
