"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { cleanName, requireUserId, toResult, UserError, type ActionResult } from "./helpers";
import { generateToken } from "@/lib/api/tokens";

const MAX_TOKENS = 10;

export type TokenInfo = { id: string; name: string; prefix: string; readOnly: boolean; createdAt: string; lastUsedAt: string | null };

export async function listApiTokens(): Promise<TokenInfo[]> {
  const userId = await requireUserId().catch(() => null);
  if (!userId) return [];
  const rows = await prisma.apiToken.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  return rows.map((t) => ({ id: t.id, name: t.name, prefix: t.prefix, readOnly: t.readOnly, createdAt: t.createdAt.toISOString(), lastUsedAt: t.lastUsedAt?.toISOString() ?? null }));
}

/** The plain token is returned here and never again: only its hash is stored. */
export async function createApiToken(name: string, readOnly: boolean): Promise<ActionResult & { token?: string }> {
  const userId = await requireUserId();
  let token: string | undefined;
  const result = await toResult(async () => {
    const cleaned = cleanName(name, "Token name");
    if ((await prisma.apiToken.count({ where: { userId } })) >= MAX_TOKENS) throw new UserError(`You can have up to ${MAX_TOKENS} tokens. Revoke one first.`);
    const generated = generateToken();
    await prisma.apiToken.create({ data: { userId, name: cleaned, tokenHash: generated.hash, prefix: generated.prefix, readOnly: !!readOnly } });
    token = generated.token;
  });
  if (!result.error) revalidatePath("/profile");
  return { ...result, token };
}

export async function revokeApiToken(id: string): Promise<ActionResult> {
  const userId = await requireUserId();
  await prisma.apiToken.deleteMany({ where: { id, userId } });
  revalidatePath("/profile");
  return {};
}
