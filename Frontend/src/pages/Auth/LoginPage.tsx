import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import Select, { type StylesConfig } from "react-select";
import { API_BASE_URL } from "../../config/api";
import {
  FiArrowRight,
  FiBriefcase,
  FiCalendar,
  FiEye,
  FiEyeOff,
  FiLock,
  FiUser,
} from "react-icons/fi";
import "./LoginPage.css";
import selectComponents from "../../components/comman/selectComponents";
import { notifyAuthStateChanged } from "../../utils/authStorage";

type LoginResponse = {
  success: boolean;
  message?: string;
  data?: {
    txtUserID: string;
    pstrCOID: string;
    PstrYear: string;
    userType: string | null;
  };
};

type Company = {
  fCoID: string;
  fCoName: string | null;
  fCoName_Short: string | null;
};

type CompaniesResponse = {
  success: boolean;
  companies?: Company[];
  message?: string;
};

type Year = {
  fYear: string | number;
};

type SelectOption = {
  value: string;
  label: string;
};

type YearsResponse = {
  success: boolean;
  years?: Year[];
  message?: string;
};

const selectStyles: StylesConfig<SelectOption, false> = {
  container: (base) => ({
    ...base,
    flex: 1,
    minWidth: 0,
  }),
  control: (base, state) => ({
    ...base,
    minHeight: 25,
    height: 25,
    border: 0,
    borderRadius: 0,
    boxShadow: "none",
    backgroundColor: "transparent",
    cursor: state.isDisabled ? "wait" : "pointer",
    "&:hover": {
      border: 0,
    },
  }),
  valueContainer: (base) => ({
    ...base,
    height: 25,
    padding: "0 6px 0 10px",
    overflow: "hidden",
  }),
  input: (base) => ({
    ...base,
    margin: 0,
    padding: 0,
    color: "#334155",
    fontSize: 12,
  }),
  singleValue: (base) => ({
    ...base,
    margin: 0,
    color: "#334155",
    fontSize: 12,
  }),
  placeholder: (base) => ({
    ...base,
    margin: 0,
    color: "#718096",
    fontSize: 12,
  }),
  indicatorsContainer: (base) => ({
    ...base,
    height: 25,
  }),
  dropdownIndicator: (base) => ({
    ...base,
    padding: "0 7px",
    color: "#7186a1",
    "&:hover": {
      color: "#334155",
    },
  }),
  indicatorSeparator: () => ({
    display: "none",
  }),
  menu: (base) => ({
    ...base,
    zIndex: 10000,
    marginTop: 2,
    overflow: "hidden",
    border: "1px solid #cbd8e6",
    borderRadius: 6,
    boxShadow: "0 8px 18px rgba(15, 23, 42, 0.14)",
  }),
  menuList: (base) => ({
    ...base,
    padding: 3,
    maxHeight: 180,
  }),
  option: (base, state) => ({
    ...base,
    padding: "7px 9px",
    backgroundColor: state.isSelected
      ? "#dff7ec"
      : state.isFocused
        ? "#f1faf6"
        : "#fff",
    color: "#334155",
    fontSize: 12,
    cursor: "pointer",
    ":active": {
      backgroundColor: "#dff7ec",
    },
  }),
  menuPortal: (base) => ({
    ...base,
    zIndex: 10000,
  }),
};

