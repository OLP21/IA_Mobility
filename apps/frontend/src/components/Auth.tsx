import React, { useState } from 'react';

interface AuthProps {
  onLoginSuccess: (userData: any) => void;
}

export default function Auth({ onLoginSuccess }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? '/auth/login' : '/auth/register';

    try {
      const response = await fetch(`http://localhost:3000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        if (isLogin) {
          onLoginSuccess(data.user);
        } else {
          setIsLogin(true);
          alert('Compte créé ! Connectez-vous.');
        }
      } else {
        setError(data.error || 'Une erreur est survenue');
      }
    } catch {
      setError('Impossible de joindre le serveur backend.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={styles.title}>{isLogin ? 'Connexion' : 'Inscription'}</h2>
          <p style={styles.subtitle}>
            {isLogin ? 'Bienvenue, entrez vos identifiants.' : 'Créez votre compte en quelques secondes.'}
          </p>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        {/* BUG FIX 1 : le <form> n'a plus de style partagé avec les inputs.
            Le bouton submit est un enfant direct du form, pas du inputGroup. */}
        <form onSubmit={handleSubmit} style={styles.form}>
          {!isLogin && (
            <div style={styles.field}>
              <label style={styles.label}>Nom complet</label>
              {/* BUG FIX 2 : ajout de value= pour en faire un input contrôlé,
                  ce qui garantit que React gère bien l'état affiché. */}
              <input
                type="text"
                placeholder="Jean Dupont"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                style={styles.input}
              />
            </div>
          )}

          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              placeholder="vous@exemple.com"
              required
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Mot de passe</label>
            <input
              type="password"
              placeholder="••••••••"
              required
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              style={styles.input}
            />
          </div>

          {/* BUG FIX 1 (suite) : le bouton a son propre style, complètement
              séparé des champs. Il ne peut plus être "absorbé" visuellement. */}
          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Chargement…' : isLogin ? 'Se connecter' : 'Créer un compte'}
          </button>
        </form>

        <p style={styles.toggleText}>
          {isLogin ? "Pas encore de compte ?" : 'Déjà inscrit ?'}{' '}
          <span
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            style={styles.toggleLink}
          >
            {isLogin ? 'Créer un compte' : 'Se connecter'}
          </span>
        </p>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    height: '100vh', background: '#f7f7f5',
  },
  card: {
    background: 'white', padding: '2.5rem 2rem',
    borderRadius: '12px', border: '1px solid #e8e8e4',
    width: '360px', boxSizing: 'border-box',
  },
  header: { marginBottom: '1.75rem' },
  title: { margin: '0 0 4px', fontSize: '22px', fontWeight: 500, color: '#111' },
  subtitle: { margin: 0, fontSize: '14px', color: '#888' },
  form: { display: 'flex', flexDirection: 'column', gap: '14px' },
  field: { display: 'flex', flexDirection: 'column', gap: '4px' },
  label: { fontSize: '12px', color: '#666', fontWeight: 500 },
  input: {
    padding: '10px 12px', border: '1px solid #e0e0da',
    borderRadius: '8px', fontSize: '14px', outline: 'none',
    background: '#fff', color: '#111', width: '100%', boxSizing: 'border-box',
  },
  // Le bouton a maintenant un style DISTINCT, sans ambiguïté possible
  button: {
    marginTop: '6px', padding: '11px',
    background: '#111', color: '#fff',
    border: 'none', borderRadius: '8px',
    fontSize: '14px', fontWeight: 500, cursor: 'pointer',
    width: '100%',
  },
  error: {
    fontSize: '13px', color: '#c0392b',
    background: '#fdf0ef', border: '1px solid #f5c6c2',
    padding: '10px 12px', borderRadius: '8px', marginBottom: '12px',
  },
  toggleText: { textAlign: 'center', marginTop: '1.25rem', fontSize: '13px', color: '#888' },
  toggleLink: { color: '#111', cursor: 'pointer', fontWeight: 500 },
};