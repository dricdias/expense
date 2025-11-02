import { Button } from "@/components/ui/button";
import { Home, Users } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ThemeSwitcher } from "@/components/apple-liquid-glass-switcher";

const MobileBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [hasFilter, setHasFilter] = useState(false);

  useEffect(() => {
    // Verifica se o filtro SVG está presente no DOM
    const exists = !!document.getElementById("switcher");
    setHasFilter(exists);
  }, []);

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
      {/* Renderiza o filtro do efeito líquido sem exibir o switcher */}
      <div style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}>
        <ThemeSwitcher />
      </div>
      <div className="mx-auto max-w-7xl px-4 pb-4 pt-2">
        <div
          className="rounded-2xl border border-white/40 dark:border-white/20 bg-white/70 dark:bg-neutral-900/80 backdrop-blur-lg shadow-lg flex items-center justify-around px-2 py-2"
        >
          {links.map(({ label, href, icon: Icon }) => (
            <Button
              key={href}
              variant="ghost"
              className={`flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-2 ${
                isActive(href)
                  ? "text-emerald-700 dark:text-emerald-400 bg-white/80 dark:bg-neutral-800/80 hover:bg-emerald-600/20 dark:hover:bg-emerald-500/20"
                  : "text-neutral-800 dark:text-neutral-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-600/10 dark:hover:bg-emerald-500/10"
              }`}
              onClick={() => navigate(href)}
              aria-current={isActive(href) ? "page" : undefined}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{label}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MobileBottomNav;