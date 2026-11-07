-- =====================================================================
-- TRAVEL database - PostgreSQL version of the SQL Server script
-- Type mapping: bit -> boolean, datetime/smalldatetime -> timestamp,
--               nvarchar -> varchar, tinyint -> smallint, int -> integer
-- Names are lower case. Defaults are written inline in the columns.
-- =====================================================================

-- Create the database once (run from the postgres database, not inside this one):
--   CREATE DATABASE travel;
-- then connect to it:   \c travel

CREATE SCHEMA IF NOT EXISTS dbo;

-- ---------------------------------------------------------------------
-- tblAirline
-- ---------------------------------------------------------------------
CREATE TABLE dbo.tblairline (
    fcoid             varchar(3)  NOT NULL,
    fairlineno        varchar(3)  NOT NULL,
    fairlinename      varchar(50) NOT NULL,
    fairlinecode      varchar(3)  NULL,
    fvatoncommission  boolean     NULL,
    fcuserid          varchar(30) NULL,
    fcuserdate        timestamp   NULL,
    fmuserid          varchar(30) NULL,
    fmuserdate        date        NULL,
    CONSTRAINT pk_tblairline PRIMARY KEY (fcoid, fairlineno)
);

-- ---------------------------------------------------------------------
-- tblCustDivision
-- ---------------------------------------------------------------------
CREATE TABLE dbo.tblcustdivision (
    fcoid        varchar(3)  NOT NULL,
    fcustomerid  varchar(12) NOT NULL,
    fdivid       varchar(8)  NOT NULL,
    fdivname     varchar(60) NULL,
    fdivname_ar  varchar(60) NULL,
    fcuserid     varchar(30) NULL,
    fcuserdate   timestamp   NULL,
    fmuserid     varchar(30) NULL,
    fmuserdate   timestamp   NULL,
    CONSTRAINT pk_tblcustdivision PRIMARY KEY (fcoid, fcustomerid, fdivid)
);

-- ---------------------------------------------------------------------
-- tblIATA
-- ---------------------------------------------------------------------
CREATE TABLE dbo.tbliata (
    fcoid                     varchar(3)  NOT NULL,
    fiatacode                 varchar(8)  NOT NULL,
    fiataname                 varchar(40) NULL,
    fbsppurchase_csaccountid  varchar(12) NULL,
    fvoidsales_csaccountid    varchar(12) NULL,
    fpaxccsales_csaccountid   varchar(12) NULL,
    fcashsales_csaccountid    varchar(12) NULL,
    fpositionno               smallint    NULL,
    fcuserid                  varchar(30) NULL,
    fcuserdate                timestamp   NULL,
    fmuserid                  varchar(30) NULL,
    fmuserdate                timestamp   NULL,
    CONSTRAINT pk_tbliata PRIMARY KEY (fcoid, fiatacode)
);

-- ---------------------------------------------------------------------
-- tblServiceChargePolicy (no primary key in the source)
-- ---------------------------------------------------------------------
CREATE TABLE dbo.tblservicechargepolicy (
    fcoid                 varchar(3)    NOT NULL,
    fsr                   varchar(2)    NOT NULL,
    fcustomerid           varchar(12)   NOT NULL,
    fservicetypeid        varchar(4)    NOT NULL,
    fdivid                varchar(8)    NOT NULL,
    fservicetypegroupid   varchar(4)    NULL,
    fmf                   numeric(18,2) NULL,
    fctacarriercode       varchar(3)    NULL,
    fd_servicechargetype  varchar(2)    NULL,
    fd_servicechgper      numeric(18,2) NULL,
    fd_minservicechgamt   numeric(18,2) NULL,
    fd_servicechgamt      numeric(18,2) NULL,
    fi_servicechargetype  varchar(2)    NULL,
    fi_servicechgper      numeric(18,2) NULL,
    fi_minservicechgamt   numeric(18,2) NULL,
    fi_servicechgamt      numeric(18,2) NULL,
    fcuserid              varchar(30)   NULL,
    fcuserdate            timestamp     NULL,
    fmuserid              varchar(30)   NULL,
    fmuserdate            timestamp     NULL
);

