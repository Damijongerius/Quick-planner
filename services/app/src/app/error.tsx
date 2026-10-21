'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function ErrorPage({ error, reset }: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="mt-2 max-w-sm text-sm text-muted">
        We couldn&apos;t load this page.{error.digest ? ` (Reference: ${error.digest})` : ''}
      </p>
      <div className="mt-6 flex gap-2">
        <button onClick={() => reset()} className="button-base button-primary button-md">Try again</button>
        <Link href="/projects" className="button-base button-secondary button-md">Back to projects</Link>
      </div>
    </main>
  );
}
