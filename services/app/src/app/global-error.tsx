'use client';

// Replaces the whole document when the root layout itself fails, so it can't rely on the app's CSS.
export default function GlobalError({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  return (
    <html lang="en">
      <body>
        <style>{`
          body { margin: 0; font-family: system-ui, sans-serif; background: #fafafb; color: #17171c; }
          @media (prefers-color-scheme: dark) { body { background: #0e0e11; color: #ededf1; } p { color: #a0a0ad !important; } }
        `}</style>
        <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 24, textAlign: 'center' }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 8px' }}>Something went wrong</h1>
          <p style={{ color: '#5f5f6b', fontSize: 14, margin: '0 0 24px', maxWidth: 380 }}>
            An unexpected error stopped the page from loading.{error?.digest ? ` (Reference: ${error.digest})` : ''}
          </p>
          <button
            onClick={() => reset()}
            style={{ height: 36, padding: '0 16px', borderRadius: 8, border: 0, background: '#4f46e5', color: '#fff', fontWeight: 500, cursor: 'pointer' }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
