export const pendingSessions = new Map<string, { token: string; user: any }>();
export const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret_key";
