"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export type SupplierFailureFormData = {
  id_falla?: number | null
  id_proveedor: string
  fecha_registro: string
  descripcion: string
  estado: string
  criticidad: string
  acciones: string
  fecha_resolucion: string
}

export type SupplierFailureModalProps = {
  isOpen: boolean
  onClose: () => void
  onSave: (payload: Record<string, unknown>) => Promise<void> | void
  failure: Record<string, any> | null
  providers: Array<{ id_proveedor: number; nombre: string }>
  schema: {
    description?: boolean
    date?: boolean
    status?: boolean
    severity?: boolean
    actions?: boolean
    resolutionDate?: boolean
  }
}

const defaultDate = () => new Date().toISOString().split("T")[0]

export default function SupplierFailureModal({
  isOpen,
  onClose,
  onSave,
  failure,
  providers = [],
  schema,
}: SupplierFailureModalProps) {
  const [formData, setFormData] = useState<SupplierFailureFormData>({
    id_falla: null,
    id_proveedor: "",
    fecha_registro: defaultDate(),
    descripcion: "",
    estado: "Abierta",
    criticidad: "Media",
    acciones: "",
    fecha_resolucion: "",
  })

  useEffect(() => {
    if (!isOpen) {
      return
    }

    if (failure) {
      const fallbackId = (() => {
        if (typeof failure.id_falla === "number") {
          return failure.id_falla
        }
        const maybeId = (failure as Record<string, unknown>).id
        return typeof maybeId === "number" ? maybeId : null
      })()
      setFormData({
        id_falla: fallbackId,
        id_proveedor: failure.id_proveedor ? String(failure.id_proveedor) : "",
        fecha_registro: failure.fecha_registro ? String(failure.fecha_registro).slice(0, 10) : defaultDate(),
        descripcion: failure.descripcion || "",
        estado: failure.estado || "Abierta",
        criticidad: failure.criticidad || "Media",
        acciones: failure.acciones || "",
        fecha_resolucion: failure.fecha_resolucion ? String(failure.fecha_resolucion).slice(0, 10) : "",
      })
    } else {
      setFormData({
        id_falla: null,
        id_proveedor: "",
        fecha_registro: defaultDate(),
        descripcion: "",
        estado: "Abierta",
        criticidad: "Media",
        acciones: "",
        fecha_resolucion: "",
      })
    }
  }, [failure, isOpen])

  const handleChange = (field: keyof SupplierFailureFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!formData.id_proveedor) {
      alert("Debe seleccionar un proveedor")
      return
    }

    const payload: Record<string, unknown> = {
      id_proveedor: Number(formData.id_proveedor),
    }

    if (formData.id_falla) {
      payload.id_falla = formData.id_falla
    }

    if (schema.date) {
      payload.fecha_registro = formData.fecha_registro
    }

    if (schema.description) {
      payload.descripcion = formData.descripcion.trim()
    }

    if (schema.status) {
      payload.estado = formData.estado.trim() || null
    }

    if (schema.severity) {
      payload.criticidad = formData.criticidad.trim() || null
    }

    if (schema.actions) {
      payload.acciones = formData.acciones.trim() || null
    }

    if (schema.resolutionDate) {
      payload.fecha_resolucion = formData.fecha_resolucion || null
    }

    await onSave(payload)
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-lg border border-border bg-card shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              {failure ? "Editar incidente" : "Registrar incidente"}
            </h2>
            <p className="text-xs text-muted-foreground">Control y seguimiento de fallas asociadas al proveedor.</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground transition-colors hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-5 overflow-y-auto px-6 py-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="id_proveedor">Proveedor</Label>
              <select
                id="id_proveedor"
                value={formData.id_proveedor}
                onChange={(event) => handleChange("id_proveedor", event.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
              >
                <option value="">Seleccionar proveedor</option>
                {providers.map((provider) => (
                  <option key={provider.id_proveedor} value={provider.id_proveedor}>
                    {provider.nombre}
                  </option>
                ))}
              </select>
            </div>

            {schema.date && (
              <div className="space-y-2">
                <Label htmlFor="fecha_registro">Fecha del incidente</Label>
                <Input
                  id="fecha_registro"
                  type="date"
                  value={formData.fecha_registro}
                  onChange={(event) => handleChange("fecha_registro", event.target.value)}
                  required
                />
              </div>
            )}
          </div>

          {schema.description && (
            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <textarea
                id="descripcion"
                value={formData.descripcion}
                onChange={(event) => handleChange("descripcion", event.target.value)}
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Detalle la falla detectada y el impacto en la operación"
                required
              />
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {schema.status && (
              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <select
                  id="estado"
                  value={formData.estado}
                  onChange={(event) => handleChange("estado", event.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="Abierta">Abierta</option>
                  <option value="En análisis">En análisis</option>
                  <option value="En mitigación">En mitigación</option>
                  <option value="Resuelta">Resuelta</option>
                  <option value="Cerrada">Cerrada</option>
                </select>
              </div>
            )}

            {schema.severity && (
              <div className="space-y-2">
                <Label htmlFor="criticidad">Criticidad</Label>
                <select
                  id="criticidad"
                  value={formData.criticidad}
                  onChange={(event) => handleChange("criticidad", event.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="Alta">Alta</option>
                  <option value="Media">Media</option>
                  <option value="Baja">Baja</option>
                </select>
              </div>
            )}
          </div>

          {schema.actions && (
            <div className="space-y-2">
              <Label htmlFor="acciones">Acciones correctivas</Label>
              <textarea
                id="acciones"
                value={formData.acciones}
                onChange={(event) => handleChange("acciones", event.target.value)}
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Detalle las acciones tomadas o planificadas para resolver la falla"
              />
            </div>
          )}

          {schema.resolutionDate && (
            <div className="space-y-2">
              <Label htmlFor="fecha_resolucion">Fecha de resolución</Label>
              <Input
                id="fecha_resolucion"
                type="date"
                value={formData.fecha_resolucion}
                onChange={(event) => handleChange("fecha_resolucion", event.target.value)}
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              Guardar incidente
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
