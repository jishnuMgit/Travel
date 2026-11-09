-- =====================================================================
-- Test data: a service charge policy for customer 60003 (Jishnu), service TKT, company 01.
-- (customer 60002 already has one: domestic 5% min 10, international flat 25)
--
--   Domestic       : by percentage ('P'), 20% of (Fare + Tax), at least 5.00
--   International  : by amount     ('A'), 20.00
--   MF             : 0 (no merchant fee)
--
-- The customer must also be marked fisservicechargepolicy = true in tblaccountcs, or the
-- screen never looks for the policy. Customer 60003 has no division, so fdivid is ''.
-- Run in traveldb. Safe to run again.
-- =====================================================================

BEGIN;

UPDATE dbo.tblaccountcs
   SET fisservicechargepolicy = true
 WHERE fcoid = '01'
   AND fcsaccountid = '60003';

DELETE FROM dbo.tblservicechargepolicy
 WHERE fcoid = '01'
   AND fsr = 'S'
   AND fcustomerid = '60003'
   AND fservicetypeid = 'TKT';

INSERT INTO dbo.tblservicechargepolicy
       (fcoid, fsr, fcustomerid, fservicetypeid, fdivid, fservicetypegroupid, fmf,
        fd_servicechargetype, fd_servicechgper, fd_minservicechgamt, fd_servicechgamt,
        fi_servicechargetype, fi_servicechgper, fi_minservicechgamt, fi_servicechgamt,
        fcuserid, fcuserdate)
VALUES ('01', 'S', '60003', 'TKT', '', 'TKT', 0,
        'P', 20, 5, 0,
        'A', 0, 0, 20,
        'ADMIN', now());

COMMIT;
