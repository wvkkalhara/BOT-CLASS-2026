import { useEffect, useState } from "react";
import { AppProvider, useApp } from "./store/AppStore";
import FxBackground from "./components/FxBackground";
import Landing from "./components/Landing";
import LoginModal from "./components/LoginModal";
import StudentDashboard from "./components/StudentDashboard";
import AdminDashboard from "./components/AdminDashboard";
import ToastHost from "./components/ToastHost";

function Shell() {
  const { session } = useApp();
  const [loginOpen, setLoginOpen] = useState(false);

  /* auto-close the login modal once a session exists */
  useEffect(() => {
    if (session) setLoginOpen(false);
  }, [session]);

  return (
    <>
      <FxBackground />
      {session?.kind === "admin" ? (
        <AdminDashboard />
      ) : session?.kind === "student" ? (
        <StudentDashboard />
      ) : (
        <Landing onLogin={() => setLoginOpen(true)} />
      )}
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      <ToastHost />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
