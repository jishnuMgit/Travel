export const clearStoredUser = (): void => {
  localStorage.removeItem("PstrUserID");
  localStorage.removeItem("PstrCoID");
  localStorage.removeItem("PstrYear");
  localStorage.removeItem("userType");
};
