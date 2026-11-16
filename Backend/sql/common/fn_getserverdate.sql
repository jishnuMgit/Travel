-- =====================================================================
-- dbo.getserverdate - the date and time of the server (the old dbo.SP_GetServerDate: SELECT GETDATE() AS fServerDate)
--
-- COMMON: every procedure that inserts or updates a row uses it for the created / modified dates, so all the pages get
-- the date from the same place:
--
--     v_now timestamp := dbo.getserverdate();
--     ... INSERT ... (fcuserid, fcuserdate) VALUES (p_pstruserid, v_now)
--     ... UPDATE ... SET fmuserid = p_pstruserid, fmuserdate = v_now
--
-- It returns the start time of the current transaction (LOCALTIMESTAMP), so two procedures that run in ONE transaction
-- (for example sp_pageticketsales and sp_pageticketsalesb) stamp exactly the same date and time.
-- From the backend: getServerDate() in src/services/common/ServerDateService.ts.
-- Run in traveldb BEFORE the procedures that use it. Safe to run again.
-- =====================================================================

CREATE OR REPLACE FUNCTION dbo.getserverdate()
RETURNS timestamp
LANGUAGE sql
STABLE
AS $$
    SELECT LOCALTIMESTAMP;
$$;
