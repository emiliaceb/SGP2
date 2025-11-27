"use client"

import { useEffect, useState } from "react"
import { Calculator, Eye, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function RatingsSection() {
  const [ratings, setRatings] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [providers, setProviders] = useState([])
  const [selectedProvider, setSelectedProvider] = useState("")
  const [calculating, setCalculating] = useState(false)
  const [autoUpdating, setAutoUpdating] = useState(false)

  useEffect(() => {
    initializeSection()
  }, [])

  const initializeSection = async () => {
    await fetchProviders()
    await autoUpdateAllRatings()
    await fetchData()
  }

  const autoUpdateAllRatings = async () => {
    try {
      setAutoUpdating(true)
      
      // Obtener todos los proveedores que tienen calificaciones
      const ratingsResponse = await fetch("/api/ratings")
      const ratingsJson = await ratingsResponse.json()
      
      if (ratingsJson.success && ratingsJson.data.length > 0) {
        // Recalcular cada calificación existente
        for (const rating of ratingsJson.data) {
          try {
            await fetch('/api/ratings/calculate', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ cuit: Number(rating.cuit) }),
            })
          } catch (error) {
            console.error(`Error actualizando calificación de proveedor ${rating.cuit}:`, error)
          }
        }
      }
    } catch (error) {
      console.error('Error en actualización automática:', error)
    } finally {
      setAutoUpdating(false)
    }
  }

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

  const fetchProviders = async () => {
    try {
      const response = await fetch("/api/providers?mode=options")
      const data = await response.json()
      if (data.success) {
        setProviders(data.data)
      }
    } catch (error) {
      console.error("Error al cargar proveedores:", error)
    }
  }

  const handleCalculateRating = async () => {
    if (!selectedProvider) {
      alert("Debe seleccionar un proveedor")
      return
    }

    setCalculating(true)
    try {
      const response = await fetch('/api/ratings/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cuit: Number(selectedProvider) }),
      })

      const data = await response.json()

      if (data.success) {
        // Actualizar la tabla inmediatamente con los nuevos datos
        await fetchData()
        
        alert(`Calificación calculada exitosamente:\n\n${data.detalle.interpretacion}\nPuntuación: ${data.detalle.puntuacion_total}\n\nPlazo Entrega: ${data.detalle.puntaje_plazo.valor}/3\nTiempo Respuesta: ${data.detalle.puntaje_tiempo_respuesta.valor}/3\nDisponibilidad: ${data.detalle.puntaje_disponibilidad.valor}/3`)
        setSelectedProvider("")
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

  const filteredRatings = ratings.filter((rating) => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return true

    return (
      rating.proveedor_nombre?.toLowerCase().includes(term) ||
      (rating.comentarios || "").toLowerCase().includes(term)
    )
  })

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

  const getScoreBadge = (score) => {
    const value = Number(score) || 0
    let label = ""
    let colorClass = ""

    if (value === 3) {
      label = "Buena"
      colorClass = "bg-green-100 text-green-800"
    } else if (value === 2) {
      label = "Media"
      colorClass = "bg-yellow-100 text-yellow-800"
    } else {
      label = "Mala"
      colorClass = "bg-red-100 text-red-800"
    }

    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold ${colorClass}`}>
        {label}
      </span>
    )
  }

  const getInterpretacionBadge = (score) => {
    const value = Number(score) || 0
    let label = ""
    let colorClass = ""

    if (value >= 2.7) {
      label = "Óptimo"
      colorClass = "bg-green-100 text-green-800"
    } else if (value >= 1.7) {
      label = "Aceptable"
      colorClass = "bg-yellow-100 text-yellow-800"
    } else {
      label = "Insatisfactorio"
      colorClass = "bg-red-100 text-red-800"
    }

    return (
      <div className="flex flex-col items-center gap-1">
        <span className="text-2xl font-bold">{value.toFixed(2)}</span>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colorClass}`}>
          {label}
        </span>
      </div>
    )
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Calificaciones de Proveedores</h2>
      </div>

      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-semibold mb-3 text-blue-900">Calcular Calificación Automática</h3>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1 text-blue-900">
              Seleccionar Proveedor
            </label>
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="w-full border px-3 py-2 rounded"
              disabled={calculating}
            >
              <option value="">-- Seleccione un proveedor --</option>
              {providers.map((provider) => (
                <option key={provider.cuit} value={provider.cuit}>
                  {provider.razon_social}
                </option>
              ))}
            </select>
          </div>
          <Button
            onClick={handleCalculateRating}
            disabled={!selectedProvider || calculating}
            className="flex items-center gap-2"
          >
            <Calculator className="w-4 h-4" />
            {calculating ? "Calculando..." : "Calcular"}
          </Button>
        </div>
        <p className="text-xs text-blue-700 mt-2">
          La calificación se genera automáticamente basándose en plazos de entrega, tiempo de respuesta a reclamos y disponibilidad.
        </p>
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

      {autoUpdating && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-blue-700 text-sm text-center">
          Actualizando calificaciones automáticamente...
        </div>
      )}

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
                <th className="border px-4 py-2 text-center">Plazo Entrega</th>
                <th className="border px-4 py-2 text-center">Tiempo Respuesta</th>
                <th className="border px-4 py-2 text-center">Disponibilidad</th>
                <th className="border px-4 py-2 text-left">Detalle</th>
                <th className="border px-4 py-2 text-center">Calificación Final</th>
                <th className="border px-4 py-2 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredRatings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-4">
                    {searchTerm ? "No se encontraron calificaciones" : "No hay calificaciones. Use el formulario de arriba para calcular una calificación."}
                  </td>
                </tr>
              ) : (
                filteredRatings.map((rating) => (
                  <tr key={rating.id_calificacion}>
                    <td className="border px-4 py-2 font-medium">{rating.proveedor_nombre}</td>
                    <td className="border px-4 py-2 text-center">
                      {getScoreBadge(rating.puntaje_plazo)}
                    </td>
                    <td className="border px-4 py-2 text-center">
                      {getScoreBadge(rating.puntaje_tiempo_respuesta)}
                    </td>
                    <td className="border px-4 py-2 text-center">
                      {getScoreBadge(rating.puntaje_disponibilidad)}
                    </td>
                    <td className="border px-4 py-2 text-sm text-gray-600">
                      {rating.comentarios || "Sin comentarios"}
                    </td>
                    <td className="border px-4 py-2 text-center">
                      {getInterpretacionBadge(rating.puntuacion_total)}
                    </td>
                    <td className="border px-4 py-2">
                      <div className="flex justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => alert(`Proveedor: ${rating.proveedor_nombre}\n\nPlazo Entrega: ${rating.puntaje_plazo || 0}/3\nTiempo Respuesta: ${rating.puntaje_tiempo_respuesta || 0}/3\nDisponibilidad: ${rating.puntaje_disponibilidad || 0}/3\n\nCalificación Final: ${rating.puntuacion_total || 0}\n\nDetalle:\n${rating.comentarios || "Sin comentarios"}`)}
                        >
                          <Eye className="w-4 h-4" />
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
    </div>
  )
}
