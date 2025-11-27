"use client"

import { useEffect, useState } from "react"
import { Plus, Eye, Pencil, Trash2, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import RatingModal from "@/components/ratings/rating-modal"

export default function RatingsSection() {
  const [ratings, setRatings] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRating, setEditingRating] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const ratingsResponse = await fetch("/api/ratings")
      const ratingsJson = await ratingsResponse.json()

      if (!ratingsJson.success) {
        throw new Error(ratingsJson.error || "No se pudieron obtener las calificaciones")
      }

      setRatings(ratingsJson.data || [])
    } catch (err) {
      console.error("Error fetching ratings data:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredRatings = ratings.filter((rating) => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return true

    return (
      rating.proveedor_nombre?.toLowerCase().includes(term) ||
      (rating.comentarios || "").toLowerCase().includes(term)
    )
  })

  const handleSaveRating = async (payload) => {
    try {
      const method = editingRating ? "PUT" : "POST"
      const response = await fetch("/api/ratings", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "No se pudo guardar la calificación")
      }

      if (editingRating) {
        setRatings((prev) =>
          prev.map((rating) =>
            rating.id_calificacion === data.data.id_calificacion ? data.data : rating
          )
        )
        setEditingRating(null)
      } else {
        setRatings((prev) => [data.data, ...prev])
      }

      setIsModalOpen(false)
    } catch (err) {
      console.error("Error saving rating:", err)
      alert(err.message)
    }
  }

  const handleEdit = (rating) => {
    setEditingRating(rating)
    setIsModalOpen(true)
  }

  const handleDelete = async (rating) => {
    if (!confirm("¿Eliminar esta calificación definitivamente?")) {
      return
    }

    try {
      const response = await fetch(`/api/ratings?id=${rating.id_calificacion}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "No se pudo eliminar la calificación")
      }

      setRatings((prev) => prev.filter((item) => item.id_calificacion !== rating.id_calificacion))
    } catch (err) {
      console.error("Error deleting rating:", err)
      alert(err.message)
    }
  }

  const renderStars = (rating) => {
    const score = Number(rating) || 0
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= score ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
          />
        ))}
      </div>
    )
  }

  const getScoreColor = (score) => {
    const value = Number(score) || 0
    if (value >= 4) return "text-green-600 font-semibold"
    if (value >= 3) return "text-yellow-600 font-semibold"
    return "text-red-600 font-semibold"
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Calificaciones</h2>
        <Button onClick={() => {
          setEditingRating(null)
          setIsModalOpen(true)
        }} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nueva Calificación
        </Button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por proveedor o comentarios..."
          className="w-full border px-4 py-2 rounded"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <p className="text-center py-8">Cargando...</p>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchData}>Reintentar</Button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-4 py-2 text-left">Proveedor</th>
                <th className="border px-4 py-2 text-left">Plazo</th>
                <th className="border px-4 py-2 text-left">Tiempo Respuesta</th>
                <th className="border px-4 py-2 text-left">Disponibilidad</th>
                <th className="border px-4 py-2 text-left">Comentarios</th>
                <th className="border px-4 py-2 text-left">Calificación</th>
                <th className="border px-4 py-2 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredRatings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-4">
                    No se encontraron calificaciones
                  </td>
                </tr>
              ) : (
                filteredRatings.map((rating) => (
                  <tr key={rating.id_calificacion}>
                    <td className="border px-4 py-2">{rating.proveedor_nombre}</td>
                    <td className="border px-4 py-2">
                      <div className="flex flex-col gap-1">
                        {renderStars(rating.puntaje_plazo)}
                        <span className={`text-xs ${getScoreColor(rating.puntaje_plazo)}`}>
                          {rating.puntaje_plazo || 0}/5
                        </span>
                      </div>
                    </td>
                    <td className="border px-4 py-2">
                      <div className="flex flex-col gap-1">
                        {renderStars(rating.puntaje_tiempo_respuesta)}
                        <span className={`text-xs ${getScoreColor(rating.puntaje_tiempo_respuesta)}`}>
                          {rating.puntaje_tiempo_respuesta || 0}/5
                        </span>
                      </div>
                    </td>
                    <td className="border px-4 py-2">
                      <div className="flex flex-col gap-1">
                        {renderStars(rating.puntaje_disponibilidad)}
                        <span className={`text-xs ${getScoreColor(rating.puntaje_disponibilidad)}`}>
                          {rating.puntaje_disponibilidad || 0}/5
                        </span>
                      </div>
                    </td>
                    <td className="border px-4 py-2">{rating.comentarios || "Sin comentarios"}</td>
                    <td className="border px-4 py-2">
                      <div className="flex flex-col gap-1">
                        {renderStars(rating.puntuacion_total)}
                        <span className={`text-xs ${getScoreColor(rating.puntuacion_total)}`}>
                          {rating.puntuacion_total || 0}/5
                        </span>
                      </div>
                    </td>
                    <td className="border px-4 py-2">
                      <div className="flex justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => alert(`Proveedor: ${rating.proveedor_nombre}\nPlazo: ${rating.puntaje_plazo || 0}/5\nCalidad: ${rating.puntaje_calidad || 0}/5\nTiempo Respuesta: ${rating.puntaje_tiempo_respuesta || 0}/5\nDisponibilidad: ${rating.puntaje_disponibilidad || 0}/5\nTotal: ${rating.puntuacion_total || 0}/5\nComentarios: ${rating.comentarios || "Sin comentarios"}`)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(rating)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(rating)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <RatingModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setEditingRating(null)
          }}
          onSave={handleSaveRating}
          rating={editingRating}
        />
      )}
    </div>
  )
}
