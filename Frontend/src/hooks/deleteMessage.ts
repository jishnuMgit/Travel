// The common message of a delete (the same on every screen, as hooks/useDeleteToast.ts of STOCK):
//   notify.success(deleteSuccessMessage("Ticket Sales"))  ->  "Ticket Sales deleted successfully"
export const deleteSuccessMessage = (formName?: string) =>
  formName ? `${formName} deleted successfully` : "Deleted successfully";

export const DELETE_FAILED_MESSAGE = "Not deleted, try again";

// The question window of a delete: the title of the screen and the Delete / Cancel buttons (as the Payment screen of STOCK).
export const deleteConfirm = (message: string, title = "Ticket Sales") => ({
  title,
  message,
  confirmLabel: "Delete",
  cancelLabel: "Cancel",
});
