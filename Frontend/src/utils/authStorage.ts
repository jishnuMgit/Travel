export const AUTH_STATE_CHANGED_EVENT = "travel:auth-state-changed";

export const notifyAuthStateChanged = (): void => {
  window.dispatchEvent(new Event(AUTH_STATE_CHANGED_EVENT));
};

export const clearStoredUser = (): void => {
  localStorage.removeItem("PstrUserID");
  localStorage.removeItem("PstrCoID");
  localStorage.removeItem("PstrYear");
  localStorage.removeItem("userType");
};
