import { Router } from "express";
import jwt from "jsonwebtoken";
import prisma from "../../lib/db";
import { pendingSessions, JWT_SECRET } from "./sessionStore";

const router = Router();

// Google OAuth URL redirect
router.get("/google", (req, res) => {
  const origin = req.query.origin || "http://localhost:3003";
  const sessionId = req.query.sessionId || "";
  const state = Buffer.from(JSON.stringify({ origin, sessionId })).toString("base64");
  
  // Construct redirect URI using host header
  const redirectUri = `${req.protocol}://${req.get("host")}/api/auth/callback/google`;
  
  const googleUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.AUTH_GOOGLE_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20profile%20email&state=${state}`;
  
  res.redirect(googleUrl);
});

// Google OAuth callback handler
router.get("/callback/google", async (req, res) => {
  const { code, state } = req.query;
  
  if (!code) {
    res.status(400).json({ error: "Authorization code is required" });
    return;
  }

  let origin = "http://localhost:3003";
  let sessionId = "";
  try {
    if (state) {
      const parsed = JSON.parse(Buffer.from(state as string, "base64").toString("utf-8"));
      if (parsed.origin) origin = parsed.origin;
      if (parsed.sessionId) sessionId = parsed.sessionId;
    }
  } catch (_) {}

  try {
    const redirectUri = `${req.protocol}://${req.get("host")}/api/auth/callback/google`;

    // Exchange auth code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: code as string,
        client_id: process.env.AUTH_GOOGLE_ID as string,
        client_secret: process.env.AUTH_GOOGLE_SECRET as string,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData: any = await tokenResponse.json();
    if (!tokenResponse.ok) {
      throw new Error(tokenData.error_description || tokenData.error || "Failed to exchange code");
    }

    // Retrieve userinfo
    const userinfoResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const userInfo: any = await userinfoResponse.json();
    if (!userinfoResponse.ok) {
      throw new Error(userInfo.error_description || userInfo.error || "Failed to fetch user profile");
    }

    const email = userInfo.email;
    const name = userInfo.name;
    const image = userInfo.picture;

    if (!email) {
      throw new Error("No email returned from Google authentication");
    }

    // Find or create user in PostgreSQL
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: name || null,
          image: image || null,
        },
      });

      // Create a default project for the new user
      const defaultProject = await prisma.project.create({
        data: {
          name: "My First Project",
          userId: user.id,
        },
      });

      // Create default NodeTypes for this project
      await prisma.nodeType.createMany({
        data: [
          {
            name: "Epic",
            projectId: defaultProject.id,
            userId: user.id,
            color: "#ec4899", // pink
            icon: "Flag",
            isSprintEligible: false,
          },
          {
            name: "Story",
            projectId: defaultProject.id,
            userId: user.id,
            color: "#3b82f6", // blue
            icon: "BookOpen",
            isSprintEligible: true,
          },
          {
            name: "Task",
            projectId: defaultProject.id,
            userId: user.id,
            color: "#10b981", // green
            icon: "CheckSquare",
            isSprintEligible: true,
          },
        ],
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    const userParam = encodeURIComponent(
      JSON.stringify({
        id: user.id,
        email: user.email,
        name: user.name || "",
        image: user.image || "",
      })
    );

    if (sessionId) {
      pendingSessions.set(sessionId, {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name || "",
          image: user.image || "",
        }
      });
      
      // Auto-cleanup after 5 minutes
      setTimeout(() => {
        pendingSessions.delete(sessionId);
      }, 5 * 60 * 1000);

      res.redirect(`${origin}/auth/callback?token=${token}&user=${userParam}&sessionId=${sessionId}`);
      return;
    }

    res.redirect(`${origin}/auth/callback?token=${token}&user=${userParam}`);
  } catch (error: any) {
    console.error("Google login callback error:", error);
    res.redirect(`${origin}/auth/signin?error=GoogleAuthFailed`);
  }
});

// Polling endpoint for Google login in Tauri client
router.get("/google/poll/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  const session = pendingSessions.get(sessionId);
  if (session) {
    pendingSessions.delete(sessionId);
    res.json({ status: "success", token: session.token, user: session.user });
  } else {
    res.json({ status: "pending" });
  }
});

export default router;
