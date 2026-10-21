/** Allows `max` hits per key within `windowMs`. In-memory: enough to stop one inbox being flooded from one server. */
export class Throttle {
  private hits = new Map<string, number[]>();
  constructor(private readonly max: number, private readonly windowMs: number) {}

  /** True if this hit is allowed (and records it). */
  take(key: string, now = Date.now()): boolean {
    const recent = (this.hits.get(key) ?? []).filter((t) => now - t < this.windowMs);
    if (recent.length >= this.max) { this.hits.set(key, recent); return false; }
    recent.push(now);
    this.hits.set(key, recent);
    if (this.hits.size > 5000) for (const [k, v] of this.hits) if (v.every((t) => now - t >= this.windowMs)) this.hits.delete(k);
    return true;
  }
}
