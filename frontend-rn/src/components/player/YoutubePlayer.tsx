import React from 'react';
import YouTube from 'react-youtube';

interface YoutubePlayerProps {
  videoId: string;
}

export const YoutubePlayer: React.FC<YoutubePlayerProps> = ({ videoId }) => {
  const opts = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 0,
      modestbranding: 1,
      rel: 0,
    },
  };

  return (
    <div className="w-full aspect-video rounded-2xl overflow-hidden shadow-2xl shadow-purple-500/10 border border-slate-800 bg-slate-900">
      <YouTube videoId={videoId} opts={opts} className="w-full h-full" iframeClassName="w-full h-full" />
    </div>
  );
};
