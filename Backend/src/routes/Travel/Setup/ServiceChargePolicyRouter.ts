
import { Router } from "express";
import {
  copyServiceChargePolicy,
  handleGetServiceChargePolicyAttachmentFile,
  handleGetServiceChargePolicyAttachments,
  handleSaveServiceChargePolicyAttachments,
  handleServiceChargePolicy,
} from "../../../controllers/Travel/Setup/ServiceChargePolicyController";
import { requireAuthentication } from "../../../middleware/AuthMiddleware";

const router = Router();

router.post("/", requireAuthentication, handleServiceChargePolicy);
router.post("/copyServiceChargePolicy", requireAuthentication, copyServiceChargePolicy);
router.get(
  "/attachments",
  requireAuthentication,
  handleGetServiceChargePolicyAttachments,
);
router.get(
  "/attachments/file/:slNo",
  requireAuthentication,
  handleGetServiceChargePolicyAttachmentFile,
);
router.post(
  "/attachments",
  requireAuthentication,
  handleSaveServiceChargePolicyAttachments,
);

export default router;
