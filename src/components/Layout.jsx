import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

const Layout = () => {
  // Lift the collapse state to layout so sidebar and main content live in perfect harmony
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-screen w-screen bg-slate-50 overflow-hidden select-none">
      {/* Sidebar Layout Slot - Pushes main view to the right naturally */}
      <div className="flex-shrink-0 z-40 h-full">
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      </div>

      {/* Main Content Pane - Zero structural overlaps, isolated scrolling window */}
      <main className="flex-1 min-w-0 h-full overflow-y-auto p-6 lg:p-10 pt-20 lg:pt-10">
        <div className="max-w-[1600px] mx-auto w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
