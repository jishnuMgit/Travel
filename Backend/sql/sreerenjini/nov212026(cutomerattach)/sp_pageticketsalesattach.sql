-- =====================================================================
-- Ticket Sales - Customer Attach (the files attached to a ticket)
-- the port of the old tblSalesAttach + SP_frmSaleAttach (modes G, S, M1, D1, D)
--
-- Table dbo.tblticketsalesattach: the files of a TICKET (the Ticket Type + Ticket No. of a branch; all the Sl. Nos of the
-- ticket share them, as in the old system). One row for each attached file / note:
--   key = fcoid, fbrid, ftickettypeid, fticketslno, fslno   (fslno = the line of the attach popup)
--   fyear is the year of the save (information; the ticket is found without the year, as the load of the ticket is)
--   fdox is the file (bytea); there is NO limit on the type of the file (pdf, doc, xls, jpeg, txt ...)
--
-- Procedure dbo.sp_pageticketsalesattach - modes (p_strmode)
--   G   get      the files of the ticket WITHOUT the file contents (the cursor p_result_cursor); the file itself is read
--                by the service when a line is viewed
--   S   save     insert ONE file / note (the ticket must be saved first)
--   M   modify   update ONE line (p_txtoriginalslno): the note, the file name / type, and the file only when a new one is given
--   D1  delete   delete ONE line (p_txtoriginalslno)
--   D   delete   delete ALL the files of the ticket (nothing to delete is fine)
--
-- Parameter names follow the screen: p_<element id in lower case>.
--   fcuserdate / fmuserdate = the server date the page sent (p_dtpserverdate), else dbo.getserverdate()
--
-- Run this file yourself in pgAdmin. Examples (the cursor call must run inside one transaction):
--   BEGIN;
--   CALL dbo.sp_pageticketsalesattach('G', '01', '2026', 'B', '1234567890', 'JD', p_result_cursor => 'cur_attach');
--   FETCH ALL FROM "cur_attach";
--   COMMIT;
-- =====================================================================

DROP PROCEDURE IF EXISTS dbo.sp_pageticketsalesattach;

CREATE OR REPLACE PROCEDURE dbo.sp_pageticketsalesattach
(
    IN    p_strmode           varchar(2),
    IN    p_pstrcoid          varchar(3),
    IN    p_pstryear          varchar(4),
    IN    p_lkptkttype        varchar(4),
    IN    p_txttktslno        varchar(12),
    IN    p_lkpbranch         varchar(3),
    IN    p_txtattachslno     smallint      DEFAULT NULL,
    IN    p_txtoriginalslno   smallint      DEFAULT NULL,
    IN    p_txtnote           varchar(100)  DEFAULT NULL,
    IN    p_txtdoxname        varchar(255)  DEFAULT NULL,
    IN    p_txtdoxtype        varchar(5)    DEFAULT NULL,
    IN    p_imgdox            bytea         DEFAULT NULL,
    IN    p_pstruserid        varchar(30)   DEFAULT NULL,
    IN    p_dtpserverdate     timestamp     DEFAULT NULL,
    INOUT p_result_cursor     refcursor     DEFAULT 'ticketsalesattach_cursor'
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_now  timestamp;
BEGIN

    IF COALESCE(BTRIM(p_lkptkttype), '') = '' OR COALESCE(BTRIM(p_txttktslno), '') = ''
       OR COALESCE(BTRIM(p_lkpbranch), '') = '' THEN
        RAISE EXCEPTION 'The ticket is not given';
    END IF;

    v_now := COALESCE(p_dtpserverdate, dbo.getserverdate());

    -- ---------------------------------------------------------------- GET
    IF p_strmode = 'G' THEN

        OPEN p_result_cursor FOR
            SELECT a.fslno, a.fnote, a.fdoxname, a.fdoxtype
              FROM dbo.tblticketsalesattach AS a
             WHERE a.fcoid = p_pstrcoid AND a.fbrid = p_lkpbranch
               AND a.ftickettypeid = p_lkptkttype AND a.fticketslno = p_txttktslno
             ORDER BY a.fslno;

    -- --------------------------------------------------------------- SAVE
    ELSIF p_strmode = 'S' THEN

        IF NOT EXISTS (SELECT 1 FROM dbo.tblticketsales AS t
                        WHERE t.fcoid = p_pstrcoid AND t.fbrid = p_lkpbranch
                          AND t.ftickettypeid = p_lkptkttype AND t.fticketslno = p_txttktslno) THEN
            RAISE EXCEPTION 'The ticket must be saved before its files are attached';
        END IF;

        INSERT INTO dbo.tblticketsalesattach
            (fcoid, fyear, fbrid, ftickettypeid, fticketslno, fslno, fnote, fdoxname, fdoxtype, fdox, fcuserid, fcuserdate)
        VALUES
            (p_pstrcoid, p_pstryear, p_lkpbranch, p_lkptkttype, p_txttktslno, p_txtattachslno,
             NULLIF(BTRIM(p_txtnote), ''), NULLIF(BTRIM(p_txtdoxname), ''), NULLIF(BTRIM(p_txtdoxtype), ''), p_imgdox,
             p_pstruserid, v_now);

    -- ------------------------------------------------------------- MODIFY
    ELSIF p_strmode = 'M' THEN

        UPDATE dbo.tblticketsalesattach
           SET fnote      = NULLIF(BTRIM(p_txtnote), ''),
               fdoxname   = NULLIF(BTRIM(p_txtdoxname), ''),
               fdoxtype   = NULLIF(BTRIM(p_txtdoxtype), ''),
               fdox       = COALESCE(p_imgdox, fdox),   -- no new file: the file stays
               fmuserid   = p_pstruserid,
               fmuserdate = v_now
         WHERE fcoid = p_pstrcoid AND fbrid = p_lkpbranch
           AND ftickettypeid = p_lkptkttype AND fticketslno = p_txttktslno
           AND fslno = p_txtoriginalslno;

    -- ------------------------------------------------------- DELETE ONE
    ELSIF p_strmode = 'D1' THEN

        DELETE FROM dbo.tblticketsalesattach
         WHERE fcoid = p_pstrcoid AND fbrid = p_lkpbranch
           AND ftickettypeid = p_lkptkttype AND fticketslno = p_txttktslno
           AND fslno = p_txtoriginalslno;

    -- ------------------------------------------------------- DELETE ALL
    ELSIF p_strmode = 'D' THEN

        DELETE FROM dbo.tblticketsalesattach
         WHERE fcoid = p_pstrcoid AND fbrid = p_lkpbranch
           AND ftickettypeid = p_lkptkttype AND fticketslno = p_txttktslno;

    ELSE
        RAISE EXCEPTION 'Mode % is not known', p_strmode;
    END IF;

END;
$$;
