export function getVideoEmbedUrl(videoUrl: string | null | undefined) {
  if (!videoUrl?.trim()) return null;

  try {
    const url = new URL(videoUrl);

    if (url.hostname.includes('youtu.be')) {
      return `https://www.youtube.com/embed${url.pathname}`;
    }

    if (url.hostname.includes('youtube.com')) {
      const videoId = url.searchParams.get('v');
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }

      if (url.pathname.startsWith('/embed/')) {
        return videoUrl;
      }
    }

    if (url.hostname.includes('vimeo.com')) {
      const vimeoId = url.pathname.split('/').filter(Boolean).pop();
      if (vimeoId) {
        return `https://player.vimeo.com/video/${vimeoId}`;
      }
    }
  } catch {
    return null;
  }

  return null;
}