-- ---------------------------------------------------------------------
-- tblServiceType
-- ---------------------------------------------------------------------
CREATE TABLE dbo.tblservicetype (
    fcoid                varchar(3)  NOT NULL,
    fservicetypeid       varchar(4)  NOT NULL,
    fservicetypegroupid  varchar(4)  NOT NULL,
    fservicetypename     varchar(50) NULL,
    fctacarriercode      varchar(3)  NULL,
    fcuserid             varchar(30) NULL,
    fcuserdate           timestamp   NULL,
    fmuserid             varchar(12) NULL,
    fmuserdate           timestamp   NULL,
    fpositionno          smallint    NULL,
    CONSTRAINT pk_tblservicetype PRIMARY KEY (fcoid, fservicetypeid)
);

-- ---------------------------------------------------------------------
-- tblServiceTypeGroup
-- ---------------------------------------------------------------------
CREATE TABLE dbo.tblservicetypegroup (
    fcoid                  varchar(3)  NOT NULL,
    fservicetypegroupid    varchar(4)  NOT NULL,
    fservicetypegroupname  varchar(50) NULL,
    fpositionno            smallint    NULL,
    fcuserid               varchar(30) NULL,
    fcuserdate             timestamp   NULL,
    fmuserid               varchar(30) NULL,
    fmuserdate             timestamp   NULL,
    CONSTRAINT pk_tblservicetypegroup PRIMARY KEY (fcoid, fservicetypegroupid)
);