const LoginPage = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyId, setCompanyId] = useState("");
  const [years, setYears] = useState<Year[]>([]);
  const [year, setYear] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);
  const [isLoadingYears, setIsLoadingYears] = useState(false);
  const [companiesError, setCompaniesError] = useState("");
  const [yearsError, setYearsError] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const companyOptions: SelectOption[] = companies.map((company) => ({
    value: company.fCoID,
    label:
      company.fCoName_Short || company.fCoName || company.fCoID,
  }));
  const yearOptions: SelectOption[] = years.map((yearOption) => ({
    value: String(yearOption.fYear),
    label: String(yearOption.fYear),
  }));

  useEffect(() => {
    const controller = new AbortController();

    const loadCompanies = async () => {
      setIsLoadingCompanies(true);
      setCompaniesError("");

      try {
        const response = await fetch(`${API_BASE_URL}/api/companies`, {
          credentials: "include",
          signal: controller.signal,
        });
        const result = (await response.json()) as CompaniesResponse;

        if (!response.ok || !result.success || !result.companies) {
          throw new Error(result.message ?? "Failed to load companies");
        }

        setCompanies(result.companies);
        setCompanyId((selectedCompanyId) =>
          result.companies?.some(
            (company) => company.fCoID === selectedCompanyId,
          )
            ? selectedCompanyId
            : (result.companies?.[0]?.fCoID ?? ""),
        );
      } catch (error: unknown) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        console.error("Company list request failed:", error);
        setCompaniesError(
          error instanceof Error
            ? error.message
            : "Unable to load companies. Please try again.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingCompanies(false);
        }
      }
    };

    void loadCompanies();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!companyId) {
      return;
    }

    const controller = new AbortController();

    const loadYears = async () => {
      setIsLoadingYears(true);
      setYearsError("");
      setYears([]);
      setYear("");

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/years?companyId=${encodeURIComponent(companyId)}`,
          {
            credentials: "include",
            signal: controller.signal,
          },
        );
        const result = (await response.json()) as YearsResponse;

        if (!response.ok || !result.success || !result.years) {
          throw new Error(result.message ?? "Failed to load years");
        }

        setYears(result.years);
        setYear(result.years[0] ? String(result.years[0].fYear) : "");
      } catch (error: unknown) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        console.error("Year list request failed:", error);
        setYearsError(
          error instanceof Error
            ? error.message
            : "Unable to load years. Please try again.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingYears(false);
        }
      }
    };

    void loadYears();

    return () => controller.abort();
  }, [companyId]);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          pstrCOID: companyId,
          PstrYear: year,
          PstrUserID: userId,
          txtPwd: password,
        }),
      });
      const result = (await response.json()) as LoginResponse;

      if (!response.ok || !result.success) {
        setErrorMessage(result.message ?? "Login failed. Please try again.");
        return;
      }

      if (result.data) {
        localStorage.setItem("PstrUserID", result.data.txtUserID);
        localStorage.setItem("PstrCoID", result.data.pstrCOID);
        localStorage.setItem("PstrYear", result.data.PstrYear);
        if (result.data.userType) {
          localStorage.setItem("userType", result.data.userType);
        }
      }

      notifyAuthStateChanged();
      navigate("/ticket-sales", { replace: true });
    } catch (error: unknown) {
      console.error("Login request failed:", error);
      setErrorMessage("Unable to connect to the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-card-heading">
          <h1 id="login-title">Login</h1>
        </div>

        <div className="login-card-body">
          <div className="login-banner">
           <span className="text-black ml-10 font-[14px]"> Please login to connect</span>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            <div className="login-fields">
              <div className="login-row">
                <label
                  htmlFor="login-user-id"
                  className="login-label"
                >
                  User ID :
                </label>
                <div className="login-control">
                  <span className="login-icon">
                    <FiUser size={16} />
                  </span>
                  <input
                    id="login-user-id"
                    type="text"
                    className="login-input"
                    autoComplete="username"
                    maxLength={100}
                    required
                    value={userId}
                    onChange={(event) => setUserId(event.target.value)}
                  />
                </div>
              </div>

              <div className="login-row">
                <label
                  htmlFor="login-password"
                  className="login-label"
                >
                  Password :
                </label>
                <div className="login-control">
                  <span className="login-icon">
                    <FiLock size={16} />
                  </span>
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    className="login-input login-password-input"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((value) => !value)}
                    className="login-password-toggle"
                  >
                    {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
              </div>

              <div className="login-row">
                <label
                  htmlFor="login-company"
                  className="login-label"
                >
                  Company :
                </label>
                <div className="login-control">
                  <span className="login-icon">
                    <FiBriefcase size={16} />
                  </span>
                  <div className="login-select-container">
                    <Select<SelectOption, false>
                      inputId="login-company"
                      instanceId="login-company-select"
                      aria-label="Company"
                      options={companyOptions}
                      value={
                        companyOptions.find(
                          (option) => option.value === companyId,
                        ) ?? null
                      }
                      onChange={(option) =>
                        setCompanyId(option?.value ?? "")
                      }
                      isDisabled={
                        isLoadingCompanies || companyOptions.length === 0
                      }
                      isLoading={isLoadingCompanies}
                      components={selectComponents}
                      isSearchable
                      isClearable={false}
                      placeholder={
                        isLoadingCompanies
                          ? "Loading companies..."
                          : "Select company"
                      }
                      noOptionsMessage={() => "No companies available"}
                      styles={selectStyles}
                      menuPosition="fixed"
                      menuPortalTarget={
                        typeof document !== "undefined"
                          ? document.body
                          : undefined
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="login-row">
                <label
                  htmlFor="login-year"
                  className="login-label"
                >
                  Year :
                </label>
                <div className="login-control login-control-year">
                  <span className="login-icon">
                    <FiCalendar size={16} />
                  </span>
                  <div className="login-select-container">
                    <Select<SelectOption, false>
                      inputId="login-year"
                      instanceId="login-year-select"
                      aria-label="Year"
                      options={yearOptions}
                      value={
                        yearOptions.find(
                          (option) => option.value === year,
                        ) ?? null
                      }
                      onChange={(option) => setYear(option?.value ?? "")}
                      isDisabled={isLoadingYears || yearOptions.length === 0}
                      isLoading={isLoadingYears}
                      components={selectComponents}
                      isSearchable={false}
                      isClearable={false}
                      placeholder={
                        isLoadingYears ? "Loading years..." : "Select year"
                      }
                      noOptionsMessage={() => "No years available"}
                      styles={selectStyles}
                      menuPosition="fixed"
                      menuPortalTarget={
                        typeof document !== "undefined"
                          ? document.body
                          : undefined
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            {errorMessage && (
              <p
                className="login-error"
                role="alert"
              >
                {errorMessage}
              </p>
            )}
            {companiesError && (
              <p
                className="login-error"
                role="alert"
              >
                {companiesError}
              </p>
            )}
            {yearsError && (
              <p
                className="login-error"
                role="alert"
              >
                {yearsError}
              </p>
            )}

            <button
              type="submit"
              disabled={
                isSubmitting ||
                isLoadingCompanies ||
                isLoadingYears ||
                companies.length === 0 ||
                !companyId ||
                !year
              }
              className="login-submit"
            >
              <FiArrowRight size={16} />
              {isSubmitting ? "Logging in..." : "Login"}
            </button>
            <div className="login-footer">
              <span>Secure access</span>
              <i aria-hidden="true" />
              <span>Reliable records</span>
              <i aria-hidden="true" />
              <span>Smart decisions</span>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
};

export default LoginPage;
