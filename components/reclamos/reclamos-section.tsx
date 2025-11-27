"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Trash2, Plus } from "lucide-react";
import ReclamoModal from "./reclamo-modal";

interface Reclamo {
  id_reclamo: number;
  fecha_reporte: string;
  descripcion: string;
  prioridad: string;
  estado: string;
  id_equipo: number | null;
  id_orden: number | null;
  id_empleado: number;
  item_descripcion: string | null;
}

export default function ReclamosSection() {
  const [reclamos, setReclamos] = useState<Reclamo[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedReclamo, setSelectedReclamo] = useState<Reclamo | null>(null);
  const [modalMode, setModalMode] = useState<"view" | "edit" | "create">("view");

  const fetchReclamos = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reclamos");
      const data = await res.json();
      if (data.success) {
        setReclamos(data.data || []);
      }
    } catch (error) {
      console.error("Error al cargar reclamos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReclamos();
  }, []);

  const filteredReclamos = reclamos.filter((reclamo) => {
    const search = searchTerm.toLowerCase();
    return (
      reclamo.id_reclamo.toString().includes(search) ||
      reclamo.descripcion?.toLowerCase().includes(search) ||
      reclamo.estado.toLowerCase().includes(search) ||
      reclamo.prioridad.toLowerCase().includes(search) ||
      reclamo.item_descripcion?.toLowerCase().includes(search)
    );
  });

  const handleView = (reclamo: Reclamo) => {
    setSelectedReclamo(reclamo);
    setModalMode("view");
    setShowModal(true);
  };

  const handleEdit = (reclamo: Reclamo) => {
    setSelectedReclamo(reclamo);
    setModalMode("edit");
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Está seguro de eliminar este reclamo?")) return;

    try {
      const res = await fetch(`/api/reclamos?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        fetchReclamos();
      } else {
        alert(data.error || "Error al eliminar el reclamo");
      }
    } catch (error) {
      console.error("Error al eliminar reclamo:", error);
      alert("Error al eliminar el reclamo");
    }
  };

  const handleCreate = () => {
    setSelectedReclamo(null);
    setModalMode("create");
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedReclamo(null);
    fetchReclamos();
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Reclamos</h2>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nuevo Reclamo
        </Button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por ID, descripción, estado, prioridad..."
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
                <th className="border px-4 py-2 text-left">Fecha Reporte</th>
                <th className="border px-4 py-2 text-left">Descripción</th>
                <th className="border px-4 py-2 text-left">Prioridad</th>
                <th className="border px-4 py-2 text-left">Estado</th>
                <th className="border px-4 py-2 text-left">ID Equipo</th>
                <th className="border px-4 py-2 text-left">ID Orden</th>
                <th className="border px-4 py-2 text-left">Descripción Item</th>
                <th className="border px-4 py-2 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredReclamos.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-4">
                    No se encontraron reclamos
                  </td>
                </tr>
              ) : (
                filteredReclamos.map((reclamo) => (
                  <tr key={reclamo.id_reclamo}>
                    <td className="border px-4 py-2">{reclamo.id_reclamo}</td>
                    <td className="border px-4 py-2">
                      {new Date(reclamo.fecha_reporte).toLocaleDateString()}
                    </td>
                    <td className="border px-4 py-2">{reclamo.descripcion || "N/A"}</td>
                    <td className="border px-4 py-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          reclamo.prioridad === "ALTA"
                            ? "bg-red-100 text-red-700"
                            : reclamo.prioridad === "MEDIA"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {reclamo.prioridad}
                      </span>
                    </td>
                    <td className="border px-4 py-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          reclamo.estado === "ABIERTO" || reclamo.estado === "ASIGNADO"
                            ? "bg-blue-100 text-blue-700"
                            : reclamo.estado === "EN ESPERA"
                            ? "bg-yellow-100 text-yellow-700"
                            : reclamo.estado === "RESUELTO" || reclamo.estado === "CERRADO"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {reclamo.estado}
                      </span>
                    </td>
                    <td className="border px-4 py-2">{reclamo.id_equipo || "N/A"}</td>
                    <td className="border px-4 py-2">{reclamo.id_orden || "N/A"}</td>
                    <td className="border px-4 py-2">{reclamo.item_descripcion || "N/A"}</td>
                    <td className="border px-4 py-2">
                      <div className="flex justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(reclamo)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(reclamo)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(reclamo.id_reclamo)}
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
        <ReclamoModal
          isOpen={showModal}
          onClose={handleModalClose}
          reclamo={selectedReclamo}
          mode={modalMode}
        />
      )}
    </div>
  );
}
