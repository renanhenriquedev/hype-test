import { auth } from '../firebase/firebase';

const API_URL = import.meta.env.VITE_API_URL;

async function getAuthHeader() {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  const token = await user.getIdToken();

  return {
    Authorization: `Bearer ${token}`,
  };
}

export async function apiFetch(
  path: string,
  options: RequestInit = {}
) {
  const authHeader = await getAuthHeader();

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...authHeader,
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Erro na requisição');
  }

  return response;
}
