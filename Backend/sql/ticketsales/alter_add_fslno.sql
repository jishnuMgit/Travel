-- =====================================================================
-- tblticketsales and tblticketsalesb: add fslno (the old [fSlNo] [tinyint] NOT NULL) and put it in the primary key
-- exactly where the old script has it:  fcoid, fyear, fbrid, fticketTypeid, fticketslno, fslno, frevno
--
--   fslno   smallint NOT NULL DEFAULT 1   (Postgres has no tinyint; smallint is the nearest)
--           tblticketsales  : always 1 (one row per ticket)
--           tblticketsalesb : the number of the customer line of the ticket (1, 2, 3 ...)
--   frevno  is already there (smallint NOT NULL) in both tables: nothing to add.
--
-- The default 1 keeps sp_pageticketsales / sp_pageticketsalesb working as they are (they do not give fslno yet).
-- Run in traveldb. Safe to run again.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------- tblticketsales
ALTER TABLE dbo.tblticketsales
    ADD COLUMN IF NOT EXISTS fslno smallint NOT NULL DEFAULT 1;

ALTER TABLE dbo.tblticketsales DROP CONSTRAINT IF EXISTS pk_tblticketsales;
ALTER TABLE dbo.tblticketsales
    ADD CONSTRAINT pk_tblticketsales
    PRIMARY KEY (fcoid, fyear, fbrid, ftickettypeid, fticketslno, fslno, frevno);

-- --------------------------------------------------------- tblticketsalesb
ALTER TABLE dbo.tblticketsalesb
    ADD COLUMN IF NOT EXISTS fslno smallint NOT NULL DEFAULT 1;

ALTER TABLE dbo.tblticketsalesb DROP CONSTRAINT IF EXISTS pk_tblticketsalesb;
ALTER TABLE dbo.tblticketsalesb
    ADD CONSTRAINT pk_tblticketsalesb
    PRIMARY KEY (fcoid, fyear, fbrid, ftickettypeid, fticketslno, fslno, frevno);

COMMIT;