-- ---------------------------------------------------------------------
-- tblTicketSales
-- ---------------------------------------------------------------------
CREATE TABLE dbo.tblticketsales (
    fcoid                 varchar(3)    NOT NULL,
    fyear                 varchar(4)    NOT NULL DEFAULT '0',
    fbrid                 varchar(3)    NOT NULL,
    ftickettypeid         varchar(4)    NOT NULL,
    fticketslno           varchar(12)   NOT NULL,
    frevno                smallint      NOT NULL,
    fservicetypegroupid   varchar(4)    NOT NULL,
    fiatacode             varchar(8)    NULL,
    fairlineno            varchar(3)    NULL,
    fticketno             varchar(18)   NULL,
    fdate                 timestamp     NULL,
    fbspdate              timestamp     NULL,
    ftraveldate           timestamp     NULL,
    fpnr                  varchar(10)   NULL,
    fsupplierid           varchar(12)   NULL,
    fvoid                 boolean       NULL DEFAULT false,
    fpaxname              varchar(100)  NULL,
    fpaxtype              varchar(1)    NULL,
    fpaxid                varchar(20)   NULL,
    froute                varchar(40)   NULL,
    fdestid               varchar(3)    NULL,
    fclass                varchar(8)    NULL,
    fcarrier              varchar(8)    NULL,
    fstaffid              varchar(4)    NULL,
    freissue              boolean       NULL DEFAULT false,
    forigtktno            varchar(20)   NULL,
    ftrip                 varchar(2)    NULL,
    fiataamt              numeric(18,2) NULL DEFAULT 0,
    fsellingamt           numeric(10,2) NULL DEFAULT 0,
    ftaxamt               numeric(18,2) NULL DEFAULT 0,
    fcommper              numeric(10,2) NULL DEFAULT 0,
    fcommamt              numeric(18,2) NULL DEFAULT 0,
    fsupplieramtfc        numeric(18,4) NULL DEFAULT 0,
    fcurrency             varchar(3)    NULL,
    fcurrencyrate         numeric(18,4) NULL,
    fsupplieramt          numeric(10,2) NULL DEFAULT 0,
    fkbamt                integer       NULL DEFAULT 0,
    fpackage              boolean       NULL DEFAULT false,
    fnote                 varchar(100)  NULL,
    fairlinecode          varchar(3)    NULL,
    freported             boolean       NULL DEFAULT false,
    ffilename             varchar(50)   NULL,
    fcnj                  boolean       NULL DEFAULT false,
    ftourcode             varchar(15)   NULL,
    fgdsid                varchar(2)    NULL,
    fccid                 varchar(8)    NULL,
    forigin               varchar(2)    NULL DEFAULT '0',
    fuserid               varchar(20)   NULL,
    fuserdate             timestamp     NULL,
    fhotelid              varchar(4)    NULL,
    fhotel                varchar(80)   NULL,
    faddress              varchar(80)   NULL,
    fphone                varchar(50)   NULL,
    fadults               integer       NULL DEFAULT 0,
    fchilds               integer       NULL DEFAULT 0,
    finfants              integer       NULL DEFAULT 0,
    fcheckin              timestamp     NULL,
    fcheckout             timestamp     NULL,
    fnights               smallint      NULL DEFAULT 0,
    froomtype             varchar(10)   NULL,
    froomqty              smallint      NULL DEFAULT 0,
    fcityid               varchar(4)    NULL,
    fmealid               varchar(4)    NULL,
    fcountryid            varchar(4)    NULL,
    fservice1             varchar(80)   NULL,
    fservice2             varchar(80)   NULL,
    fsupplierref          varchar(30)   NULL,
    fpackageid            varchar(5)    NULL,
    fpost                 boolean       NULL DEFAULT false,
    fpostno               varchar(15)   NULL,
    fdi                   varchar(1)    NULL,
    fgdsstaffid           varchar(6)    NULL,
    fdays                 integer       NULL DEFAULT 0,
    fcuserid              varchar(30)   NULL,
    fcuserdate            timestamp     NULL,
    fmuserid              varchar(30)   NULL,
    fmuserdate            timestamp     NULL,
    fnacarriercode        varchar(2)    NULL,
    fsob                  varchar(3)    NULL,
    fsourcestaffid        varchar(4)    NULL,
    fdestdescription      varchar(20)   NULL,
    fcartypeid            varchar(4)    NULL,
    fdroppoint            varchar(20)   NULL,
    fpickpoint            varchar(20)   NULL,
    fpickuptime           time          NULL,
    fflightno             varchar(20)   NULL,
    fbaggage              varchar(2)    NULL,
    ftourairlineid        varchar(10)   NULL,
    fdescription          varchar(40)   NULL,
    fposteddate           timestamp     NULL,
    femail                varchar(50)   NULL,
    fmobileno             varchar(20)   NULL,
    ffarebasis            varchar(8)    NULL,
    fpvatamt              numeric(18,2) NULL DEFAULT 0,
    fbookingofficeid      varchar(15)   NULL,
    fprintingofficeid     varchar(15)   NULL,
    finvnote              varchar(60)   NULL,
    fempid                varchar(10)   NULL,
    fcommvatamt           numeric(18,2) NULL DEFAULT 0,
    fscommamt             numeric(18,2) NULL DEFAULT 0,
    famex                 boolean       NULL DEFAULT false,
    ffileseqno            varchar(9)    NULL,
    famexgendate          timestamp     NULL,
    fmobile               varchar(20)   NULL,
    fnvtaxamt             numeric(18,2) NULL DEFAULT 0,
    fsupplieramtlcvat     numeric(18,2) NULL DEFAULT 0,
    fnationalityid        varchar(4)    NULL,
    fpaysupplierid        varchar(12)   NULL,
    freturndate           timestamp     NULL,
    fiqamano              varchar(20)   NULL,
    fempno                varchar(20)   NULL,
    fcoamexcard           boolean       NULL DEFAULT false,
    fcommtype             varchar(2)    NULL,
    fgroupid              varchar(6)    NULL,
    fcommvatreceived      varchar(2)    NULL,
    fcommamtexclvat       numeric(18,2) NULL DEFAULT 0,
    fcalccommvatamt       numeric(18,2) NULL DEFAULT 0,
    ffop                  varchar(10)   NULL,
    ftourinvtype          varchar(5)    NULL,
    fsupplierinvno        varchar(30)   NULL,
    fsupplierinvdate      timestamp     NULL,
    ftoursuppliername     varchar(100)  NULL,
    fkbaccountid          varchar(12)   NULL,
    fcopied               boolean       NULL DEFAULT false,
    fistaffid             varchar(4)    NULL,
    fbgdsstaffid          varchar(6)    NULL,
    frevenueaccountid     varchar(12)   NULL,
    fhotelconfno          varchar(20)   NULL,
    fsupfee               numeric(18,2) NULL DEFAULT 0,
    fsupfeevatamt         numeric(18,2) NULL DEFAULT 0,
    fsupplieramtcc        numeric(18,2) NULL DEFAULT 0,
    fsupplieramtcash      numeric(18,2) NULL DEFAULT 0,
    fsupplieramtep        numeric(18,2) NULL DEFAULT 0,
    fmerchant             varchar(4)    NULL,
    fserviceid            varchar(4)    NULL,
    fserviceidsub         varchar(4)    NULL,
    fctacardtype          varchar(4)    NULL,
    fccno                 varchar(15)   NULL,
    fcctype               varchar(5)    NULL,
    fmcexported           boolean       NULL DEFAULT false,
    CONSTRAINT pk_tblticketsales PRIMARY KEY (fcoid, fyear, fbrid, ftickettypeid, fticketslno, frevno)
);

