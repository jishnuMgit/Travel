--
-- PostgreSQL database dump
--

\restrict TTAvTcz00t5zVvdi9KZPuXBups6NHnK1XrRpzDLBI7vbu1bzP9H29Zbj98zB1Eb

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: dbo; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA dbo;


ALTER SCHEMA dbo OWNER TO postgres;

--
-- Name: getcommvatper(character varying); Type: FUNCTION; Schema: dbo; Owner: postgres
--

CREATE FUNCTION dbo.getcommvatper(p_pstrcoid character varying) RETURNS numeric
    LANGUAGE plpgsql STABLE
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


ALTER FUNCTION dbo.getcommvatper(p_pstrcoid character varying) OWNER TO postgres;

--
-- Name: getserverdate(); Type: FUNCTION; Schema: dbo; Owner: postgres
--

CREATE FUNCTION dbo.getserverdate() RETURNS timestamp without time zone
    LANGUAGE sql STABLE
    AS $$
    SELECT LOCALTIMESTAMP;
$$;


ALTER FUNCTION dbo.getserverdate() OWNER TO postgres;

--
-- Name: getvatoncommission(character varying, character varying); Type: FUNCTION; Schema: dbo; Owner: postgres
--

CREATE FUNCTION dbo.getvatoncommission(p_pstrcoid character varying, p_lkpairlineno character varying) RETURNS integer
    LANGUAGE plpgsql STABLE
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


ALTER FUNCTION dbo.getvatoncommission(p_pstrcoid character varying, p_lkpairlineno character varying) OWNER TO postgres;

--
-- Name: getvatper(character varying, character varying, character varying, date); Type: FUNCTION; Schema: dbo; Owner: postgres
--

CREATE FUNCTION dbo.getvatper(p_pstrcoid character varying, p_strdoctype character varying, p_strdori character varying, p_dtpdate date DEFAULT NULL::date) RETURNS numeric
    LANGUAGE plpgsql STABLE
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


ALTER FUNCTION dbo.getvatper(p_pstrcoid character varying, p_strdoctype character varying, p_strdori character varying, p_dtpdate date) OWNER TO postgres;

--
-- Name: sp_pageticketsales(character varying, character varying, character varying, character varying, character varying, smallint, smallint, character varying, character varying, character varying, date, date, date, date, character varying, character varying, character varying, character varying, character varying, character varying, character varying, character varying, character varying, boolean, character varying, character varying, character varying, character varying, character varying, character varying, character varying, character varying, character varying, boolean, character varying, character varying, character varying, character varying, character varying, character varying, numeric, numeric, numeric, numeric, numeric, character varying, numeric, numeric, numeric, numeric, numeric, numeric, numeric, numeric, numeric, integer, character varying, character varying, character varying, character varying, refcursor); Type: PROCEDURE; Schema: dbo; Owner: postgres
--

CREATE PROCEDURE dbo.sp_pageticketsales(IN p_strmode character varying, IN p_pstrcoid character varying, IN p_pstryear character varying, IN p_lkptkttype character varying, IN p_txttktslno character varying, IN p_txtslno smallint DEFAULT 1, IN p_txtrevno smallint DEFAULT 1, IN p_lkpairlineno character varying DEFAULT NULL::character varying, IN p_lkpbranch character varying DEFAULT NULL::character varying, IN p_lkpiata character varying DEFAULT NULL::character varying, IN p_dtpdate date DEFAULT NULL::date, IN p_dtpbspdate date DEFAULT NULL::date, IN p_dtpflightdate date DEFAULT NULL::date, IN p_dtpreturndate date DEFAULT NULL::date, IN p_txtpnrno character varying DEFAULT NULL::character varying, IN p_lkpdi character varying DEFAULT NULL::character varying, IN p_lkpsupplier character varying DEFAULT NULL::character varying, IN p_lkppaysupplierid character varying DEFAULT NULL::character varying, IN p_txtpaxname character varying DEFAULT NULL::character varying, IN p_lkpstaffid character varying DEFAULT NULL::character varying, IN p_txtbookinggdslogin character varying DEFAULT NULL::character varying, IN p_lkppaxtype character varying DEFAULT NULL::character varying, IN p_txtpaxnameid character varying DEFAULT NULL::character varying, IN p_lkpvoid boolean DEFAULT false, IN p_lkpservice character varying DEFAULT NULL::character varying, IN p_txtsalesgdslogin character varying DEFAULT NULL::character varying, IN p_txtmobile character varying DEFAULT NULL::character varying, IN p_txtemail character varying DEFAULT NULL::character varying, IN p_lkptrip character varying DEFAULT NULL::character varying, IN p_txttourcode character varying DEFAULT NULL::character varying, IN p_txtroute character varying DEFAULT NULL::character varying, IN p_txtclass character varying DEFAULT NULL::character varying, IN p_txtdestination character varying DEFAULT NULL::character varying, IN p_lkpcnj boolean DEFAULT false, IN p_lkpgds character varying DEFAULT NULL::character varying, IN p_lkpcctype character varying DEFAULT NULL::character varying, IN p_txtcarrier character varying DEFAULT NULL::character varying, IN p_txtfarebasis character varying DEFAULT NULL::character varying, IN p_lkpmerchant character varying DEFAULT NULL::character varying, IN p_lkpfop character varying DEFAULT NULL::character varying, IN p_txtgfare numeric DEFAULT 0, IN p_txtsupfee numeric DEFAULT 0, IN p_txtfeevat numeric DEFAULT 0, IN p_txtfopcash numeric DEFAULT 0, IN p_txtsfare numeric DEFAULT 0, IN p_lkpalcom character varying DEFAULT NULL::character varying, IN p_txtalcom numeric DEFAULT 0, IN p_txtsupcom numeric DEFAULT 0, IN p_txtfopcc numeric DEFAULT 0, IN p_txttax numeric DEFAULT 0, IN p_txtalcomamt numeric DEFAULT 0, IN p_txtalcvat numeric DEFAULT 0, IN p_txtfopep numeric DEFAULT 0, IN p_txtk7 numeric DEFAULT 0, IN p_txtsupplieramt numeric DEFAULT 0, IN p_txtkbamt integer DEFAULT 0, IN p_lkpkbaccount character varying DEFAULT NULL::character varying, IN p_txtinvnote character varying DEFAULT NULL::character varying, IN p_txtnote character varying DEFAULT NULL::character varying, IN p_pstruserid character varying DEFAULT NULL::character varying, INOUT p_result_cursor refcursor DEFAULT 'ticketsales_cursor'::refcursor)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_group        varchar(4);
    v_airlinecode  varchar(3);
    v_bspdate      date;
    v_commper      numeric(18,2);
    v_commamt      numeric(18,2);
    v_now          timestamp := dbo.getserverdate();   -- the common server date (sql/common/fn_getserverdate.sql)
BEGIN

    -- the ticket this call is about
    IF COALESCE(BTRIM(p_lkptkttype), '') = '' THEN
        RAISE EXCEPTION 'Please select ''Ticket Type''';
    END IF;
    IF COALESCE(BTRIM(p_txttktslno), '') = '' THEN
        RAISE EXCEPTION 'Please enter ''Ticket No.''';
    END IF;
    IF COALESCE(BTRIM(p_lkpbranch), '') = '' THEN
        RAISE EXCEPTION 'Please select ''Branch''';
    END IF;
    IF COALESCE(BTRIM(p_pstryear), '') = '' THEN
        RAISE EXCEPTION 'Year not found';
    END IF;

    -- ---------------------------------------------------------------- GET
    IF p_strmode = 'G' THEN

        OPEN p_result_cursor FOR
        SELECT t.*
          FROM dbo.tblticketsales AS t
         WHERE t.fcoid = p_pstrcoid
           AND t.fyear = p_pstryear
           AND t.fbrid = p_lkpbranch
           AND t.ftickettypeid = p_lkptkttype
           AND t.fticketslno = p_txttktslno AND t.fslno = p_txtslno
           AND t.frevno = p_txtrevno;

    -- ------------------------------------------------------ SAVE / MODIFY
    ELSIF p_strmode IN ('S', 'M') THEN

        IF p_dtpdate IS NULL THEN
            RAISE EXCEPTION 'Please enter ''Date''';
        END IF;

        -- the service type group comes from the ticket type
        SELECT t.fservicetypegroupid
          INTO v_group
          FROM dbo.tbltickettype AS t
         WHERE t.fcoid = p_pstrcoid
           AND t.ftickettypeid = p_lkptkttype;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Ticket Type ''%'' does not exist', p_lkptkttype;
        END IF;
        v_group := COALESCE(v_group, 'TKT');

        -- the airline code (e.g. SV) belongs to the airline
        IF COALESCE(BTRIM(p_lkpairlineno), '') <> '' THEN
            SELECT a.fairlinecode
              INTO v_airlinecode
              FROM dbo.tblairline AS a
             WHERE a.fcoid = p_pstrcoid
               AND a.fairlineno = p_lkpairlineno;
        END IF;

        -- the BSP Date only for BSP tickets
        v_bspdate := CASE WHEN p_lkptkttype IN ('B', 'M') THEN p_dtpbspdate ELSE NULL END;

        -- A/L Com.: the % and the amount as the screen shows them (one is typed, the other worked out)
        v_commper := p_txtalcom;
        v_commamt := p_txtalcomamt;

        IF p_strmode = 'S' THEN

            IF EXISTS (SELECT 1 FROM dbo.tblticketsales
                        WHERE fcoid = p_pstrcoid AND fyear = p_pstryear AND fbrid = p_lkpbranch
                          AND ftickettypeid = p_lkptkttype AND fticketslno = p_txttktslno AND fslno = p_txtslno AND frevno = p_txtrevno) THEN
                RAISE EXCEPTION 'Ticket ''%-%'' Sl. No. % already exists', p_lkptkttype, p_txttktslno, p_txtslno;
            END IF;

            INSERT INTO dbo.tblticketsales
                   (fcoid, fyear, ftickettypeid, fticketslno, fslno, frevno, fservicetypegroupid, fairlineno,
                    fairlinecode, fbrid, fiatacode, fdate, fbspdate, ftraveldate, freturndate, fpnr, fdi,
                    fsupplierid, fpaysupplierid, fpaxname, fstaffid, fbgdsstaffid, fpaxtype, fpaxid, fvoid,
                    fserviceid, fgdsstaffid, fmobileno, femail, ftrip, ftourcode, froute, fclass, fdestid, fcnj,
                    fgdsid, fcctype, fcarrier, ffarebasis, fmerchant, ffop, fiataamt, fsupfee, fsupfeevatamt,
                    fsupplieramtcash, fsellingamt, fcommtype, fcommper, fscommamt, fsupplieramtcc, ftaxamt, fcommamt,
                    fcommvatamt, fsupplieramtep, fpvatamt, fsupplieramt, fkbamt, fkbaccountid, finvnote, fnote,
                    fuserid, fuserdate, fcuserid, fcuserdate)
            VALUES (p_pstrcoid, p_pstryear, p_lkptkttype, p_txttktslno, COALESCE(p_txtslno, 1), p_txtrevno, v_group,
                    NULLIF(BTRIM(p_lkpairlineno), ''), v_airlinecode, p_lkpbranch, NULLIF(BTRIM(p_lkpiata), ''),
                    p_dtpdate, v_bspdate, p_dtpflightdate, p_dtpreturndate, NULLIF(BTRIM(p_txtpnrno), ''),
                    NULLIF(BTRIM(p_lkpdi), ''), NULLIF(BTRIM(p_lkpsupplier), ''),
                    NULLIF(BTRIM(p_lkppaysupplierid), ''), NULLIF(BTRIM(p_txtpaxname), ''),
                    NULLIF(BTRIM(p_lkpstaffid), ''), NULLIF(BTRIM(p_txtbookinggdslogin), ''),
                    NULLIF(BTRIM(p_lkppaxtype), ''), NULLIF(BTRIM(p_txtpaxnameid), ''), COALESCE(p_lkpvoid, false),
                    NULLIF(BTRIM(p_lkpservice), ''), NULLIF(BTRIM(p_txtsalesgdslogin), ''),
                    NULLIF(BTRIM(p_txtmobile), ''), NULLIF(BTRIM(p_txtemail), ''), NULLIF(BTRIM(p_lkptrip), ''),
                    NULLIF(BTRIM(p_txttourcode), ''), NULLIF(BTRIM(p_txtroute), ''), NULLIF(BTRIM(p_txtclass), ''),
                    NULLIF(BTRIM(p_txtdestination), ''), COALESCE(p_lkpcnj, false), NULLIF(BTRIM(p_lkpgds), ''),
                    NULLIF(BTRIM(p_lkpcctype), ''), NULLIF(BTRIM(p_txtcarrier), ''),
                    NULLIF(BTRIM(p_txtfarebasis), ''), NULLIF(BTRIM(p_lkpmerchant), ''), NULLIF(BTRIM(p_lkpfop), ''),
                    p_txtgfare, p_txtsupfee, p_txtfeevat, p_txtfopcash, p_txtsfare, NULLIF(BTRIM(p_lkpalcom), ''),
                    v_commper, p_txtsupcom, p_txtfopcc, p_txttax, v_commamt, p_txtalcvat, p_txtfopep, p_txtk7,
                    p_txtsupplieramt, COALESCE(p_txtkbamt, 0), NULLIF(BTRIM(p_lkpkbaccount), ''),
                    NULLIF(BTRIM(p_txtinvnote), ''), NULLIF(BTRIM(p_txtnote), ''), LEFT(p_pstruserid, 20), v_now,
                    p_pstruserid, v_now);

        ELSE

            IF NOT EXISTS (SELECT 1 FROM dbo.tblticketsales
                            WHERE fcoid = p_pstrcoid AND fyear = p_pstryear AND fbrid = p_lkpbranch
                              AND ftickettypeid = p_lkptkttype AND fticketslno = p_txttktslno AND fslno = p_txtslno AND frevno = p_txtrevno) THEN
                RAISE EXCEPTION 'Ticket ''%-%'' was changed or removed by someone else. Cancel and try again',
                                p_lkptkttype, p_txttktslno;
            END IF;

            UPDATE dbo.tblticketsales
               SET fservicetypegroupid = v_group,
                   fairlineno          = NULLIF(BTRIM(p_lkpairlineno), ''),
                   fairlinecode        = v_airlinecode,
                   fiatacode           = NULLIF(BTRIM(p_lkpiata), ''),
                   fdate               = p_dtpdate,
                   fbspdate            = v_bspdate,
                   ftraveldate         = p_dtpflightdate,
                   freturndate         = p_dtpreturndate,
                   fpnr                = NULLIF(BTRIM(p_txtpnrno), ''),
                   fdi                 = NULLIF(BTRIM(p_lkpdi), ''),
                   fsupplierid         = NULLIF(BTRIM(p_lkpsupplier), ''),
                   fpaysupplierid      = NULLIF(BTRIM(p_lkppaysupplierid), ''),
                   fpaxname            = NULLIF(BTRIM(p_txtpaxname), ''),
                   fstaffid            = NULLIF(BTRIM(p_lkpstaffid), ''),
                   fbgdsstaffid        = NULLIF(BTRIM(p_txtbookinggdslogin), ''),
                   fpaxtype            = NULLIF(BTRIM(p_lkppaxtype), ''),
                   fpaxid              = NULLIF(BTRIM(p_txtpaxnameid), ''),
                   fvoid               = COALESCE(p_lkpvoid, false),
                   fserviceid          = NULLIF(BTRIM(p_lkpservice), ''),
                   fgdsstaffid         = NULLIF(BTRIM(p_txtsalesgdslogin), ''),
                   fmobileno           = NULLIF(BTRIM(p_txtmobile), ''),
                   femail              = NULLIF(BTRIM(p_txtemail), ''),
                   ftrip               = NULLIF(BTRIM(p_lkptrip), ''),
                   ftourcode           = NULLIF(BTRIM(p_txttourcode), ''),
                   froute              = NULLIF(BTRIM(p_txtroute), ''),
                   fclass              = NULLIF(BTRIM(p_txtclass), ''),
                   fdestid             = NULLIF(BTRIM(p_txtdestination), ''),
                   fcnj                = COALESCE(p_lkpcnj, false),
                   fgdsid              = NULLIF(BTRIM(p_lkpgds), ''),
                   fcctype             = NULLIF(BTRIM(p_lkpcctype), ''),
                   fcarrier            = NULLIF(BTRIM(p_txtcarrier), ''),
                   ffarebasis          = NULLIF(BTRIM(p_txtfarebasis), ''),
                   fmerchant           = NULLIF(BTRIM(p_lkpmerchant), ''),
                   ffop                = NULLIF(BTRIM(p_lkpfop), ''),
                   fiataamt            = p_txtgfare,
                   fsupfee             = p_txtsupfee,
                   fsupfeevatamt       = p_txtfeevat,
                   fsupplieramtcash    = p_txtfopcash,
                   fsellingamt         = p_txtsfare,
                   fcommtype           = NULLIF(BTRIM(p_lkpalcom), ''),
                   fcommper            = v_commper,
                   fscommamt           = p_txtsupcom,
                   fsupplieramtcc      = p_txtfopcc,
                   ftaxamt             = p_txttax,
                   fcommamt            = v_commamt,
                   fcommvatamt         = p_txtalcvat,
                   fsupplieramtep      = p_txtfopep,
                   fpvatamt            = p_txtk7,
                   fsupplieramt        = p_txtsupplieramt,
                   fkbamt              = COALESCE(p_txtkbamt, 0),
                   fkbaccountid        = NULLIF(BTRIM(p_lkpkbaccount), ''),
                   finvnote            = NULLIF(BTRIM(p_txtinvnote), ''),
                   fnote               = NULLIF(BTRIM(p_txtnote), ''),
                   fmuserid            = p_pstruserid,
                   fmuserdate          = v_now
             WHERE fcoid = p_pstrcoid
               AND fyear = p_pstryear
               AND fbrid = p_lkpbranch
               AND ftickettypeid = p_lkptkttype
               AND fticketslno = p_txttktslno AND fslno = p_txtslno
               AND frevno = p_txtrevno;

        END IF;

    -- ------------------------------------------------------------- DELETE
    ELSIF p_strmode = 'D' THEN

        DELETE FROM dbo.tblticketsales
         WHERE fcoid = p_pstrcoid
           AND fyear = p_pstryear
           AND fbrid = p_lkpbranch
           AND ftickettypeid = p_lkptkttype
           AND fticketslno = p_txttktslno AND fslno = p_txtslno
           AND frevno = p_txtrevno;

    ELSE
        RAISE EXCEPTION 'invalid mode: %', p_strmode;
    END IF;
