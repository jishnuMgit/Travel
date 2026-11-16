import type { Request, Response } from "express";
import pool from "../../../DB/db";
import type { AuthenticatedRequest } from "../../../middleware/AuthMiddleware";
import {
  ApiError,
  deleteTicketSales as deleteTicketSalesRecord,
  fetchTicketSales as fetchTicketSalesRecord,
  fetchTicketSalesSlNos as fetchTicketSalesSlNosRecord,
  fetchTicketSalesVat,
  modifyTicketSales as modifyTicketSalesRecord,
  saveTicketSales as saveTicketSalesRecord,
  type SaveTicketSalesPayload,
} from "../../../services/Travel/Sales/TicketSalesService";

// GET /api/ticket-sales/tkt-types/:PstrCoID
// Ticket type lookup (prefix dropdown) for the Ticket Sales screen.
export const getTicketSalesTktTypes = async (req: Request, res: Response) => {
  const PstrCoID =
    typeof req.params.PstrCoID === "string" ? req.params.PstrCoID.trim() : "";

  if (!PstrCoID || PstrCoID.length > 3) {
    res.status(400).json({ message: "A valid pstrcoid is required." });
    return;
  }

  try {
    const result = await pool.query(
      `SELECT fticketTypeid, ftickttypename
         FROM dbo.tbltickettype
        WHERE fcoid = $1
        ORDER BY fpositionno`,
      [PstrCoID],
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Ticket sales ticket type lookup error:", error);
    res.status(500).json({ message: "Internal server error while loading ticket types." });
  }
};

// GET /api/ticket-sales/com-types
// Airline commission type lookup (fpid, fpname) for the Ticket Sales screen:
// the COMTP parameters of tbltlparam (P = Percentage, A = Amount).
// tbltlparam has no company column.
export const getTicketSalesComTypes = async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT fpid, fpname
         FROM dbo.tbltlparam
        WHERE fptype = 'COMTP'
        ORDER BY fpositionno, fpid`,
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Ticket sales commission type lookup error:", error);
    res.status(500).json({ message: "Internal server error while loading commission types." });
  }
};

// GET /api/ticket-sales/pax-types
// Passenger type lookup (fpid, fpname) for the Ticket Sales screen: the PXTP
// parameters of tbltlparam. tbltlparam has no company column.
export const getTicketSalesPaxTypes = async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT fpid, fpname
         FROM dbo.tbltlparam
        WHERE fptype = 'PXTP'
        ORDER BY fpositionno, fpid`,
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Ticket sales pax type lookup error:", error);
    res.status(500).json({ message: "Internal server error while loading pax types." });
  }
};

// GET /api/ticket-sales/di
// Domestic / International lookup (fpid, fpname) for the Ticket Sales screen:
// the DITP parameters of tbltlparam (Domestic and International only; B = Both
// is left out). tbltlparam has no company column.
export const getTicketSalesDi = async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT fpid, fpname
         FROM dbo.tbltlparam
        WHERE fptype = 'DITP'
          AND fpid IN ('D', 'I')
        ORDER BY fpositionno, fpid`,
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Ticket sales D/I lookup error:", error);
    res.status(500).json({ message: "Internal server error while loading D/I." });
  }
};

// GET /api/ticket-sales/merchants
// Merchant lookup (fpid, fpname) for the Ticket Sales screen: the MERC
// parameters of tbltlparam. tbltlparam has no company column.
export const getTicketSalesMerchants = async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT fpid, fpname
         FROM dbo.tbltlparam
        WHERE fptype = 'MERC'
        ORDER BY fpositionno, fpid`,
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Ticket sales merchant lookup error:", error);
    res.status(500).json({ message: "Internal server error while loading merchants." });
  }
};

