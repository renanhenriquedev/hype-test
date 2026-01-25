import { useMemo, useState } from 'react';
import { apiFetch } from '../services/api';

interface VideoUploadResponse {
  videoId: string;
}

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const idx = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, idx);
  return `${value.toFixed(idx === 0 ? 0 : 1)} ${units[idx]}`;
}

export function UploadVideo({ onUploaded }: { onUploaded: (videoId: string) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileMeta = useMemo(() => {
    if (!file) return null;
    return { name: file.name, size: formatBytes(file.size), type: file.type || 'video/*' };
  }, [file]);

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

      const data: VideoUploadResponse = await response.json();
      onUploaded(data.videoId);

      // UX: limpa seleção após sucesso
      setFile(null);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Falha no upload');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="stack">
      <div>
        <h3>Enviar vídeo</h3>
        <p className="muted small">Envie um arquivo e depois converta para MP4 720p.</p>
      </div>

      <div
        className={`dropzone ${drag ? 'isDrag' : ''}`}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDrag(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDrag(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDrag(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDrag(false);
          const f = e.dataTransfer.files?.[0];
          if (f) setFile(f);
        }}
      >
        <div className="row space">
          <div>
            <div className="dropzoneTitle">
              {file ? 'Arquivo selecionado' : 'Arraste e solte aqui'}
            </div>
            <div className="dropzoneHint">
              {file ? 'Você pode trocar o arquivo a qualquer momento.' : 'Ou clique para escolher um arquivo do seu computador.'}
            </div>
          </div>

          <label className="btn">
            Escolher arquivo
            <input
              type="file"
              accept="video/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>
        </div>

        {fileMeta && (
          <div className="alert" style={{ marginTop: 12 }}>
            <div className="row space">
              <div className="ellipsis">
                <strong title={fileMeta.name}>{fileMeta.name}</strong>
                <div className="small muted">
                  {fileMeta.size} • {fileMeta.type}
                </div>
              </div>

              <button className="btn btn-danger" type="button" onClick={() => setFile(null)} disabled={loading}>
                Remover
              </button>
            </div>
          </div>
        )}
      </div>

      <button className="btn btn-primary" onClick={handleUpload} disabled={!file || loading}>
        {loading ? (
          <>
            <span className="spinner" /> Enviando...
          </>
        ) : (
          'Enviar'
        )}
      </button>

      {error && <div className="alert error">⚠ {error}</div>}
    </div>
  );
}
