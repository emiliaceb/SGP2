"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ContratoModal({ isOpen, onClose, onSave, contrato, providers = [], viewMode = false }) {
  const [formData, setFormData] = useState({
    id_contrato: null,
    cuit: "",
    fecha_inicio: "",
    fecha_vencimiento: "",
    descripcion: "",
    ruta_archivo: "",
    tiempo_respuesta: "",
    disponibilidad: "",
  })

  useEffect(() => {
    if (contrato) {
      setFormData({
        id_contrato: contrato.id_contrato,
        cuit: contrato.cuit?.toString() || "",
        fecha_inicio: contrato.fecha_inicio ? contrato.fecha_inicio.slice(0, 10) : "",
        fecha_vencimiento: contrato.fecha_vencimiento ? contrato.fecha_vencimiento.slice(0, 10) : "",
        descripcion: contrato.descripcion || "",
        ruta_archivo: contrato.ruta_archivo || "",
        tiempo_respuesta: contrato.tiempo_respuesta || "",
        disponibilidad: contrato.disponibilidad ? (contrato.disponibilidad * 100).toString() : "",
      })
    } else {
      setFormData({
        id_contrato: null,
        cuit: "",
        fecha_inicio: "",
        fecha_vencimiento: "",
        descripcion: "",
        ruta_archivo: "",
        tiempo_respuesta: "",
        disponibilidad: "",
      })
    }
  }, [contrato, isOpen])

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!formData.cuit) {
      alert("Debe seleccionar un proveedor")
      return
    }

    if (!formData.fecha_inicio || !formData.fecha_vencimiento) {
      alert("Debe ingresar las fechas de inicio y vencimiento")
      return
    }

    const payload = {
      ...formData,
      cuit: Number(formData.cuit),
      disponibilidad: formData.disponibilidad ? parseFloat(formData.disponibilidad) / 100 : null,
    }

    onSave(payload)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="text-xl font-semibold text-foreground">
            {viewMode ? "Detalles del Contrato" : contrato ? "Editar Contrato" : "Nuevo Contrato"}
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
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              required
              disabled={viewMode || !!contrato}
            >
              <option value="">Seleccionar proveedor</option>
              {providers.map((provider) => (
                <option key={provider.cuit} value={provider.cuit}>
                  {provider.razon_social}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fecha_inicio">Fecha de Inicio</Label>
              <Input
                id="fecha_inicio"
                type="date"
                value={formData.fecha_inicio}
                onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                required
                disabled={viewMode}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fecha_vencimiento">Fecha de Vencimiento</Label>
              <Input
                id="fecha_vencimiento"
                type="date"
                value={formData.fecha_vencimiento}
                onChange={(e) => setFormData({ ...formData, fecha_vencimiento: e.target.value })}
                required
                disabled={viewMode}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Descripción del contrato..."
              disabled={viewMode}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ruta_archivo">Ruta del Archivo (opcional)</Label>
            <Input
              id="ruta_archivo"
              type="text"
              value={formData.ruta_archivo}
              onChange={(e) => setFormData({ ...formData, ruta_archivo: e.target.value })}
              placeholder="C:\Documentos\Contratos\contrato_001.pdf"
              disabled={viewMode}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tiempo_respuesta">Tiempo de Respuesta (opcional)</Label>
              <Input
                id="tiempo_respuesta"
                type="text"
                value={formData.tiempo_respuesta}
                onChange={(e) => setFormData({ ...formData, tiempo_respuesta: e.target.value })}
                placeholder="48 Horas"
                disabled={viewMode}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="disponibilidad">Disponibilidad (%) (opcional)</Label>
              <Input
                id="disponibilidad"
                type="number"
                value={formData.disponibilidad}
                onChange={(e) => setFormData({ ...formData, disponibilidad: e.target.value })}
                placeholder="99"
                min="0"
                max="100"
                step="0.01"
                disabled={viewMode}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            {viewMode ? (
              <Button type="button" onClick={onClose} className="flex-1">
                Cerrar
              </Button>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent">
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1">
                  Guardar
                </Button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
