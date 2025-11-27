"use client"

import { useEffect, useMemo, useState } from "react"
import { Eye, Pencil, Plus, Trash2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import SupplierFailureModal from "@/components/Reports/Reports-modal"

type SupplierFailure = {
  id_falla: number
  id_proveedor: number
  proveedor_nombre: string
  proveedor_correo?: string | null
  proveedor_telefono?: string | null
  descripcion?: string | null
  fecha_registro?: string | null
  estado?: string | null
  criticidad?: string | null
  acciones?: string | null
  fecha_resolucion?: string | null
}

type ProviderOption = {
  id_proveedor: number
  nombre: string
}

type SchemaInfo = {
  hasDescription: boolean
  hasDate: boolean
  hasStatus: boolean
  hasSeverity: boolean
  hasActions: boolean
  hasResolutionDate: boolean
}

const INITIAL_SCHEMA: SchemaInfo = {
  hasDescription: true,
  hasDate: true,
  hasStatus: true,
  hasSeverity: true,
  hasActions: true,
  hasResolutionDate: true,
}

const formatDate = (value?: string | null) => {
  if (!value) {
    return "—"
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "—"
  }
  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

const formatText = (value?: string | null) => (value && value.trim() !== "" ? value : "—")

export default function SupplierFailureSection() {
  const [failures, setFailures] = useState<SupplierFailure[]>([])
  const [providers, setProviders] = useState<ProviderOption[]>([])
  const [schema, setSchema] = useState<SchemaInfo>(INITIAL_SCHEMA)
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingFailure, setEditingFailure] = useState<SupplierFailure | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const [failuresResponse, providersResponse, schemaResponse] = await Promise.all([
          fetch("/api/supplierFailure"),
          fetch("/api/providers?mode=options"),
          fetch("/api/supplierFailure?mode=schema"),
        ])

        const failuresJson = await failuresResponse.json()
        const providersJson = await providersResponse.json()
        const schemaJson = await schemaResponse.json()

        if (!failuresJson.success) {
          throw new Error(failuresJson.error || "No se pudieron obtener las incidencias")
        }

        if (!providersJson.success) {
          throw new Error(providersJson.error || "No se pudieron obtener los proveedores")
        }

        if (!schemaJson.success) {
          throw new Error(schemaJson.error || "No se pudo obtener la estructura de fallas")
        }

        setFailures(failuresJson.data || [])
        setProviders(providersJson.data || [])
        setSchema({ ...INITIAL_SCHEMA, ...(schemaJson.data || {}) })
      } catch (err) {
        console.error("Error al cargar fallas", err)
        setError(err instanceof Error ? err.message : "Error desconocido")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const filteredFailures = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) {
      return failures
    }

    return failures.filter((failure) => {
      const matchesProvider = failure.proveedor_nombre?.toLowerCase().includes(term)
      const matchesDescription = failure.descripcion?.toLowerCase().includes(term)
      const matchesEstado = failure.estado?.toLowerCase().includes(term)
      return Boolean(matchesProvider || matchesDescription || matchesEstado)
    })
  }, [failures, searchTerm])

  const openCreateModal = () => {
    setEditingFailure(null)
    setIsModalOpen(true)
  }

  const openEditModal = (failure: SupplierFailure) => {
    setEditingFailure(failure)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingFailure(null)
  }

  const refreshFailureInState = (updated: SupplierFailure) => {
    setFailures((prev) => {
      const exists = prev.some((item) => item.id_falla === updated.id_falla)
      if (exists) {
        return prev.map((item) => (item.id_falla === updated.id_falla ? updated : item))
      }
      return [updated, ...prev]
    })
  }

  const handleSave = async (payload: { id_falla?: number | null } & Record<string, unknown>) => {
    try {
      const method = payload.id_falla ? "PUT" : "POST"
      const response = await fetch("/api/supplierFailure", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "No se pudo guardar la incidencia")
      }

      refreshFailureInState(data.data)
      closeModal()
    } catch (err) {
      console.error("Error al guardar la incidencia", err)
      alert(err instanceof Error ? err.message : "Ocurrió un error guardando la incidencia")
    }
  }

  const handleDelete = async (failure: SupplierFailure) => {
    if (!confirm(`¿Eliminar la incidencia #${failure.id_falla}?`)) {
      return
    }

    try {
      const response = await fetch(`/api/supplierFailure?id=${failure.id_falla}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "No se pudo eliminar la incidencia")
      }

      setFailures((prev) => prev.filter((item) => item.id_falla !== failure.id_falla))
    } catch (err) {
      console.error("Error al eliminar la incidencia", err)
      alert(err instanceof Error ? err.message : "Ocurrió un error eliminando la incidencia")
    }
  }

  const handleView = (failure: SupplierFailure) => {
    const detail = [
      `Proveedor: ${failure.proveedor_nombre}`,
      schema.hasDate ? `Fecha: ${formatDate(failure.fecha_registro)}` : null,
      schema.hasStatus ? `Estado: ${formatText(failure.estado)}` : null,
      schema.hasSeverity ? `Criticidad: ${formatText(failure.criticidad)}` : null,
      schema.hasDescription ? `Descripción: ${formatText(failure.descripcion)}` : null,
      schema.hasActions ? `Acciones: ${formatText(failure.acciones)}` : null,
      schema.hasResolutionDate ? `Resolución: ${formatDate(failure.fecha_resolucion)}` : null,
    ]
      .filter(Boolean)
      .join("\n")

    alert(detail)
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Cargando incidencias...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <p className="text-destructive">{error}</p>
        <Button onClick={() => window.location.reload()}>Reintentar</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Fallas registradas</h1>
          <p className="text-sm text-muted-foreground">
            Seguimiento de incidencias asociadas a proveedores y sus acciones correctivas.
          </p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva incidencia
        </Button>
      </div>

      <div className="relative">
        <Input
          type="text"
          placeholder="Buscar por proveedor, estado o descripción..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="pl-10"
        />
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Proveedor</th>
                {schema.hasDate && (
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Fecha</th>
                )}
                {schema.hasStatus && (
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Estado</th>
                )}
                {schema.hasSeverity && (
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Criticidad</th>
                )}
                {schema.hasDescription && (
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Descripción</th>
                )}
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredFailures.map((failure) => (
                <tr key={failure.id_falla} className="transition-colors hover:bg-muted/50">
                  <td className="px-6 py-4 text-sm font-medium text-foreground">
                    {failure.proveedor_nombre}
                  </td>
                  {schema.hasDate && (
                    <td className="px-6 py-4 text-sm text-muted-foreground">{formatDate(failure.fecha_registro)}</td>
                  )}
                  {schema.hasStatus && (
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                          failure.estado === "Resuelta" || failure.estado === "Cerrada"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200"
                        }`}
                      >
                        {formatText(failure.estado)}
                      </span>
                    </td>
                  )}
                  {schema.hasSeverity && (
                    <td className="px-6 py-4 text-sm text-muted-foreground">{formatText(failure.criticidad)}</td>
                  )}
                  {schema.hasDescription && (
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      <span className="line-clamp-2">{formatText(failure.descripcion)}</span>
                    </td>
                  )}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleView(failure)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEditModal(failure)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(failure)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredFailures.length === 0 && (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No se encontraron incidencias que coincidan con la búsqueda.
          </div>
        )}
      </div>

      <SupplierFailureModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={handleSave}
        failure={editingFailure}
        providers={providers}
        schema={{
          description: schema.hasDescription,
          date: schema.hasDate,
          status: schema.hasStatus,
          severity: schema.hasSeverity,
          actions: schema.hasActions,
          resolutionDate: schema.hasResolutionDate,
        }}
      />
    </div>
  )
}