END;
$$;


ALTER PROCEDURE dbo.sp_pageticketsales(IN p_strmode character varying, IN p_pstrcoid character varying, IN p_pstryear character varying, IN p_lkptkttype character varying, IN p_txttktslno character varying, IN p_txtslno smallint, IN p_txtrevno smallint, IN p_lkpairlineno character varying, IN p_lkpbranch character varying, IN p_lkpiata character varying, IN p_dtpdate date, IN p_dtpbspdate date, IN p_dtpflightdate date, IN p_dtpreturndate date, IN p_txtpnrno character varying, IN p_lkpdi character varying, IN p_lkpsupplier character varying, IN p_lkppaysupplierid character varying, IN p_txtpaxname character varying, IN p_lkpstaffid character varying, IN p_txtbookinggdslogin character varying, IN p_lkppaxtype character varying, IN p_txtpaxnameid character varying, IN p_lkpvoid boolean, IN p_lkpservice character varying, IN p_txtsalesgdslogin character varying, IN p_txtmobile character varying, IN p_txtemail character varying, IN p_lkptrip character varying, IN p_txttourcode character varying, IN p_txtroute character varying, IN p_txtclass character varying, IN p_txtdestination character varying, IN p_lkpcnj boolean, IN p_lkpgds character varying, IN p_lkpcctype character varying, IN p_txtcarrier character varying, IN p_txtfarebasis character varying, IN p_lkpmerchant character varying, IN p_lkpfop character varying, IN p_txtgfare numeric, IN p_txtsupfee numeric, IN p_txtfeevat numeric, IN p_txtfopcash numeric, IN p_txtsfare numeric, IN p_lkpalcom character varying, IN p_txtalcom numeric, IN p_txtsupcom numeric, IN p_txtfopcc numeric, IN p_txttax numeric, IN p_txtalcomamt numeric, IN p_txtalcvat numeric, IN p_txtfopep numeric, IN p_txtk7 numeric, IN p_txtsupplieramt numeric, IN p_txtkbamt integer, IN p_lkpkbaccount character varying, IN p_txtinvnote character varying, IN p_txtnote character varying, IN p_pstruserid character varying, INOUT p_result_cursor refcursor) OWNER TO postgres;

--
-- Name: sp_pageticketsalesb(character varying, character varying, character varying, character varying, character varying, smallint, smallint, character varying, date, character varying, character varying, character varying, numeric, numeric, numeric, numeric, numeric, numeric, numeric, numeric, numeric, numeric, numeric, numeric, character varying, numeric, character varying, character varying, character varying, character varying, character varying, refcursor); Type: PROCEDURE; Schema: dbo; Owner: postgres
--

CREATE PROCEDURE dbo.sp_pageticketsalesb(IN p_strmode character varying, IN p_pstrcoid character varying, IN p_pstryear character varying, IN p_lkptkttype character varying, IN p_txttktslno character varying, IN p_txtslno smallint DEFAULT 1, IN p_txtrevno smallint DEFAULT 1, IN p_lkpbranch character varying DEFAULT NULL::character varying, IN p_dtpdate date DEFAULT NULL::date, IN p_lkplinecustomer character varying DEFAULT NULL::character varying, IN p_lkplinedivision character varying DEFAULT NULL::character varying, IN p_txtlinebtype character varying DEFAULT NULL::character varying, IN p_txtlinefare numeric DEFAULT 0, IN p_txtlinetax numeric DEFAULT 0, IN p_txtlineschg numeric DEFAULT 0, IN p_txtlinevatamt numeric DEFAULT 0, IN p_txtlineschgv numeric DEFAULT 0, IN p_txtlineinvamt numeric DEFAULT 0, IN p_txtlinevatper numeric DEFAULT 0, IN p_txtlinehcharge numeric DEFAULT 0, IN p_txtlinehscvatamt numeric DEFAULT 0, IN p_txtlinemf numeric DEFAULT 0, IN p_txtlinemfwovat numeric DEFAULT 0, IN p_txtlinemfvatamt numeric DEFAULT 0, IN p_txtlineschgtype character varying DEFAULT NULL::character varying, IN p_txtlineschgper numeric DEFAULT 0, IN p_txtref1 character varying DEFAULT NULL::character varying, IN p_txtref2 character varying DEFAULT NULL::character varying, IN p_txtref3 character varying DEFAULT NULL::character varying, IN p_txtref4 character varying DEFAULT NULL::character varying, IN p_pstruserid character varying DEFAULT NULL::character varying, INOUT p_result_cursor refcursor DEFAULT 'ticketsalesb_cursor'::refcursor)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_group  varchar(4);
    v_now    timestamp := dbo.getserverdate();   -- the common server date (sql/common/fn_getserverdate.sql)
BEGIN

    IF COALESCE(BTRIM(p_lkptkttype), '') = '' OR COALESCE(BTRIM(p_txttktslno), '') = ''
       OR COALESCE(BTRIM(p_lkpbranch), '') = '' OR COALESCE(BTRIM(p_pstryear), '') = '' THEN
        RAISE EXCEPTION 'The ticket is not given';
    END IF;

    -- ---------------------------------------------------------------- GET
    IF p_strmode = 'G' THEN

        OPEN p_result_cursor FOR
        SELECT b.*
          FROM dbo.tblticketsalesb AS b
         WHERE b.fcoid = p_pstrcoid
           AND b.fyear = p_pstryear
           AND b.fbrid = p_lkpbranch
           AND b.ftickettypeid = p_lkptkttype
           AND b.fticketslno = p_txttktslno AND b.fslno = p_txtslno
           AND b.frevno = p_txtrevno;

    -- --------------------------------------------------------------- SAVE
    ELSIF p_strmode = 'S' THEN

        IF COALESCE(BTRIM(p_lkplinecustomer), '') = '' THEN
            RAISE EXCEPTION 'Please select ''Customer''';
        END IF;

        -- the ticket is saved first; its service type group goes to the line
        SELECT t.fservicetypegroupid
          INTO v_group
          FROM dbo.tblticketsales AS t
         WHERE t.fcoid = p_pstrcoid
           AND t.fyear = p_pstryear
           AND t.fbrid = p_lkpbranch
           AND t.ftickettypeid = p_lkptkttype
           AND t.fticketslno = p_txttktslno AND t.fslno = p_txtslno
           AND t.frevno = p_txtrevno;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Ticket ''%-%'' is not saved yet', p_lkptkttype, p_txttktslno;
        END IF;

        IF EXISTS (SELECT 1 FROM dbo.tblticketsalesb
                    WHERE fcoid = p_pstrcoid AND fyear = p_pstryear AND fbrid = p_lkpbranch
                      AND ftickettypeid = p_lkptkttype AND fticketslno = p_txttktslno AND fslno = p_txtslno AND frevno = p_txtrevno) THEN
            RAISE EXCEPTION 'Only one customer line can be saved for a ticket';
        END IF;

        INSERT INTO dbo.tblticketsalesb
               (fcoid, fyear, ftickettypeid, fticketslno, fslno, frevno, fbrid, fservicetypegroupid, fdate,
                fcustomerid, fdivid, fbusinesstypeid, ftotfare, ftaxamt, fagencycharge, fvatamt, fscvatamt,
                fbillingamt, fvatper, fh_agencycharge, fh_scvatamt, fmf, fmfwovat, fmfvatamt, fservicechargetype,
                fservicechargeper, frefno, frefno2, frefno3, frefno4, fcuserid, fcuserdate)
        VALUES (p_pstrcoid, p_pstryear, p_lkptkttype, p_txttktslno, COALESCE(p_txtslno, 1), p_txtrevno, p_lkpbranch,
                COALESCE(v_group, 'TKT'), p_dtpdate, BTRIM(p_lkplinecustomer), NULLIF(BTRIM(p_lkplinedivision), ''),
                NULLIF(BTRIM(p_txtlinebtype), ''), p_txtlinefare, p_txtlinetax, p_txtlineschg, p_txtlinevatamt,
                p_txtlineschgv, p_txtlineinvamt, p_txtlinevatper, p_txtlinehcharge, p_txtlinehscvatamt, p_txtlinemf,
                p_txtlinemfwovat, p_txtlinemfvatamt, NULLIF(BTRIM(p_txtlineschgtype), ''), p_txtlineschgper,
                NULLIF(BTRIM(p_txtref1), ''), NULLIF(BTRIM(p_txtref2), ''), NULLIF(BTRIM(p_txtref3), ''),
                NULLIF(BTRIM(p_txtref4), ''), p_pstruserid, v_now);

    -- ------------------------------------------------------------- MODIFY
    ELSIF p_strmode = 'M' THEN

        IF COALESCE(BTRIM(p_lkplinecustomer), '') = '' THEN
            RAISE EXCEPTION 'Please select ''Customer''';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM dbo.tblticketsalesb
                        WHERE fcoid = p_pstrcoid AND fyear = p_pstryear AND fbrid = p_lkpbranch
                          AND ftickettypeid = p_lkptkttype AND fticketslno = p_txttktslno AND fslno = p_txtslno AND frevno = p_txtrevno) THEN
            RAISE EXCEPTION 'The customer line of ticket ''%-%'' was changed or removed by someone else. Cancel and try again',
                            p_lkptkttype, p_txttktslno;
        END IF;

        UPDATE dbo.tblticketsalesb
           SET fdate               = p_dtpdate,
               fcustomerid         = BTRIM(p_lkplinecustomer),
               fdivid              = NULLIF(BTRIM(p_lkplinedivision), ''),
               fbusinesstypeid     = NULLIF(BTRIM(p_txtlinebtype), ''),
               ftotfare            = p_txtlinefare,
               ftaxamt             = p_txtlinetax,
               fagencycharge       = p_txtlineschg,
               fvatamt             = p_txtlinevatamt,
               fscvatamt           = p_txtlineschgv,
               fbillingamt         = p_txtlineinvamt,
               fvatper             = p_txtlinevatper,
               fh_agencycharge     = p_txtlinehcharge,
               fh_scvatamt         = p_txtlinehscvatamt,
               fmf                 = p_txtlinemf,
               fmfwovat            = p_txtlinemfwovat,
               fmfvatamt           = p_txtlinemfvatamt,
               fservicechargetype  = NULLIF(BTRIM(p_txtlineschgtype), ''),
               fservicechargeper   = p_txtlineschgper,
               frefno              = NULLIF(BTRIM(p_txtref1), ''),
               frefno2             = NULLIF(BTRIM(p_txtref2), ''),
               frefno3             = NULLIF(BTRIM(p_txtref3), ''),
               frefno4             = NULLIF(BTRIM(p_txtref4), ''),
               fmuserid            = p_pstruserid,
               fmuserdate          = v_now
         WHERE fcoid = p_pstrcoid
           AND fyear = p_pstryear
           AND fbrid = p_lkpbranch
           AND ftickettypeid = p_lkptkttype
           AND fticketslno = p_txttktslno AND fslno = p_txtslno
           AND frevno = p_txtrevno;

    -- ------------------------------------------------------------- DELETE
    ELSIF p_strmode = 'D' THEN

        DELETE FROM dbo.tblticketsalesb
         WHERE fcoid = p_pstrcoid
           AND fyear = p_pstryear
           AND fbrid = p_lkpbranch
           AND ftickettypeid = p_lkptkttype
           AND fticketslno = p_txttktslno AND fslno = p_txtslno
           AND frevno = p_txtrevno;

    ELSE
        RAISE EXCEPTION 'invalid mode: %', p_strmode;
    END IF;
END;
$$;


ALTER PROCEDURE dbo.sp_pageticketsalesb(IN p_strmode character varying, IN p_pstrcoid character varying, IN p_pstryear character varying, IN p_lkptkttype character varying, IN p_txttktslno character varying, IN p_txtslno smallint, IN p_txtrevno smallint, IN p_lkpbranch character varying, IN p_dtpdate date, IN p_lkplinecustomer character varying, IN p_lkplinedivision character varying, IN p_txtlinebtype character varying, IN p_txtlinefare numeric, IN p_txtlinetax numeric, IN p_txtlineschg numeric, IN p_txtlinevatamt numeric, IN p_txtlineschgv numeric, IN p_txtlineinvamt numeric, IN p_txtlinevatper numeric, IN p_txtlinehcharge numeric, IN p_txtlinehscvatamt numeric, IN p_txtlinemf numeric, IN p_txtlinemfwovat numeric, IN p_txtlinemfvatamt numeric, IN p_txtlineschgtype character varying, IN p_txtlineschgper numeric, IN p_txtref1 character varying, IN p_txtref2 character varying, IN p_txtref3 character varying, IN p_txtref4 character varying, IN p_pstruserid character varying, INOUT p_result_cursor refcursor) OWNER TO postgres;

--
-- Name: sp_pageticketsalescnj(character varying, character varying, character varying, character varying, character varying, smallint, smallint, character varying, character varying, character varying, character varying, character varying, refcursor); Type: PROCEDURE; Schema: dbo; Owner: postgres
--

