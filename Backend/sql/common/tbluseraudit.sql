-- =====================================================================
-- dbo.tbluseraudit - the user audit: one row per audited action (insert / modify / delete) of a screen
-- the same table as the STOCK project (written by dbo.sp_useraudit, read by the User Audit report)
--
--   fid          a running number
--   fcoid        company          fyear   year            fbrid  branch (empty for a screen without one)
--   fdoctype     document type    (Ticket Sales: the Ticket Type, B / O / X ...)
--   fscreenname  the screen = its menu caption (Ticket Sales)
--   fscreenkey   branch + document type + document no. glued together (set by dbo.sp_useraudit)
--   faction      S save, M modify, D delete
--   fnote        what was done / what changed (one "label : value" per line)
--   fuserid      the logged-in user      fuserdate  the server date (dbo.getserverdate())
-- =====================================================================

CREATE TABLE IF NOT EXISTS dbo.tbluseraudit (
    fid          bigint        GENERATED ALWAYS AS IDENTITY,
    fcoid        varchar(3)    NOT NULL,
    fyear        varchar(4)    NULL,
    fbrid        varchar(3)    NULL,
    fdoctype     varchar(4)    NULL,
    fscreenname  varchar(100)  NULL,
    fscreenkey   varchar(50)   NULL,
    faction      varchar(1)    NULL,
    fnote        text          NULL,
    fuserid      varchar(30)   NULL,
    fuserdate    timestamp     NULL,
    CONSTRAINT pk_tbluseraudit PRIMARY KEY (fid)
);

CREATE INDEX IF NOT EXISTS ix_tbluseraudit_screen ON dbo.tbluseraudit (fcoid, fscreenname, fscreenkey);
