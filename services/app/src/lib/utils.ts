/**
 * Serializes and then parses an object to ensure it's compatible with 
 * Next.js Client Components (e.g., converts Date to string).
 */
export function serializeData<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}