CREATE PROCEDURE dbo.sp_pageticketsalescnj(IN p_strmode character varying, IN p_pstrcoid character varying, IN p_pstryear character varying, IN p_lkptkttype character varying, IN p_txttktslno character varying, IN p_txtslno smallint DEFAULT 1, IN p_txtrevno smallint DEFAULT 1, IN p_lkpbranch character varying DEFAULT NULL::character varying, IN p_txtcnjtktslno character varying DEFAULT NULL::character varying, IN p_txtroute character varying DEFAULT NULL::character varying, IN p_txtcarrier character varying DEFAULT NULL::character varying, IN p_txtclass character varying DEFAULT NULL::character varying, INOUT p_result_cursor refcursor DEFAULT 'ticketsalescnj_cursor'::refcursor)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_group  varchar(4);
BEGIN

    IF COALESCE(BTRIM(p_lkptkttype), '') = '' OR COALESCE(BTRIM(p_txttktslno), '') = ''
       OR COALESCE(BTRIM(p_lkpbranch), '') = '' OR COALESCE(BTRIM(p_pstryear), '') = '' THEN
        RAISE EXCEPTION 'The ticket is not given';
    END IF;

    -- ---------------------------------------------------------------- GET
    IF p_strmode = 'G' THEN

        OPEN p_result_cursor FOR
        SELECT c.*
          FROM dbo.tblticketsalescnj AS c
         WHERE c.fcoid = p_pstrcoid
           AND c.fyear = p_pstryear
           AND c.fbrid = p_lkpbranch
           AND c.ftickettypeid = p_lkptkttype
           AND c.ftktslno = p_txttktslno AND c.fslno = p_txtslno
           AND c.frevno = p_txtrevno;

    -- --------------------------------------------------------------- SAVE
    ELSIF p_strmode = 'S' THEN

        IF COALESCE(BTRIM(p_txtcnjtktslno), '') = '' THEN
            RAISE EXCEPTION 'Please input ''CNJ Ticket No.''';
        END IF;

        -- the ticket is saved first; its service type group goes to the row
        SELECT t.fservicetypegroupid
          INTO v_group
          FROM dbo.tblticketsales AS t
         WHERE t.fcoid = p_pstrcoid
           AND t.fyear = p_pstryear
           AND t.fbrid = p_lkpbranch
           AND t.ftickettypeid = p_lkptkttype
           AND t.fticketslno = p_txttktslno AND t.fslno = p_txtslno
           AND t.frevno = p_txtrevno;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Ticket ''%-%'' is not saved yet', p_lkptkttype, p_txttktslno;
        END IF;

        IF EXISTS (SELECT 1 FROM dbo.tblticketsalescnj
                    WHERE fcoid = p_pstrcoid AND fyear = p_pstryear AND fbrid = p_lkpbranch
                      AND ftickettypeid = p_lkptkttype AND ftktslno = p_txttktslno AND fslno = p_txtslno AND frevno = p_txtrevno) THEN
            RAISE EXCEPTION 'Only one conjunction ticket can be saved for a ticket';
        END IF;

        INSERT INTO dbo.tblticketsalescnj
               (fcoid, fyear, fbrid, ftickettypeid, ftktslno, fslno, frevno, fcnjtktslno, fcnjtktno,
                fservicetypegroupid, froute, fclass, fcarrier)
        VALUES (p_pstrcoid, p_pstryear, p_lkpbranch, p_lkptkttype, p_txttktslno, COALESCE(p_txtslno, 1), p_txtrevno,
                BTRIM(p_txtcnjtktslno), BTRIM(p_txtcnjtktslno), COALESCE(v_group, 'TKT'),
                NULLIF(UPPER(BTRIM(p_txtroute)), ''), NULLIF(UPPER(BTRIM(p_txtclass)), ''),
                NULLIF(UPPER(BTRIM(p_txtcarrier)), ''));

    -- ------------------------------------------------------------- DELETE
    ELSIF p_strmode = 'D' THEN

        DELETE FROM dbo.tblticketsalescnj
         WHERE fcoid = p_pstrcoid
           AND fyear = p_pstryear
           AND fbrid = p_lkpbranch
           AND ftickettypeid = p_lkptkttype
           AND ftktslno = p_txttktslno AND fslno = p_txtslno
           AND frevno = p_txtrevno;

    ELSE
        RAISE EXCEPTION 'invalid mode: %', p_strmode;
    END IF;
END;
$$;


ALTER PROCEDURE dbo.sp_pageticketsalescnj(IN p_strmode character varying, IN p_pstrcoid character varying, IN p_pstryear character varying, IN p_lkptkttype character varying, IN p_txttktslno character varying, IN p_txtslno smallint, IN p_txtrevno smallint, IN p_lkpbranch character varying, IN p_txtcnjtktslno character varying, IN p_txtroute character varying, IN p_txtcarrier character varying, IN p_txtclass character varying, INOUT p_result_cursor refcursor) OWNER TO postgres;

--
-- Name: sp_useraudit(character varying, character varying, character varying, character varying, character varying, character varying, character varying, character varying, character varying); Type: PROCEDURE; Schema: dbo; Owner: postgres
--

