
import { Router } from "express";
import { handleServiceChargePolicy } from "../../../controllers/Travel/Setup/ServiceChargePolicyController";
import { requireAuthentication } from "../../../middleware/AuthMiddleware";

const router = Router();

router.post("/", requireAuthentication, handleServiceChargePolicy);

export default router;
