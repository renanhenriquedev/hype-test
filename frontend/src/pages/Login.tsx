import { useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from '../firebase/firebase';

export function Login({ onLogin }: { onLogin: () => void }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setLoading(true);
    setError(null);

    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      onLogin();
    } catch (e: any) {
      setError(e?.message ?? 'Erro');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="layout">
      <div className="card" style={{ maxWidth: 420, margin: '0 auto' }}>
        <h2>{mode === 'login' ? 'Entrar' : 'Criar conta'}</h2>
        <p className="muted">
          Acesse sua conta para ver seus vídeos convertidos.
        </p>

        <div className="row" style={{ marginBottom: 12 }}>
          <button
            type="button"
            className={mode === 'login' ? 'btn btn-primary' : 'btn'}
            onClick={() => setMode('login')}
          >
            Login
          </button>
          <button
            type="button"
            className={mode === 'signup' ? 'btn btn-primary' : 'btn'}
            onClick={() => setMode('signup')}
          >
            Cadastro
          </button>
        </div>

        <label className="label">E-mail</label>
        <input
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="voce@exemplo.com"
        />

        <label className="label">Senha</label>
        <input
          className="input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />

        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={loading || !email || !password}
        >
          {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
        </button>

        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
}
