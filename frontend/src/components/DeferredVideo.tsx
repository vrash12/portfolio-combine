import { useState } from "react";

type DeferredVideoProps = {
  src: string;
  poster?: string;
  className?: string;
  label?: string;
  muted?: boolean;
};

function DeferredVideo({
  src,
  poster,
  className = "",
  label = "Play video",
  muted = false,
}: DeferredVideoProps) {
  const [shouldLoad, setShouldLoad] = useState(false);

  if (shouldLoad) {
    return (
      <video
        src={src}
        poster={poster}
        className={className}
        controls
        autoPlay
        muted={muted}
        playsInline
        preload="metadata"
      />
    );
  }

  return (
    <button
      type="button"
      className={`${className} deferred-video-trigger`}
      onClick={() => setShouldLoad(true)}
      aria-label={label}
    >
      {poster && (
        <img
          src={poster}
          alt=""
          className="deferred-video-poster"
          loading="lazy"
          decoding="async"
        />
      )}

      <span className="deferred-video-play" aria-hidden="true">
        <span>▶</span>
        Play Video
      </span>
    </button>
  );
}

export default DeferredVideo;
