import { useEffect, useState } from 'react';
import { apiFetch } from '../services/api';

type VideoStatusType =
  | 'UPLOADED'
  | 'PROCESSING'
  | 'DONE'
  | 'FAILED';

interface VideoResponse {
  status: VideoStatusType;
}

export function VideoStatus({ videoId }: { videoId: string }) {
  const [status, setStatus] = useState<VideoStatusType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchStatus() {
    try {
      const response = await apiFetch(`/videos/${videoId}`);
      const data: VideoResponse = await response.json();
      setStatus(data.status);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleConvert() {
    setLoading(true);
    setError(null);

    try {
      await apiFetch(`/videos/${videoId}/convert`, {
        method: 'POST',
      });
      await fetchStatus();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    window.open(
      `${import.meta.env.VITE_API_URL}/videos/${videoId}/download`,
      '_blank'
    );
  }

  useEffect(() => {
    fetchStatus();

    const interval = setInterval(() => {
      if (status === 'PROCESSING') {
        fetchStatus();
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [status]);

  return (
    <div style={{ marginTop: 24 }}>
      <h3>Status do vídeo</h3>

      <p>
        <strong>ID:</strong> {videoId}
      </p>

      <p>
        <strong>Status:</strong>{' '}
        {status ?? 'Carregando...'}
      </p>

      {status === 'UPLOADED' && (
        <button onClick={handleConvert} disabled={loading}>
          {loading ? 'Convertendo...' : 'Converter'}
        </button>
      )}

      {status === 'DONE' && (
        <button onClick={handleDownload}>
          Download
        </button>
      )}

      {status === 'FAILED' && (
        <p style={{ color: 'red' }}>
          Falha na conversão
        </p>
      )}

      {error && (
        <p style={{ color: 'red' }}>{error}</p>
      )}
    </div>
  );
}
