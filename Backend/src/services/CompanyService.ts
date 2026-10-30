import pool from "../DB/db";

export type CompanyListRow = {
  fCoID: string;
  fCoName: string | null;
  fCoName_AR: string | null;
  fCoName_QR: string | null;
  fCoName_Short: string | null;
  fCoVATNo: string | null;
  fCoStatus: string | null;
  fPositionNo: number | null;
};

export const getCompanies = async (): Promise<CompanyListRow[]> => {
  const { rows } = await pool.query<CompanyListRow>(`
    SELECT
      fcoid AS "fCoID",
      fconame AS "fCoName",
      fconame_ar AS "fCoName_AR",
      fconame_qr AS "fCoName_QR",
      fconame_short AS "fCoName_Short",
      fcovatno AS "fCoVATNo",
      fcostatus AS "fCoStatus",
      fpositionno AS "fPositionNo"
    FROM dbo.tblcompany
    ORDER BY fpositionno, fcoid
  `);

  return rows;
};
