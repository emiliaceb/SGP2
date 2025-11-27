"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Trash2, Plus } from "lucide-react";
import IntervencionModal from "./Intervencion-modal";

export default function IntervencionSection() {
  const [intervenciones, setIntervenciones] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedIntervencion, setSelectedIntervencion] = useState(null);
  const [modalMode, setModalMode] = useState("view");

  const fetchIntervenciones = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/intervenciones");
      const data = await res.json();
      if (data.success) {
        setIntervenciones(data.data || []);
      }
    } catch (error) {
      console.error("Error al cargar intervenciones:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntervenciones();
  }, []);

  const filteredIntervenciones = intervenciones.filter((intervencion) => {
    const search = searchTerm.toLowerCase();
    return (
      intervencion.id_reclamo?.toString().includes(search) ||
      intervencion.estado?.toLowerCase().includes(search)
    );
  });

  const handleView = (intervencion) => {
    setSelectedIntervencion(intervencion);
    setModalMode("view");
    setShowModal(true);
  };

  const handleEdit = (intervencion) => {
    setSelectedIntervencion(intervencion);
    setModalMode("edit");
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Está seguro de eliminar esta intervención?")) return;

    try {
      const res = await fetch(`/api/intervenciones?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        fetchIntervenciones();
      } else {
        alert(data.error || "Error al eliminar la intervención");
      }
    } catch (error) {
      console.error("Error al eliminar intervención:", error);
      alert("Error al eliminar la intervención");
    }
  };

  const handleCreate = () => {
    setSelectedIntervencion(null);
    setModalMode("create");
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedIntervencion(null);
    fetchIntervenciones();
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Intervenciones</h2>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nueva Intervención
        </Button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por ID Reclamo o Estado..."
          className="w-full border px-4 py-2 rounded"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <p className="text-center py-8">Cargando...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-4 py-2 text-left">ID Reclamo</th>
                <th className="border px-4 py-2 text-left">Fecha</th>
                <th className="border px-4 py-2 text-left">Estado</th>
                <th className="border px-4 py-2 text-left">Técnico</th>
                <th className="border px-4 py-2 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredIntervenciones.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-4">
                    No se encontraron intervenciones
                  </td>
                </tr>
              ) : (
                filteredIntervenciones.map((intervencion) => (
                  <tr key={intervencion.id_intervencion}>
                    <td className="border px-4 py-2">{intervencion.id_reclamo || "N/A"}</td>
                    <td className="border px-4 py-2">
                      {new Date(intervencion.fecha).toLocaleDateString()}
                    </td>
                    <td className="border px-4 py-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          intervencion.estado === "ASIGNADA"
                            ? "bg-blue-100 text-blue-700"
                            : intervencion.estado === "EN PROGRESO"
                            ? "bg-yellow-100 text-yellow-700"
                            : intervencion.estado === "SUSPENDIDA"
                            ? "bg-red-100 text-red-700"
                            : intervencion.estado === "FINALIZADA"
                            ? "bg-green-100 text-green-700"
                            : "bg-purple-100 text-purple-700"
                        }`}
                      >
                        {intervencion.estado}
                      </span>
                    </td>
                    <td className="border px-4 py-2">{intervencion.tecnico_nombre || "N/A"}</td>
                    <td className="border px-4 py-2">
                      <div className="flex justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(intervencion)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(intervencion)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(intervencion.id_intervencion)}
                        >
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

      {showModal && (
        <IntervencionModal
          isOpen={showModal}
          onClose={handleModalClose}
          intervencion={selectedIntervencion}
          mode={modalMode}
        />
      )}
    </div>
  );
}
