import { motion } from "framer-motion";
import { Outlet, useLocation } from "react-router-dom";
import { TopNav } from "@/components/layout/TopNav";

export function AppShell() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#0b1220] text-slate-100">
      <TopNav />
      <motion.main
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: "easeOut" }}
      >
        <Outlet />
      </motion.main>
    </div>
  );
}