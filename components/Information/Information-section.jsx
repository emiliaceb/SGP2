"use client"

import { useCallback, useEffect, useState } from "react"
import { Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const INITIAL_CONSIGNAS = {
  punto4a: {
    titulo: "Punto 4.a",
    descripcion: "",
    resultados: [],
  },
  punto4b: {
    titulo: "Punto 4.b",
    descripcion: "",
    resultados: [],
  },
  punto5: {
    titulo: "Punto 5",
    descripcion: "",
    ultimaOrdenGenerada: null,
  },
  punto6: {
    titulo: "Punto 6",
    descripcion: "",
    resultados: [],
  },
}

const formatCurrency = (value) => {
  const amount = Number(value || 0)
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(amount)
}

const formatDate = (value) => {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

const formatDateTime = (value) => {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const formatStateLabel = (value) => {
  if (!value) return "Sin estado"
  const lower = value.toString().toLowerCase()
  return lower.charAt(0).toUpperCase() + lower.slice(1)
}

export default function ReportsSection() {
  const [consignas, setConsignas] = useState(INITIAL_CONSIGNAS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [providers, setProviders] = useState([])
  const [spForm, setSpForm] = useState({
    id_proveedor: "",
    fecha_pedido: new Date().toISOString().split("T")[0],
    monto_total: "1100",
  })
  const [spLoading, setSpLoading] = useState(false)
  const [spStatus, setSpStatus] = useState(null)

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/reports`, {
        cache: "no-store",
      })

      if (!response.ok) {
        throw new Error(`Error al obtener los reportes (${response.status})`)
      }

      const body = await response.json()

      if (!body.success) {
        throw new Error(body.error || "No se pudo generar el tablero de reportes")
      }

      const payload = body.data || {}

      const consignaPayload = payload.consignas || {}

      setConsignas({
        punto4a: { ...INITIAL_CONSIGNAS.punto4a, ...(consignaPayload.punto4a || {}) },
        punto4b: { ...INITIAL_CONSIGNAS.punto4b, ...(consignaPayload.punto4b || {}) },
        punto5: { ...INITIAL_CONSIGNAS.punto5, ...(consignaPayload.punto5 || {}) },
        punto6: { ...INITIAL_CONSIGNAS.punto6, ...(consignaPayload.punto6 || {}) },
      })
    } catch (err) {
      console.error("Error al cargar /api/reports", err)
      setError(err.message || "Se produjo un error desconocido")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  useEffect(() => {
    const fetchProvidersForSp = async () => {
      try {
        const response = await fetch("/api/providers?mode=options", { cache: "no-store" })

        if (!response.ok) {
          throw new Error(`Error al obtener proveedores (${response.status})`)
        }

        const payload = await response.json()

        if (!payload.success) {
          throw new Error(payload.error || "No se pudo cargar el listado de proveedores")
        }

        const items = Array.isArray(payload.data) ? payload.data : []
        setProviders(items)
        setSpForm((prev) => ({
          ...prev,
          id_proveedor: prev.id_proveedor || (items[0]?.id_proveedor?.toString() || ""),
        }))
      } catch (providerError) {
        console.error("Error al cargar proveedores para el SP:", providerError)
      }
    }

    fetchProvidersForSp()
  }, [])

  const handleStoredProcedureSubmit = async (event) => {
    event.preventDefault()

    if (!spForm.id_proveedor) {
      setSpStatus({ success: false, message: "Seleccione un proveedor válido." })
      return
    }

    if (!spForm.fecha_pedido) {
      setSpStatus({ success: false, message: "Seleccione la fecha del pedido." })
      return
    }

    const montoTotalNumber = Number(spForm.monto_total)

    if (Number.isNaN(montoTotalNumber) || montoTotalNumber <= 0) {
      setSpStatus({ success: false, message: "Ingrese un monto total válido." })
      return
    }

    try {
      setSpLoading(true)
      setSpStatus(null)

      const response = await fetch("/api/orders/sp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_proveedor: Number(spForm.id_proveedor),
          fecha_pedido: spForm.fecha_pedido,
          monto_total: Number(montoTotalNumber.toFixed(2)),
        }),
      })

      const body = await response.json()

      if (!response.ok || !body.success) {
        throw new Error(body.error || `Error al ejecutar el stored procedure (${response.status})`)
      }

      setSpStatus({
        success: true,
        message: body.message || "Stored procedure ejecutada correctamente.",
        order: body.data || null,
      })

      await fetchReports()
    } catch (procedureError) {
      console.error("Error al ejecutar SP_RegistrarOrden:", procedureError)
      setSpStatus({
        success: false,
        message: procedureError.message || "No se pudo ejecutar el stored procedure.",
      })
    } finally {
      setSpLoading(false)
    }
  }
  const consigna4a = consignas.punto4a || INITIAL_CONSIGNAS.punto4a
  const consigna4b = consignas.punto4b || INITIAL_CONSIGNAS.punto4b
  const consigna5 = consignas.punto5 || INITIAL_CONSIGNAS.punto5
  const consigna6 = consignas.punto6 || INITIAL_CONSIGNAS.punto6

  const mejoresCalificaciones = Array.isArray(consigna4a.resultados) ? consigna4a.resultados : []
  const proveedoresSinFallas = Array.isArray(consigna4b.resultados) ? consigna4b.resultados : []
  const auditoriaOrdenes = Array.isArray(consigna6.resultados) ? consigna6.resultados : []
  const ultimaOrdenSp = spStatus?.success && spStatus.order ? spStatus.order : consigna5.ultimaOrdenGenerada

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Consignas evaluadas</h1>
          <p className="text-sm text-muted-foreground">
            Visualización exclusiva de los puntos 4, 5 y 6 del trabajo integrador sobre SQL Server.
          </p>
        </div>
        <Button variant="outline" onClick={fetchReports} disabled={loading}>
          {loading ? "Actualizando..." : "Actualizar consignas"}
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          <p className="font-medium">No se pudieron cargar los datos de las consignas.</p>
          <p className="mt-1">{error}</p>
          <Button variant="ghost" className="mt-3" onClick={fetchReports}>
            Reintentar
          </Button>
        </div>
      )}

      {!error && loading && (
        <div className="rounded-lg border border-border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
          Obteniendo resultados de las consignas...
        </div>
      )}

      {!error && !loading && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-border bg-card shadow-sm">
              <div className="border-b border-border px-6 py-4">
                <h2 className="text-xl font-semibold text-foreground">{consigna4a.titulo}</h2>
                <p className="text-sm text-muted-foreground">{consigna4a.descripcion || ""}</p>
              </div>
              <div className="px-6 py-5">
                {mejoresCalificaciones.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aún no hay calificaciones registradas.</p>
                ) : (
                  <div className="space-y-4">
                    {mejoresCalificaciones.map((item) => (
                      <div
                        key={`${item.id_calificacion ?? item.id_proveedor}-${item.fecha_evaluacion}`}
                        className="rounded-lg border border-border/70 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-foreground">{item.nombre}</p>
                            <p className="text-xs text-muted-foreground">Evaluado el {formatDate(item.fecha_evaluacion)}</p>
                          </div>
                          <div className="flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-200">
                            <Star className="h-4 w-4" />
                            <span className="text-sm font-semibold">{Number(item.puntaje || 0).toFixed(1)}</span>
                          </div>
                        </div>
                        {item.comentarios && (
                          <p className="mt-3 text-sm text-muted-foreground">“{item.comentarios}”</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card shadow-sm">
              <div className="border-b border-border px-6 py-4">
                <h2 className="text-xl font-semibold text-foreground">{consigna4b.titulo}</h2>
                <p className="text-sm text-muted-foreground">{consigna4b.descripcion || ""}</p>
              </div>
              <div className="px-6 py-5">
                {proveedoresSinFallas.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay proveedores con historial limpio.</p>
                ) : (
                  <div className="space-y-4">
                    {proveedoresSinFallas.map((provider) => (
                      <div key={provider.id_proveedor} className="rounded-lg border border-border/70 p-4">
                        <p className="font-semibold text-foreground">{provider.nombre}</p>
                        <div className="mt-2 grid gap-1 text-xs text-muted-foreground">
                          <span>Correo: {provider.correo || "Sin correo"}</span>
                          <span>Teléfono: {provider.telefono || "Sin teléfono"}</span>
                          <span>Alta: {formatDate(provider.fecha_alta)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-border bg-card shadow-sm">
              <div className="border-b border-border px-6 py-4">
                <h2 className="text-xl font-semibold text-foreground">{consigna5.titulo}</h2>
                <p className="text-sm text-muted-foreground">{consigna5.descripcion || ""}</p>
              </div>
              <div className="space-y-6 px-6 py-5">
                <form onSubmit={handleStoredProcedureSubmit} className="grid grid-cols-1 gap-4 lg:grid-cols-5">
                  <div className="space-y-2 lg:col-span-2">
                    <Label htmlFor="sp-proveedor">Proveedor destino</Label>
                    <select
                      id="sp-proveedor"
                      value={spForm.id_proveedor}
                      onChange={(event) => setSpForm((prev) => ({ ...prev, id_proveedor: event.target.value }))}
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

                  <div className="space-y-2 lg:col-span-2">
                    <Label htmlFor="sp-fecha">Fecha del pedido</Label>
                    <Input
                      id="sp-fecha"
                      type="date"
                      value={spForm.fecha_pedido}
                      onChange={(event) => setSpForm((prev) => ({ ...prev, fecha_pedido: event.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2 lg:col-span-1">
                    <Label htmlFor="sp-monto">Monto total</Label>
                    <Input
                      id="sp-monto"
                      type="number"
                      step="0.01"
                      min="0"
                      value={spForm.monto_total}
                      onChange={(event) => setSpForm((prev) => ({ ...prev, monto_total: event.target.value }))}
                      required
                    />
                  </div>

                  <div className="lg:col-span-5 flex flex-col gap-2 sm:flex-row sm:items-center">
                    {spStatus?.message && (
                      <span
                        className={`text-sm ${spStatus.success ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}
                      >
                        {spStatus.message}
                      </span>
                    )}
                    <Button type="submit" disabled={spLoading} className="sm:ml-auto">
                      {spLoading ? "Ejecutando..." : "Ejecutar SP_RegistrarOrden"}
                    </Button>
                  </div>
                </form>

                <div>
                  <h3 className="text-sm font-semibold text-foreground">Última orden generada por el SP</h3>
                  {ultimaOrdenSp ? (
                    <div className="mt-3 space-y-3 rounded-lg border border-border/70 bg-muted/30 p-4 text-sm text-muted-foreground">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-semibold text-foreground">Orden #{ultimaOrdenSp.id_orden}</p>
                          <p>Proveedor: {ultimaOrdenSp.proveedor_nombre}</p>
                        </div>
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">
                          {formatStateLabel(ultimaOrdenSp.estado)}
                        </div>
                      </div>
                      <div className="grid gap-1 text-xs text-muted-foreground">
                        <span>Fecha del pedido: {formatDate(ultimaOrdenSp.fecha_pedido)}</span>
                        <span>Monto total registrado: {formatCurrency(ultimaOrdenSp.monto_total)}</span>
                      </div>
                      <div className="rounded-md border border-border/60 bg-background/60 p-3">
                        <p className="text-xs font-semibold text-foreground">Detalle automático</p>
                        <div className="mt-2 space-y-2 text-sm">
                          {Array.isArray(ultimaOrdenSp.detalles) && ultimaOrdenSp.detalles.length > 0 ? (
                            ultimaOrdenSp.detalles.map((detail) => (
                              <div
                                key={detail.id_detalle || `${detail.id_producto}-${detail.cantidad}`}
                                className="flex items-center justify-between gap-3"
                              >
                                <span>
                                  {detail.cantidad} x {detail.producto_nombre}
                                </span>
                                <span>{formatCurrency(detail.subtotal)}</span>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-muted-foreground">Sin detalles registrados.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-muted-foreground">
                      Ejecuta el procedimiento para registrar automáticamente la orden de ejemplo y visualizarla aquí.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card shadow-sm">
              <div className="border-b border-border px-6 py-4">
                <h2 className="text-xl font-semibold text-foreground">{consigna6.titulo}</h2>
                <p className="text-sm text-muted-foreground">{consigna6.descripcion || ""}</p>
              </div>
              <div className="px-6 py-5">
                {auditoriaOrdenes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No se registraron operaciones en la auditoría.</p>
                ) : (
                  <div className="space-y-4">
                    {auditoriaOrdenes.map((audit) => (
                      <div key={audit.id_auditoria} className="rounded-lg border border-border/70 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-foreground">Orden #{audit.id_orden || "N/A"}</p>
                            <p className="text-xs text-muted-foreground">
                              Proveedor: {audit.proveedor_nombre || "Sin asignar"}
                            </p>
                          </div>
                          <span className="rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">
                            {audit.accion || "Acción no definida"}
                          </span>
                        </div>
                        <div className="mt-3 grid gap-1 text-xs text-muted-foreground">
                          <span>Estado registrado: {formatStateLabel(audit.estado)}</span>
                          <span>Fecha del pedido: {formatDate(audit.fecha_pedido)}</span>
                          <span>Auditado el: {formatDateTime(audit.fecha_auditoria)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
