import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase/firebase';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';

function App() {
  const [logged, setLogged] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setLogged(!!user);
    });
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h1>Video Converter</h1>
      {logged ? <Dashboard /> : <Login onLogin={() => setLogged(true)} />}
    </div>
  );
}

export default App;
