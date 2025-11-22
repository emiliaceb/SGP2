"use client"

import { useEffect, useMemo, useState } from "react"
import { Search, Plus, Pencil, Trash2, Star, MapPin, Mail, Phone, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import ProviderModal from "@/components/providers/provider-modal"

const formatAddress = (provider) => {
  if (!provider.direccion || 
      provider.direccion === 'null null (null)' || 
      provider.direccion === 'Sin dirección registrada' ||
      provider.direccion.trim() === '') {
    return "Sin dirección registrada"
  }
  return provider.direccion
}

const formatContact = (provider) => {
  const contacts = []
  if (provider.telefono) {
    contacts.push(`Tel: ${provider.telefono}`)
  }
  if (provider.email) {
    contacts.push(`Email: ${provider.email}`)
  }
  return contacts.length > 0 ? contacts.join(' | ') : "Sin contacto"
}

const renderStars = (value) => {
  const numericValue = Number(value) || 0
  const roundedValue = Math.round(numericValue)
  
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= roundedValue ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground">{numericValue.toFixed(1)}/5</span>
    </div>
  )
}

export default function ProvidersSection() {
  const [providers, setProviders] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProvider, setEditingProvider] = useState(null)
  const [viewMode, setViewMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchProviders()
  }, [])

  const fetchProviders = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch("/api/providers")
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "No se pudo obtener la lista de proveedores")
      }

      setProviders(data.data)
    } catch (err) {
      console.error("Error fetching providers:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredProviders = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return providers

    return providers.filter((provider) => {
      return (
        provider.razon_social?.toLowerCase().includes(term) ||
        (provider.cuit || "").toLowerCase().includes(term) ||
        (provider.email || "").toLowerCase().includes(term) ||
        (provider.rubros || "").toLowerCase().includes(term)
      )
    })
  }, [providers, searchTerm])

  const handleSaveProvider = async (payload) => {
    try {
      const method = editingProvider ? "PUT" : "POST"
      const response = await fetch("/api/providers", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "No se pudo guardar el proveedor")
      }

      if (editingProvider) {
        setProviders((prev) =>
          prev.map((provider) => (provider.cuit === data.data.cuit ? data.data : provider))
        )
      } else {
        setProviders((prev) => [...prev, data.data])
      }

      setIsModalOpen(false)
      setEditingProvider(null)
    } catch (err) {
      console.error("Error saving provider:", err)
      alert(err.message)
    }
  }

  const handleDelete = async (provider) => {
    if (!confirm(`¿Eliminar definitivamente a ${provider.razon_social}? Esta acción no se puede deshacer.`)) {
      return
    }

    try {
      const response = await fetch(`/api/providers?cuit=${provider.cuit}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "No se pudo eliminar el proveedor")
      }

      setProviders((prev) => prev.filter((item) => item.cuit !== provider.cuit))
    } catch (err) {
      console.error("Error deleting provider:", err)
      alert(err.message)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-muted-foreground">Cargando proveedores...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-red-600">{error}</p>
        <Button onClick={fetchProviders}>Reintentar</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Proveedores</h1>
        <Button
          onClick={() => {
            setEditingProvider(null)
            setViewMode(false)
            setIsModalOpen(true)
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo proveedor
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar por razón social, CUIT, email o rubro..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px]">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Razón Social</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">CUIT</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Contacto</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Rubro</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Dirección</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Calificación</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredProviders.map((provider, index) => (
                <tr key={`${provider.cuit}-${index}`} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-foreground font-medium">{provider.razon_social || "-"}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground font-mono">{provider.cuit || "-"}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    <div className="text-xs max-w-[200px]">
                      {formatContact(provider)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    <div className="text-xs max-w-[150px] truncate" title={provider.rubros}>
                      {provider.rubros || "Sin rubro"}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    <div className="flex items-start gap-2 text-xs max-w-[200px]">
                      <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span className="truncate" title={formatAddress(provider)}>
                        {formatAddress(provider)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {renderStars(provider.calificacion_total_promedio)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingProvider(provider)
                          setViewMode(true)
                          setIsModalOpen(true)
                        }}
                        title="Ver detalles"
                      >
                        <Eye className="w-4 h-4 text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingProvider(provider)
                          setViewMode(false)
                          setIsModalOpen(true)
                        }}
                        title="Editar proveedor"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDelete(provider)}
                        title="Eliminar proveedor"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredProviders.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No se encontraron proveedores</p>
          </div>
        )}
      </div>

      <ProviderModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingProvider(null)
          setViewMode(false)
        }}
        onSave={handleSaveProvider}
        provider={editingProvider}
        onDataChange={fetchProviders}
        viewMode={viewMode}
      />
    </div>
  )
}
