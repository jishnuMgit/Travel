-- =====================================================================
-- PROCEDURE: dbo.sp_pageticketsalescnj - the conjunction ticket of a ticket (the "Sales Conjunction" popup of Ticket Sales)
-- the port of the old SP_frmTktSalesCnj (modes G, S, M1, D), for dbo.tblticketsalescnj.
--
-- The table: key = fcoid, fyear, fbrid, ftickettypeid, ftktslno, fslno, frevno (the ticket, as in tblticketsales /
-- tblticketsalesb), so a ticket (and Sl. No.) has ONE conjunction row, as the old form (it only used the first row).
--
-- Modes (p_strmode)
--   G  get     the conjunction row of the ticket (the cursor p_result_cursor)
--   S  save    insert the row (the ticket must be saved first); a second row for the ticket is refused
--   D  delete  delete the row of the ticket (nothing to delete is fine)
-- Modify = D then S (the ticket's row is replaced), done by the service in the same transaction.
--
-- Parameter names follow the screen: p_<element id in lower case>; the popup columns are
--   CNJ Ticket No. (p_txtcnjtktslno), Route (p_txtroute), Carrier (p_txtcarrier), Class (p_txtclass).
-- Route, Carrier and Class are saved in capital letters (the old procedure did Upper()).
-- fcnjtktno (the CNJ ticket as the old form saved it) = the CNJ Ticket No.; fservicetypegroupid is the ticket's.
--
-- Examples (cursor calls must run inside one transaction)
--   BEGIN;
--   CALL dbo.sp_pageticketsalescnj('G', '01', '2026', 'B', '1234567890', 1, 1, 'JD', p_result_cursor => 'cur_cnj');
--   FETCH ALL FROM "cur_cnj";
--   COMMIT;
-- =====================================================================

DROP PROCEDURE IF EXISTS dbo.sp_pageticketsalescnj;

CREATE OR REPLACE PROCEDURE dbo.sp_pageticketsalescnj
(
    IN    p_strmode           varchar(1),
    IN    p_pstrcoid          varchar(3),
    IN    p_pstryear          varchar(4),
    IN    p_lkptkttype        varchar(4),
    IN    p_txttktslno        varchar(12),
    IN    p_txtslno           smallint      DEFAULT 1,
    IN    p_txtrevno          smallint      DEFAULT 1,
    IN    p_lkpbranch         varchar(3)    DEFAULT NULL,
    IN    p_txtcnjtktslno     varchar(12)   DEFAULT NULL,
    IN    p_txtroute          varchar(19)   DEFAULT NULL,
    IN    p_txtcarrier        varchar(8)    DEFAULT NULL,
    IN    p_txtclass          varchar(8)    DEFAULT NULL,
    INOUT p_result_cursor     refcursor     DEFAULT 'ticketsalescnj_cursor'
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_group  varchar(4);
BEGIN

    IF COALESCE(BTRIM(p_lkptkttype), '') = '' OR COALESCE(BTRIM(p_txttktslno), '') = ''
       OR COALESCE(BTRIM(p_lkpbranch), '') = '' OR COALESCE(BTRIM(p_pstryear), '') = '' THEN
        RAISE EXCEPTION 'The ticket is not given';
    END IF;

    -- ---------------------------------------------------------------- GET
    IF p_strmode = 'G' THEN

        OPEN p_result_cursor FOR
        SELECT c.*
          FROM dbo.tblticketsalescnj AS c
         WHERE c.fcoid = p_pstrcoid
           AND c.fyear = p_pstryear
           AND c.fbrid = p_lkpbranch
           AND c.ftickettypeid = p_lkptkttype
           AND c.ftktslno = p_txttktslno AND c.fslno = p_txtslno
           AND c.frevno = p_txtrevno;

    -- --------------------------------------------------------------- SAVE
    ELSIF p_strmode = 'S' THEN

        IF COALESCE(BTRIM(p_txtcnjtktslno), '') = '' THEN
            RAISE EXCEPTION 'Please input ''CNJ Ticket No.''';
        END IF;

        -- the ticket is saved first; its service type group goes to the row
        SELECT t.fservicetypegroupid
          INTO v_group
          FROM dbo.tblticketsales AS t
         WHERE t.fcoid = p_pstrcoid
           AND t.fyear = p_pstryear
           AND t.fbrid = p_lkpbranch
           AND t.ftickettypeid = p_lkptkttype
           AND t.fticketslno = p_txttktslno AND t.fslno = p_txtslno
           AND t.frevno = p_txtrevno;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Ticket ''%-%'' is not saved yet', p_lkptkttype, p_txttktslno;
        END IF;

        IF EXISTS (SELECT 1 FROM dbo.tblticketsalescnj
                    WHERE fcoid = p_pstrcoid AND fyear = p_pstryear AND fbrid = p_lkpbranch
                      AND ftickettypeid = p_lkptkttype AND ftktslno = p_txttktslno AND fslno = p_txtslno AND frevno = p_txtrevno) THEN
            RAISE EXCEPTION 'Only one conjunction ticket can be saved for a ticket';
        END IF;

        INSERT INTO dbo.tblticketsalescnj
               (fcoid, fyear, fbrid, ftickettypeid, ftktslno, fslno, frevno, fcnjtktslno, fcnjtktno,
                fservicetypegroupid, froute, fclass, fcarrier)
        VALUES (p_pstrcoid, p_pstryear, p_lkpbranch, p_lkptkttype, p_txttktslno, COALESCE(p_txtslno, 1), p_txtrevno,
                BTRIM(p_txtcnjtktslno), BTRIM(p_txtcnjtktslno), COALESCE(v_group, 'TKT'),
                NULLIF(UPPER(BTRIM(p_txtroute)), ''), NULLIF(UPPER(BTRIM(p_txtclass)), ''),
                NULLIF(UPPER(BTRIM(p_txtcarrier)), ''));

    -- ------------------------------------------------------------- DELETE
    ELSIF p_strmode = 'D' THEN

        DELETE FROM dbo.tblticketsalescnj
         WHERE fcoid = p_pstrcoid
           AND fyear = p_pstryear
           AND fbrid = p_lkpbranch
           AND ftickettypeid = p_lkptkttype
           AND ftktslno = p_txttktslno AND fslno = p_txtslno
           AND frevno = p_txtrevno;

    ELSE
        RAISE EXCEPTION 'invalid mode: %', p_strmode;
    END IF;
END;
$$;