-- ---------------------------------------------------------------------
-- tblTicketSalesB
-- ---------------------------------------------------------------------
CREATE TABLE dbo.tblticketsalesb (
    fcoid                  varchar(3)    NOT NULL,
    fyear                  varchar(4)    NOT NULL DEFAULT '0',
    fbrid                  varchar(3)    NOT NULL,
    ftickettypeid          varchar(4)    NOT NULL,
    fticketslno            varchar(12)   NOT NULL,
    frevno                 smallint      NOT NULL,
    fservicetypegroupid    varchar(4)    NOT NULL,
    fticketno              varchar(18)   NULL,
    fdate                  timestamp     NULL,
    fcustomerid            varchar(12)   NULL,
    fdivid                 varchar(4)    NULL,
    fbusinesstypeid        varchar(3)    NULL,
    ftotfare               numeric(18,2) NULL,
    ftaxamt                numeric(18,2) NULL DEFAULT 0,
    fh_agencycharge        numeric(18,2) NULL DEFAULT 0,
    fh_scvatamt            numeric(18,2) NULL DEFAULT 0,
    fh_agencychargewovat   numeric(18,2) NULL DEFAULT 0,
    fagencycharge          numeric(18,2) NULL DEFAULT 0,
    fscvatamt              numeric(18,2) NULL DEFAULT 0,
    fagencychargewovat     numeric(18,2) NULL DEFAULT 0,
    fvatamt                numeric(18,2) NULL DEFAULT 0,
    fbillingamt            numeric(18,2) NULL DEFAULT 0,
    finvoiced              boolean       NULL DEFAULT false,
    finvtype               varchar(5)    NULL,
    finvno                 varchar(15)   NULL,
    finvslno               smallint      NULL DEFAULT 0,
    finvdate               timestamp     NULL,
    finvfromdate           timestamp     NULL,
    finvtodate             timestamp     NULL,
    forigin                varchar(2)    NULL,
    freported              boolean       NULL DEFAULT false,
    fvatper                numeric(18,2) NULL DEFAULT 0,
    finvdi                 varchar(1)    NULL,
    ffileseqno             varchar(9)    NULL,
    fctafilegen            boolean       NULL DEFAULT false,
    fctafilegendate        timestamp     NULL,
    finvdatetime           timestamp     NULL,
    fmergetoinvslno        smallint      NULL DEFAULT 0,
    finvmergeuserid        varchar(30)   NULL,
    finvmergeuserdate      timestamp     NULL,
    fservicechargetype     varchar(2)    NULL,
    fservicechargeper      numeric(18,2) NULL DEFAULT 0,
    finvrcnnote            varchar(100)  NULL,
    finvuserid             varchar(30)   NULL,
    fzatcacleared          boolean       NULL DEFAULT false,
    fdatabeforezatca       boolean       NULL DEFAULT false,
    finvoicetox            varchar(80)   NULL,
    fvatnox                varchar(15)   NULL,
    fmf                    numeric(18,2) NULL,
    fmfwovat               numeric(18,2) NULL DEFAULT 0,
    fmfvatamt              numeric(18,2) NULL DEFAULT 0,
    frefno                 varchar(30)   NULL,
    frefno1                varchar(30)   NULL,
    frefno2                varchar(30)   NULL,
    frefno3                varchar(30)   NULL,
    frefno4                varchar(30)   NULL,
    finvmethod             varchar(5)    NULL,
    fcuserid               varchar(30)   NULL,
    fcuserdate             date          NULL,
    fmuserid               varchar(30)   NULL,
    fmuserdate             date          NULL,
    CONSTRAINT pk_tblticketsalesb PRIMARY KEY (fcoid, fyear, fbrid, ftickettypeid, fticketslno, frevno)
);

