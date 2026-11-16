-- =====================================================================
-- dbo.sp_pageticketsales - the Ticket Sales screen, the ticket itself (dbo.tblticketsales)
-- the port of the old SP_frmTktSales
--
--   G  one ticket                    (cursor: the ticket's columns)
--   S  save a new ticket
--   M  modify a ticket
--   D  delete a ticket
--
-- The ticket is saved together with its customer line (dbo.sp_pageticketsalesb) in ONE transaction (the backend):
-- any error rolls both back.
-- The rules are here, so they hold whoever calls it:
--   * Ticket Type, Ticket No., Branch and Date are required
--   * the Ticket Type must exist (its service type group is taken from it)
--   * a ticket (company, year, branch, ticket type, ticket no., revision) can be saved once
--   * the BSP Date is kept only for BSP tickets (ticket type B or M); the old rule
-- A rule that fails is a RAISE EXCEPTION (SQLSTATE P0001) whose message the screen shows as it is.
--
-- K7 (txtK7) is the purchase VAT amount of the supplier (the old txtTotPVATAmt, column fpvatamt).
--
-- The table (dbo.tblticketsales): key = fcoid, fyear, fbrid, ftickettypeid, fticketslno, fslno (Sl. No.), frevno;
-- one Ticket No. can have several Sl. Nos (1, 2, ...): each is its own row here and in dbo.tblticketsalesb;
-- fcuserid / fcuserdate = created by, fmuserid / fmuserdate = modified by.
--
-- Parameter names follow the screen: p_<element id of the form, in lower case>. p_pstr... are the logged-in values.
-- The ORDER follows the screen too (from Ticket Type onwards): the parameters, the INSERT columns and the UPDATE are in the order
-- of the fields of the form: Ticket No. (lkpTktType, txtTktSLNo, txtSlNo), Airline, Branch, IATA, the details box, the route box,
-- the amounts box (row by row), then KB. Amt., KB. Account, INV. Note and Note. The grid and Ref. 1-4 are in dbo.sp_pageticketsalesb.
-- A different signature than an older install -> the old one is dropped first (CREATE OR REPLACE cannot rename or
-- move arguments).
-- =====================================================================

DROP PROCEDURE IF EXISTS dbo.sp_pageticketsales;

CREATE OR REPLACE PROCEDURE dbo.sp_pageticketsales
(
    IN    p_strmode           varchar(1),
    IN    p_pstrcoid          varchar(3),
    IN    p_pstryear          varchar(4),
    IN    p_lkptkttype        varchar(4),
    IN    p_txttktslno        varchar(12),
    IN    p_txtslno           smallint      DEFAULT 1,
    IN    p_txtrevno          smallint      DEFAULT 1,
    IN    p_lkpairlineno      varchar(3)    DEFAULT NULL,
    IN    p_lkpbranch         varchar(3)    DEFAULT NULL,
    IN    p_lkpiata           varchar(8)    DEFAULT NULL,
    IN    p_dtpdate           date          DEFAULT NULL,
    IN    p_dtpbspdate        date          DEFAULT NULL,
    IN    p_dtpflightdate     date          DEFAULT NULL,
    IN    p_dtpreturndate     date          DEFAULT NULL,
    IN    p_txtpnrno          varchar(10)   DEFAULT NULL,
    IN    p_lkpdi             varchar(1)    DEFAULT NULL,
    IN    p_lkpsupplier       varchar(12)   DEFAULT NULL,
    IN    p_lkppaysupplierid  varchar(12)   DEFAULT NULL,
    IN    p_txtpaxname        varchar(100)  DEFAULT NULL,
    IN    p_lkpstaffid        varchar(4)    DEFAULT NULL,
    IN    p_txtbookinggdslogin varchar(6)  DEFAULT NULL,
    IN    p_lkppaxtype        varchar(1)    DEFAULT NULL,
    IN    p_txtpaxnameid      varchar(20)   DEFAULT NULL,
    IN    p_lkpvoid           boolean       DEFAULT false,
    IN    p_lkpservice        varchar(4)    DEFAULT NULL,
    IN    p_txtsalesgdslogin  varchar(6)    DEFAULT NULL,
    IN    p_txtmobile         varchar(20)   DEFAULT NULL,
    IN    p_txtemail          varchar(50)   DEFAULT NULL,
    IN    p_lkptrip           varchar(2)    DEFAULT NULL,
    IN    p_txttourcode       varchar(15)   DEFAULT NULL,
    IN    p_txtroute          varchar(40)   DEFAULT NULL,
    IN    p_txtclass          varchar(8)    DEFAULT NULL,
    IN    p_txtdestination    varchar(3)    DEFAULT NULL,
    IN    p_lkpcnj            boolean       DEFAULT false,
    IN    p_lkpgds            varchar(2)    DEFAULT NULL,
    IN    p_lkpcctype         varchar(5)    DEFAULT NULL,
    IN    p_txtcarrier        varchar(8)    DEFAULT NULL,
    IN    p_txtfarebasis      varchar(8)    DEFAULT NULL,
    IN    p_lkpmerchant       varchar(4)    DEFAULT NULL,
    IN    p_lkpfop            varchar(10)   DEFAULT NULL,
    IN    p_txtgfare          numeric(18,2) DEFAULT 0,
    IN    p_txtsupfee         numeric(18,2) DEFAULT 0,
    IN    p_txtfeevat         numeric(18,2) DEFAULT 0,
    IN    p_txtfopcash        numeric(18,2) DEFAULT 0,
    IN    p_txtsfare          numeric(18,2) DEFAULT 0,
    IN    p_lkpalcom          varchar(2)    DEFAULT NULL,
    IN    p_txtalcom          numeric(18,2) DEFAULT 0,
    IN    p_txtsupcom         numeric(18,2) DEFAULT 0,
    IN    p_txtfopcc          numeric(18,2) DEFAULT 0,
    IN    p_txttax            numeric(18,2) DEFAULT 0,
    IN    p_txtalcomamt       numeric(18,2) DEFAULT 0,
    IN    p_txtalcvat         numeric(18,2) DEFAULT 0,
    IN    p_txtfopep          numeric(18,2) DEFAULT 0,
    IN    p_txtk7             numeric(18,2) DEFAULT 0,
    IN    p_txtsupplieramt    numeric(18,2) DEFAULT 0,
    IN    p_txtkbamt          integer       DEFAULT 0,
    IN    p_lkpkbaccount      varchar(12)   DEFAULT NULL,
    IN    p_txtinvnote        varchar(60)   DEFAULT NULL,
    IN    p_txtnote           varchar(100)  DEFAULT NULL,
    IN    p_pstruserid        varchar(30)   DEFAULT NULL,
    INOUT p_result_cursor     refcursor     DEFAULT 'ticketsales_cursor'
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_group        varchar(4);
    v_airlinecode  varchar(3);
    v_bspdate      date;
    v_commper      numeric(18,2);
    v_commamt      numeric(18,2);
    v_now          timestamp := dbo.getserverdate();   -- the common server date (sql/common/fn_getserverdate.sql)
BEGIN

    -- the ticket this call is about
    IF COALESCE(BTRIM(p_lkptkttype), '') = '' THEN
        RAISE EXCEPTION 'Please select ''Ticket Type''';
    END IF;
    IF COALESCE(BTRIM(p_txttktslno), '') = '' THEN
        RAISE EXCEPTION 'Please enter ''Ticket No.''';
    END IF;
    IF COALESCE(BTRIM(p_lkpbranch), '') = '' THEN
        RAISE EXCEPTION 'Please select ''Branch''';
    END IF;
    IF COALESCE(BTRIM(p_pstryear), '') = '' THEN
        RAISE EXCEPTION 'Year not found';
    END IF;

    -- ---------------------------------------------------------------- GET
    IF p_strmode = 'G' THEN

        OPEN p_result_cursor FOR
        SELECT t.*
          FROM dbo.tblticketsales AS t
         WHERE t.fcoid = p_pstrcoid
           AND t.fyear = p_pstryear
           AND t.fbrid = p_lkpbranch
           AND t.ftickettypeid = p_lkptkttype
           AND t.fticketslno = p_txttktslno AND t.fslno = p_txtslno
           AND t.frevno = p_txtrevno;

    -- ------------------------------------------------------ SAVE / MODIFY
    ELSIF p_strmode IN ('S', 'M') THEN

        IF p_dtpdate IS NULL THEN
            RAISE EXCEPTION 'Please enter ''Date''';
        END IF;

        -- the service type group comes from the ticket type
        SELECT t.fservicetypegroupid
          INTO v_group
          FROM dbo.tbltickettype AS t
         WHERE t.fcoid = p_pstrcoid
           AND t.ftickettypeid = p_lkptkttype;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Ticket Type ''%'' does not exist', p_lkptkttype;
        END IF;
        v_group := COALESCE(v_group, 'TKT');

        -- the airline code (e.g. SV) belongs to the airline
        IF COALESCE(BTRIM(p_lkpairlineno), '') <> '' THEN
            SELECT a.fairlinecode
              INTO v_airlinecode
              FROM dbo.tblairline AS a
             WHERE a.fcoid = p_pstrcoid
               AND a.fairlineno = p_lkpairlineno;
        END IF;

        -- the BSP Date only for BSP tickets
        v_bspdate := CASE WHEN p_lkptkttype IN ('B', 'M') THEN p_dtpbspdate ELSE NULL END;

        -- A/L Com.: the % and the amount as the screen shows them (one is typed, the other worked out)
        v_commper := p_txtalcom;
        v_commamt := p_txtalcomamt;

        IF p_strmode = 'S' THEN

            IF EXISTS (SELECT 1 FROM dbo.tblticketsales
                        WHERE fcoid = p_pstrcoid AND fyear = p_pstryear AND fbrid = p_lkpbranch
                          AND ftickettypeid = p_lkptkttype AND fticketslno = p_txttktslno AND fslno = p_txtslno AND frevno = p_txtrevno) THEN
                RAISE EXCEPTION 'Ticket ''%-%'' Sl. No. % already exists', p_lkptkttype, p_txttktslno, p_txtslno;
            END IF;

            INSERT INTO dbo.tblticketsales
                   (fcoid, fyear, ftickettypeid, fticketslno, fslno, frevno, fservicetypegroupid, fairlineno,
                    fairlinecode, fbrid, fiatacode, fdate, fbspdate, ftraveldate, freturndate, fpnr, fdi,
                    fsupplierid, fpaysupplierid, fpaxname, fstaffid, fbgdsstaffid, fpaxtype, fpaxid, fvoid,
                    fserviceid, fgdsstaffid, fmobileno, femail, ftrip, ftourcode, froute, fclass, fdestid, fcnj,
                    fgdsid, fcctype, fcarrier, ffarebasis, fmerchant, ffop, fiataamt, fsupfee, fsupfeevatamt,
                    fsupplieramtcash, fsellingamt, fcommtype, fcommper, fscommamt, fsupplieramtcc, ftaxamt, fcommamt,
                    fcommvatamt, fsupplieramtep, fpvatamt, fsupplieramt, fkbamt, fkbaccountid, finvnote, fnote,
                    fuserid, fuserdate, fcuserid, fcuserdate)
            VALUES (p_pstrcoid, p_pstryear, p_lkptkttype, p_txttktslno, COALESCE(p_txtslno, 1), p_txtrevno, v_group,
                    NULLIF(BTRIM(p_lkpairlineno), ''), v_airlinecode, p_lkpbranch, NULLIF(BTRIM(p_lkpiata), ''),
                    p_dtpdate, v_bspdate, p_dtpflightdate, p_dtpreturndate, NULLIF(BTRIM(p_txtpnrno), ''),
                    NULLIF(BTRIM(p_lkpdi), ''), NULLIF(BTRIM(p_lkpsupplier), ''),
                    NULLIF(BTRIM(p_lkppaysupplierid), ''), NULLIF(BTRIM(p_txtpaxname), ''),
                    NULLIF(BTRIM(p_lkpstaffid), ''), NULLIF(BTRIM(p_txtbookinggdslogin), ''),
                    NULLIF(BTRIM(p_lkppaxtype), ''), NULLIF(BTRIM(p_txtpaxnameid), ''), COALESCE(p_lkpvoid, false),
                    NULLIF(BTRIM(p_lkpservice), ''), NULLIF(BTRIM(p_txtsalesgdslogin), ''),
                    NULLIF(BTRIM(p_txtmobile), ''), NULLIF(BTRIM(p_txtemail), ''), NULLIF(BTRIM(p_lkptrip), ''),
                    NULLIF(BTRIM(p_txttourcode), ''), NULLIF(BTRIM(p_txtroute), ''), NULLIF(BTRIM(p_txtclass), ''),
                    NULLIF(BTRIM(p_txtdestination), ''), COALESCE(p_lkpcnj, false), NULLIF(BTRIM(p_lkpgds), ''),
                    NULLIF(BTRIM(p_lkpcctype), ''), NULLIF(BTRIM(p_txtcarrier), ''),
                    NULLIF(BTRIM(p_txtfarebasis), ''), NULLIF(BTRIM(p_lkpmerchant), ''), NULLIF(BTRIM(p_lkpfop), ''),
                    p_txtgfare, p_txtsupfee, p_txtfeevat, p_txtfopcash, p_txtsfare, NULLIF(BTRIM(p_lkpalcom), ''),
                    v_commper, p_txtsupcom, p_txtfopcc, p_txttax, v_commamt, p_txtalcvat, p_txtfopep, p_txtk7,
                    p_txtsupplieramt, COALESCE(p_txtkbamt, 0), NULLIF(BTRIM(p_lkpkbaccount), ''),
                    NULLIF(BTRIM(p_txtinvnote), ''), NULLIF(BTRIM(p_txtnote), ''), LEFT(p_pstruserid, 20), v_now,
                    p_pstruserid, v_now);

        ELSE

            IF NOT EXISTS (SELECT 1 FROM dbo.tblticketsales
                            WHERE fcoid = p_pstrcoid AND fyear = p_pstryear AND fbrid = p_lkpbranch
                              AND ftickettypeid = p_lkptkttype AND fticketslno = p_txttktslno AND fslno = p_txtslno AND frevno = p_txtrevno) THEN
                RAISE EXCEPTION 'Ticket ''%-%'' was changed or removed by someone else. Cancel and try again',
                                p_lkptkttype, p_txttktslno;
            END IF;

            UPDATE dbo.tblticketsales
               SET fservicetypegroupid = v_group,
                   fairlineno          = NULLIF(BTRIM(p_lkpairlineno), ''),
                   fairlinecode        = v_airlinecode,
                   fiatacode           = NULLIF(BTRIM(p_lkpiata), ''),
                   fdate               = p_dtpdate,
                   fbspdate            = v_bspdate,
                   ftraveldate         = p_dtpflightdate,
                   freturndate         = p_dtpreturndate,
                   fpnr                = NULLIF(BTRIM(p_txtpnrno), ''),
                   fdi                 = NULLIF(BTRIM(p_lkpdi), ''),
                   fsupplierid         = NULLIF(BTRIM(p_lkpsupplier), ''),
                   fpaysupplierid      = NULLIF(BTRIM(p_lkppaysupplierid), ''),
                   fpaxname            = NULLIF(BTRIM(p_txtpaxname), ''),
                   fstaffid            = NULLIF(BTRIM(p_lkpstaffid), ''),
                   fbgdsstaffid        = NULLIF(BTRIM(p_txtbookinggdslogin), ''),
                   fpaxtype            = NULLIF(BTRIM(p_lkppaxtype), ''),
                   fpaxid              = NULLIF(BTRIM(p_txtpaxnameid), ''),
                   fvoid               = COALESCE(p_lkpvoid, false),
                   fserviceid          = NULLIF(BTRIM(p_lkpservice), ''),
                   fgdsstaffid         = NULLIF(BTRIM(p_txtsalesgdslogin), ''),
                   fmobileno           = NULLIF(BTRIM(p_txtmobile), ''),
                   femail              = NULLIF(BTRIM(p_txtemail), ''),
                   ftrip               = NULLIF(BTRIM(p_lkptrip), ''),
                   ftourcode           = NULLIF(BTRIM(p_txttourcode), ''),
                   froute              = NULLIF(BTRIM(p_txtroute), ''),
                   fclass              = NULLIF(BTRIM(p_txtclass), ''),
                   fdestid             = NULLIF(BTRIM(p_txtdestination), ''),
                   fcnj                = COALESCE(p_lkpcnj, false),
                   fgdsid              = NULLIF(BTRIM(p_lkpgds), ''),
                   fcctype             = NULLIF(BTRIM(p_lkpcctype), ''),
                   fcarrier            = NULLIF(BTRIM(p_txtcarrier), ''),
                   ffarebasis          = NULLIF(BTRIM(p_txtfarebasis), ''),
                   fmerchant           = NULLIF(BTRIM(p_lkpmerchant), ''),
                   ffop                = NULLIF(BTRIM(p_lkpfop), ''),
                   fiataamt            = p_txtgfare,
                   fsupfee             = p_txtsupfee,
                   fsupfeevatamt       = p_txtfeevat,
                   fsupplieramtcash    = p_txtfopcash,
                   fsellingamt         = p_txtsfare,
                   fcommtype           = NULLIF(BTRIM(p_lkpalcom), ''),
                   fcommper            = v_commper,
                   fscommamt           = p_txtsupcom,
                   fsupplieramtcc      = p_txtfopcc,
                   ftaxamt             = p_txttax,
                   fcommamt            = v_commamt,
                   fcommvatamt         = p_txtalcvat,
                   fsupplieramtep      = p_txtfopep,
                   fpvatamt            = p_txtk7,
                   fsupplieramt        = p_txtsupplieramt,
                   fkbamt              = COALESCE(p_txtkbamt, 0),
                   fkbaccountid        = NULLIF(BTRIM(p_lkpkbaccount), ''),
                   finvnote            = NULLIF(BTRIM(p_txtinvnote), ''),
                   fnote               = NULLIF(BTRIM(p_txtnote), ''),
                   fmuserid            = p_pstruserid,
                   fmuserdate          = v_now
             WHERE fcoid = p_pstrcoid
               AND fyear = p_pstryear
               AND fbrid = p_lkpbranch
               AND ftickettypeid = p_lkptkttype
               AND fticketslno = p_txttktslno AND fslno = p_txtslno
               AND frevno = p_txtrevno;

        END IF;

    -- ------------------------------------------------------------- DELETE
    ELSIF p_strmode = 'D' THEN

        DELETE FROM dbo.tblticketsales
         WHERE fcoid = p_pstrcoid
           AND fyear = p_pstryear
           AND fbrid = p_lkpbranch
           AND ftickettypeid = p_lkptkttype
           AND fticketslno = p_txttktslno AND fslno = p_txtslno
           AND frevno = p_txtrevno;

    ELSE
        RAISE EXCEPTION 'invalid mode: %', p_strmode;
    END IF;
END;
$$;
