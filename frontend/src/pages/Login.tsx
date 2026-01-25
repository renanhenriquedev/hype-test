import { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/firebase';

function firebaseErrorMessage(e: any) {
  const code = e?.code ?? '';
  if (code.includes('auth/invalid-credential') || code.includes('auth/wrong-password')) return 'E-mail ou senha inválidos.';
  if (code.includes('auth/user-not-found')) return 'Usuário não encontrado.';
  if (code.includes('auth/email-already-in-use')) return 'Esse e-mail já está em uso.';
  if (code.includes('auth/weak-password')) return 'Senha fraca. Use pelo menos 6 caracteres.';
  if (code.includes('auth/invalid-email')) return 'E-mail inválido.';
  return e?.message ?? 'Erro ao autenticar.';
}

export function Login({ onLogin }: { onLogin: () => void }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      onLogin();
    } catch (err: any) {
      setError(firebaseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="layout">
      <div className="card" style={{ maxWidth: 440, margin: '0 auto' }}>
        <div className="stack">
          <div>
            <h2>{mode === 'login' ? 'EntrarRRR' : 'Criar conta'}</h2>
            <p className="muted small" style={{ marginTop: 6 }}>
              Acesse para enviar e converter vídeos para MP4 720p.
            </p>
          </div>

          <div className="row" style={{ marginTop: 6 }}>
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

          <form className="stack" onSubmit={handleSubmit}>
            <div>
              <label className="label">E-mail</label>
              <input
                className="input"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@exemplo.com"
              />
            </div>

            <div>
              <label className="label">Senha</label>
              <input
                className="input"
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              {mode === 'signup' && <div className="small muted" style={{ marginTop: 6 }}>Mínimo de 6 caracteres.</div>}
            </div>

            <button
              className="btn btn-primary"
              type="submit"
              disabled={loading || !email || !password}
            >
              {loading ? (
                <>
                  <span className="spinner" /> Aguarde...
                </>
              ) : mode === 'login' ? (
                'Entrar'
              ) : (
                'Criar conta'
              )}
            </button>

            {error && <div className="alert error">⚠ {error}</div>}
          </form>
        </div>
      </div>
    </div>
  );
}