-- ---------------------------------------------------------------------
-- tblTicketSalesCnj
-- ---------------------------------------------------------------------
CREATE TABLE dbo.tblticketsalescnj (
    fcoid                varchar(3)   NOT NULL,
    fyear                varchar(4)   NOT NULL,
    fbrid                varchar(3)   NOT NULL,
    ftickettypeid        varchar(4)   NOT NULL,
    ftktslno             varchar(12)  NOT NULL,
    fcnjtktslno          varchar(12)  NOT NULL,
    frevno               smallint     NOT NULL,
    fservicetypegroupid  varchar(4)   NOT NULL,
    fcnjtktno            varchar(20)  NULL,
    froute               varchar(19)  NULL,
    fcustroute           varchar(19)  NULL,
    fclass               varchar(8)   NULL,
    fcustclass           varchar(8)   NULL,
    fcarrier             varchar(8)   NULL,
    finvslno             integer      NULL,
    ffileseqno           varchar(9)   NULL,
    ftransid             varchar(20)  NULL,
    fmergetoinvslno      smallint     NULL,
    CONSTRAINT pk_tblticketsalescnj PRIMARY KEY (fcoid, fyear, fbrid, ftickettypeid, ftktslno, fcnjtktslno)
);

-- ---------------------------------------------------------------------
-- tblTicketType (the source has no primary key; one is added here)
-- ---------------------------------------------------------------------
CREATE TABLE dbo.tbltickettype (
    fcoid                varchar(3)  NOT NULL,
    ftickettypeid        varchar(4)  NOT NULL,
    ftickttypename       varchar(30) NULL,
    fservicetypegroupid  varchar(4)  NULL,
    fpositionno          smallint    NULL,
    fcuserid             varchar(30) NULL,
    fcuserdate           timestamp   NULL,
    fmuserid             varchar(30) NULL,
    fmuserdate           timestamp   NULL,
    CONSTRAINT pk_tbltickettype PRIMARY KEY (fcoid, ftickettypeid)
);

-- =====================================================================
-- DATA
-- =====================================================================

INSERT INTO dbo.tblairline
  (fcoid, fairlineno, fairlinename, fairlinecode, fvatoncommission, fcuserid, fcuserdate, fmuserid, fmuserdate)
VALUES
  ('01', '065', 'Saudi Airlines', 'SV', NULL, NULL, NULL, NULL, NULL),
  ('01', '072', 'Gulf Air',       'GF', NULL, NULL, NULL, NULL, NULL),
  ('01', '098', 'Air India',      'AI', NULL, NULL, NULL, NULL, NULL);

INSERT INTO dbo.tblcustdivision
  (fcoid, fcustomerid, fdivid, fdivname, fdivname_ar, fcuserid, fcuserdate, fmuserid, fmuserdate)
