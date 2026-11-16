-- =====================================================================
-- PROCEDURE: dbo.sp_useraudit - writes one row of the user audit (dbo.tbluseraudit)
-- the same procedure as the STOCK project, so every screen calls it the same way:
--
--   CALL dbo.sp_useraudit(PstrCoID, PstrYear, lkpBranch, doc type, doc no., screen name, action, note, PstrUserID);
--
--   action     S save, M modify, D delete
--   screen     the menu caption of the screen (Ticket Sales)
--   fscreenkey = branch + doc type + doc no.  (a screen without a branch / year / document passes NULL or '')
--   fuserdate  = dbo.getserverdate() (the common server date)
-- It is called inside the transaction of the screen, so the audit row is saved or rolled back with it.
-- =====================================================================

CREATE OR REPLACE PROCEDURE dbo.sp_useraudit(
    IN p_strcoid       character varying DEFAULT NULL::character varying,
    IN p_stryear       character varying DEFAULT NULL::character varying,
    IN p_strbrid       character varying DEFAULT NULL::character varying,
    IN p_strdoctype    character varying DEFAULT NULL::character varying,
    IN p_strdocno      character varying DEFAULT NULL::character varying,
    IN p_strscreenname character varying DEFAULT NULL::character varying,
    IN p_straction     character varying DEFAULT NULL::character varying,
    IN p_strnote       character varying DEFAULT NULL::character varying,
    IN p_struserid     character varying DEFAULT NULL::character varying
)
LANGUAGE plpgsql
AS $procedure$
BEGIN

    INSERT INTO dbo.tbluseraudit
    (
        fcoid,
        fyear,
        fbrid,
        fdoctype,
        fscreenname,
        fscreenkey,
        faction,
        fnote,
        fuserid,
        fuserdate
    )
    VALUES
    (
        p_strcoid,
        p_stryear,
        p_strbrid,
        p_strdoctype,
        p_strscreenname,
        COALESCE(p_strbrid, '')
            || COALESCE(p_strdoctype, '')
            || COALESCE(p_strdocno, ''),
        p_straction,
        p_strnote,
        p_struserid,
        dbo.getserverdate()
    );

END;
$procedure$;
