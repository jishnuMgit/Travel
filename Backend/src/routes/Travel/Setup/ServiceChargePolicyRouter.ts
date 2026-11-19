
import { Router, type Request, type Response } from "express";
import { copyServiceChargePolicy, handleServiceChargePolicy } from "../../../controllers/Travel/Setup/ServiceChargePolicyController";
import {
  requireAuthentication,
  type AuthenticatedRequest,
} from "../../../middleware/AuthMiddleware";
import {
  getAttachments,
  getFile,
  saveAttachments,
} from "../../../services/Travel/Setup/attachService";
import type { AttachDto } from "../../../types";

const router = Router();

router.post("/", requireAuthentication, handleServiceChargePolicy);
router.post("/copyServiceChargePolicy", requireAuthentication, copyServiceChargePolicy);

const attachmentScope = (req: Request) => ({
  coId: typeof req.query.PstrCoID === "string" ? req.query.PstrCoID.trim() : "",
  accountId:
    typeof req.query.StrCustomerID === "string"
      ? req.query.StrCustomerID.trim()
      : "",
  type: typeof req.query.StrSR === "string" ? req.query.StrSR.trim() : "",
});

const isValidAttachmentScope = (
  scope: ReturnType<typeof attachmentScope>,
) => Boolean(scope.coId && scope.accountId && ["S", "R"].includes(scope.type));

router.get(
  "/attachments",
  requireAuthentication,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const scope = attachmentScope(req);
    if (!isValidAttachmentScope(scope)) {
      res.status(400).json({
        success: false,
        message: "Company ID, customer ID, and a valid policy type are required.",
      });
      return;
    }

    try {
      res.status(200).json(
        await getAttachments(scope.coId, scope.accountId, scope.type),
      );
    } catch (error) {
      console.error("Service charge policy attachments load error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to load service charge policy attachments.",
      });
    }
  },
);

router.get(
  "/attachments/file/:slNo",
  requireAuthentication,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const scope = attachmentScope(req);
    const slNo = Number(req.params.slNo);
    if (!isValidAttachmentScope(scope) || !Number.isInteger(slNo) || slNo < 1) {
      res.status(400).json({
        success: false,
        message: "Valid attachment details are required.",
      });
      return;
    }

    try {
      const file = await getFile(
        scope.coId,
        scope.accountId,
        scope.type,
        slNo,
      );
      if (!file) {
        res.status(404).json({ success: false, message: "Attachment not found." });
        return;
      }

      res.setHeader("Content-Type", file.mime);
      res.setHeader("Content-Length", file.bytes.length);
      res.setHeader(
        "Content-Disposition",
        `${req.query.download === "true" ? "attachment" : "inline"}; filename="${encodeURIComponent(file.name)}"`,
      );
      res.status(200).send(file.bytes);
    } catch (error) {
      console.error("Service charge policy attachment download error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to load the attachment.",
      });
    }
  },
);

router.post(
  "/attachments",
  requireAuthentication,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { PstrCoID, StrCustomerID, StrSR, Rows } = req.body ?? {};
    const scope = {
      coId: typeof PstrCoID === "string" ? PstrCoID.trim() : "",
      accountId:
        typeof StrCustomerID === "string" ? StrCustomerID.trim() : "",
      type: typeof StrSR === "string" ? StrSR.trim() : "",
    };
    const userId = req.user?.userId;

    if (!isValidAttachmentScope(scope) || !Array.isArray(Rows) || !userId) {
      res.status(400).json({
        success: false,
        message: "Valid customer, policy type, user, and attachment rows are required.",
      });
      return;
    }

    try {
      await saveAttachments(
        scope.coId,
        scope.accountId,
        scope.type,
        userId,
        Rows as AttachDto[],
      );
      res.status(200).json({
        success: true,
        message: "Attachments saved successfully.",
      });
    } catch (error) {
      console.error("Service charge policy attachment save error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to save service charge policy attachments.",
      });
    }
  },
);

export default router;
