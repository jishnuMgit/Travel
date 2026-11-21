

import { Router } from "express";
import {
  Apply,
  ApplyD,
  DeleteBudget,
//   FillAccountCombos,
  FillCombos,
  GetDataTL,
  SaveBudget,
  UpdateBudget,
}  from "../../../controllers/Travel/Sales/BudgetController";import { requireAuthentication } from "../../../middleware/AuthMiddleware";
;

const router = Router();

// Lookups
router.get("/FillCombos/:PstrCoID", FillCombos);
// router.get("/FillAccountCombos/:StrBudgetHeadType", FillAccountCombos);
router.get("/GetDataTL/:PstrCoID/:IntYear/:StrBrID/:StrType",requireAuthentication, GetDataTL);

// Save (whole grid: inserts + updates + deletes in one transaction)
router.post("/Apply",requireAuthentication, Apply);

// Save (single row)
router.post("/SaveBudget",requireAuthentication, SaveBudget);
router.put("/UpdateBudget/:PstrCoID/:IntYear/:StrBrID/:StrType/:OriginalSlNo",requireAuthentication, UpdateBudget);
router.delete("/DeleteBudget/:PstrCoID/:IntYear/:StrBrID/:StrType/:OriginalSlNo",requireAuthentication, DeleteBudget);

// Delete all rows for year / branch / type
router.delete("/ApplyD/:PstrCoID/:IntYear/:StrBrID/:StrType",requireAuthentication, ApplyD);

export default router;