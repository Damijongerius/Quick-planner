import { Router } from "express";
import prisma from "../../lib/db";
import { verifyToken } from "../../middleware/auth";
import { pendingSessions } from "./sessionStore";

const router = Router();

// get profile details
router.get("/me", verifyToken, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json(user);
  } catch (error: any) {
    console.error("Profile error:", error);
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
});

// Generic session polling endpoint (supports both Google and Credentials flows)
router.get("/session/poll/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  const session = pendingSessions.get(sessionId);
  if (session) {
    pendingSessions.delete(sessionId);
    res.json({ status: "success", token: session.token, user: session.user });
  } else {
    res.json({ status: "pending" });
  }
});

// Complete session from browser (used for Credentials login completion)
router.post("/session/complete", (req, res) => {
  const { sessionId, token, user } = req.body;
  if (!sessionId || !token || !user) {
    res.status(400).json({ error: "Session ID, token, and user are required" });
    return;
  }

  pendingSessions.set(sessionId, { token, user });

  // Auto-cleanup after 5 minutes
  setTimeout(() => {
    pendingSessions.delete(sessionId);
  }, 5 * 60 * 1000);

  res.json({ status: "success" });
});

export default router;
