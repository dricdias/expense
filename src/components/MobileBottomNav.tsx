import { Button } from "@/components/ui/button";
import { Home, Users } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const MobileBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Ocultar na página de autenticação
  if (location.pathname === "/auth") return null;

  const links = [
    { label: "Home", href: "/", icon: Home },
    { label: "Grupos", href: "/groups", icon: Users },
  ];

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  return (
    <div className="fixed bottom-0 inset-x-0 md:hidden z-40">
      <div className="mx-auto max-w-7xl px-4 pb-4 pt-2">
        <div className="rounded-2xl border border-white/20 dark:border-white/10 bg-white/10 dark:bg-neutral-900/40 backdrop-blur-xl shadow-smooth flex items-center justify-around px-2 py-2">
          {links.map(({ label, href, icon: Icon }) => (
            <Button
              key={href}
              variant="ghost"
              className={`flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-2 ${isActive(href) ? "bg-white/20 dark:bg-white/10 text-foreground" : "hover:bg-white/10"}`}
              onClick={() => navigate(href)}
              aria-current={isActive(href) ? "page" : undefined}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs">{label}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MobileBottomNav;