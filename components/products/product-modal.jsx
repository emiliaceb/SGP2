"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ProductModal({ isOpen, onClose, onSave, equipo, viewMode = false }) {
  const [formData, setFormData] = useState({
    id_equipo: null,
    numero_serie: "",
    id_modelo: "",
    expiracion_garantia: "",
    estado: "OPERATIVO",
    modelo_nombre: "",
    modelo_marca: "",
    modelo_especificaciones: "",
  })

  useEffect(() => {
    if (equipo) {
      setFormData({
        id_equipo: equipo.id_equipo,
        numero_serie: equipo.numero_serie || "",
        id_modelo: equipo.id_modelo || "",
        expiracion_garantia: equipo.expiracion_garantia ? equipo.expiracion_garantia.slice(0, 10) : "",
        estado: equipo.estado || "OPERATIVO",
        modelo_nombre: equipo.modelo_nombre || "",
        modelo_marca: equipo.modelo_marca || "",
        modelo_especificaciones: equipo.modelo_especificaciones || "",
      })
    } else {
      setFormData({
        id_equipo: null,
        numero_serie: "",
        id_modelo: "",
        expiracion_garantia: "",
        estado: "OPERATIVO",
        modelo_nombre: "",
        modelo_marca: "",
        modelo_especificaciones: "",
      })
    }
  }, [equipo, isOpen])

  const handleSubmit = (event) => {
    event.preventDefault()
    onSave(formData)
  }

  if (!isOpen) return null

  // Modo solo lectura
  if (viewMode) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-card rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card z-10">
            <h2 className="text-xl font-semibold text-foreground">
              Detalles del Equipo #{equipo?.id_equipo}
            </h2>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Información del Item y Orden */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b pb-2">Información de la Orden</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">ID Item</Label>
                  <p className="text-sm font-medium text-foreground">{equipo?.id_item || "-"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Descripción</Label>
                  <p className="text-sm font-medium text-foreground">{equipo?.descripcion || "-"}</p>
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs text-muted-foreground">Proveedor</Label>
                  <p className="text-sm font-medium text-foreground">{equipo?.proveedor || "-"}</p>
                </div>
              </div>
            </div>

            {/* Información del Equipo */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b pb-2">Información del Equipo</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">ID Equipo</Label>
                  <p className="text-sm font-medium text-foreground">#{equipo?.id_equipo}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Número de Serie</Label>
                  <p className="text-sm font-medium text-foreground">{equipo?.numero_serie || "-"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Expiración de Garantía</Label>
                  <p className="text-sm font-medium text-foreground">
                    {equipo?.expiracion_garantia 
                      ? new Date(equipo.expiracion_garantia).toLocaleDateString("es-AR")
                      : "-"}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Estado</Label>
                  <p className="text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      equipo?.estado === "OPERATIVO"
                        ? "bg-green-100 text-green-800"
                        : equipo?.estado === "MANTENIMIENTO"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {equipo?.estado}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Información del Modelo */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b pb-2">Información del Modelo</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Nombre del Modelo</Label>
                  <p className="text-sm font-medium text-foreground">{equipo?.modelo_nombre || "-"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Marca</Label>
                  <p className="text-sm font-medium text-foreground">{equipo?.modelo_marca || "-"}</p>
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs text-muted-foreground">Especificaciones</Label>
                  <p className="text-sm font-medium text-foreground whitespace-pre-wrap">
                    {equipo?.modelo_especificaciones || "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end p-6 border-t border-border">
            <Button onClick={onClose} variant="outline">
              Cerrar
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Modo edición/creación
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="text-xl font-semibold text-foreground">
            {equipo ? `Editar Equipo #${equipo.id_equipo}` : "Nuevo Equipo"}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Información de la Orden (solo lectura) */}
          {equipo && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b pb-2">Información de la Orden</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">ID Item</Label>
                  <p className="text-sm font-medium text-foreground">{equipo.id_item || "-"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Descripción</Label>
                  <p className="text-sm font-medium text-foreground">{equipo.descripcion || "-"}</p>
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs text-muted-foreground">Proveedor</Label>
                  <p className="text-sm font-medium text-foreground">{equipo.proveedor || "-"}</p>
                </div>
              </div>
            </div>
          )}

          {/* Información del Equipo (editable) */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground border-b pb-2">Información del Equipo</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {equipo && (
                <div>
                  <Label className="text-xs text-muted-foreground">ID Equipo</Label>
                  <p className="text-sm font-medium text-foreground">#{equipo.id_equipo}</p>
                </div>
              )}
              
              <div className={equipo ? "md:col-span-1" : "md:col-span-2"}>
                <Label htmlFor="numero_serie">Número de Serie</Label>
                <Input
                  id="numero_serie"
                  type="text"
                  value={formData.numero_serie}
                  onChange={(e) => setFormData({ ...formData, numero_serie: e.target.value })}
                  placeholder="Número de serie del equipo"
                />
              </div>

              <div>
                <Label htmlFor="expiracion_garantia">Expiración de Garantía</Label>
                <Input
                  id="expiracion_garantia"
                  type="date"
                  value={formData.expiracion_garantia}
                  onChange={(e) => setFormData({ ...formData, expiracion_garantia: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="estado">Estado</Label>
                <select
                  id="estado"
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                >
                  <option value="OPERATIVO">OPERATIVO</option>
                  <option value="MANTENIMIENTO">MANTENIMIENTO</option>
                  <option value="DESUSO">DESUSO</option>
                </select>
              </div>
            </div>
          </div>

          {/* Información del Modelo (editable) */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground border-b pb-2">Información del Modelo</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="modelo_nombre">Nombre del Modelo</Label>
                <Input
                  id="modelo_nombre"
                  type="text"
                  value={formData.modelo_nombre}
                  onChange={(e) => setFormData({ ...formData, modelo_nombre: e.target.value })}
                  placeholder="Nombre del modelo"
                />
              </div>

              <div>
                <Label htmlFor="modelo_marca">Marca</Label>
                <Input
                  id="modelo_marca"
                  type="text"
                  value={formData.modelo_marca}
                  onChange={(e) => setFormData({ ...formData, modelo_marca: e.target.value })}
                  placeholder="Marca del equipo"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="modelo_especificaciones">Especificaciones</Label>
                <textarea
                  id="modelo_especificaciones"
                  value={formData.modelo_especificaciones}
                  onChange={(e) => setFormData({ ...formData, modelo_especificaciones: e.target.value })}
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Especificaciones técnicas del modelo"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              Guardar
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
