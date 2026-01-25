import { useEffect, useState } from 'react';
import { apiFetch } from '../services/api';

type VideoStatusType = 'UPLOADED' | 'PROCESSING' | 'DONE' | 'FAILED';

interface VideoResponse {
  status: VideoStatusType;
  errorMessage?: string | null;
}

export function VideoStatus({
  videoId,
  onStatusChange,
}: {
  videoId: string;
  onStatusChange?: (payload: {
    videoId: string;
    status: VideoStatusType;
    errorMessage?: string | null;
  }) => void;
}) {
  const [status, setStatus] = useState<VideoStatusType | null>(null);
  const [remoteError, setRemoteError] = useState<string | null>(null);

  const [loadingConvert, setLoadingConvert] = useState(false);
  const [loadingDownload, setLoadingDownload] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchStatus() {
    try {
      const response = await apiFetch(`/videos/${videoId}`);
      const data: VideoResponse = await response.json();

      setStatus(data.status);
      setRemoteError(data.errorMessage ?? null);

      onStatusChange?.({
        videoId,
        status: data.status,
        errorMessage: data.errorMessage ?? null,
      });
    } catch (err: any) {
      setError(err?.message ?? 'Falha ao buscar status');
    }
  }

  async function handleConvert() {
    setLoadingConvert(true);
    setError(null);

    try {
      await apiFetch(`/videos/${videoId}/convert`, { method: 'POST' });

      setStatus('PROCESSING');
      setRemoteError(null);
      onStatusChange?.({ videoId, status: 'PROCESSING', errorMessage: null });

      await fetchStatus();
    } catch (err: any) {
      setError(err?.message ?? 'Falha ao iniciar conversão');
    } finally {
      setLoadingConvert(false);
    }
  }

  async function handleDownload() {
    setLoadingDownload(true);
    setError(null);

    try {
      const response = await apiFetch(`/videos/${videoId}/download`);
      const data = await response.json();
      window.open(data.url, '_blank');
    } catch (err: any) {
      setError(err?.message ?? 'Falha ao gerar link de download');
    } finally {
      setLoadingDownload(false);
    }
  }

  useEffect(() => {
    setStatus(null);
    setRemoteError(null);
    setError(null);
    fetchStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  useEffect(() => {
    if (status !== 'PROCESSING') return;
    const t = setInterval(() => fetchStatus(), 4000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, videoId]);

  return (
    <div className="stack">
      <h3>Status</h3>

      <div className="alert">
        <div className="row space">
          <div className="ellipsis">
            <div className="small muted">ID</div>
            <strong title={videoId}>{videoId}</strong>
          </div>
          <span className="badge info">{status ?? '...'}</span>
        </div>
      </div>

      {status === 'UPLOADED' && (
        <button className="btn btn-primary" onClick={handleConvert} disabled={loadingConvert}>
          {loadingConvert ? 'Iniciando...' : 'Converter'}
        </button>
      )}

      {status === 'DONE' && (
        <button className="btn btn-primary" onClick={handleDownload} disabled={loadingDownload}>
          {loadingDownload ? 'Preparando...' : 'Baixar'}
        </button>
      )}

      {status === 'FAILED' && (
        <div className="alert error">⚠ Falha{remoteError ? `: ${remoteError}` : ''}</div>
      )}

      {error && <div className="alert error">⚠ {error}</div>}
    </div>
  );
}
