"use client"

import { useState, useEffect } from "react"
import { Plus, Pencil, Eye, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import ContratoModal from "./contrato-modal"

export default function ContratosSection() {
  const [contratos, setContratos] = useState([])
  const [filteredContratos, setFilteredContratos] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedContrato, setSelectedContrato] = useState(null)
  const [viewMode, setViewMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [providers, setProviders] = useState([])

  useEffect(() => {
    fetchContratos()
    fetchProviders()
  }, [])

  useEffect(() => {
    const filtered = contratos.filter((contrato) => {
      const searchLower = searchTerm.toLowerCase()
      return (
        contrato.proveedor_nombre?.toLowerCase().includes(searchLower) ||
        contrato.descripcion?.toLowerCase().includes(searchLower) ||
        contrato.id_contrato?.toString().includes(searchLower)
      )
    })
    setFilteredContratos(filtered)
  }, [searchTerm, contratos])

  const fetchContratos = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/contratos")
      const data = await response.json()
      if (data.success) {
        setContratos(data.data)
        setFilteredContratos(data.data)
      } else {
        console.error("Error al cargar contratos:", data.error)
      }
    } catch (error) {
      console.error("Error al cargar contratos:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProviders = async () => {
    try {
      const response = await fetch("/api/providers?mode=options")
      const data = await response.json()
      if (data.success) {
        setProviders(data.data)
      }
    } catch (error) {
      console.error("Error al cargar proveedores:", error)
    }
  }

  const handleSave = async (contratoData) => {
    try {
      const url = selectedContrato ? "/api/contratos" : "/api/contratos"
      const method = selectedContrato ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(contratoData),
      })

      const data = await response.json()

      if (data.success) {
        await fetchContratos()
        setIsModalOpen(false)
        setSelectedContrato(null)
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error("Error al guardar contrato:", error)
      alert("Error al guardar el contrato")
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm("¿Está seguro de eliminar este contrato?")) return

    try {
      const response = await fetch(`/api/contratos?id=${id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        await fetchContratos()
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error("Error al eliminar contrato:", error)
      alert("Error al eliminar el contrato")
    }
  }

  const handleEdit = (contrato) => {
    setSelectedContrato(contrato)
    setViewMode(false)
    setIsModalOpen(true)
  }

  const handleView = (contrato) => {
    setSelectedContrato(contrato)
    setViewMode(true)
    setIsModalOpen(true)
  }

  const handleNew = () => {
    setSelectedContrato(null)
    setViewMode(false)
    setIsModalOpen(true)
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString("es-AR")
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Contratos</h2>
        <Button onClick={handleNew} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nuevo Contrato
        </Button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por proveedor, descripción..."
          className="w-full border px-4 py-2 rounded"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <p className="text-center py-8">Cargando...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-4 py-2 text-left">Proveedor</th>
                <th className="border px-4 py-2 text-left">Inicio</th>
                <th className="border px-4 py-2 text-left">Vencimiento</th>
                <th className="border px-4 py-2 text-left">Descripción</th>
                <th className="border px-4 py-2 text-left">Tiempo Respuesta</th>
                <th className="border px-4 py-2 text-left">Disponibilidad</th>
                <th className="border px-4 py-2 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredContratos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-4">
                    {searchTerm ? "No se encontraron contratos" : "No hay contratos registrados"}
                  </td>
                </tr>
              ) : (
                filteredContratos.map((contrato) => (
                  <tr key={contrato.id_contrato}>
                    <td className="border px-4 py-2">{contrato.proveedor_nombre || "N/A"}</td>
                    <td className="border px-4 py-2">{formatDate(contrato.fecha_inicio)}</td>
                    <td className="border px-4 py-2">{formatDate(contrato.fecha_vencimiento)}</td>
                    <td className="border px-4 py-2">{contrato.descripcion || "Sin descripción"}</td>
                    <td className="border px-4 py-2">{contrato.tiempo_respuesta || "N/A"}</td>
                    <td className="border px-4 py-2">
                      {contrato.disponibilidad ? `${(contrato.disponibilidad * 100).toFixed(2)}%` : "N/A"}
                    </td>
                    <td className="border px-4 py-2">
                      <div className="flex justify-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleView(contrato)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(contrato)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(contrato.id_contrato)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <ContratoModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedContrato(null)
          setViewMode(false)
        }}
        onSave={handleSave}
        contrato={selectedContrato}
        providers={providers}
        viewMode={viewMode}
      />
    </div>
  )
}
