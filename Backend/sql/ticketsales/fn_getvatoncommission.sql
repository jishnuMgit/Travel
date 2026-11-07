-- =====================================================================
-- dbo.getvatoncommission - 1 when the airline has VAT on the commission, else 0
-- the port of the old dbo.GetVATOnCommission(CoID, AirlineNo), read from tblairline.fvatoncommission
-- Airline not found / flag empty -> 0.
-- =====================================================================

CREATE OR REPLACE FUNCTION dbo.getvatoncommission
(
    p_pstrcoid       varchar,
    p_lkpairlineno   varchar
)
RETURNS integer
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_flag  boolean;
BEGIN
    SELECT a.fvatoncommission
      INTO v_flag
      FROM dbo.tblairline AS a
     WHERE a.fcoid = p_pstrcoid
       AND a.fairlineno = p_lkpairlineno;

    RETURN CASE WHEN COALESCE(v_flag, false) THEN 1 ELSE 0 END;
END;
$$;
