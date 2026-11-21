// ============================================================
// THE SERVER DATE - the common helper (the same as the STOCK project)
//
// The time of a save comes from the DATABASE server's clock, never from the browser's: the page asks for it
// (GET /api/datetime/server-date, the common DateTime controller) and sends it with the request, as `dtpServerDate`:
//
//     const dtpServerDate = await tryGetServerDate();
//     await saveTicketSales({ ..., dtpServerDate });
//
// The backend checks it (the format, and that it is close to its own clock) and the procedures write it on every row of
// the transaction (fcuserdate / fmuserdate and the user audit), so all the rows carry the same time. If the page sends
// none, or a wrong one, the backend uses its own.
// ============================================================

const api = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace(/\/$/, "");

// "YYYY-MM-DD HH:mm:ss" - the time of the database server
export async function getServerDate(): Promise<string> {
  const response = await fetch(`${api}/datetime/server-date`, { credentials: "include" });
  const result = await response.json();

  if (!response.ok || !result.success || !result.data?.serverDate) {
    throw new Error(result.message || "Could not get the server date");
  }

  return String(result.data.serverDate);
}

// The same, but never fails: "" when the server date cannot be had (the backend then uses its own time), so a save is
// never stopped by it.
export async function tryGetServerDate(): Promise<string> {
  try {
    return await getServerDate();
  } catch (error: unknown) {
    console.error("getServerDate error:", error);
    return "";
  }
}
