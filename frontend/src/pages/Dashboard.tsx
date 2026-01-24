import { useState } from 'react';
import { UploadVideo } from '../components/UploadVideo';
import { VideoStatus } from '../components/VideoStatus';

export function Dashboard() {
  const [videoId, setVideoId] = useState<string | null>(null);

  return (
    <div>
      <h2>Dashboard</h2>

      <UploadVideo onUploaded={setVideoId} />

      {videoId && <VideoStatus videoId={videoId} />}
    </div>
  );
}
