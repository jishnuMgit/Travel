import { Router } from "express";
import {
  getMe,
  login,
  logout,
} from "../controllers/AuthController";
import { requireAuthentication } from "../middleware/AuthMiddleware";

const authRouter = Router();

authRouter.post("/login", login);
authRouter.get("/me", requireAuthentication, getMe);
authRouter.post("/logout", logout);

export default authRouter;