VALUES
  ('01', '60001', '01', 'Div 01-60001', NULL, NULL, NULL, NULL, NULL),
  ('01', '60001', '02', 'Div 02-60001', NULL, NULL, NULL, NULL, NULL),
  ('01', '60002', '01', 'Div 01-60002', NULL, NULL, NULL, NULL, NULL);

INSERT INTO dbo.tbliata
  (fcoid, fiatacode, fiataname, fbsppurchase_csaccountid, fvoidsales_csaccountid,
   fpaxccsales_csaccountid, fcashsales_csaccountid, fpositionno, fcuserid, fcuserdate, fmuserid, fmuserdate)
VALUES
  ('01', '71202088', 'Jeddah', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
  ('01', '71303088', 'Riyadh', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
  ('01', 'NA',       NULL,     NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO dbo.tblservicetype
  (fcoid, fservicetypeid, fservicetypegroupid, fservicetypename, fctacarriercode,
   fcuserid, fcuserdate, fmuserid, fmuserdate, fpositionno)
VALUES
  ('01', 'CAR',  'OS',  'Car Rental',           NULL, NULL, NULL, NULL, NULL, 21),
  ('01', 'FER',  'OS',  'Ferries',              NULL, NULL, NULL, NULL, NULL, 25),
  ('01', 'HTL',  'HTL', 'Hotel',                NULL, NULL, NULL, NULL, NULL, 11),
  ('01', 'IDL',  'OS',  'Intl Driving License', NULL, NULL, NULL, NULL, NULL, 24),
  ('01', 'LIM',  'OS',  'Limosine',             NULL, NULL, NULL, NULL, NULL, 22),
  ('01', 'M&G',  'OS',  'Meet & Greet',         NULL, NULL, NULL, NULL, NULL, 23),
  ('01', 'RAIL', 'OS',  'Rail Ticket',          NULL, NULL, NULL, NULL, NULL, 26),
  ('01', 'REI',  'TKT', 'Re-Issue',             NULL, NULL, NULL, NULL, NULL, 2),
  ('01', 'TKT',  'TKT', 'Air Ticket',           NULL, NULL, NULL, NULL, NULL, 1),
  ('01', 'TOUR', 'OS',  'TOUR',                 NULL, NULL, NULL, NULL, NULL, 29),
  ('01', 'TRP',  'OS',  'Transportation',       NULL, NULL, NULL, NULL, NULL, 27),
  ('01', 'VI',   'OS',  'Vissa',                NULL, NULL, NULL, NULL, NULL, 28),
  ('01', 'VOID', 'TKT', 'Void',                 NULL, NULL, NULL, NULL, NULL, 3);

INSERT INTO dbo.tblservicetypegroup
  (fcoid, fservicetypegroupid, fservicetypegroupname, fpositionno, fcuserid, fcuserdate, fmuserid, fmuserdate)
VALUES
  ('01', 'HTL', 'Accomodation',  2, NULL, NULL, NULL, NULL),
  ('01', 'OS',  'Other Service', 3, NULL, NULL, NULL, NULL),
  ('01', 'TKT', 'Air Ticket',    1, NULL, NULL, NULL, NULL);

INSERT INTO dbo.tbltickettype
  (fcoid, ftickettypeid, ftickttypename, fservicetypegroupid, fpositionno, fcuserid, fcuserdate, fmuserid, fmuserdate)
VALUES
  ('01', 'B',   'BSP',    'TKT', 1,  NULL, NULL, NULL, NULL),
  ('01', 'O',   'Online', 'TKT', 2,  NULL, NULL, NULL, NULL),
  ('01', 'ADM', 'ADM',    'TKT', 11, NULL, NULL, NULL, NULL),
  ('01', 'ACM', 'ACM',    'TKT', 12, NULL, NULL, NULL, NULL),
  ('01', 'X',   'XO',     'TKT', 3,  NULL, NULL, NULL, NULL),
  ('01', 'D',   'Dummy',  'TKT', 4,  NULL, NULL, NULL, NULL);
