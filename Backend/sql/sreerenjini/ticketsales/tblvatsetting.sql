-- =====================================================================
-- What the VAT functions read (dbo.getvatper, dbo.getcommvatper, dbo.getvatoncommission)
-- the old tables / columns, converted to Postgres
--
--   dbo.tblvatsetting  the service charge VAT % of a document type + D/I
--                      (fservicetypeid = document type + D / I: TD, TI = ticket, HD, HI = hotel, OD, OI = other),
--                      and the % that was valid until fprevvatdate (the VAT change of 2020)
--   dbo.tblcompany.fcommvatper          the VAT % on the commission of the company
--   dbo.tblaccountcs.fcalcsupfeevat     the supplier calculates VAT on the Sup. Fee
--   dbo.tblaccountcs.fisservicechargepolicy   the customer has a service charge policy
-- tblairline.fvatoncommission (already there) = the airline has VAT on the commission
-- =====================================================================

CREATE TABLE IF NOT EXISTS dbo.tblvatsetting (
    fcoid           varchar(3)    NOT NULL,
    fslno           smallint      NOT NULL DEFAULT 0,
    fservicetypeid  varchar(4)    NOT NULL,
    fvatper         numeric(18,2) NULL DEFAULT 0,
    fuserid         varchar(20)   NULL,
    fuserdate       timestamp     NULL,
    fprevvatper     numeric(18,2) NULL DEFAULT 0,
    fprevvatdate    timestamp     NULL,
    CONSTRAINT pk_tblvatsetting PRIMARY KEY (fcoid, fslno, fservicetypeid)
);

INSERT INTO dbo.tblvatsetting
    (fcoid, fslno, fservicetypeid, fvatper, fuserid, fuserdate, fprevvatper, fprevvatdate)
VALUES
('01',1,'TD',15.00,'ADMIN','2017-12-12 16:41:36.830',15.00,'2020-06-30 00:00:00'),
('01',2,'TI',15.00,'ADMIN','2025-02-02 18:13:28.333',15.00,'2020-06-30 00:00:00'),
('01',3,'HD',15.00,'ADMIN','2018-01-19 13:26:01.050',15.00,'2020-06-30 00:00:00'),
('01',4,'HI',15.00,'ADMIN','2025-02-02 18:13:28.423',15.00,'2020-06-30 00:00:00'),
('01',5,'OD',15.00,'ADMIN','2018-01-19 21:07:51.130',15.00,'2020-06-30 00:00:00'),
('01',6,'OI',15.00,'ADMIN','2025-02-02 18:13:28.513',15.00,'2020-06-30 00:00:00'),
('02',1,'TD',15.00,'ADMIN','2017-12-12 16:41:36.830',15.00,'2020-06-30 00:00:00'),
('02',2,'TI',15.00,'ADMIN','2025-02-02 18:13:28.333',15.00,'2020-06-30 00:00:00'),
('02',3,'HD',15.00,'ADMIN','2018-01-19 13:26:01.050',15.00,'2020-06-30 00:00:00'),
('02',4,'HI',15.00,'ADMIN','2025-02-02 18:13:28.423',15.00,'2020-06-30 00:00:00'),
('02',5,'OD',15.00,'ADMIN','2018-01-19 21:07:51.130',15.00,'2020-06-30 00:00:00'),
('02',6,'OI',15.00,'ADMIN','2025-02-02 18:13:28.513',15.00,'2020-06-30 00:00:00')
ON CONFLICT (fcoid, fslno, fservicetypeid) DO NOTHING;

ALTER TABLE dbo.tblcompany   ADD COLUMN IF NOT EXISTS fcommvatper numeric(18,2) NULL;
ALTER TABLE dbo.tblaccountcs ADD COLUMN IF NOT EXISTS fcalcsupfeevat boolean NULL;
ALTER TABLE dbo.tblaccountcs ADD COLUMN IF NOT EXISTS fisservicechargepolicy boolean NULL;
