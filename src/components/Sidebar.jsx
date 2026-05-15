import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  ShoppingCart,
  Truck,
  Package,
  Syringe,
  ClipboardList,
  BarChart3,
  Building2,
  Pill,
  FileText,
  LogOut,
  Menu,
  X,
  User,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { to: "/", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/orders", icon: ShoppingCart, label: "Orders" },
    { to: "/receive", icon: Truck, label: "Receive Order" },
    { to: "/stock", icon: Package, label: "Stock" },
    // { to: "/dispense", icon: Syringe, label: "Dispense" },
    { to: "/dispense-requests", icon: ClipboardList, label: "Pick List" },
    { to: "/analytics", icon: BarChart3, label: "Analytics" },
    { to: "/companies", icon: Building2, label: "Suppliers" },
    { to: "/drugs", icon: Pill, label: "Drugs" },
    { to: "/reports", icon: FileText, label: "Reports" },
    { to: "/profile", icon: User, label: "Profile" },
  ];

  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile menu button - Uses Emerald Theme */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 rounded-xl shadow-lg shadow-emerald-600/30 transition-all duration-200 active:scale-95"
      >
        {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Sidebar Layout Layer */}
      <aside
        className={`
          h-full bg-slate-950 text-slate-100 flex flex-col border-r border-slate-900 transition-all duration-300 ease-in-out
          
          /* MOBILE Context */
          fixed top-0 left-0 z-50
          ${isMobileMenuOpen ? "translate-x-0 w-64" : "-translate-x-full"}
          
          /* DESKTOP Context */
          lg:relative lg:translate-x-0 lg:z-0
          ${isCollapsed ? "lg:w-20" : "lg:w-64"}
        `}
      >
        {/* Header / Logo - Emerald & Mint Accents */}
        <div className="h-20 px-4 border-b border-slate-900 flex items-center justify-between bg-slate-950/50 backdrop-blur-md overflow-hidden whitespace-nowrap">
          <div className="flex items-center gap-2.5 mx-auto lg:mx-0 pl-2">
            <div className="p-2 bg-emerald-600/10 rounded-lg text-emerald-400 border border-emerald-500/20 shrink-0">
              <Pill size={20} className="animate-pulse text-emerald-400" />
            </div>
            <span
              className={`font-semibold text-lg tracking-wide bg-gradient-to-r from-white via-slate-100 to-emerald-400 bg-clip-text text-transparent transition-opacity duration-200 ${
                isCollapsed ? "lg:opacity-0 lg:w-0" : "opacity-100"
              }`}
            >
              PharmaManager
            </span>
          </div>
          {isMobileMenuOpen && (
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* User Profile Card - Emerald Gradient Profile Icon */}
        <div
          className={`p-3 mx-3 my-4 bg-slate-900/40 border border-slate-900 rounded-xl flex items-center gap-3 transition-all duration-200 ${
            isCollapsed ? "lg:justify-center lg:px-0" : ""
          }`}
        >
          <div className="h-10 w-10 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center font-bold text-white shadow-md shadow-emerald-600/20 shrink-0">
            {user?.name ? (
              user.name.charAt(0).toUpperCase()
            ) : (
              <User size={18} />
            )}
          </div>
          <div
            className={`overflow-hidden transition-all duration-200 ${
              isCollapsed ? "lg:w-0 lg:opacity-0" : "w-full opacity-100"
            }`}
          >
            <p className="font-medium text-sm text-slate-200 truncate">
              {user?.name || "Admin Account"}
            </p>
            <p className="text-xs text-slate-400 truncate">
              {user?.email || "admin@pharmacy.com"}
            </p>
          </div>
        </div>

        {/* Navigation Links - Emerald Hover & Active States */}
        <nav
          className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          <style>{`
            nav::-webkit-scrollbar {
              display: none;
            }
          `}</style>

          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={handleLinkClick}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 group relative ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 border border-emerald-500/30"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/60"
                } ${isCollapsed ? "lg:justify-center lg:px-0 lg:h-11 lg:w-11 lg:mx-auto" : ""}`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    size={18}
                    className={`transition-transform duration-200 group-hover:scale-110 shrink-0 ${
                      isActive
                        ? "text-white"
                        : "text-slate-400 group-hover:text-emerald-400"
                    }`}
                  />
                  <span
                    className={`transition-all duration-200 whitespace-nowrap ${
                      isCollapsed ? "lg:hidden" : "opacity-100"
                    }`}
                  >
                    {item.label}
                  </span>

                  {/* Desktop Hover Tooltips */}
                  {isCollapsed && (
                    <div className="hidden lg:block absolute left-full rounded-md px-2 py-1 ml-6 bg-slate-950 text-slate-200 text-xs font-normal whitespace-nowrap opacity-0 -translate-x-3 group-hover:translate-x-0 group-hover:opacity-100 transition-all pointer-events-none border border-slate-900 shadow-xl z-50">
                      {item.label}
                    </div>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer Panel Operations */}
        <div className="p-3 border-t border-slate-900 bg-slate-950/60 space-y-1">
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-200 w-full group relative ${
              isCollapsed
                ? "lg:justify-center lg:px-0 lg:h-11 lg:w-11 lg:mx-auto"
                : ""
            }`}
          >
            <LogOut
              size={18}
              className="transition-transform duration-200 group-hover:-translate-x-0.5 group-hover:text-rose-400 shrink-0"
            />
            <span
              className={`transition-all duration-200 ${isCollapsed ? "lg:hidden" : "opacity-100"}`}
            >
              Logout
            </span>

            {/* Collapsed Tooltip */}
            {isCollapsed && (
              <div className="hidden lg:block absolute left-full rounded-md px-2 py-1 ml-6 bg-slate-950 text-rose-400 text-xs font-normal whitespace-nowrap opacity-0 -translate-x-3 group-hover:translate-x-0 group-hover:opacity-100 transition-all pointer-events-none border border-slate-900 shadow-xl z-50">
                Logout
              </div>
            )}
          </button>

          {/* Expand/Collapse Trigger */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex items-center justify-center w-11 h-11 mx-auto rounded-xl text-slate-500 hover:text-emerald-400 hover:bg-slate-900/40 transition-all duration-200 cursor-pointer"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight size={20} />
            ) : (
              <ChevronLeft size={20} />
            )}
          </button>
        </div>
      </aside>

      {/* Screen Backdrop Overlay for Mobile screens */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-30 lg:hidden transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
