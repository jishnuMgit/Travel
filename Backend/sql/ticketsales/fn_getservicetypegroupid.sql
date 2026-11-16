-- =====================================================================
-- dbo.getservicetypegroupid - the service type group of a service type (tblservicetype)
--   p_pstrcoid        the company
--   p_servicetypeid   the Service Type (fservicetypeid, e.g. TKT)
-- Returns fservicetypegroupid (e.g. TKT, OS, HTL). Service type not found / empty -> NULL (the caller falls back).
-- Used by dbo.sp_pageticketsales: fservicetypeid = the Service Type box, fservicetypegroupid = this function of it.
-- =====================================================================

CREATE OR REPLACE FUNCTION dbo.getservicetypegroupid
(
    p_pstrcoid        varchar,
    p_servicetypeid   varchar
)
RETURNS varchar
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_group  varchar(4);
BEGIN
    IF COALESCE(BTRIM(p_servicetypeid), '') = '' THEN
        RETURN NULL;
    END IF;

    SELECT s.fservicetypegroupid
      INTO v_group
      FROM dbo.tblservicetype AS s
     WHERE s.fcoid = p_pstrcoid
       AND s.fservicetypeid = BTRIM(p_servicetypeid);

    RETURN v_group;
END;
$$;
