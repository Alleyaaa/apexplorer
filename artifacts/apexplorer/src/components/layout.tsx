import { Link, useLocation } from "wouter";
import { 
  Activity, 
  TerminalSquare, 
  FolderSearch, 
  BookMarked,
  LayoutDashboard
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHealthCheck } from "@workspace/api-client-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: health } = useHealthCheck();

  const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "API Explorer", href: "/explorer", icon: TerminalSquare },
    { name: "File Analyzer", href: "/files", icon: FolderSearch },
    { name: "Collections", href: "/collections", icon: BookMarked },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-sidebar flex flex-col">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <Activity className="h-6 w-6 text-primary" />
          <span className="font-bold font-mono tracking-tight">APExplorer</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors duration-200",
                  isActive 
                    ? "bg-primary/10 text-primary font-medium" 
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border text-xs text-muted-foreground flex items-center justify-between">
          <span className="font-mono">Sys Status</span>
          <div className="flex items-center gap-2">
            <span className={cn("h-2 w-2 rounded-full", health?.status === "ok" ? "bg-primary" : "bg-destructive animate-pulse")} />
            {health?.status === "ok" ? "Online" : "Offline"}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {children}
      </main>
    </div>
  );
}