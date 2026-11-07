-- =====================================================================
-- dbo.getcommvatper - the VAT % on the commission of the company
-- the port of the old objCommon.GetCommVATPer (the fCommVATPer of tblCompany)
-- Company not found / no % -> 0.
-- =====================================================================

CREATE OR REPLACE FUNCTION dbo.getcommvatper
(
    p_pstrcoid  varchar
)
RETURNS numeric
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_per  numeric;
BEGIN
    SELECT c.fcommvatper
      INTO v_per
      FROM dbo.tblcompany AS c
     WHERE c.fcoid = p_pstrcoid;

    RETURN COALESCE(v_per, 0);
END;
$$;
