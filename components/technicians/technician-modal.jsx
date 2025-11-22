"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function TechnicianModal({ isOpen, onClose, onSave, technician, providers = [] }) {
  const [formData, setFormData] = useState({
    id_tecnico: null,
    nombre: "",
    telefono: "",
    cuit: "",
  })

  useEffect(() => {
    if (technician) {
      setFormData({
        id_tecnico: technician.id_tecnico,
        nombre: technician.nombre || "",
        telefono: technician.telefono || "",
        cuit: technician.cuit?.toString() || "",
      })
    } else {
      setFormData({
        id_tecnico: null,
        nombre: "",
        telefono: "",
        cuit: "",
      })
    }
  }, [technician, isOpen])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.nombre || !formData.telefono || !formData.cuit) {
      alert("Nombre, teléfono y proveedor son obligatorios")
      return
    }

    onSave({
      ...formData,
      cuit: formData.cuit,
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="text-xl font-semibold text-foreground">
            {technician ? "Editar Técnico" : "Nuevo Técnico"}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cuit">Proveedor</Label>
            <select
              id="cuit"
              value={formData.cuit}
              onChange={(e) => setFormData({ ...formData, cuit: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              required
            >
              <option value="">Seleccionar proveedor</option>
              {providers.map((provider) => (
                <option key={provider.cuit} value={provider.cuit}>
                  {provider.razon_social}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre del Técnico</Label>
            <Input
              id="nombre"
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Carlos Rodríguez"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefono">Teléfono</Label>
            <Input
              id="telefono"
              type="text"
              value={formData.telefono}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              placeholder="11-4567-8901"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
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