CREATE PROCEDURE dbo.sp_useraudit(IN p_strcoid character varying DEFAULT NULL::character varying, IN p_stryear character varying DEFAULT NULL::character varying, IN p_strbrid character varying DEFAULT NULL::character varying, IN p_strdoctype character varying DEFAULT NULL::character varying, IN p_strdocno character varying DEFAULT NULL::character varying, IN p_strscreenname character varying DEFAULT NULL::character varying, IN p_straction character varying DEFAULT NULL::character varying, IN p_strnote character varying DEFAULT NULL::character varying, IN p_struserid character varying DEFAULT NULL::character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN

    INSERT INTO dbo.tbluseraudit
    (
        fcoid,
        fyear,
        fbrid,
        fdoctype,
        fscreenname,
        fscreenkey,
        faction,
        fnote,
        fuserid,
        fuserdate
    )
    VALUES
    (
        p_strcoid,
        p_stryear,
        p_strbrid,
        p_strdoctype,
        p_strscreenname,
        COALESCE(p_strbrid, '')
            || COALESCE(p_strdoctype, '')
            || COALESCE(p_strdocno, ''),
        p_straction,
        p_strnote,
        p_struserid,
        dbo.getserverdate()
    );

END;
$$;


ALTER PROCEDURE dbo.sp_useraudit(IN p_strcoid character varying, IN p_stryear character varying, IN p_strbrid character varying, IN p_strdoctype character varying, IN p_strdocno character varying, IN p_strscreenname character varying, IN p_straction character varying, IN p_strnote character varying, IN p_struserid character varying) OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: tblaccount; Type: TABLE; Schema: dbo; Owner: postgres
--

CREATE TABLE dbo.tblaccount (
    fcoid character varying(3) NOT NULL,
    faccountid character varying(12) NOT NULL,
    fgph character varying(1),
    fgcs character varying(1),
    faccountname character varying(100),
    faccountname_ar character varying(100),
    faccountname_legal_ar character varying(100),
    facccountname_short character varying(20),
    faccountgroupid character varying(12),
    faccounttypeid character varying(1),
    faccountlevel smallint,
    fhavedivision boolean,
    fhavecc boolean DEFAULT false,
    fstatus boolean DEFAULT true,
    fstatusreason character varying(100),
    foldaccountid character varying(20),
    ferpaccountid character varying(20),
    ftitle character varying(5),
    fcuserid character varying(30),
    fcuserdate timestamp without time zone,
    fmuserid character varying(30),
    fmuserdate timestamp without time zone
);


ALTER TABLE dbo.tblaccount OWNER TO postgres;

--
-- Name: tblaccountcs; Type: TABLE; Schema: dbo; Owner: postgres
--

CREATE TABLE dbo.tblaccountcs (
    fcoid character varying(3) NOT NULL,
    fcsaccountid character varying(12) NOT NULL,
    fcsaccountname character varying(100),
    fcs character varying(1),
    fcsdet character varying(4),
    fcsaccountname_leagal character varying(100),
    fcsaccountname_short character varying(20),
    fcstype character varying(4),
    fgaccountid character varying(12),
    fbussinesstype character varying(3),
    fbuildingno character varying(6),
    fstreetname character varying(40),
    fdistrict character varying(40),
    fcity character varying(40),
    fcountryid character varying(4),
    fpostalcode character varying(7),
    fadditionalno character varying(6),
    fcrno character varying(20),
    fvatno character varying(15),
    faccountname_ar character varying(100),
    fleagalaccountname_ar character varying(100),
    fbuildingno_ar character varying(6),
    fstreetname_a character varying(40),
    fdistrict_ar character varying(40),
    fcity_ar character varying(40),
    fcountryid_ar character varying(4),
    fpostalcode_ar character varying(7),
    fadditionalno_ar character varying(6),
    fcrno_ar character varying(20),
    fvatno_ar character varying(15),
    fcontact character varying(80),
    fphone character varying(60),
    femail character varying(120),
    fhavedivision boolean DEFAULT false,
    fbrid character varying(3),
    fcreditlimit integer DEFAULT 0,
    fcreditdays integer DEFAULT 0,
    fstatus boolean DEFAULT false,
    fstatusreason character varying(50),
    ftitle character varying(5),
    fintercompany boolean DEFAULT false,
    fexcludefromageing boolean DEFAULT false,
    fctacardtype character varying(1),
    fctacardno character varying(15),
    fshortctacardno character varying(8),
    fctaexpiry character varying(15),
    fcuserid character varying(30),
    fcuserdate timestamp without time zone,
    fmuserid character varying(30),
    fmuserdate timestamp without time zone,
    fstaffid character varying(4),
    fcalcsupfeevat boolean,
    fisservicechargepolicy boolean
);


ALTER TABLE dbo.tblaccountcs OWNER TO postgres;

--
-- Name: tblairline; Type: TABLE; Schema: dbo; Owner: postgres
--

CREATE TABLE dbo.tblairline (
    fcoid character varying(3) NOT NULL,
    fairlineno character varying(3) NOT NULL,
    fairlinename character varying(50) NOT NULL,
    fairlinecode character varying(3),
    fvatoncommission boolean,
    fcuserid character varying(30),
    fcuserdate timestamp without time zone,
    fmuserid character varying(30),
    fmuserdate date
);


ALTER TABLE dbo.tblairline OWNER TO postgres;

--
-- Name: tblbranch; Type: TABLE; Schema: dbo; Owner: postgres
--

CREATE TABLE dbo.tblbranch (
    fcoid character varying(3) NOT NULL,
    fbrid character varying(3) NOT NULL,
    fbrname character varying(40),
    fiata boolean DEFAULT false,
    fiatacode character varying(8),
    fbspaccountid character varying(12),
    fcaccountid character varying(12),
    fbaccountid character varying(12),
    fpaccountid character varying(12),
    fccaccountid character varying(12),
    factivefromdate timestamp without time zone,
    factivetodate timestamp without time zone,
    fneedyearclose boolean DEFAULT false,
    fpositionno smallint DEFAULT 0 NOT NULL,
    fcustadvanceaccountid character varying(12),
    flocalserverpath character varying(200),
    fcomputerid character varying(50),
    fbrautobossupdates boolean DEFAULT false,
    fbuildingno character varying(30),
    fstreetname character varying(30),
    fdistrict character varying(30),
    fcity character varying(30),
    fcountry character varying(30),
    fpostalcode character varying(20),
    fadditionalno character varying(20),
    fcrno character varying(20),
    fbuildingno_a character varying(30),
    fstreetname_a character varying(30),
    fdistrict_a character varying(30),
    fcity_a character varying(30),
    fcountry_a character varying(30),
    fpostalcode_a character varying(20),
    fadditionalno_a character varying(20),
    fcrno_a character varying(20),
    fbrname_a character varying(40),
    ftourismlicenseno character varying(15),
    ftourismlicenseno_a character varying(15),
    fcategory character varying(30),
    fcategory_a character varying(30),
    ftelephone character varying(40),
    ftelephone_a character varying(40),
    fho boolean DEFAULT false,
    fbrtype character varying(1),
    faddress1 character varying(100),
    faddress2 character varying(100),
    faddress3 character varying(100),
    femail character varying(120),
    fuserid character varying(20),
    fuserdate timestamp without time zone,
    fmuserid character varying(20),
    fmuserdate timestamp without time zone
);


ALTER TABLE dbo.tblbranch OWNER TO postgres;

--
-- Name: tblcompany; Type: TABLE; Schema: dbo; Owner: postgres
--

CREATE TABLE dbo.tblcompany (
    fcoid character varying(3) NOT NULL,
    fconame character varying(100),
    fconame_ar character varying(100),
    fconame_qr character varying(30),
    fconame_short character varying(30),
    fcoaddress1 character varying(80),
    fcoaddress2 character varying(80),
    fcoaddress3 character varying(80),
    fcoaddress4 character varying(80),
    fcoaddress1_ar character(80),
    fcoaddress2_ar character(80),
    fcoaddress3_ar character(80),
    fcoaddress4_ar character varying(80),
    fcovatno character varying(15),
    fcovatno_ar character varying(15),
    fpiexpenseaccountgroup character varying(12),
    fbg2arap boolean,
    fycmethod character varying(2),
    flslno character varying(100),
    fcuserid character varying(30),
    fcuserdate timestamp without time zone,
    fmuserid character varying(30),
    fmuserdate timestamp without time zone,
    fpositionno smallint,
    fcostatus character varying(1),
    fcommvatper numeric(18,2),
    CONSTRAINT chk_fcostatus CHECK (((fcostatus)::text = ANY (ARRAY[('A'::character varying)::text, ('C'::character varying)::text])))
);


ALTER TABLE dbo.tblcompany OWNER TO postgres;

--
-- Name: tblcustdivision; Type: TABLE; Schema: dbo; Owner: postgres
--

CREATE TABLE dbo.tblcustdivision (
    fcoid character varying(3) NOT NULL,
    fcustomerid character varying(12) NOT NULL,
    fdivid character varying(8) NOT NULL,
    fdivname character varying(60),
    fdivname_ar character varying(60),
    fcuserid character varying(30),
    fcuserdate timestamp without time zone,
    fmuserid character varying(30),
    fmuserdate timestamp without time zone
);


ALTER TABLE dbo.tblcustdivision OWNER TO postgres;

--
-- Name: tblfop; Type: TABLE; Schema: dbo; Owner: postgres
--

CREATE TABLE dbo.tblfop (
    fcoid character varying(3) NOT NULL,
    ffop character varying(10) NOT NULL,
    fpositionno integer,
    fcuserid character varying(30),
    fcuserdate timestamp without time zone,
    fmuserid character varying(30),
    fmuserdate timestamp without time zone,
    ffopname character varying(30)
);


ALTER TABLE dbo.tblfop OWNER TO postgres;

--
-- Name: tblgds; Type: TABLE; Schema: dbo; Owner: postgres
--

CREATE TABLE dbo.tblgds (
    fcoid character varying(3) NOT NULL,
    fgdsid character varying(2) NOT NULL,
    fgdsname character varying(15),
    firid character varying(5),
    firpath character varying(50),
    factive boolean DEFAULT false,
    fpositionno smallint,
    fcuserid character varying(30),
    fcuserdate timestamp without time zone,
    fmuserid character varying(30),
    fmuserdate timestamp without time zone
);


ALTER TABLE dbo.tblgds OWNER TO postgres;

--
-- Name: tbliata; Type: TABLE; Schema: dbo; Owner: postgres
--

CREATE TABLE dbo.tbliata (
    fcoid character varying(3) NOT NULL,
    fiatacode character varying(8) NOT NULL,
    fiataname character varying(40),
    fbsppurchase_csaccountid character varying(12),
    fvoidsales_csaccountid character varying(12),
    fpaxccsales_csaccountid character varying(12),
    fcashsales_csaccountid character varying(12),
    fpositionno smallint,
    fcuserid character varying(30),
    fcuserdate timestamp without time zone,
    fmuserid character varying(30),
    fmuserdate timestamp without time zone
);


ALTER TABLE dbo.tbliata OWNER TO postgres;

--
-- Name: tblmenu; Type: TABLE; Schema: dbo; Owner: postgres
--

CREATE TABLE dbo.tblmenu (
    fmenuid character varying(15) NOT NULL,
    fmenuname character varying(50),
    fmenucaption character varying(50),
    fmenubuttons character varying(10)
);


ALTER TABLE dbo.tblmenu OWNER TO postgres;

--
-- Name: tblservicechargepolicy; Type: TABLE; Schema: dbo; Owner: postgres
--

CREATE TABLE dbo.tblservicechargepolicy (
    fcoid character varying(3) NOT NULL,
    fsr character varying(2) NOT NULL,
    fcustomerid character varying(12) NOT NULL,
    fservicetypeid character varying(4) NOT NULL,
    fdivid character varying(8) NOT NULL,
    fservicetypegroupid character varying(4),
    fmf numeric(18,2),
    fctacarriercode character varying(3),
    fd_servicechargetype character varying(2),
    fd_servicechgper numeric(18,2),
    fd_minservicechgamt numeric(18,2),
    fd_servicechgamt numeric(18,2),
    fi_servicechargetype character varying(2),
    fi_servicechgper numeric(18,2),
    fi_minservicechgamt numeric(18,2),
    fi_servicechgamt numeric(18,2),
    fcuserid character varying(30),
    fcuserdate timestamp without time zone,
    fmuserid character varying(30),
    fmuserdate timestamp without time zone
);


ALTER TABLE dbo.tblservicechargepolicy OWNER TO postgres;

--
-- Name: tblservicetype; Type: TABLE; Schema: dbo; Owner: postgres
--

CREATE TABLE dbo.tblservicetype (
    fcoid character varying(3) NOT NULL,
    fservicetypeid character varying(4) NOT NULL,
    fservicetypegroupid character varying(4) NOT NULL,
    fservicetypename character varying(50),
    fctacarriercode character varying(3),
    fcuserid character varying(30),
    fcuserdate timestamp without time zone,
    fmuserid character varying(12),
    fmuserdate timestamp without time zone,
    fpositionno smallint
);


ALTER TABLE dbo.tblservicetype OWNER TO postgres;

--
-- Name: tblservicetypegroup; Type: TABLE; Schema: dbo; Owner: postgres
--

CREATE TABLE dbo.tblservicetypegroup (
    fcoid character varying(3) NOT NULL,
    fservicetypegroupid character varying(4) NOT NULL,
    fservicetypegroupname character varying(50),
    fpositionno smallint,
    fcuserid character varying(30),
    fcuserdate timestamp without time zone,
    fmuserid character varying(30),
    fmuserdate timestamp without time zone
);


ALTER TABLE dbo.tblservicetypegroup OWNER TO postgres;

--
-- Name: tblstaff; Type: TABLE; Schema: dbo; Owner: postgres
--

CREATE TABLE dbo.tblstaff (
    fcoid character varying(3) NOT NULL,
    fstaffid character varying(4) NOT NULL,
    fstaffname character varying(50),
    fispurchase boolean DEFAULT false NOT NULL,
    fissales boolean DEFAULT false NOT NULL,
    fcuserid character varying(30),
    fcuserdate timestamp without time zone,
    fmuserid character varying(30),
    fmuserdate timestamp without time zone
);


ALTER TABLE dbo.tblstaff OWNER TO postgres;

--
-- Name: tblticketsales; Type: TABLE; Schema: dbo; Owner: postgres
--

CREATE TABLE dbo.tblticketsales (
    fcoid character varying(3) NOT NULL,
    fyear character varying(4) DEFAULT '0'::character varying NOT NULL,
    fbrid character varying(3) NOT NULL,
    ftickettypeid character varying(4) NOT NULL,
    fticketslno character varying(12) NOT NULL,
    fslno smallint NOT NULL,
    frevno smallint NOT NULL,
    fservicetypegroupid character varying(4) NOT NULL,
    fiatacode character varying(8),
    fairlineno character varying(3),
    fticketno character varying(18),
    fdate timestamp without time zone,
    fbspdate timestamp without time zone,
    ftraveldate timestamp without time zone,
    fpnr character varying(10),
    fsupplierid character varying(12),
    fvoid boolean DEFAULT false,
    fpaxname character varying(100),
    fpaxtype character varying(1),
    fpaxid character varying(20),
    froute character varying(40),
    fdestid character varying(3),
    fclass character varying(8),
    fcarrier character varying(8),
    fstaffid character varying(4),
    freissue boolean DEFAULT false,
    forigtktno character varying(20),
    ftrip character varying(2),
    fiataamt numeric(18,2) DEFAULT 0,
    fsellingamt numeric(10,2) DEFAULT 0,
    ftaxamt numeric(18,2) DEFAULT 0,
    fcommper numeric(10,2) DEFAULT 0,
    fcommamt numeric(18,2) DEFAULT 0,
    fsupplieramtfc numeric(18,4) DEFAULT 0,
    fcurrency character varying(3),
    fcurrencyrate numeric(18,4),
    fsupplieramt numeric(10,2) DEFAULT 0,
    fkbamt integer DEFAULT 0,
    fpackage boolean DEFAULT false,
    fnote character varying(100),
    fairlinecode character varying(3),
    freported boolean DEFAULT false,
    ffilename character varying(50),
    fcnj boolean DEFAULT false,
    ftourcode character varying(15),
    fgdsid character varying(2),
    fccid character varying(8),
    forigin character varying(2) DEFAULT '0'::character varying,
    fuserid character varying(20),
    fuserdate timestamp without time zone,
    fhotelid character varying(4),
    fhotel character varying(80),
    faddress character varying(80),
    fphone character varying(50),
    fadults integer DEFAULT 0,
    fchilds integer DEFAULT 0,
    finfants integer DEFAULT 0,
    fcheckin timestamp without time zone,
    fcheckout timestamp without time zone,
    fnights smallint DEFAULT 0,
    froomtype character varying(10),
    froomqty smallint DEFAULT 0,
    fcityid character varying(4),
    fmealid character varying(4),
    fcountryid character varying(4),
    fservice1 character varying(80),
    fservice2 character varying(80),
    fsupplierref character varying(30),
    fpackageid character varying(5),
    fpost boolean DEFAULT false,
    fpostno character varying(15),
    fdi character varying(1),
    fgdsstaffid character varying(6),
    fdays integer DEFAULT 0,
    fnacarriercode character varying(2),
    fsob character varying(3),
    fsourcestaffid character varying(4),
    fdestdescription character varying(20),
    fcartypeid character varying(4),
    fdroppoint character varying(20),
    fpickpoint character varying(20),
    fpickuptime time without time zone,
    fflightno character varying(20),
    fbaggage character varying(2),
    ftourairlineid character varying(10),
    fdescription character varying(40),
    fposteddate timestamp without time zone,
    femail character varying(50),
    fmobileno character varying(20),
    ffarebasis character varying(8),
    fpvatamt numeric(18,2) DEFAULT 0,
    fbookingofficeid character varying(15),
    fprintingofficeid character varying(15),
    finvnote character varying(60),
    fempid character varying(10),
    fcommvatamt numeric(18,2) DEFAULT 0,
    fscommamt numeric(18,2) DEFAULT 0,
    famex boolean DEFAULT false,
    ffileseqno character varying(9),
    famexgendate timestamp without time zone,
    fmobile character varying(20),
    fnvtaxamt numeric(18,2) DEFAULT 0,
    fsupplieramtlcvat numeric(18,2) DEFAULT 0,
    fnationalityid character varying(4),
    fpaysupplierid character varying(12),
    freturndate timestamp without time zone,
    fiqamano character varying(20),
    fempno character varying(20),
    fcoamexcard boolean DEFAULT false,
    fcommtype character varying(2),
    fgroupid character varying(6),
    fcommvatreceived character varying(2),
    fcommamtexclvat numeric(18,2) DEFAULT 0,
    fcalccommvatamt numeric(18,2) DEFAULT 0,
    ffop character varying(10),
    ftourinvtype character varying(5),
    fsupplierinvno character varying(30),
    fsupplierinvdate timestamp without time zone,
    ftoursuppliername character varying(100),
    fkbaccountid character varying(12),
    fcopied boolean DEFAULT false,
    fistaffid character varying(4),
    fbgdsstaffid character varying(6),
    frevenueaccountid character varying(12),
    fhotelconfno character varying(20),
    fsupfee numeric(18,2) DEFAULT 0,
    fsupfeevatamt numeric(18,2) DEFAULT 0,
    fsupplieramtcc numeric(18,2) DEFAULT 0,
    fsupplieramtcash numeric(18,2) DEFAULT 0,
    fsupplieramtep numeric(18,2) DEFAULT 0,
    fmerchant character varying(4),
    fserviceid character varying(4),
    fserviceidsub character varying(4),
    fctacardtype character varying(4),
    fccno character varying(15),
    fcctype character varying(5),
    fmcexported boolean DEFAULT false,
    fcuserid character varying(30),
    fcuserdate timestamp without time zone,
    fmuserid character varying(30),
    fmuserdate timestamp without time zone
);


ALTER TABLE dbo.tblticketsales OWNER TO postgres;

--
-- Name: tblticketsalesb; Type: TABLE; Schema: dbo; Owner: postgres
--

CREATE TABLE dbo.tblticketsalesb (
    fcoid character varying(3) NOT NULL,
    fyear character varying(4) DEFAULT '0'::character varying NOT NULL,
    fbrid character varying(3) NOT NULL,
    ftickettypeid character varying(4) NOT NULL,
    fticketslno character varying(12) NOT NULL,
    fslno smallint NOT NULL,
    frevno smallint NOT NULL,
    fservicetypegroupid character varying(4) NOT NULL,
    fticketno character varying(18),
    fdate timestamp without time zone,
    fcustomerid character varying(12),
    fdivid character varying(4),
    fbusinesstypeid character varying(3),
    ftotfare numeric(18,2),
    ftaxamt numeric(18,2) DEFAULT 0,
    fh_agencycharge numeric(18,2) DEFAULT 0,
    fh_scvatamt numeric(18,2) DEFAULT 0,
    fh_agencychargewovat numeric(18,2) DEFAULT 0,
    fagencycharge numeric(18,2) DEFAULT 0,
    fscvatamt numeric(18,2) DEFAULT 0,
    fagencychargewovat numeric(18,2) DEFAULT 0,
    fvatamt numeric(18,2) DEFAULT 0,
    fbillingamt numeric(18,2) DEFAULT 0,
    finvoiced boolean DEFAULT false,
    finvtype character varying(5),
    finvno character varying(15),
    finvslno smallint DEFAULT 0,
    finvdate timestamp without time zone,
    finvfromdate timestamp without time zone,
    finvtodate timestamp without time zone,
    forigin character varying(2),
    freported boolean DEFAULT false,
    fvatper numeric(18,2) DEFAULT 0,
    finvdi character varying(1),
    ffileseqno character varying(9),
    fctafilegen boolean DEFAULT false,
    fctafilegendate timestamp without time zone,
    finvdatetime timestamp without time zone,
    fmergetoinvslno smallint DEFAULT 0,
    finvmergeuserid character varying(30),
    finvmergeuserdate timestamp without time zone,
    fservicechargetype character varying(2),
    fservicechargeper numeric(18,2) DEFAULT 0,
    finvrcnnote character varying(100),
    finvuserid character varying(30),
    fzatcacleared boolean DEFAULT false,
    fdatabeforezatca boolean DEFAULT false,
    finvoicetox character varying(80),
    fvatnox character varying(15),
    fmf numeric(18,2),
    fmfwovat numeric(18,2) DEFAULT 0,
    fmfvatamt numeric(18,2) DEFAULT 0,
    frefno character varying(30),
    frefno1 character varying(30),
    frefno2 character varying(30),
    frefno3 character varying(30),
    frefno4 character varying(30),
    finvmethod character varying(5),
    fcuserid character varying(30),
    fcuserdate timestamp without time zone,
    fmuserid character varying(30),
    fmuserdate timestamp without time zone
);


ALTER TABLE dbo.tblticketsalesb OWNER TO postgres;

--
-- Name: tblticketsalescnj; Type: TABLE; Schema: dbo; Owner: postgres
--

CREATE TABLE dbo.tblticketsalescnj (
    fcoid character varying(3) NOT NULL,
    fyear character varying(4) NOT NULL,
    fbrid character varying(3) NOT NULL,
    ftickettypeid character varying(4) NOT NULL,
    ftktslno character varying(12) NOT NULL,
    fslno smallint NOT NULL,
    frevno smallint NOT NULL,
    fcnjtktslno character varying(12) NOT NULL,
    fcnjtktno character varying(20),
    fservicetypegroupid character varying(4) NOT NULL,
    froute character varying(19),
    fcustroute character varying(19),
    fclass character varying(8),
    fcustclass character varying(8),
    fcarrier character varying(8),
    finvslno integer,
    ffileseqno character varying(9),
    ftransid character varying(20),
    fmergetoinvslno smallint
);


ALTER TABLE dbo.tblticketsalescnj OWNER TO postgres;

--
-- Name: tbltickettype; Type: TABLE; Schema: dbo; Owner: postgres
--

CREATE TABLE dbo.tbltickettype (
    fcoid character varying(3) NOT NULL,
    ftickettypeid character varying(4) NOT NULL,
    ftickttypename character varying(30),
    fservicetypegroupid character varying(4),
    fpositionno smallint,
    fcuserid character varying(30),
    fcuserdate timestamp without time zone,
    fmuserid character varying(30),
    fmuserdate timestamp without time zone
);


ALTER TABLE dbo.tbltickettype OWNER TO postgres;

--
-- Name: tbltlparam; Type: TABLE; Schema: dbo; Owner: postgres
--

CREATE TABLE dbo.tbltlparam (
    fptype character varying(6) NOT NULL,
    fpositionno smallint DEFAULT 0 NOT NULL,
    fpid character varying(4) NOT NULL,
    fpname character varying(40),
    fuserid character varying(20),
    fuserdate timestamp without time zone
);


ALTER TABLE dbo.tbltlparam OWNER TO postgres;

--
-- Name: tbluseraudit; Type: TABLE; Schema: dbo; Owner: postgres
--

CREATE TABLE dbo.tbluseraudit (
    fid bigint NOT NULL,
    fcoid character varying(3) NOT NULL,
    fyear character varying(4),
    fbrid character varying(3),
    fdoctype character varying(4),
    fscreenname character varying(100),
    fscreenkey character varying(50),
    faction character varying(1),
    fnote text,
    fuserid character varying(30),
    fuserdate timestamp without time zone
);


ALTER TABLE dbo.tbluseraudit OWNER TO postgres;

--
-- Name: tbluseraudit_fid_seq; Type: SEQUENCE; Schema: dbo; Owner: postgres
--

ALTER TABLE dbo.tbluseraudit ALTER COLUMN fid ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME dbo.tbluseraudit_fid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: tbluserlogin; Type: TABLE; Schema: dbo; Owner: postgres
--

CREATE TABLE dbo.tbluserlogin (
    fcoid character varying(3) NOT NULL,
    fuserid character varying(30) NOT NULL,
    fusername character varying(60),
    fuserpwd character varying(100),
    fusertype character varying(2),
    fuserstatus character varying(1),
    fdatevalidity smallint
);


ALTER TABLE dbo.tbluserlogin OWNER TO postgres;

--
-- Name: tblusersession; Type: TABLE; Schema: dbo; Owner: postgres
--

CREATE TABLE dbo.tblusersession (
    fsessionid integer NOT NULL,
    fuserid character varying(100) NOT NULL,
    fsessiontoken uuid NOT NULL,
    fcreatedat timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    flastactivity timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fbranchid character varying(3),
    fexpiresat timestamp with time zone DEFAULT (now() + '24:00:00'::interval) NOT NULL,
    fcoid character varying(10)
);


ALTER TABLE dbo.tblusersession OWNER TO postgres;

--
-- Name: tblusersession_fsessionid_seq; Type: SEQUENCE; Schema: dbo; Owner: postgres
--

CREATE SEQUENCE dbo.tblusersession_fsessionid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE dbo.tblusersession_fsessionid_seq OWNER TO postgres;

--
-- Name: tblusersession_fsessionid_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: postgres
--

ALTER SEQUENCE dbo.tblusersession_fsessionid_seq OWNED BY dbo.tblusersession.fsessionid;


--
-- Name: tblvatsetting; Type: TABLE; Schema: dbo; Owner: postgres
--

CREATE TABLE dbo.tblvatsetting (
    fcoid character varying(3) NOT NULL,
    fslno smallint DEFAULT 0 NOT NULL,
    fservicetypeid character varying(4) NOT NULL,
    fvatper numeric(18,2) DEFAULT 0,
    fuserid character varying(20),
    fuserdate timestamp without time zone,
    fprevvatper numeric(18,2) DEFAULT 0,
    fprevvatdate timestamp without time zone
);


ALTER TABLE dbo.tblvatsetting OWNER TO postgres;

--
-- Name: tblyear; Type: TABLE; Schema: dbo; Owner: postgres
--

CREATE TABLE dbo.tblyear (
    fcoid character varying(3) NOT NULL,
    fyear smallint NOT NULL,
    fbrid character varying(3) NOT NULL,
    fyearclosestatusid character varying(2),
    fyearclosestatus character varying(20) DEFAULT 'Opened'::character varying,
    fcuserid character varying(30),
    fcuserdate timestamp without time zone,
    fmuserid character varying(30),
    fmuserdate date
);


ALTER TABLE dbo.tblyear OWNER TO postgres;

--
-- Name: tblusersession fsessionid; Type: DEFAULT; Schema: dbo; Owner: postgres
--

ALTER TABLE ONLY dbo.tblusersession ALTER COLUMN fsessionid SET DEFAULT nextval('dbo.tblusersession_fsessionid_seq'::regclass);


--
-- Data for Name: tblaccount; Type: TABLE DATA; Schema: dbo; Owner: postgres
--

COPY dbo.tblaccount (fcoid, faccountid, fgph, fgcs, faccountname, faccountname_ar, faccountname_legal_ar, facccountname_short, faccountgroupid, faccounttypeid, faccountlevel, fhavedivision, fhavecc, fstatus, fstatusreason, foldaccountid, ferpaccountid, ftitle, fcuserid, fcuserdate, fmuserid, fmuserdate) FROM stdin;
\.


--
-- Data for Name: tblaccountcs; Type: TABLE DATA; Schema: dbo; Owner: postgres
--

COPY dbo.tblaccountcs (fcoid, fcsaccountid, fcsaccountname, fcs, fcsdet, fcsaccountname_leagal, fcsaccountname_short, fcstype, fgaccountid, fbussinesstype, fbuildingno, fstreetname, fdistrict, fcity, fcountryid, fpostalcode, fadditionalno, fcrno, fvatno, faccountname_ar, fleagalaccountname_ar, fbuildingno_ar, fstreetname_a, fdistrict_ar, fcity_ar, fcountryid_ar, fpostalcode_ar, fadditionalno_ar, fcrno_ar, fvatno_ar, fcontact, fphone, femail, fhavedivision, fbrid, fcreditlimit, fcreditdays, fstatus, fstatusreason, ftitle, fintercompany, fexcludefromageing, fctacardtype, fctacardno, fshortctacardno, fctaexpiry, fcuserid, fcuserdate, fmuserid, fmuserdate, fstaffid, fcalcsupfeevat, fisservicechargepolicy) FROM stdin;
01	60005	Vishnu	C	100	Vishnu		\N	1104001	B2B	111	Kottayam	Kottayam	Kottayam	IN	777777		111		فيشنو	فيشنو	١١١	كوتّايام	كوتّايام	كوتّايام	IN	٧٧٧٧٧٧		١١١					f	\N	0	0	f	\N	\N	f	f	\N	\N	\N	\N	ADMIN	2026-10-12 12:06:51.147	ADMIN	2026-10-12 13:04:50.982	\N	\N	\N
01	60004	Ramees	C	100	Ramees		\N	1104001	B2C	3444	Kottayam	Kottayam	Kottayam	IN	686509		3444		راميس	راميس	٣٤٤٤	كوتّايام	كوتّايام	كوتّايام	IN	٦٨٦٥٠٩		٣٣٤٤					t	\N	0	0	f	\N	\N	f	f	\N	\N	\N	\N	ADMIN	2026-10-12 11:15:46.88	ADMIN	2026-10-12 13:05:23.132	\N	\N	\N
01	70000	supplier1	S	010	Supplier1	\N	\N	2101000	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	0	0	f	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
01	60006	ALRAJHI TRAVELS	C	100	ALRAJHI TRAVELS	ALRAJHi	\N	1104001	B2B	9849	AL RASHID ST.	DAMMAM	DAMMAM	SA	94890	4999	94894883993884888489	995998499999999	ALRAJHI TRAVELS	AJRAJHI Travels	9489	ALRSAHID ST.	DAMMAM	DMMAM	SA	94899	9949	99490309949900499993	994885999483999	Gargsh	903890020940	dkk@gmail.com	t	JD	900000	50	f	\N	\N	f	f	\N	\N	\N	\N	ADMIN	2026-10-14 14:23:40.652	ADMIN	2026-10-23 09:53:34.342	\N	\N	\N
01	60007	SIEMENS CORP	C	100	SIEMENS CORP	SC	\N	1104001	B2B	7899	UM STREET	DAAMAN	JEDDAH	SA	78888	9999	01234567891234567890	232323232323236	فيشنو	تيست كست	3385	4444	كوتّايام	كوتّايام	SA	23423	8949	5544444666	444444444444444	Abdul			f	JD	850000	50	f	\N	\N	f	f	\N	\N	\N	\N	ADMIN	2026-10-23 09:54:56.984	\N	\N	\N	\N	\N
01	60008	testtt	C	100	testtt		\N	1104001	B2B	122	safdsa	sdsa	zxcxzc	IN	68650			12345678999	اسم العميل	اسم العميل	122	اسم العميل	اسم العميل		SA				12345678999				t	\N	0	0	f	\N	\N	f	f	\N	\N	\N	\N	ADMIN	2026-11-05 11:27:57.128	\N	\N	\N	\N	\N
01	70001	Amadeus GDS	S	010	Amadeus GDS	\N	\N	2101000	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	0	0	f	\N	\N	f	f	\N	\N	\N	\N	ADMIN	2026-11-06 15:52:26.387	\N	\N	\N	\N	\N
01	70002	Sabre GDS	S	010	Sabre GDS	\N	\N	2101000	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	0	0	f	\N	\N	f	f	\N	\N	\N	\N	ADMIN	2026-11-06 15:52:26.397	\N	\N	\N	\N	\N
01	70003	IATA BSP	S	010	IATA BSP	\N	\N	2101000	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	0	0	f	\N	\N	f	f	\N	\N	\N	\N	ADMIN	2026-11-06 15:52:26.398	\N	\N	\N	\N	\N
01	70004	Saudi Airlines	S	010	Saudi Airlines	\N	\N	2101000	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	0	0	f	\N	\N	f	f	\N	\N	\N	\N	ADMIN	2026-11-06 15:52:26.399	\N	\N	\N	\N	\N
01	60002	testCustomer	S	100	testCustomer		\N	1104001	B2B	4433	street	street	kottayam	IND	22222	2222	33442222222222222222		تيست كست	تيست كست	2222	شارع	شارع	كوتايام	IND	22222	2222	22222222222222222222					f	\N	0	0	f	\N	\N	f	f	\N	\N	\N	\N	ADMIN	2026-10-05 11:02:44.516	ADMIN	2026-10-14 14:15:56.524	\N	\N	t
01	60003	Jishnu	C	100	Jishnu		\N	1104001	B2B	4444	Mundakkayam	Kottayam	Mundakkayam	IN	686509		4444		جِشْنُو	جِشْنُو	٤٤٤٤	مُنْدَكَّيَم	كوتّايام	مُنْدَكَّيَم	IN	٦٨٦٥٠٩		٤٤٤٤					f	\N	0	0	f	\N	\N	f	f	\N	\N	\N	\N	ADMIN	2026-10-10 12:08:57.498	ADMIN	2026-10-12 13:04:58.725	\N	\N	t
\.


--
-- Data for Name: tblairline; Type: TABLE DATA; Schema: dbo; Owner: postgres
--

COPY dbo.tblairline (fcoid, fairlineno, fairlinename, fairlinecode, fvatoncommission, fcuserid, fcuserdate, fmuserid, fmuserdate) FROM stdin;
01	065	Saudi Airlines	SV	\N	\N	\N	\N	\N
01	072	Gulf Air	GF	\N	\N	\N	\N	\N
01	098	Air India	AI	\N	\N	\N	\N	\N
\.


--
-- Data for Name: tblbranch; Type: TABLE DATA; Schema: dbo; Owner: postgres
--

COPY dbo.tblbranch (fcoid, fbrid, fbrname, fiata, fiatacode, fbspaccountid, fcaccountid, fbaccountid, fpaccountid, fccaccountid, factivefromdate, factivetodate, fneedyearclose, fpositionno, fcustadvanceaccountid, flocalserverpath, fcomputerid, fbrautobossupdates, fbuildingno, fstreetname, fdistrict, fcity, fcountry, fpostalcode, fadditionalno, fcrno, fbuildingno_a, fstreetname_a, fdistrict_a, fcity_a, fcountry_a, fpostalcode_a, fadditionalno_a, fcrno_a, fbrname_a, ftourismlicenseno, ftourismlicenseno_a, fcategory, fcategory_a, ftelephone, ftelephone_a, fho, fbrtype, faddress1, faddress2, faddress3, femail, fuserid, fuserdate, fmuserid, fmuserdate) FROM stdin;
01	JD	JEDDAH	f	\N	\N	\N	\N	\N	\N	\N	\N	f	1	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	ADMIN	2026-11-06 10:44:09.743	\N	\N
01	RY	RIYADH	f	\N	\N	\N	\N	\N	\N	\N	\N	f	2	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	ADMIN	2026-11-06 10:44:09.743	\N	\N
\.


--
-- Data for Name: tblcompany; Type: TABLE DATA; Schema: dbo; Owner: postgres
--

COPY dbo.tblcompany (fcoid, fconame, fconame_ar, fconame_qr, fconame_short, fcoaddress1, fcoaddress2, fcoaddress3, fcoaddress4, fcoaddress1_ar, fcoaddress2_ar, fcoaddress3_ar, fcoaddress4_ar, fcovatno, fcovatno_ar, fpiexpenseaccountgroup, fbg2arap, fycmethod, flslno, fcuserid, fcuserdate, fmuserid, fmuserdate, fpositionno, fcostatus, fcommvatper) FROM stdin;
01	Travel max	نَسَب	QR	TM	Al Rashidiya, Dubai	Al Rashidiya, Near Metro Station	Dubai, United Arab Emirates	P.O. Box 12345, Dubai Tel: +971 4 123 4567	الراشدية، دبي                                                                   	الراشدية، بالقرب من محطة المترو                                                 	دبي، الإمارات العربية المتحدة                                                   	هاتف: ‎+٩٧١ ٤ ١٢٣ ٤٥٦٧ ص.ب ١٢٣٤٥، دبي	12232324355555	١٢٣٤٥٦٧٨٩٠	\N	\N	\N	\N	\N	\N	ADMIN	2026-09-23 15:37:37.248	1	A	15.00
02	game hub	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2	A	15.00
\.


--
-- Data for Name: tblcustdivision; Type: TABLE DATA; Schema: dbo; Owner: postgres
--

COPY dbo.tblcustdivision (fcoid, fcustomerid, fdivid, fdivname, fdivname_ar, fcuserid, fcuserdate, fmuserid, fmuserdate) FROM stdin;
01	60001	01	Div 01-60001	\N	\N	\N	\N	\N
01	60001	02	Div 02-60001	\N	\N	\N	\N	\N
01	60002	01	Div 01-60002	\N	\N	\N	\N	\N
\.


--
-- Data for Name: tblfop; Type: TABLE DATA; Schema: dbo; Owner: postgres
--

COPY dbo.tblfop (fcoid, ffop, fpositionno, fcuserid, fcuserdate, fmuserid, fmuserdate, ffopname) FROM stdin;
01	CASH	1	\N	\N	\N	\N	Cash
01	CASH+CC	4	\N	\N	\N	\N	Cash + Credit Card
01	CC	3	\N	\N	\N	\N	Credit Card
01	INV	2	\N	\N	\N	\N	Invoice
\.


--
-- Data for Name: tblgds; Type: TABLE DATA; Schema: dbo; Owner: postgres
--

COPY dbo.tblgds (fcoid, fgdsid, fgdsname, firid, firpath, factive, fpositionno, fcuserid, fcuserdate, fmuserid, fmuserdate) FROM stdin;
01	AM	Amadeus	\N	\N	t	1	ADMIN	2026-11-07 09:26:31.845388	\N	\N
01	SB	Sabre	\N	\N	t	2	ADMIN	2026-11-07 09:26:31.845388	\N	\N
01	GL	Galileo	\N	\N	t	3	ADMIN	2026-11-07 09:26:31.845388	\N	\N
01	WS	Worldspan	\N	\N	f	4	ADMIN	2026-11-07 09:26:31.845388	\N	\N
\.


--
-- Data for Name: tbliata; Type: TABLE DATA; Schema: dbo; Owner: postgres
--

COPY dbo.tbliata (fcoid, fiatacode, fiataname, fbsppurchase_csaccountid, fvoidsales_csaccountid, fpaxccsales_csaccountid, fcashsales_csaccountid, fpositionno, fcuserid, fcuserdate, fmuserid, fmuserdate) FROM stdin;
01	71202088	Jeddah	\N	\N	\N	\N	\N	\N	\N	\N	\N
01	71303088	Riyadh	\N	\N	\N	\N	\N	\N	\N	\N	\N
01	NA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: tblmenu; Type: TABLE DATA; Schema: dbo; Owner: postgres
--

COPY dbo.tblmenu (fmenuid, fmenuname, fmenucaption, fmenubuttons) FROM stdin;
\.


--
-- Data for Name: tblservicechargepolicy; Type: TABLE DATA; Schema: dbo; Owner: postgres
--

COPY dbo.tblservicechargepolicy (fcoid, fsr, fcustomerid, fservicetypeid, fdivid, fservicetypegroupid, fmf, fctacarriercode, fd_servicechargetype, fd_servicechgper, fd_minservicechgamt, fd_servicechgamt, fi_servicechargetype, fi_servicechgper, fi_minservicechgamt, fi_servicechgamt, fcuserid, fcuserdate, fmuserid, fmuserdate) FROM stdin;
01	S	60002	TKT	01	TKT	0.00	\N	P	5.00	10.00	0.00	A	0.00	0.00	25.00	ADMIN	2026-11-07 15:52:56.835084	\N	\N
01	S	60003	TKT		TKT	0.00	\N	P	20.00	5.00	0.00	A	0.00	0.00	20.00	ADMIN	2026-11-09 11:49:37.05002	\N	\N
\.


--
-- Data for Name: tblservicetype; Type: TABLE DATA; Schema: dbo; Owner: postgres
--

COPY dbo.tblservicetype (fcoid, fservicetypeid, fservicetypegroupid, fservicetypename, fctacarriercode, fcuserid, fcuserdate, fmuserid, fmuserdate, fpositionno) FROM stdin;
01	CAR	OS	Car Rental	\N	\N	\N	\N	\N	21
01	FER	OS	Ferries	\N	\N	\N	\N	\N	25
01	HTL	HTL	Hotel	\N	\N	\N	\N	\N	11
01	IDL	OS	Intl Driving License	\N	\N	\N	\N	\N	24
01	LIM	OS	Limosine	\N	\N	\N	\N	\N	22
01	M&G	OS	Meet & Greet	\N	\N	\N	\N	\N	23
01	RAIL	OS	Rail Ticket	\N	\N	\N	\N	\N	26
01	REI	TKT	Re-Issue	\N	\N	\N	\N	\N	2
01	TKT	TKT	Air Ticket	\N	\N	\N	\N	\N	1
01	TOUR	OS	TOUR	\N	\N	\N	\N	\N	29
01	TRP	OS	Transportation	\N	\N	\N	\N	\N	27
01	VI	OS	Vissa	\N	\N	\N	\N	\N	28
01	VOID	TKT	Void	\N	\N	\N	\N	\N	3
\.


--
-- Data for Name: tblservicetypegroup; Type: TABLE DATA; Schema: dbo; Owner: postgres
--

COPY dbo.tblservicetypegroup (fcoid, fservicetypegroupid, fservicetypegroupname, fpositionno, fcuserid, fcuserdate, fmuserid, fmuserdate) FROM stdin;
01	HTL	Accomodation	2	\N	\N	\N	\N
01	OS	Other Service	3	\N	\N	\N	\N
01	TKT	Air Ticket	1	\N	\N	\N	\N
\.


--
-- Data for Name: tblstaff; Type: TABLE DATA; Schema: dbo; Owner: postgres
--

COPY dbo.tblstaff (fcoid, fstaffid, fstaffname, fispurchase, fissales, fcuserid, fcuserdate, fmuserid, fmuserdate) FROM stdin;
01	0001	Ahmed Al Harbi	t	f	ADMIN	2026-10-10 14:15:24.87	\N	\N
01	0002	Khalid Al Otaibi	f	t	ADMIN	2026-10-10 14:15:24.87	\N	\N
01	0003	Sara Mohammed	t	t	ADMIN	2026-10-10 14:15:24.87	\N	\N
01	0004	Rahul Nair	f	f	ADMIN	2026-10-10 14:15:24.87	\N	\N
01	0005	Ahmed Jaffar	t	t	ADMIN	2026-10-10 14:24:42.064	\N	\N
01	0006	Kiran Methan	t	f	ADMIN	2026-10-10 14:27:56.056	\N	\N
01	0007	Ahmed Rahman	f	t	ADMIN	2026-10-10 14:27:56.056	\N	\N
01	0008	John Davis	t	f	ADMIN	2026-10-10 14:27:56.056	\N	\N
01	0009	Joby Thomas	f	t	ADMIN	2026-10-10 14:27:56.056	\N	\N
01	0010	Faiz Muhmmed	t	t	ADMIN	2026-10-10 14:27:56.056	\N	\N
01	0011	Fahd Dan	t	f	ADMIN	2026-10-10 14:27:56.056	\N	\N
01	0012	Joseph George	t	f	ADMIN	2026-10-10 14:27:56.056	\N	\N
01	0013	Hahima Lada	f	t	ADMIN	2026-10-10 14:27:56.056	\N	\N
\.


--
-- Data for Name: tblticketsales; Type: TABLE DATA; Schema: dbo; Owner: postgres
--

COPY dbo.tblticketsales (fcoid, fyear, fbrid, ftickettypeid, fticketslno, fslno, frevno, fservicetypegroupid, fiatacode, fairlineno, fticketno, fdate, fbspdate, ftraveldate, fpnr, fsupplierid, fvoid, fpaxname, fpaxtype, fpaxid, froute, fdestid, fclass, fcarrier, fstaffid, freissue, forigtktno, ftrip, fiataamt, fsellingamt, ftaxamt, fcommper, fcommamt, fsupplieramtfc, fcurrency, fcurrencyrate, fsupplieramt, fkbamt, fpackage, fnote, fairlinecode, freported, ffilename, fcnj, ftourcode, fgdsid, fccid, forigin, fuserid, fuserdate, fhotelid, fhotel, faddress, fphone, fadults, fchilds, finfants, fcheckin, fcheckout, fnights, froomtype, froomqty, fcityid, fmealid, fcountryid, fservice1, fservice2, fsupplierref, fpackageid, fpost, fpostno, fdi, fgdsstaffid, fdays, fnacarriercode, fsob, fsourcestaffid, fdestdescription, fcartypeid, fdroppoint, fpickpoint, fpickuptime, fflightno, fbaggage, ftourairlineid, fdescription, fposteddate, femail, fmobileno, ffarebasis, fpvatamt, fbookingofficeid, fprintingofficeid, finvnote, fempid, fcommvatamt, fscommamt, famex, ffileseqno, famexgendate, fmobile, fnvtaxamt, fsupplieramtlcvat, fnationalityid, fpaysupplierid, freturndate, fiqamano, fempno, fcoamexcard, fcommtype, fgroupid, fcommvatreceived, fcommamtexclvat, fcalccommvatamt, ffop, ftourinvtype, fsupplierinvno, fsupplierinvdate, ftoursuppliername, fkbaccountid, fcopied, fistaffid, fbgdsstaffid, frevenueaccountid, fhotelconfno, fsupfee, fsupfeevatamt, fsupplieramtcc, fsupplieramtcash, fsupplieramtep, fmerchant, fserviceid, fserviceidsub, fctacardtype, fccno, fcctype, fmcexported, fcuserid, fcuserdate, fmuserid, fmuserdate) FROM stdin;
01	2026	JD	B	12345679	1	1	TKT	71202088	065	\N	2026-11-11 00:00:00	2026-11-11 00:00:00	2026-11-12 00:00:00	teat	60002	f	test	A	\N	cok jed	BHA	B	test	0001	f	\N	OW	1000.00	1000.00	100.00	0.00	0.00	0.0000	\N	\N	1265.00	0	f	\N	SV	f	\N	f	\N	AM	\N	0	ADMIN	2026-11-11 11:00:19.396898	\N	\N	\N	\N	0	0	0	\N	\N	0	\N	0	\N	\N	\N	\N	\N	\N	\N	f	\N	D	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	sreerenjini1000@gmail.com	97888888888	\N	165.00	\N	\N	\N	\N	0.00	0.00	f	\N	\N	\N	0.00	0.00	\N	60002	\N	\N	\N	f	P	\N	\N	0.00	0.00	CASH	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	0.00	0.00	0.00	120.00	0.00	NA	TKT	\N	\N	\N	NA	f	ADMIN	2026-11-11 11:00:19.396898	\N	\N
01	2026	JD	B	4444444444	2	1	TKT	71202088	065	\N	2026-11-12 00:00:00	2026-11-12 00:00:00	2026-11-20 00:00:00	12345	60002	f	samarjith k r	A	12345678	COK BEH	BHA	Y	test	0001	f	\N	OW	1000.00	1000.00	100.00	0.00	0.00	0.0000	\N	\N	1100.00	0	f	test	SV	f	\N	t	\N	AM	\N	0	ADMIN	2026-11-12 13:45:57.678265	\N	\N	\N	\N	0	0	0	\N	\N	0	\N	0	\N	\N	\N	\N	\N	\N	\N	f	\N	I	0001	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	sreerenjini1000@gmail.com	97888888888	\N	0.00	\N	\N	111	\N	0.00	0.00	f	\N	\N	\N	0.00	0.00	\N	60002	\N	\N	\N	f	P	\N	\N	0.00	0.00	CASH	\N	\N	\N	\N	\N	f	\N	0001	\N	\N	0.00	0.00	0.00	2000.00	0.00	NA	TKT	\N	\N	\N	NA	f	ADMIN	2026-11-12 13:45:57.678265	ADMIN	2026-11-12 13:48:10.663694
01	2026	JD	B	1234567890	1	1	TKT	71202088	065	\N	2026-11-11 00:00:00	2026-11-12 00:00:00	2026-11-11 00:00:00	12345	70000	f	Sreerenjini Renjith	A	\N	COK BEH	BHA	Y	test	0002	f	\N	OW	1000.00	1000.00	0.00	0.00	0.00	0.0000	\N	\N	1010.00	10	f	\N	SV	f	\N	f	\N	SB	\N	0	ADMIN	2026-11-11 15:24:43.0709	\N	\N	\N	\N	0	0	0	\N	\N	0	\N	0	\N	\N	\N	\N	\N	\N	\N	f	\N	D	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	sreerenjini1000@gmail.com	97888888888	\N	10.00	\N	\N	1111	\N	0.00	0.00	f	\N	\N	\N	0.00	0.00	\N	70000	\N	\N	\N	f	P	\N	\N	0.00	0.00	CASH	\N	\N	\N	\N	KB1	f	\N	\N	\N	\N	0.00	0.00	0.00	2000.00	0.00	NA	TKT	\N	\N	\N	NA	f	ADMIN	2026-11-11 15:24:43.0709	ADMIN	2026-11-12 09:19:07.304354
01	2026	JD	B	1111111111	2	1	TKT	71202088	065	\N	2026-11-11 00:00:00	2026-11-12 00:00:00	2026-11-21 00:00:00	123456	60002	f	Sreerenjini Renjith  k	A	123	COK BEH	\N	\N	\N	0001	f	\N	OW	1220.00	1220.00	100.00	0.00	0.00	0.0000	\N	\N	1320.00	0	f	\N	SV	f	\N	f	\N	AM	\N	0	ADMIN	2026-11-12 11:13:56.817894	\N	\N	\N	\N	0	0	0	\N	\N	0	\N	0	\N	\N	\N	\N	\N	\N	\N	f	\N	I	1222	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	sreerenjini1000@gmail.com	97888888888	\N	0.00	\N	\N	\N	\N	0.00	0.00	f	\N	\N	\N	0.00	0.00	\N	60002	\N	\N	\N	f	P	\N	\N	0.00	0.00	CASH	\N	\N	\N	\N	\N	f	\N	122	\N	\N	0.00	0.00	0.00	0.00	0.00	NA	TKT	\N	\N	\N	NA	f	ADMIN	2026-11-12 11:13:56.817894	ADMIN	2026-11-12 11:16:31.035427
01	2026	JD	B	3333333333	1	1	TKT	71202088	065	\N	2026-11-12 00:00:00	2026-11-12 00:00:00	2026-11-12 00:00:00	12345	60002	f	Sreerenjini Renjith	A	\N	COK BEH	BHA	Y	test	0001	f	\N	OW	2000.00	2000.00	110.00	0.00	0.00	0.0000	\N	\N	2120.00	0	f	\N	SV	f	\N	f	\N	AM	\N	0	ADMIN	2026-11-12 14:02:27.235147	\N	\N	\N	\N	0	0	0	\N	\N	0	\N	0	\N	\N	\N	\N	\N	\N	\N	f	\N	D	0001	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	sreerenjini1000@gmail.com	97888888888	\N	10.00	\N	\N	\N	\N	0.00	0.00	f	\N	\N	\N	0.00	0.00	\N	60002	\N	\N	\N	f	P	\N	\N	0.00	0.00	CASH	\N	\N	\N	\N	\N	f	\N	0001	\N	\N	0.00	0.00	0.00	12340.00	0.00	NA	TKT	\N	\N	\N	NA	f	ADMIN	2026-11-12 14:02:27.235147	\N	\N
01	2026	JD	B	2222222222	1	1	TKT	71202088	065	\N	2026-11-12 00:00:00	2026-11-12 00:00:00	2026-11-14 00:00:00	12345	60002	f	Sreerenjini Renjith	A	1234	COK BEH	\N	Y	\N	0001	f	\N	OW	1220.00	1220.00	110.00	0.00	0.00	0.0000	\N	\N	1330.00	0	f	\N	SV	f	\N	t	\N	AM	\N	0	ADMIN	2026-11-12 11:58:36.872898	\N	\N	\N	\N	0	0	0	\N	\N	0	\N	0	\N	\N	\N	\N	\N	\N	\N	f	\N	I	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0.00	\N	\N	\N	\N	0.00	0.00	f	\N	\N	\N	0.00	0.00	\N	60002	\N	\N	\N	f	P	\N	\N	0.00	0.00	CASH	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	0.00	0.00	0.00	0.00	0.00	NA	TKT	\N	\N	\N	NA	f	ADMIN	2026-11-12 11:58:36.872898	ADMIN	2026-11-12 12:08:25.465668
01	2026	JD	B	1111111111	1	1	TKT	71202088	065	\N	2026-11-11 00:00:00	2026-11-12 00:00:00	2026-11-21 00:00:00	123456	60002	f	Sreerenjini Renjith	A	123	COK BEH	\N	\N	\N	0001	f	\N	OW	1220.00	1220.00	100.00	0.00	0.00	0.0000	\N	\N	1320.00	0	f	\N	SV	f	\N	t	\N	AM	\N	0	ADMIN	2026-11-12 09:33:49.950569	\N	\N	\N	\N	0	0	0	\N	\N	0	\N	0	\N	\N	\N	\N	\N	\N	\N	f	\N	I	1222	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	sreerenjini1000@gmail.com	97888888888	\N	0.00	\N	\N	\N	\N	0.00	0.00	f	\N	\N	\N	0.00	0.00	\N	60002	\N	\N	\N	f	P	\N	\N	0.00	0.00	CASH	\N	\N	\N	\N	\N	f	\N	122	\N	\N	0.00	0.00	0.00	0.00	0.00	NA	TKT	\N	\N	\N	NA	f	ADMIN	2026-11-12 09:33:49.950569	ADMIN	2026-11-12 12:56:54.884129
01	2026	JD	B	4444444444	1	1	TKT	71202088	065	\N	2026-11-12 00:00:00	2026-11-12 00:00:00	2026-11-20 00:00:00	12345	60002	f	samarjith k r	A	12345678	COK BEH	BHA	Y	test	0001	f	\N	OW	1000.00	1000.00	100.00	0.00	0.00	0.0000	\N	\N	1100.00	0	f	test	SV	f	\N	f	\N	AM	\N	0	ADMIN	2026-11-12 13:45:31.103513	\N	\N	\N	\N	0	0	0	\N	\N	0	\N	0	\N	\N	\N	\N	\N	\N	\N	f	\N	I	0001	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	sreerenjini1000@gmail.com	97888888888	\N	0.00	\N	\N	111	\N	0.00	0.00	f	\N	\N	\N	0.00	0.00	\N	60002	\N	\N	\N	f	P	\N	\N	0.00	0.00	CASH	\N	\N	\N	\N	\N	f	\N	0001	\N	\N	0.00	0.00	0.00	2000.00	0.00	NA	TKT	\N	\N	\N	NA	f	ADMIN	2026-11-12 13:45:31.103513	\N	\N
\.


--
-- Data for Name: tblticketsalesb; Type: TABLE DATA; Schema: dbo; Owner: postgres
--

COPY dbo.tblticketsalesb (fcoid, fyear, fbrid, ftickettypeid, fticketslno, fslno, frevno, fservicetypegroupid, fticketno, fdate, fcustomerid, fdivid, fbusinesstypeid, ftotfare, ftaxamt, fh_agencycharge, fh_scvatamt, fh_agencychargewovat, fagencycharge, fscvatamt, fagencychargewovat, fvatamt, fbillingamt, finvoiced, finvtype, finvno, finvslno, finvdate, finvfromdate, finvtodate, forigin, freported, fvatper, finvdi, ffileseqno, fctafilegen, fctafilegendate, finvdatetime, fmergetoinvslno, finvmergeuserid, finvmergeuserdate, fservicechargetype, fservicechargeper, finvrcnnote, finvuserid, fzatcacleared, fdatabeforezatca, finvoicetox, fvatnox, fmf, fmfwovat, fmfvatamt, frefno, frefno1, frefno2, frefno3, frefno4, finvmethod, fcuserid, fcuserdate, fmuserid, fmuserdate) FROM stdin;
01	2026	JD	B	12345679	1	1	TKT	\N	2026-11-11 00:00:00	60003	\N	B2B	1000.00	100.00	34.78	5.22	0.00	40.00	6.00	0.00	171.00	1351.00	f	\N	\N	0	\N	\N	\N	\N	f	15.00	\N	\N	f	\N	\N	0	\N	\N	P	20.00	\N	\N	f	f	\N	\N	0.00	0.00	0.00	\N	\N	\N	\N	\N	\N	ADMIN	2026-11-11 11:00:19.396898	\N	\N
01	2026	JD	B	1234567890	1	1	TKT	\N	2026-11-11 00:00:00	60004	\N	B2C	1000.00	0.00	8.70	1.30	0.00	10.00	1.50	0.00	151.50	1171.50	f	\N	\N	0	\N	\N	\N	\N	f	15.00	\N	\N	f	\N	\N	0	\N	\N	\N	0.00	\N	\N	f	f	\N	\N	0.00	0.00	0.00	1111	\N	111	111	1111	\N	ADMIN	2026-11-11 15:24:43.0709	ADMIN	2026-11-12 09:19:07.304354
01	2026	JD	B	2222222222	1	1	TKT	\N	2026-11-12 00:00:00	60003	\N	B2B	1220.00	110.00	0.00	0.00	0.00	20.00	3.00	0.00	3.00	1353.00	f	\N	\N	0	\N	\N	\N	\N	f	15.00	\N	\N	f	\N	\N	0	\N	\N	A	0.00	\N	\N	f	f	\N	\N	0.00	0.00	0.00	\N	\N	\N	\N	\N	\N	ADMIN	2026-11-12 11:58:36.872898	ADMIN	2026-11-12 12:08:25.465668
01	2026	JD	B	1111111111	1	1	TKT	\N	2026-11-11 00:00:00	60006	\N	B2B	1220.00	100.00	8.70	1.30	0.00	10.00	1.50	0.00	1.50	1341.50	f	\N	\N	0	\N	\N	\N	\N	f	15.00	\N	\N	f	\N	\N	0	\N	\N	\N	0.00	\N	\N	f	f	\N	\N	0.00	0.00	0.00	\N	\N	\N	\N	\N	\N	ADMIN	2026-11-12 09:33:49.950569	ADMIN	2026-11-12 12:56:54.884129
01	2026	JD	B	4444444444	1	1	TKT	\N	2026-11-12 00:00:00	60005	\N	B2B	1000.00	100.00	8.70	1.30	0.00	10.00	1.50	0.00	1.50	1121.50	f	\N	\N	0	\N	\N	\N	\N	f	15.00	\N	\N	f	\N	\N	0	\N	\N	\N	0.00	\N	\N	f	f	\N	\N	0.00	0.00	0.00	ref1	\N	ref21	ref3	ref4	\N	ADMIN	2026-11-12 13:45:31.103513	\N	\N
01	2026	JD	B	1111111111	2	1	TKT	\N	2026-11-11 00:00:00	60006	\N	B2B	1220.00	100.00	8.70	1.30	0.00	10.00	1.50	0.00	1.50	1341.50	f	\N	\N	0	\N	\N	\N	\N	f	15.00	\N	\N	f	\N	\N	0	\N	\N	\N	0.00	\N	\N	f	f	\N	\N	0.00	0.00	0.00	\N	\N	\N	\N	\N	\N	ADMIN	2026-11-12 11:13:56.817894	ADMIN	2026-11-12 11:16:31.035427
01	2026	JD	B	4444444444	2	1	TKT	\N	2026-11-12 00:00:00	60005	\N	B2B	1000.00	100.00	8.70	1.30	0.00	10.00	1.50	0.00	1.50	1121.50	f	\N	\N	0	\N	\N	\N	\N	f	15.00	\N	\N	f	\N	\N	0	\N	\N	\N	0.00	\N	\N	f	f	\N	\N	0.00	0.00	0.00	ref1	\N	ref21	ref3	ref4	\N	ADMIN	2026-11-12 13:45:57.678265	ADMIN	2026-11-12 13:48:10.663694
01	2026	JD	B	3333333333	1	1	TKT	\N	2026-11-12 00:00:00	60003	\N	B2B	2000.00	110.00	0.00	0.00	0.00	422.00	63.30	0.00	379.80	2911.80	f	\N	\N	0	\N	\N	\N	\N	f	15.00	\N	\N	f	\N	\N	0	\N	\N	P	20.00	\N	\N	f	f	\N	\N	0.00	0.00	0.00	\N	\N	\N	\N	\N	\N	ADMIN	2026-11-12 14:02:27.235147	\N	\N
\.


--
-- Data for Name: tblticketsalescnj; Type: TABLE DATA; Schema: dbo; Owner: postgres
--

COPY dbo.tblticketsalescnj (fcoid, fyear, fbrid, ftickettypeid, ftktslno, fslno, frevno, fcnjtktslno, fcnjtktno, fservicetypegroupid, froute, fcustroute, fclass, fcustclass, fcarrier, finvslno, ffileseqno, ftransid, fmergetoinvslno) FROM stdin;
01	2026	JD	B	2222222222	1	1	ticketss	ticketss	TKT	DHK	\N	Y	\N	SDD	\N	\N	\N	\N
01	2026	JD	B	1111111111	1	1	ee	ee	TKT	C33 333	\N	E	\N	1	\N	\N	\N	\N
01	2026	JD	B	4444444444	2	1	111111111111	111111111111	TKT	DHK SRR	\N	Y	\N	SDD	\N	\N	\N	\N
\.


--
-- Data for Name: tbltickettype; Type: TABLE DATA; Schema: dbo; Owner: postgres
--

COPY dbo.tbltickettype (fcoid, ftickettypeid, ftickttypename, fservicetypegroupid, fpositionno, fcuserid, fcuserdate, fmuserid, fmuserdate) FROM stdin;
01	B	BSP	TKT	1	\N	\N	\N	\N
01	O	Online	TKT	2	\N	\N	\N	\N
01	ADM	ADM	TKT	11	\N	\N	\N	\N
01	ACM	ACM	TKT	12	\N	\N	\N	\N
01	X	XO	TKT	3	\N	\N	\N	\N
01	D	Dummy	TKT	4	\N	\N	\N	\N
\.


--
-- Data for Name: tbltlparam; Type: TABLE DATA; Schema: dbo; Owner: postgres
--

COPY dbo.tbltlparam (fptype, fpositionno, fpid, fpname, fuserid, fuserdate) FROM stdin;
AMTP	1	C	ACM	\N	\N
AMTP	1	D	ADM	\N	\N
AXTP	1	C	CTA	\N	\N
AXTP	2	I	INDIVIDUAL	\N	\N
AXTP	3	NA	NOT APPLICABLE	\N	\N
B2TP	1	B2B	B2B INVOICE	\N	\N
B2TP	2	B2C	B2C INVOICE	\N	\N
B2TP	3	OTH	OTHER	\N	\N
BCRTP	1	C	Cash	\N	1900-01-01 00:00:00
BCRTP	2	R	Credit	\N	1900-01-01 00:00:00
BCRTP	3	A	CTA	\N	1900-01-01 00:00:00
CIMD	1	PER	BY PERIOD	\N	\N
CIMD	2	TRN	BY TRANSACTION	\N	\N
CIMD	3	REF	BY REFERENCE	\N	\N
COMTP	1	P	Percentage	\N	\N
COMTP	2	A	Amount	\N	\N
CRNTP	1	T	Ticket Refund	\N	\N
CRTP	1	A	Advance/ Balance	\N	\N
CRTP	2	C	Cash Sales Receipt	\N	\N
CTATP	1	C	CTA Card-Customer	\N	\N
CTATP	2	P	CTA Card-Project	\N	\N
CTATP	3	L	CTA Card-Personnel	\N	\N
CUSTP	1	B2B	B2B	\N	\N
CUSTP	2	B2C	B2C	\N	\N
DITP	1	D	Domestic	\N	\N
DITP	2	I	International	\N	\N
DITP	3	B	Both	\N	\N
FOPTP	1	CASH	Cash	\N	\N
FOPTP	2	INV	INV	\N	\N
FOPTP	3	CC	Credit Card	\N	\N
FOPTP	4	CX	CASH+CCAX	\N	\N
INVDT	1	CI	CASH INVOICE	\N	\N
INVDT	2	INV	INVOICE	\N	\N
INVDT	3	CRN	CASH REFUND NOTE	\N	\N
INVDT	4	RCN	REFUND CREDIT NOTE	\N	\N
INVDT	5	DN	DEBIT NOTE	\N	\N
INVDT	6	CN	CREDIT NOTE	\N	\N
INVMD	1	PER	BY PERIOD	\N	\N
INVMD	2	REF	BY REFERENCE	\N	\N
INVMD	3	TRN	BY TRANSACTION	\N	\N
LGTP	1	E	English	\N	\N
LGTP	2	A	Arabic	\N	\N
MDTP	1	T	Travel	\N	\N
MDTP	2	H	Tourism	\N	\N
MDTP	3	O	Other	\N	\N
MDTP	4	A	All	\N	\N
MERC	1	A	Airline	ADMIN	2026-03-25 09:19:39.717
MERC	2	T	Travel Agent	ADMIN	2026-03-25 09:19:39.72
MERC	3	NA	Not Applicable	ADMIN	2026-03-25 11:28:18.987
POSTMD	1	INV	PER INVOICE	\N	\N
POSTMD	2	TKT	PER TICKET	\N	\N
PXTP	1	A	Adult	\N	\N
PXTP	2	C	Child	\N	\N
PXTP	3	I	Infant	\N	\N
RCNMD	1	PER	BY PERIOD	\N	\N
RCNMD	2	SI	BY Sales Invoice No	\N	\N
RCNMD	3	TRN	BY TRANSACTION	\N	\N
REFTP	1	P	Partial	\N	\N
REFTP	2	D	DownGrade	\N	\N
REFTP	3	F	Full	\N	\N
RTYPE	1	PV	PV	\N	\N
RTYPE	2	INV	INV	\N	\N
SBDGT	1	T	Travel	\N	\N
SBDGT	2	H	Tourism	\N	\N
SCHGTP	1	A	By Amount	\N	\N
SCHGTP	2	P	By Percent	\N	\N
TKTKND	1	ETKT	E TICKET	\N	\N
TKTKND	2	L	Licence	\N	\N
TKTKND	2	T	Triptic	\N	\N
TLTP	1	T	TRAVEL	\N	\N
TLTP	2	H	TOUR	\N	\N
TLTP	3	O	OTHER	\N	\N
TRTP	1	C	Cash	\N	1900-01-01 00:00:00
TRTP	2	R	Credit	\N	1900-01-01 00:00:00
TRTP	3	CTA	CTA	\N	\N
TRTP	4	CC	Credit Card	\N	\N
TRTP	5	MC	Master Card	\N	\N
TSTP	1	INV	TAX INVOICE	\N	1900-01-01 00:00:00
TSTP	2	CI	SIMPLIFIED TAX INVOICE	\N	1900-01-01 00:00:00
TSTP	3	OT	OTHER	\N	1900-01-01 00:00:00
YCMT	1	C	Company wise	\N	\N
YCMT	2	B	Branch wise	\N	\N
\.


--
-- Data for Name: tbluseraudit; Type: TABLE DATA; Schema: dbo; Owner: postgres
--

COPY dbo.tbluseraudit (fid, fcoid, fyear, fbrid, fdoctype, fscreenname, fscreenkey, faction, fnote, fuserid, fuserdate) FROM stdin;
16	01	2026	JD	B	Ticket Sales	JDB1234567890	M	BSP Date : Changed from 11-11-2026 to 12-11-2026\r\nRoute : Changed from cok to COK BEH	ADMIN	2026-11-12 09:19:07.304354
17	01	2026	JD	B	Ticket Sales	JDB1111111111	S	Ticket Type : B\r\nTicket No. : 1111111111\r\nBranch : JD\r\nAirline No. : 065\r\nDate : 11-11-2026\r\nSupplier : 60002\r\nPax Name : Sreerenjini Renjith\r\nD/I : I\r\nG. Fare : 1220.00\r\nS. Fare : 1220.00\r\nTax : 100.00\r\nK7 : 0.00\r\nSupplier Amt. : 1320.00\r\nCustomer ID : 60006\r\nInv. Amt. : 1341.50	ADMIN	2026-11-12 09:33:49.950569
28	01	2026	JD	B	Ticket Sales	JDB1111111111	S	Ticket Type : B\r\nTicket No. : 1111111111\r\nSl. No. : 2\r\nBranch : JD\r\nAirline No. : 065\r\nDate : 11-11-2026\r\nSupplier : 60002\r\nPax Name : Sreerenjini Renjith\r\nD/I : I\r\nG. Fare : 1220.00\r\nS. Fare : 1220.00\r\nTax : 100.00\r\nK7 : 0.00\r\nSupplier Amt. : 1320.00\r\nCustomer ID : 60006\r\nInv. Amt. : 1341.50	ADMIN	2026-11-12 11:13:09.60814
29	01	2026	JD	B	Ticket Sales	JDB1111111111	D	Ticket Type : B\r\nTicket No. : 1111111111\r\nSl. No. : 2\r\nBranch : JD\r\nAirline No. : 065\r\nDate : 11-11-2026\r\nSupplier : 60002\r\nPax Name : Sreerenjini Renjith\r\nD/I : I\r\nG. Fare : 1220.00\r\nS. Fare : 1220.00\r\nTax : 100.00\r\nK7 : 0.00\r\nSupplier Amt. : 1320.00\r\nCustomer ID : 60006\r\nInv. Amt. : 1341.50	ADMIN	2026-11-12 11:13:35.293247
30	01	2026	JD	B	Ticket Sales	JDB1111111111	S	Ticket Type : B\r\nTicket No. : 1111111111\r\nSl. No. : 2\r\nBranch : JD\r\nAirline No. : 065\r\nDate : 11-11-2026\r\nSupplier : 60002\r\nPax Name : Sreerenjini Renjith\r\nD/I : I\r\nG. Fare : 1220.00\r\nS. Fare : 1220.00\r\nTax : 100.00\r\nK7 : 0.00\r\nSupplier Amt. : 1320.00\r\nCustomer ID : 60006\r\nInv. Amt. : 1341.50	ADMIN	2026-11-12 11:13:56.817894
31	01	2026	JD	B	Ticket Sales	JDB1111111111	M	No field changed	ADMIN	2026-11-12 11:16:14.289391
32	01	2026	JD	B	Ticket Sales	JDB1111111111	M	Pax Name : Changed from Sreerenjini Renjith to Sreerenjini Renjith  k	ADMIN	2026-11-12 11:16:31.035427
41	01	2026	JD	B	Ticket Sales	JDB1111111111	M	CNJ : Changed from No to Yes\r\nCNJ Ticket No. : Changed from  to ee\r\nCNJ Route : Changed from  to C\r\nCNJ Carrier : Changed from  to 1\r\nCNJ Class : Changed from  to E	ADMIN	2026-11-12 11:44:37.67972
42	01	2026	JD	B	Ticket Sales	JDB2222222222	S	Ticket Type : B\r\nTicket No. : 2222222222\r\nSl. No. : 1\r\nBranch : JD\r\nAirline No. : 065\r\nDate : 12-11-2026\r\nSupplier : 60002\r\nPax Name : Sreerenjini Renjith\r\nD/I : I\r\nG. Fare : 1220.00\r\nS. Fare : 1220.00\r\nTax : 10.00\r\nK7 : 0.00\r\nSupplier Amt. : 1230.00\r\nCustomer ID : 60003\r\nInv. Amt. : 1264.00	ADMIN	2026-11-12 11:48:08.031131
43	01	2026	JD	B	Ticket Sales	JDB2222222222	M	No field changed	ADMIN	2026-11-12 11:53:02.955657
44	01	2026	JD	B	Ticket Sales	JDB2222222222	D	Ticket Type : B\r\nTicket No. : 2222222222\r\nSl. No. : 1\r\nBranch : JD\r\nAirline No. : 065\r\nDate : 12-11-2026\r\nSupplier : 60002\r\nPax Name : Sreerenjini Renjith\r\nD/I : I\r\nG. Fare : 1220.00\r\nS. Fare : 1220.00\r\nTax : 10.00\r\nK7 : 0.00\r\nSupplier Amt. : 1230.00\r\nCustomer ID : 60003\r\nInv. Amt. : 1264.00	ADMIN	2026-11-12 11:56:15.788791
45	01	2026	JD	B	Ticket Sales	JDB2222222222	S	Ticket Type : B\r\nTicket No. : 2222222222\r\nSl. No. : 1\r\nBranch : JD\r\nAirline No. : 065\r\nDate : 12-11-2026\r\nSupplier : 60002\r\nPax Name : Sreerenjini Renjith\r\nD/I : I\r\nG. Fare : 1220.00\r\nS. Fare : 1220.00\r\nTax : 110.00\r\nK7 : 0.00\r\nSupplier Amt. : 1330.00\r\nCustomer ID : 60003\r\nInv. Amt. : 1353.00	ADMIN	2026-11-12 11:58:36.872898
46	01	2026	JD	B	Ticket Sales	JDB2222222222	M	CNJ : Changed from No to Yes\r\nCNJ Ticket No. : Changed from  to ticket\r\nCNJ Route : Changed from  to DHK\r\nCNJ Carrier : Changed from  to SDD\r\nCNJ Class : Changed from  to Y	ADMIN	2026-11-12 12:01:53.865134
47	01	2026	JD	B	Ticket Sales	JDB2222222222	M	CNJ Ticket No. : Changed from ticket to ticketss	ADMIN	2026-11-12 12:08:25.465668
48	01	2026	JD	B	Ticket Sales	JDB1111111111	M	CNJ Route : Changed from C to C33 333	ADMIN	2026-11-12 12:56:54.884129
49	01	2026	JD	B	Ticket Sales	JDB4444444444	S	Ticket Type : B\r\nTicket No. : 4444444444\r\nSl. No. : 1\r\nBranch : JD\r\nAirline No. : 065\r\nDate : 12-11-2026\r\nSupplier : 60002\r\nPax Name : samarjith k r\r\nD/I : I\r\nG. Fare : 1000.00\r\nS. Fare : 1000.00\r\nTax : 100.00\r\nK7 : 0.00\r\nSupplier Amt. : 1100.00\r\nCustomer ID : 60005\r\nInv. Amt. : 1121.50	ADMIN	2026-11-12 13:45:31.103513
50	01	2026	JD	B	Ticket Sales	JDB4444444444	S	Ticket Type : B\r\nTicket No. : 4444444444\r\nSl. No. : 2\r\nBranch : JD\r\nAirline No. : 065\r\nDate : 12-11-2026\r\nSupplier : 60002\r\nPax Name : samarjith k r\r\nD/I : I\r\nG. Fare : 1000.00\r\nS. Fare : 1000.00\r\nTax : 100.00\r\nK7 : 0.00\r\nSupplier Amt. : 1100.00\r\nCustomer ID : 60005\r\nInv. Amt. : 1121.50	ADMIN	2026-11-12 13:45:57.678265
51	01	2026	JD	B	Ticket Sales	JDB4444444444	M	CNJ : Changed from No to Yes\r\nCNJ Ticket No. : Changed from  to 111111111111\r\nCNJ Route : Changed from  to DHK SRR\r\nCNJ Carrier : Changed from  to SDD\r\nCNJ Class : Changed from  to Y	ADMIN	2026-11-12 13:48:10.663694
52	01	2026	JD	B	Ticket Sales	JDB3333333333	S	Ticket Type : B\r\nTicket No. : 3333333333\r\nSl. No. : 1\r\nBranch : JD\r\nAirline No. : 065\r\nDate : 12-11-2026\r\nSupplier : 60002\r\nPax Name : Sreerenjini Renjith\r\nD/I : D\r\nG. Fare : 2000.00\r\nS. Fare : 2000.00\r\nTax : 110.00\r\nK7 : 10.00\r\nSupplier Amt. : 2120.00\r\nCustomer ID : 60003\r\nInv. Amt. : 2911.80	ADMIN	2026-11-12 14:02:27.235147
\.


--
-- Data for Name: tbluserlogin; Type: TABLE DATA; Schema: dbo; Owner: postgres
--

COPY dbo.tbluserlogin (fcoid, fuserid, fusername, fuserpwd, fusertype, fuserstatus, fdatevalidity) FROM stdin;
01	ADMIN	ADMIN	005940060100614	AU	A	0
\.


--
-- Data for Name: tblusersession; Type: TABLE DATA; Schema: dbo; Owner: postgres
--

COPY dbo.tblusersession (fsessionid, fuserid, fsessiontoken, fcreatedat, flastactivity, fbranchid, fexpiresat, fcoid) FROM stdin;
17	ADMIN	6c7d4ebf-719e-4b61-84a2-b8c1d92c7b69	2026-11-12 09:10:37.114591	2026-11-12 09:10:37.114591	\N	2026-11-13 09:10:37.114591+05:30	01
\.


--
-- Data for Name: tblvatsetting; Type: TABLE DATA; Schema: dbo; Owner: postgres
--

COPY dbo.tblvatsetting (fcoid, fslno, fservicetypeid, fvatper, fuserid, fuserdate, fprevvatper, fprevvatdate) FROM stdin;
01	1	TD	15.00	ADMIN	2017-12-12 16:41:36.83	15.00	2020-06-30 00:00:00
01	2	TI	15.00	ADMIN	2025-02-02 18:13:28.333	15.00	2020-06-30 00:00:00
01	3	HD	15.00	ADMIN	2018-01-19 13:26:01.05	15.00	2020-06-30 00:00:00
01	4	HI	15.00	ADMIN	2025-02-02 18:13:28.423	15.00	2020-06-30 00:00:00
01	5	OD	15.00	ADMIN	2018-01-19 21:07:51.13	15.00	2020-06-30 00:00:00
01	6	OI	15.00	ADMIN	2025-02-02 18:13:28.513	15.00	2020-06-30 00:00:00
02	1	TD	15.00	ADMIN	2017-12-12 16:41:36.83	15.00	2020-06-30 00:00:00
02	2	TI	15.00	ADMIN	2025-02-02 18:13:28.333	15.00	2020-06-30 00:00:00
02	3	HD	15.00	ADMIN	2018-01-19 13:26:01.05	15.00	2020-06-30 00:00:00
02	4	HI	15.00	ADMIN	2025-02-02 18:13:28.423	15.00	2020-06-30 00:00:00
02	5	OD	15.00	ADMIN	2018-01-19 21:07:51.13	15.00	2020-06-30 00:00:00
02	6	OI	15.00	ADMIN	2025-02-02 18:13:28.513	15.00	2020-06-30 00:00:00
\.


--
-- Data for Name: tblyear; Type: TABLE DATA; Schema: dbo; Owner: postgres
--

COPY dbo.tblyear (fcoid, fyear, fbrid, fyearclosestatusid, fyearclosestatus, fcuserid, fcuserdate, fmuserid, fmuserdate) FROM stdin;
01	2026	JD	O	Open	ADMIN	2025-12-29 15:09:34.677	\N	\N
01	2026	RH	O	Open	ADMIN	2025-12-29 15:09:34.677	\N	\N
\.


--
-- Name: tbluseraudit_fid_seq; Type: SEQUENCE SET; Schema: dbo; Owner: postgres
--

SELECT pg_catalog.setval('dbo.tbluseraudit_fid_seq', 52, true);


--
-- Name: tblusersession_fsessionid_seq; Type: SEQUENCE SET; Schema: dbo; Owner: postgres
--

SELECT pg_catalog.setval('dbo.tblusersession_fsessionid_seq', 17, true);


--
-- Name: tblaccount pk_tblaccount_1; Type: CONSTRAINT; Schema: dbo; Owner: postgres
--

ALTER TABLE ONLY dbo.tblaccount
    ADD CONSTRAINT pk_tblaccount_1 PRIMARY KEY (fcoid, faccountid);


--
-- Name: tblaccountcs pk_tblaccountcs; Type: CONSTRAINT; Schema: dbo; Owner: postgres
--

ALTER TABLE ONLY dbo.tblaccountcs
    ADD CONSTRAINT pk_tblaccountcs PRIMARY KEY (fcoid, fcsaccountid);


--
-- Name: tblairline pk_tblairline; Type: CONSTRAINT; Schema: dbo; Owner: postgres
--

ALTER TABLE ONLY dbo.tblairline
    ADD CONSTRAINT pk_tblairline PRIMARY KEY (fcoid, fairlineno);


--
-- Name: tblbranch pk_tblbranch; Type: CONSTRAINT; Schema: dbo; Owner: postgres
--

ALTER TABLE ONLY dbo.tblbranch
    ADD CONSTRAINT pk_tblbranch PRIMARY KEY (fcoid, fbrid);


--
-- Name: tblcompany pk_tblcompany; Type: CONSTRAINT; Schema: dbo; Owner: postgres
--

ALTER TABLE ONLY dbo.tblcompany
    ADD CONSTRAINT pk_tblcompany PRIMARY KEY (fcoid);


--
-- Name: tblcustdivision pk_tblcustdivision; Type: CONSTRAINT; Schema: dbo; Owner: postgres
--

ALTER TABLE ONLY dbo.tblcustdivision
    ADD CONSTRAINT pk_tblcustdivision PRIMARY KEY (fcoid, fcustomerid, fdivid);


--
-- Name: tblfop pk_tblfop; Type: CONSTRAINT; Schema: dbo; Owner: postgres
--

ALTER TABLE ONLY dbo.tblfop
    ADD CONSTRAINT pk_tblfop PRIMARY KEY (fcoid, ffop);


--
-- Name: tblgds pk_tblgds; Type: CONSTRAINT; Schema: dbo; Owner: postgres
--

ALTER TABLE ONLY dbo.tblgds
    ADD CONSTRAINT pk_tblgds PRIMARY KEY (fcoid, fgdsid);


--
-- Name: tbliata pk_tbliata; Type: CONSTRAINT; Schema: dbo; Owner: postgres
--

ALTER TABLE ONLY dbo.tbliata
    ADD CONSTRAINT pk_tbliata PRIMARY KEY (fcoid, fiatacode);


--
-- Name: tblmenu pk_tblmenu; Type: CONSTRAINT; Schema: dbo; Owner: postgres
--

ALTER TABLE ONLY dbo.tblmenu
    ADD CONSTRAINT pk_tblmenu PRIMARY KEY (fmenuid);


--
-- Name: tblservicetype pk_tblservicetype; Type: CONSTRAINT; Schema: dbo; Owner: postgres
--

ALTER TABLE ONLY dbo.tblservicetype
    ADD CONSTRAINT pk_tblservicetype PRIMARY KEY (fcoid, fservicetypeid);


--
-- Name: tblservicetypegroup pk_tblservicetypegroup; Type: CONSTRAINT; Schema: dbo; Owner: postgres
--

ALTER TABLE ONLY dbo.tblservicetypegroup
    ADD CONSTRAINT pk_tblservicetypegroup PRIMARY KEY (fcoid, fservicetypegroupid);


--
-- Name: tblstaff pk_tblstaff; Type: CONSTRAINT; Schema: dbo; Owner: postgres
--

ALTER TABLE ONLY dbo.tblstaff
    ADD CONSTRAINT pk_tblstaff PRIMARY KEY (fcoid, fstaffid);


--
-- Name: tblticketsales pk_tblticketsales; Type: CONSTRAINT; Schema: dbo; Owner: postgres
--

ALTER TABLE ONLY dbo.tblticketsales
    ADD CONSTRAINT pk_tblticketsales PRIMARY KEY (fcoid, fyear, fbrid, ftickettypeid, fticketslno, fslno, frevno);


--
-- Name: tblticketsalesb pk_tblticketsalesb; Type: CONSTRAINT; Schema: dbo; Owner: postgres
--

ALTER TABLE ONLY dbo.tblticketsalesb
    ADD CONSTRAINT pk_tblticketsalesb PRIMARY KEY (fcoid, fyear, fbrid, ftickettypeid, fticketslno, fslno, frevno);


--
-- Name: tblticketsalescnj pk_tblticketsalescnj; Type: CONSTRAINT; Schema: dbo; Owner: postgres
--

ALTER TABLE ONLY dbo.tblticketsalescnj
    ADD CONSTRAINT pk_tblticketsalescnj PRIMARY KEY (fcoid, fyear, fbrid, ftickettypeid, ftktslno, fslno, frevno);


--
-- Name: tbltickettype pk_tbltickettype; Type: CONSTRAINT; Schema: dbo; Owner: postgres
--

ALTER TABLE ONLY dbo.tbltickettype
    ADD CONSTRAINT pk_tbltickettype PRIMARY KEY (fcoid, ftickettypeid);


--
-- Name: tbltlparam pk_tbltlparam; Type: CONSTRAINT; Schema: dbo; Owner: postgres
--

ALTER TABLE ONLY dbo.tbltlparam
    ADD CONSTRAINT pk_tbltlparam PRIMARY KEY (fptype, fpositionno, fpid);


--
-- Name: tbluseraudit pk_tbluseraudit; Type: CONSTRAINT; Schema: dbo; Owner: postgres
--

ALTER TABLE ONLY dbo.tbluseraudit
    ADD CONSTRAINT pk_tbluseraudit PRIMARY KEY (fid);


--
-- Name: tbluserlogin pk_tbluserlogin; Type: CONSTRAINT; Schema: dbo; Owner: postgres
--

ALTER TABLE ONLY dbo.tbluserlogin
    ADD CONSTRAINT pk_tbluserlogin PRIMARY KEY (fcoid, fuserid);


--
-- Name: tblvatsetting pk_tblvatsetting; Type: CONSTRAINT; Schema: dbo; Owner: postgres
--

ALTER TABLE ONLY dbo.tblvatsetting
    ADD CONSTRAINT pk_tblvatsetting PRIMARY KEY (fcoid, fslno, fservicetypeid);


--
-- Name: tblyear pk_tblyear; Type: CONSTRAINT; Schema: dbo; Owner: postgres
--

ALTER TABLE ONLY dbo.tblyear
    ADD CONSTRAINT pk_tblyear PRIMARY KEY (fcoid, fyear, fbrid);


--
-- Name: tblusersession tblusersession_fsessiontoken_key; Type: CONSTRAINT; Schema: dbo; Owner: postgres
--

ALTER TABLE ONLY dbo.tblusersession
    ADD CONSTRAINT tblusersession_fsessiontoken_key UNIQUE (fsessiontoken);


--
-- Name: tblusersession tblusersession_fuserid_key; Type: CONSTRAINT; Schema: dbo; Owner: postgres
--

ALTER TABLE ONLY dbo.tblusersession
    ADD CONSTRAINT tblusersession_fuserid_key UNIQUE (fuserid);


--
-- Name: tblusersession tblusersession_pkey; Type: CONSTRAINT; Schema: dbo; Owner: postgres
--

ALTER TABLE ONLY dbo.tblusersession
    ADD CONSTRAINT tblusersession_pkey PRIMARY KEY (fsessionid);


--
-- Name: ix_tbluseraudit_screen; Type: INDEX; Schema: dbo; Owner: postgres
--

CREATE INDEX ix_tbluseraudit_screen ON dbo.tbluseraudit USING btree (fcoid, fscreenname, fscreenkey);


--
-- PostgreSQL database dump complete
--

\unrestrict TTAvTcz00t5zVvdi9KZPuXBups6NHnK1XrRpzDLBI7vbu1bzP9H29Zbj98zB1Eb

