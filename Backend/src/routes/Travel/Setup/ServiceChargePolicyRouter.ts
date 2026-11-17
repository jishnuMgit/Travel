
import { Router } from "express";
import { copyServiceChargePolicy, handleServiceChargePolicy } from "../../../controllers/Travel/Setup/ServiceChargePolicyController";
import { requireAuthentication } from "../../../middleware/AuthMiddleware";

const router = Router();

router.post("/", requireAuthentication, handleServiceChargePolicy);
router.post("/copyServiceChargePolicy", requireAuthentication, copyServiceChargePolicy);

export default router;
