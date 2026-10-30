
import { useEffect, useState, type ReactNode } from "react";
import {
  BrowserRouter,
  Navigate,
  useLocation,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import NavShell from "./components/NavShell/NavShell";
import AppRoutes from "./routes/AppRoutes";
import { API_BASE_URL } from "./config/api";
import { AUTH_STATE_CHANGED_EVENT } from "./utils/authStorage";
import "./App.css";

type CurrentUserResponse = {
  success: boolean;
  data?: {
    userId: string;
    userType: string | null;
  };
  message?: string;
};

type AuthStatus = "checking" | "authenticated" | "unauthenticated" | "error";

const AppLayout = () => {
  const [authStatus, setAuthStatus] = useState<AuthStatus>("checking");
  const [authError, setAuthError] = useState("");
  const [authCheckKey, setAuthCheckKey] = useState(0);
  const { pathname } = useLocation();

  useEffect(() => {
    let active = true;
    let controller: AbortController | undefined;

    const checkAuthentication = async () => {
      controller?.abort();
      const requestController = new AbortController();
      controller = requestController;
      setAuthStatus("checking");
      setAuthError("");

      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          credentials: "include",
          signal: requestController.signal,
        });

        if (response.status === 401) {
          if (active && !requestController.signal.aborted) {
            setAuthStatus("unauthenticated");
          }
          return;
        }

        const result = (await response.json()) as CurrentUserResponse;

        if (!response.ok || !result.success || !result.data?.userId) {
          throw new Error(result.message ?? "Unable to verify your session");
        }

        if (active && !requestController.signal.aborted) {
          setAuthStatus("authenticated");
        }
      } catch (error: unknown) {
        if (
          requestController.signal.aborted ||
          (error instanceof DOMException && error.name === "AbortError")
        ) {
          return;
        }

        console.error("Authentication check failed:", error);
        if (active && !requestController.signal.aborted) {
          setAuthError(
            error instanceof Error
              ? error.message
              : "Unable to verify your session",
          );
          setAuthStatus("error");
        }
      }
    };

    const handleAuthStateChanged = () => {
      void checkAuthentication();
    };

    window.addEventListener(AUTH_STATE_CHANGED_EVENT, handleAuthStateChanged);
    void checkAuthentication();

    return () => {
      active = false;
      controller?.abort();
      window.removeEventListener(
        AUTH_STATE_CHANGED_EVENT,
        handleAuthStateChanged,
      );
    };
  }, [authCheckKey]);

  const isLogin = pathname === "/login";
  let page: ReactNode;

  if (isLogin) {
    if (authStatus === "authenticated") {
      page = <Navigate to="/ticket-sales" replace />;
    } else if (authStatus === "checking") {
      page = (
        <div className="flex min-h-screen items-center justify-center bg-slate-100 text-sm text-slate-600">
          Checking your session...
        </div>
      );
    } else {
      page = <AppRoutes />;
    }
  } else if (authStatus === "checking") {
    page = (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-sm text-slate-600">
        Checking your session...
      </div>
    );
  } else if (authStatus === "unauthenticated") {
    page = <Navigate to="/login" replace />;
  } else if (authStatus === "error") {
    page = (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-100 px-4 text-center">
        <p className="text-sm text-red-700" role="alert">
          {authError}
        </p>
        <button
          type="button"
          onClick={() => setAuthCheckKey((key) => key + 1)}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Retry
        </button>
      </div>
    );
  } else {
    page = (
      <NavShell>
        <AppRoutes />
      </NavShell>
    );
  }

  return (
    <>
      {page}
      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
      />
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

export default App;
