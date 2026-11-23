-- The user audit action gets a second character: D1 = one line of a ticket was deleted (an attached file of the Customer
-- Attach popup, a line of the Sales Conjunction popup). S save, M modify, D delete, D1 delete one line.
-- Run it in pgAdmin BEFORE using the x of the two popups (the old column was varchar(1): "D1" does not fit).
ALTER TABLE dbo.tbluseraudit ALTER COLUMN faction TYPE varchar(2);
