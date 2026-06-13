import { Router } from "express";
import getNodesRouter from "./getNodes";
import createNodeRouter from "./createNode";
import updateNodeRouter from "./updateNode";
import deleteNodeRouter from "./deleteNode";

const router = Router();

router.use(getNodesRouter);
router.use(createNodeRouter);
router.use(updateNodeRouter);
router.use(deleteNodeRouter);

export default router;
