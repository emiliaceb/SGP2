"use client"

import { FolderOpen, ShoppingCart, Package, Wrench, Star, AlertTriangle, BarChart3, Hammer, FileText, User, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useRouter } from "next/navigation";

const menuItems = [
  { id: "proveedores", label: "Proveedores", icon: FolderOpen },
  { id: "ordenes", label: "Órdenes de compra", icon: ShoppingCart },
  { id: "productos", label: "Equipos adquiridos", icon: Package },
  { id: "tecnicos", label: "Técnicos", icon: Wrench },
  { id: "calificaciones", label: "Calificaciones", icon: Star },
  { id: "reportes", label: "Reclamos", icon: AlertTriangle },
  { id: "intervencion", label: "Intervencion", icon: Hammer },
  { id: "contratos", label: "Contratos", icon: FileText },
  { id: "informes", label: "Informes", icon: BarChart3 },
]

export default function Sidebar({ activeSection, setActiveSection }) {
  const userData = JSON.parse(localStorage.getItem("userData") || "{}");
  const [showUserMenu, setShowUserMenu] = useState(false)
  const router = useRouter();
  const handleLogout = () => {
    localStorage.removeItem("userData")
    router.push("/")
  }
  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col">
      <div className="p-[17.5px] border-b border-border">
        <h1 className="text-xl font-bold text-foreground">Sistema de Gestión</h1>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = activeSection === item.id

          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>
      {/* User section */}
      <div className="border-t border-border p-4">
        <div className="flex items-center justify-between gap-3 relative">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
              <User className="w-5 h-5" />
            </div>
            <div className="flex-1 text-sm min-w-0">
              <p className="font-medium truncate">{userData.usuario} - {userData.nombre}</p>
              <p className="text-xs text-muted-foreground truncate">{userData.perfil}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setShowUserMenu(!showUserMenu)} className="h-6 w-6">
            <LogOut className="w-5 h-5" />
          </Button>
          {showUserMenu && (
            <div className="absolute bottom-full mb-2 right-0 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[150px]">
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
