CREATE OR REPLACE PROCEDURE dbo.sp_pagebudgetcopy(
    IN p_pstrcoid character varying,
    IN p_pstryear character varying,
    IN p_strbrid character varying DEFAULT NULL::character varying,
    IN p_strbudgetheadtype character varying DEFAULT NULL::character varying,
    IN p_strcopytoyear character varying DEFAULT NULL::character varying,
    IN p_strcopytobrid character varying DEFAULT NULL::character varying,
    IN p_strcopytotype character varying DEFAULT NULL::character varying,
    IN p_pstruserid character varying DEFAULT NULL::character varying
)
LANGUAGE plpgsql
AS $BODY$
BEGIN
    IF p_pstryear IS NOT DISTINCT FROM p_strcopytoyear
       AND p_strbrid IS NOT DISTINCT FROM p_strcopytobrid
       AND p_strbudgetheadtype IS NOT DISTINCT FROM p_strcopytotype THEN
        RAISE EXCEPTION 'The source and destination budgets must be different.';
    END IF;

    DELETE FROM dbo.tblbudgetm
    WHERE fcoid = p_pstrcoid
      AND fyear = p_strcopytoyear
      AND fbrid = p_strcopytobrid
      AND fbudgetheadtype = p_strcopytotype;

    INSERT INTO dbo.tblbudgetm (
        fcoid,
        fyear,
        fbrid,
        fbudgetheadtype,
        fslno,
        faccountid,
        fgaccountid,
        fmonthamt1,
        fmonthamt2,
        fmonthamt3,
        fmonthamt4,
        fmonthamt5,
        fmonthamt6,
        fmonthamt7,
        fmonthamt8,
        fmonthamt9,
        fmonthamt10,
        fmonthamt11,
        fmonthamt12,
        ftotamt,
        fcuserid,
        fcuserdate,
        fnote
    )
    SELECT
        fcoid,
        p_strcopytoyear,
        p_strcopytobrid,
        p_strcopytotype,
        fslno,
        faccountid,
        fgaccountid,
        fmonthamt1,
        fmonthamt2,
        fmonthamt3,
        fmonthamt4,
        fmonthamt5,
        fmonthamt6,
        fmonthamt7,
        fmonthamt8,
        fmonthamt9,
        fmonthamt10,
        fmonthamt11,
        fmonthamt12,
        ftotamt,
        p_pstruserid,
        CURRENT_TIMESTAMP,
        fnote
    FROM dbo.tblbudgetm
    WHERE fcoid = p_pstrcoid
      AND fyear = p_pstryear
      AND fbrid = p_strbrid
      AND fbudgetheadtype = p_strbudgetheadtype;
END;
$BODY$;

ALTER PROCEDURE dbo.sp_pagebudgetcopy(
    character varying,
    character varying,
    character varying,
    character varying,
    character varying,
    character varying,
    character varying,
    character varying
)
    OWNER TO postgres;
