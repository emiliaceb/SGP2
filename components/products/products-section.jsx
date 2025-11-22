"use client"

import { useEffect, useMemo, useState } from "react"
import { Search, Plus, Eye, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import ProductModal from "@/components/products/product-modal"

export default function ProductsSection() {
  const [equipos, setEquipos] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEquipo, setEditingEquipo] = useState(null)
  const [viewMode, setViewMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchEquipos()
  }, [])

  const fetchEquipos = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/products")
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "No se pudieron obtener los equipos")
      }

      setEquipos(data.data)
    } catch (err) {
      console.error("Error fetching equipos:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredEquipos = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return equipos

    return equipos.filter((equipo) => {
      return (
        (equipo.numero_serie || "").toLowerCase().includes(term) ||
        (equipo.descripcion || "").toLowerCase().includes(term) ||
        (equipo.proveedor || "").toLowerCase().includes(term) ||
        equipo.id_equipo.toString().includes(term)
      )
    })
  }, [equipos, searchTerm])

  const handleSaveEquipo = async (payload) => {
    try {
      const method = payload.id_equipo ? "PUT" : "POST"
      const response = await fetch("/api/products", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "No se pudo guardar el equipo")
      }

      if (payload.id_equipo) {
        setEquipos((prev) =>
          prev.map((equipo) => (equipo.id_equipo === data.data.id_equipo ? data.data : equipo))
        )
      } else {
        setEquipos((prev) => [data.data, ...prev])
      }

      setIsModalOpen(false)
      setEditingEquipo(null)
      setViewMode(false)
    } catch (err) {
      console.error("Error saving equipo:", err)
      alert(err.message)
    }
  }

  const handleDelete = async (equipo) => {
    if (!confirm(`¿Eliminar definitivamente el equipo #${equipo.id_equipo}?`)) {
      return
    }

    try {
      const response = await fetch(`/api/products?id=${equipo.id_equipo}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "No se pudo eliminar el equipo")
      }

      setEquipos((prev) => prev.filter((item) => item.id_equipo !== equipo.id_equipo))
    } catch (err) {
      console.error("Error deleting equipo:", err)
      alert(err.message)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-muted-foreground">Cargando equipos...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-red-600">{error}</p>
        <Button onClick={fetchEquipos}>Reintentar</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Equipos</h1>
        <Button
          onClick={() => {
            setEditingEquipo(null)
            setViewMode(false)
            setIsModalOpen(true)
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo equipo
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar por ID, número de serie, descripción o proveedor..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">ID Orden</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">ID Item</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Descripción</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Proveedor</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">ID Equipo</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Expiración Garantía</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Estado</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredEquipos.map((equipo) => (
                <tr key={equipo.id_equipo} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {equipo.id_orden ? `#${equipo.id_orden}` : "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {equipo.id_item || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground">
                    {equipo.descripcion || "Sin descripción"}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {equipo.proveedor || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground font-medium">
                    #{equipo.id_equipo}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {equipo.expiracion_garantia 
                      ? new Date(equipo.expiracion_garantia).toLocaleDateString("es-AR")
                      : "-"}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      equipo.estado === "OPERATIVO"
                        ? "bg-green-100 text-green-800"
                        : equipo.estado === "MANTENIMIENTO"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {equipo.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingEquipo(equipo)
                          setViewMode(true)
                          setIsModalOpen(true)
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingEquipo(equipo)
                          setViewMode(false)
                          setIsModalOpen(true)
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(equipo)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredEquipos.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No se encontraron equipos</p>
          </div>
        )}
      </div>

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingEquipo(null)
          setViewMode(false)
        }}
        onSave={handleSaveEquipo}
        equipo={editingEquipo}
        viewMode={viewMode}
      />
    </div>
  )
}
