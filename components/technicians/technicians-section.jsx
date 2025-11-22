"use client"

import { useEffect, useMemo, useState } from "react"
import { Search, Plus, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import TechnicianModal from "@/components/technicians/technician-modal"

export default function TechniciansSection() {
  const [technicians, setTechnicians] = useState([])
  const [providers, setProviders] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTechnician, setEditingTechnician] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [techniciansResponse, providersResponse] = await Promise.all([
        fetch("/api/technicians"),
        fetch("/api/providers?mode=options"),
      ])

      const techniciansJson = await techniciansResponse.json()
      const providersJson = await providersResponse.json()

      if (!techniciansJson.success) {
        throw new Error(techniciansJson.error || "No se pudieron obtener los técnicos")
      }

      if (!providersJson.success) {
        throw new Error(providersJson.error || "No se pudieron obtener los proveedores")
      }

      setTechnicians(techniciansJson.data)
      setProviders(providersJson.data)
    } catch (err) {
      console.error("Error fetching technicians data:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredTechnicians = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return technicians

    return technicians.filter((tech) => {
      return (
        tech.nombre.toLowerCase().includes(term) ||
        (tech.proveedor || "").toLowerCase().includes(term) ||
        (tech.telefono || "").toLowerCase().includes(term)
      )
    })
  }, [technicians, searchTerm])

  const handleSaveTechnician = async (payload) => {
    try {
      const method = editingTechnician ? "PUT" : "POST"
      const response = await fetch("/api/technicians", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "No se pudo guardar el técnico")
      }

      if (editingTechnician) {
        setTechnicians((prev) =>
          prev.map((tech) => (tech.id_tecnico === data.data.id_tecnico ? data.data : tech))
        )
        setEditingTechnician(null)
      } else {
        setTechnicians((prev) => [data.data, ...prev])
      }

      setIsModalOpen(false)
    } catch (err) {
      console.error("Error saving technician:", err)
      alert(err.message)
    }
  }

  const handleEdit = (technician) => {
    setEditingTechnician(technician)
    setIsModalOpen(true)
  }

  const handleDelete = async (technician) => {
    if (!confirm("¿Eliminar este técnico y su registro de contacto?")) {
      return
    }

    try {
      const response = await fetch(`/api/technicians?id=${technician.id_tecnico}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "No se pudo eliminar el técnico")
      }

      setTechnicians((prev) => prev.filter((item) => item.id_tecnico !== technician.id_tecnico))
    } catch (err) {
      console.error("Error deleting technician:", err)
      alert(err.message)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-muted-foreground">Cargando técnicos...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-red-600">{error}</p>
        <Button onClick={fetchData}>Reintentar</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Técnicos Autorizados</h1>
        <Button
          onClick={() => {
            setEditingTechnician(null)
            setIsModalOpen(true)
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo técnico
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar por nombre, proveedor o teléfono..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Proveedor</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Nombre</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Teléfono</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredTechnicians.map((tech) => (
                <tr key={tech.id_tecnico} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-foreground font-medium">{tech.proveedor || "-"}</td>
                  <td className="px-6 py-4 text-sm text-foreground">{tech.nombre}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{tech.telefono || "-"}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(tech)} title="Editar técnico">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(tech)} title="Eliminar técnico">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTechnicians.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No se encontraron técnicos</p>
          </div>
        )}
      </div>

      <TechnicianModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingTechnician(null)
        }}
        onSave={handleSaveTechnician}
        technician={editingTechnician}
        providers={providers}
      />
    </div>
  )
}
