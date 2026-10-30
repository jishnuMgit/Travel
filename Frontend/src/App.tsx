
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
    const controller = new AbortController();
    let active = true;

    const checkAuthentication = async () => {
      setAuthStatus("checking");
      setAuthError("");

      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          credentials: "include",
          signal: controller.signal,
        });

        if (response.status === 401) {
          if (active) {
            setAuthStatus("unauthenticated");
          }
          return;
        }

        const result = (await response.json()) as CurrentUserResponse;

        if (!response.ok || !result.success || !result.data?.userId) {
          throw new Error(result.message ?? "Unable to verify your session");
        }

        if (active) {
          setAuthStatus("authenticated");
        }
      } catch (error: unknown) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        console.error("Authentication check failed:", error);
        if (active) {
          setAuthError(
            error instanceof Error
              ? error.message
              : "Unable to verify your session",
          );
          setAuthStatus("error");
        }
      }
    };

    void checkAuthentication();

    return () => {
      active = false;
      controller.abort();
    };
  }, [pathname, authCheckKey]);

  const isLogin = pathname === "/login";
  let page: ReactNode;

  if (isLogin) {
    page =
      authStatus === "authenticated" ? (
        <Navigate to="/ticket-sales" replace />
      ) : (
        <AppRoutes />
      );
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
