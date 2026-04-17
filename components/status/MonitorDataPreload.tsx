interface MonitorDataPreloadProps {
  pageId: string;
}

export function MonitorDataPreload({ pageId }: MonitorDataPreloadProps) {
  return (
    <link
      rel="preload"
      as="fetch"
      href={`/api/monitor?pageId=${encodeURIComponent(pageId)}`}
      crossOrigin="anonymous"
    />
  );
}
