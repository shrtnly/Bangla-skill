import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  User,
  FileText,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const menuItems = [
    { label: "আমার কোর্স", path: "/learning", icon: BookOpen },
    { label: "ড্যাশবোর্ড", path: "/dashboard", icon: LayoutDashboard },
    { label: "আমার প্রোফাইল", path: "/profile", icon: User },
    { label: "রিসোর্স", path: "/resources", icon: FileText },
  ];

  return (
    <aside
      className={`fixed top-18 left-0 h-screen bg-[#212127] text-white border-r border-[#212127] transition-all duration-300 z-40
        ${collapsed ? "w-20" : "w-64"}`}
    >
      {/* Logo + Collapse Button */}
      <div
        className="flex items-center justify-between px-4 py-4 border-b border-[#212127]"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-12 text-white" />
          {!collapsed && <span className="font-bold text-lg">OptimaEx</span>}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-md hover:bg-[#7b4dc4]/50 transition"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5 text-white" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-white" />
          )}
        </button>
      </div>



      {/* Menu Items */}
      <nav className="flex flex-col mt-2 px-2 space-y-1 overflow-y-auto h-[calc(100vh-4rem)]">
        {menuItems.map(({ label, path, icon: Icon }) => (
          <Button
            key={path}
            variant="ghost"
            onClick={() => navigate(path)}
            className={`flex items-center gap-3 w-full justify-start text-base font-medium rounded-xl transition-all duration-200
              ${
                isActive(path)
                  ? "bg-[#7b4dc4] text-white"
                  : "text-white/90 hover:bg-[#7b4dc4]/10 hover:text-white"
              } ${collapsed ? "justify-center" : "px-4 py-3"}
            `}
          >
            <Icon className="w-5 h-5" />
            {!collapsed && <span>{label}</span>}
          </Button>
        ))}
      </nav>

      {/* Footer Section */}
      <div className="absolute bottom-0 left-0 w-full border-t border-[#7b4dc4]/10 p-4 flex items-center justify-center">
        {collapsed ? (
          <User className="w-5 h-5 text-white" />
        ) : (
          <span className="text-sm text-white/80">© 2025 Learn</span>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;