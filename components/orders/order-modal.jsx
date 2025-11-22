"use client"

import { useMemo, useState, useEffect } from "react"
import { X, Trash2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const estadoOptions = ["Pendiente", "Confirmada", "Recibida", "Rechazada", "Cancelada"]

export default function OrderModal({ isOpen, onClose, onSave, order, providers = [], equipos = [], viewMode = false }) {
  const [formData, setFormData] = useState({
    id_orden: null,
    cuit: "",
    fecha_pedido: new Date().toISOString().split("T")[0],
    fecha_recepcion: "",
    estado: "Pendiente",
  })
  const [items, setItems] = useState([
    { descripcion: "", cantidad: 1, precio_unitario: "" },
  ])

  useEffect(() => {
    if (order) {
      setFormData({
        id_orden: order.id_orden,
        cuit: order.cuit?.toString() || "",
        fecha_pedido: order.fecha_pedido ? order.fecha_pedido.slice(0, 10) : new Date().toISOString().split("T")[0],
        fecha_recepcion: order.fecha_recepcion ? order.fecha_recepcion.slice(0, 10) : "",
        estado: order.estado || "Pendiente",
      })
      setItems(
        order.detalles && order.detalles.length > 0
          ? order.detalles.map((detail) => ({
              id_equipo: detail.id_equipo?.toString() || "",
              descripcion: detail.producto_nombre || "",
              cantidad: detail.cantidad?.toString() || "1",
              precio_unitario: detail.precio_unitario?.toString() || "",
            }))
          : [{ descripcion: "", cantidad: 1, precio_unitario: "" }]
      )
    } else {
      setFormData({
        id_orden: null,
        cuit: "",
        fecha_pedido: new Date().toISOString().split("T")[0],
        fecha_recepcion: "",
        estado: "Pendiente",
      })
      setItems([{ descripcion: "", cantidad: 1, precio_unitario: "" }])
    }
  }, [order, isOpen])

  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const handleAddItem = () => {
    // Validar que el último ítem esté completo antes de agregar uno nuevo
    const lastItem = items[items.length - 1]
    if (!lastItem.descripcion || !lastItem.precio_unitario || lastItem.cantidad <= 0) {
      alert("Complete el ítem actual antes de agregar uno nuevo")
      return
    }
    setItems((prev) => [...prev, { descripcion: "", cantidad: 1, precio_unitario: "" }])
  }

  const handleRemoveItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const total = useMemo(() => {
    return items.reduce((sum, item) => {
      const quantity = Number(item.cantidad)
      const unit = Number(item.precio_unitario)
      if (Number.isNaN(quantity) || Number.isNaN(unit)) {
        return sum
      }
      return sum + quantity * unit
    }, 0)
  }, [items])

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(value || 0)
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return "-"
    return new Date(dateStr).toLocaleDateString("es-AR")
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    // Validar cada ítem antes de continuar
    const invalidItems = []
    items.forEach((item, index) => {
      const desc = item.descripcion?.trim() || ""
      const cant = parseInt(item.cantidad, 10)
      const precio = Number(item.precio_unitario)
      
      if (!desc) {
        invalidItems.push(`Ítem ${index + 1}: falta descripción`)
      }
      if (Number.isNaN(cant) || cant <= 0) {
        invalidItems.push(`Ítem ${index + 1}: cantidad inválida`)
      }
      if (Number.isNaN(precio) || precio <= 0) {
        invalidItems.push(`Ítem ${index + 1}: precio inválido`)
      }
    })

    if (invalidItems.length > 0) {
      alert("Corrija los siguientes errores:\n" + invalidItems.join("\n"))
      return
    }

    const preparedItems = items.map((item) => ({
      descripcion: item.descripcion.trim(),
      cantidad: parseInt(item.cantidad, 10),
      precio_unitario: Number(item.precio_unitario),
    }))

    if (preparedItems.length === 0) {
      alert("La orden debe incluir al menos un ítem válido")
      return
    }

    if (!formData.cuit) {
      alert("Seleccione un proveedor")
      return
    }

    // Validar que si el estado es "Recibida" debe tener fecha_recepcion
    if (formData.estado === "Recibida" && !formData.fecha_recepcion) {
      alert('Si el estado es "Recibida" debe especificar la fecha de recepción')
      return
    }

    onSave({
      ...formData,
      cuit: formData.cuit,
      fecha_recepcion: formData.fecha_recepcion || null,
      items: preparedItems,
    })
  }

  if (!isOpen) return null

  // Modal de solo lectura
  if (viewMode && order) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-card rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card z-10">
            <h2 className="text-xl font-semibold text-foreground">Orden de Compra</h2>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Información General */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b pb-2">Información de la Orden</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">ID Orden</Label>
                  <p className="text-foreground font-medium">#{order.id_orden}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Proveedor</Label>
                  <p className="text-foreground font-medium">{order.proveedor_nombre}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Fecha de Pedido</Label>
                  <p className="text-foreground font-medium">{formatDate(order.fecha_pedido)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Fecha de Recepción</Label>
                  <p className="text-foreground font-medium">{formatDate(order.fecha_recepcion)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Estado</Label>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                    order.estado === "Recibida" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                    order.estado === "Pendiente" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" :
                    order.estado === "Confirmada" ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" :
                    order.estado === "Rechazada" || order.estado === "Cancelada" ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" :
                    "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                  }`}>
                    {order.estado}
                  </span>
                </div>
                <div>
                  <Label className="text-muted-foreground">Monto Total</Label>
                  <p className="text-foreground font-bold text-lg">{formatCurrency(order.monto_total || 0)}</p>
                </div>
              </div>
            </div>

            {/* Detalle de Items */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b pb-2">Detalle de Items</h3>
              {order.detalles && order.detalles.length > 0 ? (
                <div className="space-y-3">
                  {order.detalles.map((item, index) => (
                    <div key={index} className="p-4 bg-muted/50 rounded-lg border border-border">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <Label className="text-muted-foreground text-xs">Descripción</Label>
                          <p className="text-foreground font-medium">{item.producto_nombre}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground text-xs">Cantidad</Label>
                          <p className="text-foreground">{item.cantidad}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground text-xs">Precio Unitario</Label>
                          <p className="text-foreground">{formatCurrency(item.precio_unitario)}</p>
                        </div>
                        <div className="col-span-2">
                          <Label className="text-muted-foreground text-xs">Subtotal</Label>
                          <p className="text-foreground font-semibold">{formatCurrency(item.subtotal)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">Sin detalles de items</p>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const isEditMode = !!order

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="text-xl font-semibold text-foreground">
            {order ? "Editar Orden de Compra" : "Nueva Orden de Compra"}
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
              disabled={isEditMode}
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
            <Label htmlFor="fecha_pedido">Fecha del pedido</Label>
            <Input
              id="fecha_pedido"
              type="date"
              value={formData.fecha_pedido}
              onChange={(e) => setFormData({ ...formData, fecha_pedido: e.target.value })}
              required
              disabled={isEditMode}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fecha_recepcion">Fecha de recepción (opcional)</Label>
            <Input
              id="fecha_recepcion"
              type="date"
              value={formData.fecha_recepcion}
              onChange={(e) => setFormData({ ...formData, fecha_recepcion: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="estado">Estado</Label>
            <select
              id="estado"
              value={formData.estado}
              onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              required
            >
              {estadoOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Ítems de la orden</Label>
              {!isEditMode && (
                <Button type="button" variant="outline" size="sm" onClick={handleAddItem} className="flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Agregar ITEM
                </Button>
              )}
            </div>
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="p-4 rounded-lg border border-border bg-muted/30">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="md:col-span-4">
                      <Label className="text-xs" htmlFor={`descripcion-${index}`}>
                        Descripción
                      </Label>
                      <Input
                        id={`descripcion-${index}`}
                        type="text"
                        value={item.descripcion}
                        onChange={(e) => handleItemChange(index, "descripcion", e.target.value)}
                        placeholder="Descripción del ítem"
                        required
                        disabled={isEditMode}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-xs" htmlFor={`cantidad-${index}`}>
                        Cantidad
                      </Label>
                      <Input
                        id={`cantidad-${index}`}
                        type="number"
                        min="1"
                        value={item.cantidad}
                        onChange={(e) => handleItemChange(index, "cantidad", e.target.value)}
                        required
                        disabled={isEditMode}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-xs" htmlFor={`precio-${index}`}>
                        Precio unitario
                      </Label>
                      <Input
                        id={`precio-${index}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.precio_unitario}
                        onChange={(e) => handleItemChange(index, "precio_unitario", e.target.value)}
                        required
                        disabled={isEditMode}
                      />
                    </div>
                    <div className="md:col-span-3">
                      <Label className="text-xs">Subtotal</Label>
                      <div className="flex h-10 items-center justify-end px-3 py-2 text-xs md:text-sm font-semibold text-foreground bg-muted rounded-md border border-input overflow-hidden">
                        <span className="truncate">{formatCurrency((Number(item.cantidad) || 0) * (Number(item.precio_unitario) || 0))}</span>
                      </div>
                    </div>
                    {!isEditMode && items.length > 1 && (
                      <div className="md:col-span-1 flex items-end justify-center">
                        <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveItem(index)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border border-dashed border-muted px-4 py-3 bg-muted/30 text-sm">
            <span className="font-semibold text-muted-foreground">Total estimado</span>
            <span className="text-foreground font-semibold">{formatCurrency(total)}</span>
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
