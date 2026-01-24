import { useState } from 'react';
import { apiFetch } from '../services/api';

export function UploadVideo({
  onUploaded,
}: {
  onUploaded: (videoId: string) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload() {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiFetch('/videos', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      onUploaded(data.videoId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h3>Upload de vídeo</h3>

      <input
        type="file"
        accept="video/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />

      <button onClick={handleUpload} disabled={!file || loading}>
        {loading ? 'Enviando...' : 'Enviar'}
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