// GET /api/ticket-sales/fop/:PstrCoID
// Form of payment lookup (ffop, ffopname) for the Ticket Sales screen.
export const getTicketSalesFop = async (req: Request, res: Response) => {
  const PstrCoID =
    typeof req.params.PstrCoID === "string" ? req.params.PstrCoID.trim() : "";

  if (!PstrCoID || PstrCoID.length > 3) {
    res.status(400).json({ message: "A valid PstrCoID is required." });
    return;
  }

  try {
    const result = await pool.query(
      `SELECT ffop, ffopname
         FROM dbo.tblfop
        WHERE fcoid = $1
        ORDER BY fpositionno, ffop`,
      [PstrCoID],
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Ticket sales FOP lookup error:", error);
    res.status(500).json({ message: "Internal server error while loading form of payment." });
  }
};

// GET /api/ticket-sales/gds/:PstrCoID
// GDS lookup (fgdsid, fgdsname) for the Ticket Sales screen: active GDS only.
export const getTicketSalesGds = async (req: Request, res: Response) => {
  const PstrCoID =
    typeof req.params.PstrCoID === "string" ? req.params.PstrCoID.trim() : "";

  if (!PstrCoID || PstrCoID.length > 3) {
    res.status(400).json({ message: "A valid PstrCoID is required." });
    return;
  }

  try {
    const result = await pool.query(
      `SELECT fgdsid, fgdsname
         FROM dbo.tblgds
        WHERE fcoid = $1
          AND factive = true
        ORDER BY fpositionno, fgdsid`,
      [PstrCoID],
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Ticket sales GDS lookup error:", error);
    res.status(500).json({ message: "Internal server error while loading GDS." });
  }
};

// GET /api/ticket-sales/service-types/:PstrCoID
// Service type lookup (fservicetypeid, fservicetypename) for the Ticket Sales
// screen: the service types of the ticket group (fservicetypegroupid = TKT).
export const getTicketSalesServiceTypes = async (
  req: Request,
  res: Response,
) => {
  const PstrCoID =
    typeof req.params.PstrCoID === "string" ? req.params.PstrCoID.trim() : "";

  if (!PstrCoID || PstrCoID.length > 3) {
    res.status(400).json({ message: "A valid PstrCoID is required." });
    return;
  }

  try {
    const result = await pool.query(
      `SELECT fservicetypeid, fservicetypename
         FROM dbo.tblservicetype
        WHERE fcoid = $1
          AND fservicetypegroupid = 'TKT'
        ORDER BY fpositionno, fservicetypeid`,
      [PstrCoID],
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Ticket sales service type lookup error:", error);
    res.status(500).json({ message: "Internal server error while loading service types." });
  }
};

// GET /api/ticket-sales/customers/:PstrCoID
// Customer lookup for the Ticket Sales grid: tblaccountcs rows with fcs = 'C'.
export const getTicketSalesCustomers = async (req: Request, res: Response) => {
  const PstrCoID =
    typeof req.params.PstrCoID === "string" ? req.params.PstrCoID.trim() : "";

  if (!PstrCoID || PstrCoID.length > 3) {
    res.status(400).json({ message: "A valid PstrCoID is required." });
    return;
  }

  try {
    const result = await pool.query(
      `SELECT fcsaccountid, fcsaccountname, fbussinesstype,
              COALESCE(fisservicechargepolicy, false) AS fisservicechargepolicy
         FROM dbo.tblaccountcs
        WHERE fcoid = $1
          AND fcs = 'C'
        ORDER BY fcsaccountid`,
      [PstrCoID],
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Ticket sales customer lookup error:", error);
    res.status(500).json({ message: "Internal server error while loading customers." });
  }
};

// GET /api/ticket-sales/customer-divisions/:PstrCoID/:CustomerID
// Divisions (fdivid, fdivname) of one customer, from tblcustdivision.
export const getTicketSalesCustomerDivisions = async (
  req: Request,
  res: Response,
) => {
  const PstrCoID =
    typeof req.params.PstrCoID === "string" ? req.params.PstrCoID.trim() : "";
  const CustomerID =
    typeof req.params.CustomerID === "string" ? req.params.CustomerID.trim() : "";

  if (!PstrCoID || PstrCoID.length > 3) {
    res.status(400).json({ message: "A valid PstrCoID is required." });
    return;
  }

  if (!CustomerID || CustomerID.length > 12) {
    res.status(400).json({ message: "A valid CustomerID is required." });
    return;
  }

  try {
    const result = await pool.query(
      `SELECT fdivid, fdivname
         FROM dbo.tblcustdivision
        WHERE fcoid = $1
          AND fcustomerid = $2
        ORDER BY fdivid`,
      [PstrCoID, CustomerID],
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Ticket sales customer division lookup error:", error);
    res.status(500).json({ message: "Internal server error while loading divisions." });
  }
};

// GET /api/ticket-sales/service-charge-policies/:PstrCoID
// The service charge policies of the customers (dbo.tblservicechargepolicy, fsr = 'S'): the S. Chg. of a
// customer line is worked out from the row of its customer + service type (the old CalCustomerSCharge).
export const getTicketSalesServiceChargePolicies = async (
  req: Request,
  res: Response,
) => {
  const PstrCoID =
    typeof req.params.PstrCoID === "string" ? req.params.PstrCoID.trim() : "";

  if (!PstrCoID || PstrCoID.length > 3) {
    res.status(400).json({ message: "A valid PstrCoID is required." });
    return;
  }

  try {
    const result = await pool.query(
      `SELECT fcustomerid, fservicetypeid, fmf,
              fd_servicechargetype, fd_servicechgper, fd_minservicechgamt, fd_servicechgamt,
              fi_servicechargetype, fi_servicechgper, fi_minservicechgamt, fi_servicechgamt
         FROM dbo.tblservicechargepolicy
        WHERE fcoid = $1
          AND fsr = 'S'
        ORDER BY fcustomerid, fservicetypeid`,
      [PstrCoID],
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Ticket sales service charge policy lookup error:", error);
    res.status(500).json({ message: "Internal server error while loading the service charge policies." });
  }
};

// GET /api/ticket-sales/suppliers/:PstrCoID
// Supplier lookup for the Ticket Sales screen: tblaccountcs rows with fcs = 'S'.
export const getTicketSalesSuppliers = async (req: Request, res: Response) => {
  const PstrCoID =
    typeof req.params.PstrCoID === "string" ? req.params.PstrCoID.trim() : "";

  if (!PstrCoID || PstrCoID.length > 3) {
    res.status(400).json({ message: "A valid PstrCoID is required." });
    return;
  }

  try {
    const result = await pool.query(
      `SELECT fcsaccountid, fcsaccountname
         FROM dbo.tblaccountcs
        WHERE fcoid = $1
          AND fcs = 'S'
        ORDER BY fcsaccountid`,
      [PstrCoID],
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Ticket sales supplier lookup error:", error);
    res.status(500).json({ message: "Internal server error while loading suppliers." });
  }
};

// GET /api/ticket-sales/staffs/:PstrCoID
// Staff lookup (fstaffid, fstaffname) for the Ticket Sales screen.
export const getTicketSalesStaffs = async (req: Request, res: Response) => {
  const PstrCoID =
    typeof req.params.PstrCoID === "string" ? req.params.PstrCoID.trim() : "";

  if (!PstrCoID || PstrCoID.length > 3) {
    res.status(400).json({ message: "A valid PstrCoID is required." });
    return;
  }

  try {
    const result = await pool.query(
      `SELECT fstaffid, fstaffname
         FROM dbo.tblstaff
        WHERE fcoid = $1
        ORDER BY fstaffid`,
      [PstrCoID],
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Ticket sales staff lookup error:", error);
    res.status(500).json({ message: "Internal server error while loading staff." });
  }
};

// GET /api/ticket-sales/iatas/:PstrCoID
// IATA lookup (fiatacode, fiataname) for the Ticket Sales screen.
export const getTicketSalesIatas = async (req: Request, res: Response) => {
  const PstrCoID =
    typeof req.params.PstrCoID === "string" ? req.params.PstrCoID.trim() : "";

  if (!PstrCoID || PstrCoID.length > 3) {
    res.status(400).json({ message: "A valid PstrCoID is required." });
    return;
  }

  try {
    const result = await pool.query(
      `SELECT fiatacode, fiataname, fbsppurchase_csaccountid
         FROM dbo.tbliata
        WHERE fcoid = $1
        ORDER BY fpositionno, fiatacode`,
      [PstrCoID],
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Ticket sales IATA lookup error:", error);
    res.status(500).json({ message: "Internal server error while loading IATA codes." });
  }
};

// GET /api/ticket-sales/branches/:PstrCoID
// Branch lookup for the Ticket Sales screen.
export const getTicketSalesBranches = async (req: Request, res: Response) => {
  const PstrCoID =
    typeof req.params.PstrCoID === "string" ? req.params.PstrCoID.trim() : "";

  if (!PstrCoID || PstrCoID.length > 3) {
    res.status(400).json({ message: "A valid pstrcoid is required." });
    return;
  }

  try {
    const result = await pool.query(
      `SELECT fbrid, fbrname
         FROM dbo.tblbranch
        WHERE fcoid = $1
        ORDER BY fpositionno, fbrid`,
      [PstrCoID],
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Ticket sales branch lookup error:", error);
    res.status(500).json({ message: "Internal server error while loading branches." });
  }
};

// GET /api/ticket-sales/airlines/:PstrCoID
// Airline lookup for the Ticket Sales screen.
export const getTicketSalesAirlines = async (req: Request, res: Response) => {
  const PstrCoID =
    typeof req.params.PstrCoID === "string" ? req.params.PstrCoID.trim() : "";

  if (!PstrCoID || PstrCoID.length > 3) {
    res.status(400).json({ message: "A valid pstrcoid is required." });
    return;
  }

  try {
    const query = `SELECT fcoid, fairlineno, fairlinename, fairlinecode
         FROM dbo.tblairline
        WHERE fcoid = $1
        ORDER BY fairlineno`;
    const result = await pool.query(query, [PstrCoID]);
    res.status(200).json(result.rows);
  } 
  catch (error) {
    res.status(500).json({ message: "Internal server error while loading airlines." });
  }
};

/* ---------------------------------------------------------------------
   POST /api/ticket-sales : save a NEW ticket
   The rules are in dbo.sp_pageticketsales / dbo.sp_pageticketsalesb, called by
   the service in one transaction. The user is the logged-in user (the session),
   never the request.
   --------------------------------------------------------------------- */
export const saveTicketSales = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  // the user stored in fcuserid / fmuserid is the logged-in user of the SESSION (the screen also sends PstrUserID, but a value
  // from the browser can be changed by anyone, so it is not what is stored)
  const PstrUserID = req.user?.userId;

  if (!PstrUserID) {
    res.status(401).json({ success: false, message: "Authentication required" });
    return;
  }

  try {
    const saved = await saveTicketSalesRecord(
      (req.body ?? {}) as SaveTicketSalesPayload,
      PstrUserID,
    );

    res.status(201).json({
      success: true,
      message: "Saved successfully",
      ticket: saved,
    });
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      res.status(error.status).json({ success: false, message: error.message });
      return;
    }

    console.error("Ticket sales save error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while saving the ticket.",
    });
  }
};

/* ---------------------------------------------------------------------
   GET /api/ticket-sales/vat/:PstrCoID?lkpDI=&dtpDate=&lkpAirlineNo=
   The VAT percentages of the fares panel: dbo.getvatper, dbo.getcommvatper and
   dbo.getvatoncommission.
   --------------------------------------------------------------------- */
export const getTicketSalesVat = async (req: Request, res: Response) => {
  const PstrCoID =
    typeof req.params.PstrCoID === "string" ? req.params.PstrCoID.trim() : "";
  const queryText = (value: unknown) => (typeof value === "string" ? value : "");

  try {
    const vat = await fetchTicketSalesVat(
      PstrCoID,
      queryText(req.query.lkpDI),
      queryText(req.query.dtpDate),
      queryText(req.query.lkpAirlineNo),
    );
    res.status(200).json(vat);
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      res.status(error.status).json({ message: error.message });
      return;
    }

    console.error("Ticket sales VAT lookup error:", error);
    res.status(500).json({ message: "Internal server error while loading the VAT percentages." });
  }
};

// GET /api/ticket-sales/ticket/:PstrCoID/:PstrYear/:lkpTktType/:txtTktSLNo?lkpBranch=JD&txtSlNo=2  (no txtSlNo = the first Sl. No. saved)
// Load a saved ticket (the ticket and its customer line) into the Ticket Sales screen: the keys of the answer are the
// element ids of the form. The ticket is searched in the branch of the screen first, else in the branch it was saved in.
export const loadTicketSales = async (req: Request, res: Response) => {
  const param = (value: unknown) => (typeof value === "string" ? value.trim() : "");

  try {
    const ticket = await fetchTicketSalesRecord({
      PstrCoID: param(req.params.PstrCoID),
      PstrYear: param(req.params.PstrYear),
      lkpTktType: param(req.params.lkpTktType),
      txtTktSLNo: param(req.params.txtTktSLNo),
      lkpBranch: param(req.query.lkpBranch) || null,
      txtSlNo: param(req.query.txtSlNo) || null,
    });

    if (!ticket) {
      res.status(404).json({
        success: false,
        message: `Ticket ${param(req.params.lkpTktType)}-${param(req.params.txtTktSLNo)} not found`,
      });
      return;
    }

    res.status(200).json({ success: true, ticket });
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      res.status(error.status).json({ success: false, message: error.message });
      return;
    }

    console.error("Ticket sales load error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while loading the ticket.",
    });
  }
};

// GET /api/ticket-sales/ticket/:PstrCoID/:PstrYear/:lkpTktType/:txtTktSLNo/sl-nos
// The Sl. Nos saved for a Ticket No. and the next free one (1 when it is not saved yet): the Sl. No. box shows the next one
// when it is cleared.
export const getTicketSalesSlNos = async (req: Request, res: Response) => {
  const param = (value: unknown) => (typeof value === "string" ? value.trim() : "");

  try {
    const result = await fetchTicketSalesSlNosRecord({
      PstrCoID: param(req.params.PstrCoID),
      PstrYear: param(req.params.PstrYear),
      lkpTktType: param(req.params.lkpTktType),
      txtTktSLNo: param(req.params.txtTktSLNo),
    });

    res.status(200).json({ success: true, ...result });
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      res.status(error.status).json({ success: false, message: error.message });
      return;
    }

    console.error("Ticket sales Sl. No. lookup error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while loading the Sl. Nos.",
    });
  }
};

// PUT /api/ticket-sales
// Modify a saved ticket: the same body as the save (the keys are the element ids of the form). The user stored in fmuserid is
// the logged-in user of the session, as in the save.
export const modifyTicketSales = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const PstrUserID = req.user?.userId;

  if (!PstrUserID) {
    res.status(401).json({ success: false, message: "Authentication required" });
    return;
  }

  try {
    const saved = await modifyTicketSalesRecord(
      (req.body ?? {}) as SaveTicketSalesPayload,
      PstrUserID,
    );

    res.status(200).json({
      success: true,
      message: "Modified successfully",
      ticket: saved,
    });
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      res.status(error.status).json({ success: false, message: error.message });
      return;
    }

    console.error("Ticket sales modify error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while modifying the ticket.",
    });
  }
};

