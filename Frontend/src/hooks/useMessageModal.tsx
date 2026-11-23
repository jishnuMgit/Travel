import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import MessageModal, { type MessageType } from "../components/common/MessageModal";

interface QueuedMessage {
  id: number;
  type: MessageType;
  message: ReactNode;
}

/* A message window instead of a toast (a port of STOCK's hook):
     const { notify, dialog } = useMessageModal("Ticket Sales");
     notify.success("Saved successfully");   // also error / warning / info
     ... {dialog}
   The messages wait in a queue: each one is closed (OK / Enter / Esc) before the next one shows. */
export const useMessageModal = (title?: string) => {
  const [queue, setQueue] = useState<QueuedMessage[]>([]);
  const idRef = useRef(0);

  const push = useCallback((type: MessageType, message: ReactNode) => {
    idRef.current += 1;
    const id = idRef.current;
    setQueue((current) => [...current, { id, type, message }]);
  }, []);

  const close = useCallback(() => setQueue((current) => current.slice(1)), []);

  // the same method names as react-toastify (warn -> warning), and a stable reference
  const notify = useMemo(
    () => ({
      success: (m: ReactNode) => push("success", m),
      error: (m: ReactNode) => push("error", m),
      warning: (m: ReactNode) => push("warning", m),
      info: (m: ReactNode) => push("info", m),
    }),
    [push],
  );

  const current = queue[0];

  const dialog = (
    <MessageModal
      key={current?.id}
      open={!!current}
      type={current?.type}
      title={title}
      message={current?.message ?? ""}
      onClose={close}
    />
  );

  return { notify, dialog };
};
