"use client"

import { useState, useEffect } from "react"
import { X, Star } from "lucide-react"
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

  useEffect(() => {
    if (rating) {
      const total = Math.round((
        (rating.puntaje_plazo || 0) +
        (rating.puntaje_calidad || 0) +
        (rating.puntaje_tiempo_respuesta || 0) +
        (rating.puntaje_disponibilidad || 0)
      ) / 4)
      
      setFormData({
        id_calificacion: rating.id_calificacion,
        cuit: rating.cuit?.toString() || "",
        puntaje_plazo: Number(rating.puntaje_plazo) || 3,
        puntaje_calidad: Number(rating.puntaje_calidad) || 3,
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
        puntaje_calidad: 3,
        puntaje_tiempo_respuesta: 3,
        puntaje_disponibilidad: 3,
        comentarios: "",
        puntuacion_total: 3,
      })
    }
  }, [rating, isOpen])

  const calculateTotal = (plazo, calidad, tiempo, disponibilidad) => {
    return Math.round((plazo + calidad + tiempo + disponibilidad) / 4)
  }

  const handleScoreChange = (field, value) => {
    const newFormData = { ...formData, [field]: value }
    newFormData.puntuacion_total = calculateTotal(
      newFormData.puntaje_plazo,
      newFormData.puntaje_calidad,
      newFormData.puntaje_tiempo_respuesta,
      newFormData.puntaje_disponibilidad
    )
    setFormData(newFormData)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = {
      ...formData,
      cuit: formData.cuit ? Number(formData.cuit) : null,
      puntaje_plazo: Number(formData.puntaje_plazo),
      puntaje_calidad: Number(formData.puntaje_calidad),
      puntaje_tiempo_respuesta: Number(formData.puntaje_tiempo_respuesta),
      puntaje_disponibilidad: Number(formData.puntaje_disponibilidad),
      puntuacion_total: Number(formData.puntuacion_total),
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Plazo (1 a 5)</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((score) => (
                  <button
                    key={score}
                    type="button"
                    onClick={() => handleScoreChange('puntaje_plazo', score)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`w-6 h-6 transition-colors ${
                        score <= formData.puntaje_plazo
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300 hover:text-yellow-200"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Calidad (1 a 5)</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((score) => (
                  <button
                    key={score}
                    type="button"
                    onClick={() => handleScoreChange('puntaje_calidad', score)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`w-6 h-6 transition-colors ${
                        score <= formData.puntaje_calidad
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300 hover:text-yellow-200"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tiempo Respuesta (1 a 5)</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((score) => (
                  <button
                    key={score}
                    type="button"
                    onClick={() => handleScoreChange('puntaje_tiempo_respuesta', score)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`w-6 h-6 transition-colors ${
                        score <= formData.puntaje_tiempo_respuesta
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300 hover:text-yellow-200"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Disponibilidad (1 a 5)</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((score) => (
                  <button
                    key={score}
                    type="button"
                    onClick={() => handleScoreChange('puntaje_disponibilidad', score)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`w-6 h-6 transition-colors ${
                        score <= formData.puntaje_disponibilidad
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300 hover:text-yellow-200"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2 p-3 bg-muted rounded-md">
            <Label>Puntuación Total</Label>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((score) => (
                  <Star
                    key={score}
                    className={`w-7 h-7 ${
                      score <= formData.puntuacion_total
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-lg font-semibold">{formData.puntuacion_total}/5</span>
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