// DELETE /api/ticket-sales/ticket/:PstrCoID/:PstrYear/:lkpTktType/:txtTktSLNo?lkpBranch=JD
// Delete a saved ticket and its customer line (the old Delete button). A ticket that does not exist is a 404; an invoiced or
// posted ticket is refused.
export const deleteTicketSales = async (req: AuthenticatedRequest, res: Response) => {
  const param = (value: unknown) => (typeof value === "string" ? value.trim() : "");
  const PstrUserID = req.user?.userId;

  if (!PstrUserID) {
    res.status(401).json({ success: false, message: "Authentication required" });
    return;
  }

  try {
    const deleted = await deleteTicketSalesRecord(
      {
      PstrCoID: param(req.params.PstrCoID),
      PstrYear: param(req.params.PstrYear),
      lkpTktType: param(req.params.lkpTktType),
      txtTktSLNo: param(req.params.txtTktSLNo),
      lkpBranch: param(req.query.lkpBranch) || null,
      txtSlNo: param(req.query.txtSlNo) || null,
      },
      PstrUserID,
    );

    res.status(200).json({ success: true, message: "Deleted successfully", ticket: deleted });
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      res.status(error.status).json({ success: false, message: error.message });
      return;
    }

    console.error("Ticket sales delete error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while deleting the ticket.",
    });
  }
};
