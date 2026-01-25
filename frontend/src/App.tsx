import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase/firebase';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';

function App() {
  const [logged, setLogged] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => setLogged(!!user));
  }, []);

  return (
    <div className="container">
      <div className="topbar">
        <div className="brand">
          <h1>Video Converter</h1>
          <span>MP4 • 720p</span>
        </div>
        <span className="small muted">{logged ? 'Conectado' : 'Faça login para continuar'}</span>
      </div>

      {logged ? <Dashboard /> : <Login onLogin={() => setLogged(true)} />}
    </div>
  );
}

export default App;
