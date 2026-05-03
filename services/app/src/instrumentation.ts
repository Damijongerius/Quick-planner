export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { warmupAI } = await import('@/lib/discovery');
    warmupAI();
  }
}
