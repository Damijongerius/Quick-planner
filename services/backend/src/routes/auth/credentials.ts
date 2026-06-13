import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../../lib/db";
import { JWT_SECRET } from "./sessionStore";

const router = Router();

// signup
router.post("/signup", async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(400).json({ error: "Email already in use" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
      },
    });

    // Create a default project for the new user
    const defaultProject = await prisma.project.create({
      data: {
        name: "My First Project",
        userId: user.id,
      },
    });

    // Create default NodeTypes for this project (e.g. EPIC, STORY, TASK)
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

    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error: any) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Failed to sign up user" });
  }
});

// login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Failed to log in" });
  }
});

export default router;
