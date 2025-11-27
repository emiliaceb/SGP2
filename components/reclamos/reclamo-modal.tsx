"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

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

interface ReclamoModalProps {
  isOpen: boolean;
  onClose: () => void;
  reclamo: Reclamo | null;
  mode: "view" | "edit" | "create";
}

export default function ReclamoModal({ isOpen, onClose, reclamo, mode }: ReclamoModalProps) {
  const [formData, setFormData] = useState({
    id_empleado: "",
    id_equipo: "",
    id_orden: "",
    fecha_reporte: "",
    descripcion: "",
    prioridad: "MEDIA",
    estado: "ABIERTO",
  });

  const [empleados, setEmpleados] = useState<any[]>([]);
  const [equipos, setEquipos] = useState<any[]>([]);
  const [ordenes, setOrdenes] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchOptions();
      if (reclamo && (mode === "view" || mode === "edit")) {
        setFormData({
          id_empleado: reclamo.id_empleado?.toString() || "",
          id_equipo: reclamo.id_equipo?.toString() || "",
          id_orden: reclamo.id_orden?.toString() || "",
          fecha_reporte: reclamo.fecha_reporte?.split("T")[0] || "",
          descripcion: reclamo.descripcion || "",
          prioridad: reclamo.prioridad || "MEDIA",
          estado: reclamo.estado || "ABIERTO",
        });
      } else {
        setFormData({
          id_empleado: "",
          id_equipo: "",
          id_orden: "",
          fecha_reporte: new Date().toISOString().split("T")[0],
          descripcion: "",
          prioridad: "MEDIA",
          estado: "ABIERTO",
        });
      }
    }
  }, [isOpen, reclamo, mode]);

  const fetchOptions = async () => {
    try {
      // Fetch empleados, equipos y ordenes para los selects
      // Por ahora dejamos vacío, ajusta según tus APIs
      setEmpleados([]);
      setEquipos([]);
      setOrdenes([]);
    } catch (error) {
      console.error("Error al cargar opciones:", error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "view") {
      onClose();
      return;
    }

    try {
      const payload: any = {
        id_empleado: parseInt(formData.id_empleado),
        id_equipo: formData.id_equipo ? parseInt(formData.id_equipo) : null,
        id_orden: formData.id_orden ? parseInt(formData.id_orden) : null,
        fecha_reporte: formData.fecha_reporte,
        descripcion: formData.descripcion,
        prioridad: formData.prioridad,
        estado: formData.estado,
      };

      if (mode === "edit" && reclamo) {
        payload.id_reclamo = reclamo.id_reclamo;
      }

      const method = mode === "edit" ? "PUT" : "POST";
      const res = await fetch("/api/reclamos", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        onClose();
      } else {
        alert(data.error || "Error al guardar el reclamo");
      }
    } catch (error) {
      console.error("Error al guardar reclamo:", error);
      alert("Error al guardar el reclamo");
    }
  };

  if (!isOpen) return null;

  const isViewMode = mode === "view";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">
          {mode === "create" ? "Nuevo Reclamo" : mode === "edit" ? "Editar Reclamo" : "Ver Reclamo"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="id_empleado">ID Empleado *</Label>
            <Input
              id="id_empleado"
              name="id_empleado"
              type="number"
              value={formData.id_empleado}
              onChange={handleChange}
              disabled={isViewMode}
              required
            />
          </div>

          <div>
            <Label htmlFor="id_equipo">ID Equipo</Label>
            <Input
              id="id_equipo"
              name="id_equipo"
              type="number"
              value={formData.id_equipo}
              onChange={handleChange}
              disabled={isViewMode}
            />
          </div>

          <div>
            <Label htmlFor="id_orden">ID Orden</Label>
            <Input
              id="id_orden"
              name="id_orden"
              type="number"
              value={formData.id_orden}
              onChange={handleChange}
              disabled={isViewMode}
            />
          </div>

          <div>
            <Label htmlFor="fecha_reporte">Fecha de Reporte *</Label>
            <Input
              id="fecha_reporte"
              name="fecha_reporte"
              type="date"
              value={formData.fecha_reporte}
              onChange={handleChange}
              disabled={isViewMode}
              required
            />
          </div>

          <div>
            <Label htmlFor="descripcion">Descripción</Label>
            <textarea
              id="descripcion"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              disabled={isViewMode}
              className="w-full border px-3 py-2 rounded min-h-[100px]"
              maxLength={500}
            />
          </div>

          <div>
            <Label htmlFor="prioridad">Prioridad *</Label>
            <select
              id="prioridad"
              name="prioridad"
              value={formData.prioridad}
              onChange={handleChange}
              disabled={isViewMode}
              className="w-full border px-3 py-2 rounded"
              required
            >
              <option value="ALTA">Alta</option>
              <option value="MEDIA">Media</option>
              <option value="BAJA">Baja</option>
            </select>
          </div>

          <div>
            <Label htmlFor="estado">Estado *</Label>
            <select
              id="estado"
              name="estado"
              value={formData.estado}
              onChange={handleChange}
              disabled={isViewMode}
              className="w-full border px-3 py-2 rounded"
              required
            >
              <option value="ABIERTO">Abierto</option>
              <option value="ASIGNADO">Asignado</option>
              <option value="EN ESPERA">En Espera</option>
              <option value="RESUELTO">Resuelto</option>
              <option value="CERRADO">Cerrado</option>
              <option value="ANULADO">Anulado</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              {isViewMode ? "Cerrar" : "Cancelar"}
            </Button>
            {!isViewMode && (
              <Button type="submit">
                {mode === "create" ? "Crear" : "Guardar"}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
