import { Router } from "express";
import credentialsRouter from "./credentials";
import googleRouter from "./google";
import userRouter from "./user";
import wakeRouter from "./wake";

const router = Router();

router.use(credentialsRouter);
router.use(googleRouter);
router.use(userRouter);
router.use(wakeRouter);

export default router;
