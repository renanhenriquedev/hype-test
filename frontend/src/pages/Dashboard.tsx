import { useEffect, useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/firebase';
import { apiFetch } from '../services/api';
import { UploadVideo } from '../components/UploadVideo';
import { VideoStatus } from '../components/VideoStatus';

type VideoItem = {
  videoId: string;
  status: 'UPLOADED' | 'PROCESSING' | 'DONE' | 'FAILED';
  originalFilename: string | null;
  createdAt: string | null;
  errorMessage: string | null;
};

export function Dashboard() {
  const [items, setItems] = useState<VideoItem[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadList() {
    setLoading(true);
    try {
      const res = await apiFetch('/videos?status=DONE');
      const data: VideoItem[] = await res.json();
      setItems(data);
      if (!selectedVideoId && data.length) setSelectedVideoId(data[0].videoId);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadList();
  }, []);

  return (
    <div className="layout">
      <div className="header">
        <div>
          <h2>Dashboard</h2>
          <p className="muted">{auth.currentUser?.email}</p>
        </div>
        <button className="btn" onClick={() => signOut(auth)}>
          Sair
        </button>
      </div>

      <div className="grid">
        <div className="card">
          <UploadVideo
            onUploaded={(id) => {
              setSelectedVideoId(id);
              loadList();
            }}
          />
        </div>

        <div className="card">
          <div className="row space">
            <h3>Meus vídeos</h3>
            <button className="btn" onClick={loadList} disabled={loading}>
              {loading ? 'Atualizando...' : 'Atualizar'}
            </button>
          </div>

          {items.length === 0 ? (
            <p className="muted">Você ainda não enviou nenhum vídeo.</p>
          ) : (
            <div className="list">
              {items.map((v) => (
                <button
                  key={v.videoId}
                  className={`listItem ${selectedVideoId === v.videoId ? 'active' : ''}`}
                  onClick={() => setSelectedVideoId(v.videoId)}
                >
                  <div className="row space">
                    <div className="ellipsis">
                      <strong>{v.originalFilename ?? v.videoId}</strong>
                      <div className="muted small">{v.createdAt ?? ''}</div>
                    </div>
                    <span className={`badge ${v.status.toLowerCase()}`}>{v.status}</span>
                  </div>

                  {v.status === 'FAILED' && v.errorMessage && (
                    <div className="error small">Erro: {v.errorMessage}</div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedVideoId && (
        <div className="card">
          <VideoStatus videoId={selectedVideoId} />
        </div>
      )}
    </div>
  );
}
