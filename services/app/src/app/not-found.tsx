import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <h1 className="text-xl font-semibold">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-muted">This page doesn&apos;t exist, or you don&apos;t have access to it.</p>
      <Link href="/projects" className="button-base button-primary button-md mt-6">Back to projects</Link>
    </main>
  );
}
