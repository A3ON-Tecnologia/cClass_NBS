import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
    Users,
    Building2,
    Home,
    LogOut,
    Settings,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { useState } from "react";

interface AdminLayoutProps {
    children: React.ReactNode;
}

const menuItems = [
    { path: "/admin/users", label: "Usuários", icon: Users },
    { path: "/admin/companies", label: "Empresas", icon: Building2 },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
    const { user, logout } = useAuth();
    const [location] = useLocation();
    const [collapsed, setCollapsed] = useState(false);

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex">
            {/* Sidebar */}
            <aside
                className={`${collapsed ? "w-16" : "w-64"
                    } bg-gradient-to-b from-slate-800/80 to-slate-900/90 backdrop-blur-xl border-r border-slate-700/50 flex flex-col transition-all duration-300 ease-in-out`}
            >
                {/* Header */}
                <div className="p-4 border-b border-slate-700/50">
                    <div className="flex items-center justify-between">
                        {!collapsed && (
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                    <Settings className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-sm font-semibold text-white">Admin</h1>
                                    <p className="text-xs text-slate-400 truncate max-w-28">
                                        {user.username}
                                    </p>
                                </div>
                            </div>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setCollapsed(!collapsed)}
                            className="text-slate-400 hover:text-white hover:bg-slate-700/50"
                        >
                            {collapsed ? (
                                <ChevronRight className="h-4 w-4" />
                            ) : (
                                <ChevronLeft className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-3 space-y-1">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location === item.path;
                        return (
                            <Link key={item.path} href={item.path}>
                                <div
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 group ${isActive
                                            ? "bg-gradient-to-r from-blue-600/80 to-purple-600/80 text-white shadow-lg shadow-blue-500/20"
                                            : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                                        }`}
                                >
                                    <Icon
                                        className={`h-5 w-5 flex-shrink-0 ${isActive
                                                ? "text-white"
                                                : "text-slate-400 group-hover:text-white"
                                            }`}
                                    />
                                    {!collapsed && (
                                        <span className="text-sm font-medium">{item.label}</span>
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="p-3 border-t border-slate-700/50 space-y-1">
                    <Link href="/home">
                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200">
                            <Home className="h-5 w-5 flex-shrink-0" />
                            {!collapsed && (
                                <span className="text-sm font-medium">Página Inicial</span>
                            )}
                        </div>
                    </Link>
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
                    >
                        <LogOut className="h-5 w-5 flex-shrink-0" />
                        {!collapsed && <span className="text-sm font-medium">Sair</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <div className="p-6">{children}</div>
            </main>
        </div>
    );
}
