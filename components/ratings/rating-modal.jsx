"use client"

import { useState, useEffect } from "react"
import { X, Star, Calculator } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function RatingModal({ isOpen, onClose, onSave, rating, providers = [] }) {
  const [formData, setFormData] = useState({
    id_calificacion: null,
    cuit: "",
    puntaje_plazo: 3,
    puntaje_calidad: 3,
    puntaje_tiempo_respuesta: 3,
    puntaje_disponibilidad: 3,
    comentarios: "",
    puntuacion_total: 3,
  })
  const [calculating, setCalculating] = useState(false)
  const [detalle, setDetalle] = useState(null)

  useEffect(() => {
    if (rating) {
      const total = ((
        (rating.puntaje_plazo || 0) +
        (rating.puntaje_tiempo_respuesta || 0) +
        (rating.puntaje_disponibilidad || 0)
      ) / 3).toFixed(2)
      
      setFormData({
        id_calificacion: rating.id_calificacion,
        cuit: rating.cuit?.toString() || "",
        puntaje_plazo: Number(rating.puntaje_plazo) || 3,
        puntaje_calidad: null,
        puntaje_tiempo_respuesta: Number(rating.puntaje_tiempo_respuesta) || 3,
        puntaje_disponibilidad: Number(rating.puntaje_disponibilidad) || 3,
        comentarios: rating.comentarios || "",
        puntuacion_total: total,
      })
    } else {
      setFormData({
        id_calificacion: null,
        cuit: "",
        puntaje_plazo: 3,
        puntaje_calidad: null,
        puntaje_tiempo_respuesta: 3,
        puntaje_disponibilidad: 3,
        comentarios: "",
        puntuacion_total: "3.00",
      })
    }
    setDetalle(null)
  }, [rating, isOpen])

  const calculateTotal = (plazo, tiempo, disponibilidad) => {
    return ((plazo + tiempo + disponibilidad) / 3).toFixed(2)
  }

  const handleScoreChange = (field, value) => {
    const newFormData = { ...formData, [field]: value }
    newFormData.puntuacion_total = calculateTotal(
      newFormData.puntaje_plazo,
      newFormData.puntaje_tiempo_respuesta,
      newFormData.puntaje_disponibilidad
    )
    setFormData(newFormData)
  }

  const handleCalculateAutomatic = async () => {
    if (!formData.cuit) {
      alert("Debe seleccionar un proveedor primero")
      return
    }

    setCalculating(true)
    try {
      const response = await fetch('/api/ratings/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cuit: Number(formData.cuit) }),
      })

      const data = await response.json()

      if (data.success) {
        setFormData({
          ...formData,
          id_calificacion: data.data.id_calificacion,
          puntaje_plazo: data.data.puntaje_plazo,
          puntaje_calidad: null,
          puntaje_tiempo_respuesta: data.data.puntaje_tiempo_respuesta,
          puntaje_disponibilidad: data.data.puntaje_disponibilidad,
          comentarios: data.data.comentarios,
          puntuacion_total: data.data.puntuacion_total,
        })
        setDetalle(data.detalle)
        alert(`Calificación calculada: ${data.detalle.interpretacion}\nPuntuación: ${data.detalle.puntuacion_total}`)
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error al calcular calificación:', error)
      alert('Error al calcular la calificación automática')
    } finally {
      setCalculating(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = {
      ...formData,
      cuit: formData.cuit ? Number(formData.cuit) : null,
      puntaje_plazo: Number(formData.puntaje_plazo),
      puntaje_calidad: null,
      puntaje_tiempo_respuesta: Number(formData.puntaje_tiempo_respuesta),
      puntaje_disponibilidad: Number(formData.puntaje_disponibilidad),
      puntuacion_total: Math.round(parseFloat(formData.puntuacion_total)),
    }

    if (!payload.cuit) {
      alert("Debe seleccionar un proveedor")
      return
    }

    onSave(payload)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="text-xl font-semibold text-foreground">
            {rating ? "Editar Calificación" : "Nueva Calificación"}
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
              disabled={rating}
            >
              <option value="">Seleccionar proveedor</option>
              {providers.map((provider) => (
                <option key={provider.cuit} value={provider.cuit}>
                  {provider.razon_social}
                </option>
              ))}
            </select>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleCalculateAutomatic}
            disabled={!formData.cuit || calculating}
            className="w-full flex items-center justify-center gap-2"
          >
            <Calculator className="w-4 h-4" />
            {calculating ? "Calculando..." : "Calcular Calificación Automática"}
          </Button>

          {detalle && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-md text-sm space-y-1">
              <p className="font-semibold text-blue-900 dark:text-blue-100">Detalle del Cálculo:</p>
              <p className="text-blue-800 dark:text-blue-200">
                • Plazo de Entrega: {detalle.puntaje_plazo.valor}/3 ({detalle.puntaje_plazo.promedio_dias} días promedio)
              </p>
              <p className="text-blue-800 dark:text-blue-200">
                • Tiempo Respuesta: {detalle.puntaje_tiempo_respuesta.valor}/3 ({detalle.puntaje_tiempo_respuesta.promedio_dias} días promedio)
              </p>
              <p className="text-blue-800 dark:text-blue-200">
                • Disponibilidad: {detalle.puntaje_disponibilidad.valor}/3 ({detalle.puntaje_disponibilidad.reclamos_pendientes} reclamos pendientes)
              </p>
              <p className="font-semibold text-blue-900 dark:text-blue-100 mt-2">
                Calificación Final: {detalle.puntuacion_total} - {detalle.interpretacion}
              </p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Plazo Entrega (1-3)</Label>
              <div className="flex gap-2 justify-center">
                {[1, 2, 3].map((score) => (
                  <button
                    key={score}
                    type="button"
                    onClick={() => handleScoreChange('puntaje_plazo', score)}
                    className={`w-10 h-10 rounded-full font-bold transition-colors ${
                      score === formData.puntaje_plazo
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {score}
                  </button>
                ))}
              </div>
              <p className="text-xs text-center text-muted-foreground">
                {formData.puntaje_plazo === 3 ? "Buena" : formData.puntaje_plazo === 2 ? "Media" : "Mala"}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Tiempo Respuesta (1-3)</Label>
              <div className="flex gap-2 justify-center">
                {[1, 2, 3].map((score) => (
                  <button
                    key={score}
                    type="button"
                    onClick={() => handleScoreChange('puntaje_tiempo_respuesta', score)}
                    className={`w-10 h-10 rounded-full font-bold transition-colors ${
                      score === formData.puntaje_tiempo_respuesta
                        ? "bg-green-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {score}
                  </button>
                ))}
              </div>
              <p className="text-xs text-center text-muted-foreground">
                {formData.puntaje_tiempo_respuesta === 3 ? "Buena" : formData.puntaje_tiempo_respuesta === 2 ? "Media" : "Mala"}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Disponibilidad (1-3)</Label>
              <div className="flex gap-2 justify-center">
                {[1, 2, 3].map((score) => (
                  <button
                    key={score}
                    type="button"
                    onClick={() => handleScoreChange('puntaje_disponibilidad', score)}
                    className={`w-10 h-10 rounded-full font-bold transition-colors ${
                      score === formData.puntaje_disponibilidad
                        ? "bg-purple-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {score}
                  </button>
                ))}
              </div>
              <p className="text-xs text-center text-muted-foreground">
                {formData.puntaje_disponibilidad === 3 ? "Buena" : formData.puntaje_disponibilidad === 2 ? "Media" : "Mala"}
              </p>
            </div>
          </div>

          <div className="space-y-2 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950 rounded-lg border-2 border-yellow-300 dark:border-yellow-700">
            <Label className="text-lg">Calificación Final</Label>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                {formData.puntuacion_total}
              </span>
              <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                formData.puntuacion_total >= 2.7 
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : formData.puntuacion_total >= 1.7
                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
              }`}>
                {formData.puntuacion_total >= 2.7 ? "Óptimo" : formData.puntuacion_total >= 1.7 ? "Aceptable" : "Insatisfactorio"}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comentarios">Comentarios</Label>
            <textarea
              id="comentarios"
              value={formData.comentarios}
              onChange={(e) => setFormData({ ...formData, comentarios: e.target.value })}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Escriba sus comentarios sobre la evaluación..."
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
