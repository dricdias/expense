import { Button } from "@/components/ui/button";
import { Receipt, Home, Users, LogOut } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();

  const isActive = (path: string) => {
    if (path === "/groups") {
      return location.pathname === "/groups" || location.pathname.startsWith("/groups/");
    }
    return location.pathname === path;
  };

  return (
    <header className="bg-gradient-primary text-primary-foreground shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div 
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => navigate("/")}
            >
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Receipt className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">RachaDespesas</h1>
                <p className="text-sm text-primary-foreground/80">Split expenses easily</p>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-2">
              <Button
                variant="ghost"
                className={`text-primary-foreground hover:bg-white/10 ${
                  isActive("/") ? "bg-white/20" : ""
                }`}
                onClick={() => navigate("/")}
              >
                <Home className="w-4 h-4 mr-2" />
                Início
              </Button>
              <Button
                variant="ghost"
                className={`text-primary-foreground hover:bg-white/10 ${
                  isActive("/groups") ? "bg-white/20" : ""
                }`}
                onClick={() => navigate("/groups")}
              >
                <Users className="w-4 h-4 mr-2" />
                Grupos
              </Button>
            </nav>
          </div>

          <Button
            onClick={signOut}
            size="lg"
            variant="ghost"
            className="text-primary-foreground hover:bg-white/10"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};
