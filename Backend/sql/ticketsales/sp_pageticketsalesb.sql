-- =====================================================================
-- dbo.sp_pageticketsalesb - the Ticket Sales screen, the customer line (dbo.tblticketsalesb)
-- the port of the old SP_frmTktSalesB
--
--   G  the customer line of one ticket  (cursor: the line's columns)
--   S  save the customer line of a new ticket
--   M  modify the customer line
--   D  delete the customer line
--
-- Called after dbo.sp_pageticketsales, in the same transaction (the backend).
-- The rules are here, so they hold whoever calls it:
--   * the ticket must exist (dbo.sp_pageticketsales saves it first)
--   * Customer is required
--   * dbo.tblticketsalesb has ONE row per ticket revision (its key has no line number), so a ticket has one
--     customer line
-- A rule that fails is a RAISE EXCEPTION (SQLSTATE P0001) whose message the screen shows as it is.
--
-- The table (dbo.tblticketsalesb): key = fcoid, fyear, fbrid, ftickettypeid, fticketslno, frevno;
-- fcuserid / fcuserdate = created by, fmuserid / fmuserdate = modified by.
--
-- Parameter names follow the screen: p_<element id of the form, in lower case>. p_pstr... are the logged-in values.
-- =====================================================================

DROP PROCEDURE IF EXISTS dbo.sp_pageticketsalesb;

CREATE OR REPLACE PROCEDURE dbo.sp_pageticketsalesb
(
    IN    p_strmode           varchar(1),
    IN    p_pstrcoid          varchar(3),
    IN    p_pstryear          varchar(4),
    IN    p_lkpbranch       varchar(3),
    IN    p_lkptkttype        varchar(4),
    IN    p_txttktslno        varchar(12),
    IN    p_txtrevno          smallint      DEFAULT 1,
    IN    p_dtpdate           date          DEFAULT NULL,
    IN    p_lkplinecustomer   varchar(12)   DEFAULT NULL,
    IN    p_lkplinedivision   varchar(4)    DEFAULT NULL,
    IN    p_txtlinebtype      varchar(3)    DEFAULT NULL,
    IN    p_txtlinefare       numeric(18,2) DEFAULT 0,
    IN    p_txtlinetax        numeric(18,2) DEFAULT 0,
    IN    p_txtlineschg       numeric(18,2) DEFAULT 0,
    IN    p_txtlineschgv      numeric(18,2) DEFAULT 0,
    IN    p_txtlinevatamt     numeric(18,2) DEFAULT 0,
    IN    p_txtlineinvamt     numeric(18,2) DEFAULT 0,
    IN    p_txtlinevatper     numeric(18,2) DEFAULT 0,
    IN    p_txtlinehcharge    numeric(18,2) DEFAULT 0,
    IN    p_txtlinehscvatamt  numeric(18,2) DEFAULT 0,
    IN    p_txtlinemf         numeric(18,2) DEFAULT 0,
    IN    p_txtlinemfwovat    numeric(18,2) DEFAULT 0,
    IN    p_txtlinemfvatamt   numeric(18,2) DEFAULT 0,
    IN    p_txtlinesctype     varchar(2)    DEFAULT NULL,
    IN    p_txtlinescper      numeric(18,2) DEFAULT 0,
    IN    p_txtref1           varchar(30)   DEFAULT NULL,
    IN    p_txtref2           varchar(30)   DEFAULT NULL,
    IN    p_txtref3           varchar(30)   DEFAULT NULL,
    IN    p_txtref4           varchar(30)   DEFAULT NULL,
    IN    p_pstruserid        varchar(20)   DEFAULT NULL,
    INOUT p_result_cursor     refcursor     DEFAULT 'ticketsalesb_cursor'
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_group  varchar(4);
    v_now    timestamp := CURRENT_TIMESTAMP;
BEGIN

    IF COALESCE(BTRIM(p_lkptkttype), '') = '' OR COALESCE(BTRIM(p_txttktslno), '') = ''
       OR COALESCE(BTRIM(p_lkpbranch), '') = '' OR COALESCE(BTRIM(p_pstryear), '') = '' THEN
        RAISE EXCEPTION 'The ticket is not given';
    END IF;

    -- ---------------------------------------------------------------- GET
    IF p_strmode = 'G' THEN

        OPEN p_result_cursor FOR
        SELECT b.*
          FROM dbo.tblticketsalesb AS b
         WHERE b.fcoid = p_pstrcoid
           AND b.fyear = p_pstryear
           AND b.fbrid = p_lkpbranch
           AND b.ftickettypeid = p_lkptkttype
           AND b.fticketslno = p_txttktslno
           AND b.frevno = p_txtrevno;

    -- --------------------------------------------------------------- SAVE
    ELSIF p_strmode = 'S' THEN

        IF COALESCE(BTRIM(p_lkplinecustomer), '') = '' THEN
            RAISE EXCEPTION 'Please select ''Customer''';
        END IF;

        -- the ticket is saved first; its service type group goes to the line
        SELECT t.fservicetypegroupid
          INTO v_group
          FROM dbo.tblticketsales AS t
         WHERE t.fcoid = p_pstrcoid
           AND t.fyear = p_pstryear
           AND t.fbrid = p_lkpbranch
           AND t.ftickettypeid = p_lkptkttype
           AND t.fticketslno = p_txttktslno
           AND t.frevno = p_txtrevno;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Ticket ''%-%'' is not saved yet', p_lkptkttype, p_txttktslno;
        END IF;

        IF EXISTS (SELECT 1 FROM dbo.tblticketsalesb
                    WHERE fcoid = p_pstrcoid AND fyear = p_pstryear AND fbrid = p_lkpbranch
                      AND ftickettypeid = p_lkptkttype AND fticketslno = p_txttktslno AND frevno = p_txtrevno) THEN
            RAISE EXCEPTION 'Only one customer line can be saved for a ticket';
        END IF;

        INSERT INTO dbo.tblticketsalesb
               (fcoid, fyear, fbrid, ftickettypeid, fticketslno, frevno, fservicetypegroupid, fdate,
                fcustomerid, fdivid, fbusinesstypeid,
                ftotfare, ftaxamt, fagencycharge, fscvatamt, fvatamt, fbillingamt,
                fvatper, fh_agencycharge, fh_scvatamt, fmf, fmfwovat, fmfvatamt,
                fservicechargetype, fservicechargeper,
                frefno, frefno2, frefno3, frefno4,
                fcuserid, fcuserdate)
        VALUES (p_pstrcoid, p_pstryear, p_lkpbranch, p_lkptkttype, p_txttktslno, p_txtrevno, COALESCE(v_group, 'TKT'),
                p_dtpdate,
                BTRIM(p_lkplinecustomer), NULLIF(BTRIM(p_lkplinedivision), ''), NULLIF(BTRIM(p_txtlinebtype), ''),
                p_txtlinefare, p_txtlinetax, p_txtlineschg, p_txtlineschgv, p_txtlinevatamt, p_txtlineinvamt,
                p_txtlinevatper, p_txtlinehcharge, p_txtlinehscvatamt, p_txtlinemf, p_txtlinemfwovat, p_txtlinemfvatamt,
                NULLIF(BTRIM(p_txtlinesctype), ''), p_txtlinescper,
                NULLIF(BTRIM(p_txtref1), ''), NULLIF(BTRIM(p_txtref2), ''),
                NULLIF(BTRIM(p_txtref3), ''), NULLIF(BTRIM(p_txtref4), ''),
                p_pstruserid, v_now::date);

    -- ------------------------------------------------------------- MODIFY
    ELSIF p_strmode = 'M' THEN

        IF COALESCE(BTRIM(p_lkplinecustomer), '') = '' THEN
            RAISE EXCEPTION 'Please select ''Customer''';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM dbo.tblticketsalesb
                        WHERE fcoid = p_pstrcoid AND fyear = p_pstryear AND fbrid = p_lkpbranch
                          AND ftickettypeid = p_lkptkttype AND fticketslno = p_txttktslno AND frevno = p_txtrevno) THEN
            RAISE EXCEPTION 'The customer line of ticket ''%-%'' was changed or removed by someone else. Cancel and try again',
                            p_lkptkttype, p_txttktslno;
        END IF;

        UPDATE dbo.tblticketsalesb
           SET fdate           = p_dtpdate,
               fcustomerid     = BTRIM(p_lkplinecustomer),
               fdivid          = NULLIF(BTRIM(p_lkplinedivision), ''),
               fbusinesstypeid = NULLIF(BTRIM(p_txtlinebtype), ''),
               ftotfare        = p_txtlinefare,
               ftaxamt         = p_txtlinetax,
               fagencycharge   = p_txtlineschg,
               fscvatamt       = p_txtlineschgv,
               fvatamt         = p_txtlinevatamt,
               fbillingamt     = p_txtlineinvamt,
               fvatper         = p_txtlinevatper,
               fh_agencycharge = p_txtlinehcharge,
               fh_scvatamt     = p_txtlinehscvatamt,
               fmf             = p_txtlinemf,
               fmfwovat        = p_txtlinemfwovat,
               fmfvatamt       = p_txtlinemfvatamt,
               fservicechargetype = NULLIF(BTRIM(p_txtlinesctype), ''),
               fservicechargeper  = p_txtlinescper,
               frefno          = NULLIF(BTRIM(p_txtref1), ''),
               frefno2         = NULLIF(BTRIM(p_txtref2), ''),
               frefno3         = NULLIF(BTRIM(p_txtref3), ''),
               frefno4         = NULLIF(BTRIM(p_txtref4), ''),
               fmuserid        = p_pstruserid,
               fmuserdate      = v_now::date
         WHERE fcoid = p_pstrcoid
           AND fyear = p_pstryear
           AND fbrid = p_lkpbranch
           AND ftickettypeid = p_lkptkttype
           AND fticketslno = p_txttktslno
           AND frevno = p_txtrevno;

    -- ------------------------------------------------------------- DELETE
    ELSIF p_strmode = 'D' THEN

        DELETE FROM dbo.tblticketsalesb
         WHERE fcoid = p_pstrcoid
           AND fyear = p_pstryear
           AND fbrid = p_lkpbranch
           AND ftickettypeid = p_lkptkttype
           AND fticketslno = p_txttktslno
           AND frevno = p_txtrevno;

    ELSE
        RAISE EXCEPTION 'invalid mode: %', p_strmode;
    END IF;
END;
$$;
