import { useLocation } from "react-router-dom";
import AuthImage from "../assets/login.png";

const AuthLayout = ({ children }) => {
  const location = useLocation();
  const path = location.pathname;

  let title = "";
  let subtitle = "";

  if (path === "/forgot-password") {
    title = "Forgot Password?";
    subtitle =
      "Don’t worry! It happens. Please enter the email associated with your account.";
  } else if (path === "/reset-password") {
    title = "Reset Password?";
    subtitle = "Please type something you’ll remember.";
  } else if (path === "/verify-code") {
    title = "Enter Verification Code";
    subtitle = "We’ve sent a verification code to xyz@gmail.com";
  }

  return (
    <div className="h-screen flex flex-col md:flex-row bg-white dark:bg-slate-950">
      <aside className="hidden md:flex w-1/2 relative" aria-label="Product preview">
        <img
          src={AuthImage}
          alt="Jitox agri ERP dashboard — orders, inventory, and accounts for distributors"
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
      </aside>

      <main className="w-full md:w-1/2 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 dark:bg-slate-950">
        <div className="max-w-md w-full ds-stack-major">
          {path === "/login" || path === "/register" ? (
            <header className="flex flex-col gap-2 text-left">
              <h1 className="lg:text-2xl text-3xl font-bold text-slate-900 dark:text-slate-100">
                {path === "/login"
                  ? "Welcome Back to "
                  : "Register Account to "}
                <span className="text-primary">Jitox Agro</span>
              </h1>
              <p className="text-sm text-light leading-relaxed">
                {path === "/login"
                  ? "Hello there, Login to continue"
                  : "Hello there, Register to continue"}
              </p>
              {path !== "/message-box" && (
                <hr className="border-light-border mt-8" />
              )}
            </header>
          ) : (
            <header className="flex flex-col gap-2 text-left">
              <h1 className="text-3xl font-bold text-gray-800 leading-snug dark:text-slate-100">
                {title}
              </h1>
              <p className="text-gray-600 text-sm mt-2 leading-relaxed dark:text-slate-400">
                {subtitle}
              </p>
              {path !== "/message-box" && (
                <hr className="border-light-border mt-8" />
              )}
            </header>
          )}
          {children}
        </div>
      </main>
    </div>
  );
};

export default AuthLayout;
