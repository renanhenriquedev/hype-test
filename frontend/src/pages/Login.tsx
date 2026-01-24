import { signInAnonymously } from 'firebase/auth';
import { auth } from '../firebase/firebase';

export function Login({ onLogin }: { onLogin: () => void }) {
  async function handleLogin() {
    await signInAnonymously(auth);
    onLogin();
  }

  return (
    <div>
      <h2>Login</h2>
      <button onClick={handleLogin}>Entrar</button>
    </div>
  );
}
