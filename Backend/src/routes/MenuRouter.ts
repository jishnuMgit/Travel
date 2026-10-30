import { Router } from "express";
import { getMenus } from "../controllers/MenuController";
import { requireAuthentication } from "../middleware/AuthMiddleware";

const menuRouter = Router();

menuRouter.get("/", requireAuthentication, getMenus);

export default menuRouter;
