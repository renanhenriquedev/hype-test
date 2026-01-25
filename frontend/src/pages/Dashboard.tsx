import { useEffect, useMemo, useState } from 'react';
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

type Filter = 'ALL' | 'DONE' | 'FAILED';

function badgeTone(status: VideoItem['status']) {
  switch (status) {
    case 'DONE': return 'success';
    case 'FAILED': return 'danger';
    case 'PROCESSING': return 'warning';
    case 'UPLOADED': return 'info';
  }
}

function formatCreatedAt(createdAt: string | null) {
  if (!createdAt) return '';
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return createdAt;
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d);
}

export function Dashboard() {
  const [items, setItems] = useState<VideoItem[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [loading, setLoading] = useState(false);

  function patchItem(videoId: string, patch: Partial<VideoItem>) {
    setItems((prev) =>
      prev.map((it) => (it.videoId === videoId ? { ...it, ...patch } : it))
    );
  }

  async function loadList(nextFilter: Filter = filter) {
    setLoading(true);
    try {
      const path = nextFilter === 'ALL' ? '/videos' : `/videos?status=${nextFilter}`;
      const res = await apiFetch(path);
      const data: VideoItem[] = await res.json();
      setItems(data);

      if (!selectedVideoId && data.length) setSelectedVideoId(data[0].videoId);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadList(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const counts = useMemo(() => {
    const all = items.length;
    const done = items.filter((i) => i.status === 'DONE').length;
    const failed = items.filter((i) => i.status === 'FAILED').length;
    return { all, done, failed };
  }, [items]);

  return (
    <div className="layout">
      <div className="header">
        <div>
          <h2>Dashboard</h2>
          <p className="muted small">{auth.currentUser?.email}</p>
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
              setFilter('ALL');
              loadList('ALL');
            }}
          />
        </div>

        <div className="card">
          <div className="row space">
            <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
              <h3>Meus vídeos</h3>

              <div className="segmented" role="tablist" aria-label="Filtro de vídeos">
                <button
                  className={filter === 'ALL' ? 'active' : ''}
                  onClick={() => setFilter('ALL')}
                  type="button"
                >
                  Todos ({counts.all})
                </button>
                <button
                  className={filter === 'DONE' ? 'active' : ''}
                  onClick={() => setFilter('DONE')}
                  type="button"
                >
                  Prontos ({counts.done})
                </button>
                <button
                  className={filter === 'FAILED' ? 'active' : ''}
                  onClick={() => setFilter('FAILED')}
                  type="button"
                >
                  Falhas ({counts.failed})
                </button>
              </div>
            </div>

            <button className="btn" onClick={() => loadList(filter)} disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner" /> Atualizando...
                </>
              ) : (
                'Atualizar'
              )}
            </button>
          </div>

          {items.length === 0 ? (
            <div className="alert">
              <strong>Nenhum vídeo ainda</strong>
              <p className="muted small" style={{ marginTop: 6 }}>
                Envie um arquivo para começar. Ele aparecerá aqui com o status.
              </p>
            </div>
          ) : (
            <div className="list">
              {items.map((v) => (
                <button
                  key={v.videoId}
                  className={`item ${selectedVideoId === v.videoId ? 'active' : ''}`}
                  onClick={() => setSelectedVideoId(v.videoId)}
                  type="button"
                >
                  <div className="row space">
                    <div className="ellipsis">
                      <strong title={v.originalFilename ?? v.videoId}>
                        {v.originalFilename ?? v.videoId}
                      </strong>
                      <div className="muted small">{formatCreatedAt(v.createdAt)}</div>
                    </div>

                    <span className={`badge ${badgeTone(v.status)}`}>{v.status}</span>
                  </div>

                  {v.status === 'FAILED' && v.errorMessage && (
                    <div className="error small" style={{ marginTop: 8 }}>
                      Erro: {v.errorMessage}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedVideoId && (
          <div className="card">
            <VideoStatus
              videoId={selectedVideoId}
              onStatusChange={({ videoId, status, errorMessage }) => {
                patchItem(videoId, { status, errorMessage: errorMessage ?? null });
              }}
            />
          </div>
      )}
    </div>
  );
}
