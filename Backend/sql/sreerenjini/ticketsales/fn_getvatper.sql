-- =====================================================================
-- dbo.getvatper - the service charge VAT % of a document type + D/I on a date
-- the port of the old objCommon.GetVATPer(strDocType, strTktType, strDorI, strDate)
--
--   p_strdoctype  the document type of the screen ('T' for Ticket Sales)
--   p_strdori     'D' domestic / 'I' international
--   p_dtpdate     the date of the ticket
--
-- The setting row is fservicetypeid = p_strdoctype || p_strdori (e.g. 'TD'). Its VAT % is returned; when the row has a
-- fprevvatdate and the date is on or before it, the previous % (fprevvatper) is returned (the VAT change of 2020).
-- No setting row -> 0.
-- =====================================================================

CREATE OR REPLACE FUNCTION dbo.getvatper
(
    p_pstrcoid     varchar,
    p_strdoctype   varchar,
    p_strdori      varchar,
    p_dtpdate      date DEFAULT NULL
)
RETURNS numeric
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_vatper    numeric;
    v_prevdate  date;
    v_prevper   numeric;
BEGIN
    SELECT s.fvatper, s.fprevvatdate::date, s.fprevvatper
      INTO v_vatper, v_prevdate, v_prevper
      FROM dbo.tblvatsetting AS s
     WHERE s.fcoid = p_pstrcoid
       AND s.fservicetypeid = COALESCE(p_strdoctype, '') || COALESCE(p_strdori, '')
     ORDER BY s.fslno
     LIMIT 1;

    IF NOT FOUND THEN
        RETURN 0;
    END IF;

    v_vatper := COALESCE(v_vatper, 0);

    IF v_prevdate IS NOT NULL AND p_dtpdate IS NOT NULL AND p_dtpdate <= v_prevdate THEN
        v_vatper := COALESCE(v_prevper, 0);
    END IF;

    RETURN v_vatper;
END;
$$;
