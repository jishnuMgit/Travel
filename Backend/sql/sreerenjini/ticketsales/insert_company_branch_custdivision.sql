-- Data of dbo.tblcompany, dbo.tblbranch and dbo.tblcustdivision, as INSERT statements (from traveldb).
-- ON CONFLICT DO NOTHING: a row whose primary key already exists is skipped, so the file can be run again.
-- Order: company, branch, customer divisions.

BEGIN;

-- ------------------------------------------------------------------ dbo.tblcompany (2 rows)
INSERT INTO dbo.tblcompany (fcoid, fconame, fconame_ar, fconame_qr, fconame_short, fcoaddress1, fcoaddress2, fcoaddress3, fcoaddress4, fcoaddress1_ar, fcoaddress2_ar, fcoaddress3_ar, fcoaddress4_ar, fcovatno, fcovatno_ar, fpiexpenseaccountgroup, fbg2arap, fycmethod, flslno, fcuserid, fcuserdate, fmuserid, fmuserdate, fpositionno, fcostatus, fcommvatper)
VALUES ('01', 'Travel max', 'نَسَب', 'QR', 'TM', 'Al Rashidiya, Dubai', 'Al Rashidiya, Near Metro Station', 'Dubai, United Arab Emirates', 'P.O. Box 12345, Dubai Tel: +971 4 123 4567', 'الراشدية، دبي                                                                   ', 'الراشدية، بالقرب من محطة المترو                                                 ', 'دبي، الإمارات العربية المتحدة                                                   ', 'هاتف: ‎+٩٧١ ٤ ١٢٣ ٤٥٦٧ ص.ب ١٢٣٤٥، دبي', '12232324355555', '١٢٣٤٥٦٧٨٩٠', NULL, NULL, NULL, NULL, NULL, NULL, 'ADMIN', '2026-09-23 15:37:37.248', 1, 'A', '15.00')
ON CONFLICT DO NOTHING;
INSERT INTO dbo.tblcompany (fcoid, fconame, fconame_ar, fconame_qr, fconame_short, fcoaddress1, fcoaddress2, fcoaddress3, fcoaddress4, fcoaddress1_ar, fcoaddress2_ar, fcoaddress3_ar, fcoaddress4_ar, fcovatno, fcovatno_ar, fpiexpenseaccountgroup, fbg2arap, fycmethod, flslno, fcuserid, fcuserdate, fmuserid, fmuserdate, fpositionno, fcostatus, fcommvatper)
VALUES ('02', 'game hub', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 2, 'A', '15.00')
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------------ dbo.tblbranch (2 rows)
INSERT INTO dbo.tblbranch (fcoid, fbrid, fbrname, fiata, fiatacode, fbspaccountid, fcaccountid, fbaccountid, fpaccountid, fccaccountid, factivefromdate, factivetodate, fneedyearclose, fpositionno, fcustadvanceaccountid, flocalserverpath, fcomputerid, fbrautobossupdates, fbuildingno, fstreetname, fdistrict, fcity, fcountry, fpostalcode, fadditionalno, fcrno, fbuildingno_a, fstreetname_a, fdistrict_a, fcity_a, fcountry_a, fpostalcode_a, fadditionalno_a, fcrno_a, fbrname_a, ftourismlicenseno, ftourismlicenseno_a, fcategory, fcategory_a, ftelephone, ftelephone_a, fho, fbrtype, faddress1, faddress2, faddress3, femail, fuserid, fuserdate, fmuserid, fmuserdate)
VALUES ('01', 'JD', 'JEDDAH', false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, 1, NULL, NULL, NULL, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL, NULL, NULL, 'ADMIN', '2026-11-06 10:44:09.743', NULL, NULL)
ON CONFLICT DO NOTHING;
INSERT INTO dbo.tblbranch (fcoid, fbrid, fbrname, fiata, fiatacode, fbspaccountid, fcaccountid, fbaccountid, fpaccountid, fccaccountid, factivefromdate, factivetodate, fneedyearclose, fpositionno, fcustadvanceaccountid, flocalserverpath, fcomputerid, fbrautobossupdates, fbuildingno, fstreetname, fdistrict, fcity, fcountry, fpostalcode, fadditionalno, fcrno, fbuildingno_a, fstreetname_a, fdistrict_a, fcity_a, fcountry_a, fpostalcode_a, fadditionalno_a, fcrno_a, fbrname_a, ftourismlicenseno, ftourismlicenseno_a, fcategory, fcategory_a, ftelephone, ftelephone_a, fho, fbrtype, faddress1, faddress2, faddress3, femail, fuserid, fuserdate, fmuserid, fmuserdate)
VALUES ('01', 'RY', 'RIYADH', false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, 2, NULL, NULL, NULL, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL, NULL, NULL, 'ADMIN', '2026-11-06 10:44:09.743', NULL, NULL)
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------------ dbo.tblcustdivision (3 rows)
INSERT INTO dbo.tblcustdivision (fcoid, fcustomerid, fdivid, fdivname, fdivname_ar, fcuserid, fcuserdate, fmuserid, fmuserdate)
VALUES ('01', '60001', '01', 'Div 01-60001', NULL, NULL, NULL, NULL, NULL)
ON CONFLICT DO NOTHING;
INSERT INTO dbo.tblcustdivision (fcoid, fcustomerid, fdivid, fdivname, fdivname_ar, fcuserid, fcuserdate, fmuserid, fmuserdate)
VALUES ('01', '60001', '02', 'Div 02-60001', NULL, NULL, NULL, NULL, NULL)
ON CONFLICT DO NOTHING;
INSERT INTO dbo.tblcustdivision (fcoid, fcustomerid, fdivid, fdivname, fdivname_ar, fcuserid, fcuserdate, fmuserid, fmuserdate)
VALUES ('01', '60002', '01', 'Div 01-60002', NULL, NULL, NULL, NULL, NULL)
ON CONFLICT DO NOTHING;

-- verify before committing
SELECT 'tblcompany' AS t, count(*) FROM dbo.tblcompany
UNION ALL SELECT 'tblbranch', count(*) FROM dbo.tblbranch
UNION ALL SELECT 'tblcustdivision', count(*) FROM dbo.tblcustdivision;

COMMIT;   -- or ROLLBACK
