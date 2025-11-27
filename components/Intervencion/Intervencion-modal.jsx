"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function IntervencionModal({ isOpen, onClose, intervencion, mode }) {
  const [formData, setFormData] = useState({
    id_equipo: "",
    id_tecnico: "",
    id_reclamo: "",
    fecha: "",
    estado: "ASIGNADA",
    descripcion_problema: "",
    descripcion_trabajo_realizado: "",
  });

  const [tecnicos, setTecnicos] = useState([]);
  const [reclamos, setReclamos] = useState([]);
  const [reclamoInfo, setReclamoInfo] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchOptions();
      if (intervencion && (mode === "view" || mode === "edit")) {
        setFormData({
          id_equipo: intervencion.intervencion_id_equipo?.toString() || "",
          id_tecnico: intervencion.id_tecnico?.toString() || "",
          id_reclamo: intervencion.id_reclamo?.toString() || "",
          fecha: intervencion.fecha?.split("T")[0] || "",
          estado: intervencion.estado || "ASIGNADA",
          descripcion_problema: intervencion.descripcion_problema || "",
          descripcion_trabajo_realizado: intervencion.descripcion_trabajo_realizado || "",
        });
        
        // Establecer información del reclamo para modo view/edit
        if (intervencion.id_reclamo) {
          setReclamoInfo({
            id_equipo: intervencion.reclamo_id_equipo,
            id_orden: intervencion.reclamo_id_orden,
            orden_descripcion: intervencion.orden_descripcion,
          });
        }
      } else {
        setFormData({
          id_equipo: "",
          id_tecnico: "",
          id_reclamo: "",
          fecha: new Date().toISOString().split("T")[0],
          estado: "ASIGNADA",
          descripcion_problema: "",
          descripcion_trabajo_realizado: "",
        });
        setReclamoInfo(null);
      }
    }
  }, [isOpen, intervencion, mode]);

  const fetchOptions = async () => {
    try {
      const [tecnicosRes, reclamosRes] = await Promise.all([
        fetch("/api/technicians"),
        fetch("/api/reclamos"),
      ]);

      const tecnicosData = await tecnicosRes.json();
      const reclamosData = await reclamosRes.json();

      if (tecnicosData.success) {
        setTecnicos(tecnicosData.data || []);
      }
      if (reclamosData.success) {
        // Filtrar solo reclamos que tengan id_equipo
        const reclamosConEquipo = (reclamosData.data || []).filter(r => r.id_equipo);
        setReclamos(reclamosConEquipo);
      }
    } catch (error) {
      console.error("Error al cargar opciones:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Si se cambia el reclamo en modo creación, actualizar el id_equipo automáticamente
    if (name === "id_reclamo" && mode === "create" && value) {
      const reclamoSeleccionado = reclamos.find(r => r.id_reclamo === parseInt(value));
      if (reclamoSeleccionado && reclamoSeleccionado.id_equipo) {
        setFormData((prev) => ({ 
          ...prev, 
          [name]: value,
          id_equipo: reclamoSeleccionado.id_equipo.toString()
        }));
        setReclamoInfo({
          id_equipo: reclamoSeleccionado.id_equipo,
          id_orden: reclamoSeleccionado.id_orden,
          orden_descripcion: reclamoSeleccionado.item_descripcion,
        });
        return;
      }
    }
    
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (mode === "view") {
      onClose();
      return;
    }

    // Validar que el reclamo tenga un equipo asociado
    if (!formData.id_equipo) {
      alert("El reclamo seleccionado debe tener un equipo asociado");
      return;
    }

    try {
      const payload = {
        id_equipo: parseInt(formData.id_equipo),
        id_tecnico: parseInt(formData.id_tecnico),
        id_reclamo: parseInt(formData.id_reclamo),
        fecha: formData.fecha,
        estado: formData.estado,
        descripcion_problema: formData.descripcion_problema,
        descripcion_trabajo_realizado: formData.descripcion_trabajo_realizado,
      };

      if (mode === "edit" && intervencion) {
        payload.id_intervencion = intervencion.id_intervencion;
      }

      const method = mode === "edit" ? "PUT" : "POST";
      const res = await fetch("/api/intervenciones", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        onClose();
      } else {
        alert(data.error || "Error al guardar la intervención");
      }
    } catch (error) {
      console.error("Error al guardar intervención:", error);
      alert("Error al guardar la intervención");
    }
  };

  if (!isOpen) return null;

  const isViewMode = mode === "view";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">
          {mode === "create" ? "Nueva Intervención" : mode === "edit" ? "Editar Intervención" : "Ver Intervención"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="id_reclamo">Reclamo *</Label>
            <select
              id="id_reclamo"
              name="id_reclamo"
              value={formData.id_reclamo}
              onChange={handleChange}
              disabled={isViewMode || mode === "edit"}
              className="w-full border px-3 py-2 rounded"
              required
            >
              <option value="">Seleccione un reclamo</option>
              {reclamos.map((reclamo) => (
                <option key={reclamo.id_reclamo} value={reclamo.id_reclamo}>
                  #{reclamo.id_reclamo} - Equipo: {reclamo.id_equipo} - {reclamo.descripcion?.substring(0, 40) || "Sin descripción"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="id_tecnico">Técnico *</Label>
            <select
              id="id_tecnico"
              name="id_tecnico"
              value={formData.id_tecnico}
              onChange={handleChange}
              disabled={isViewMode}
              className="w-full border px-3 py-2 rounded"
              required
            >
              <option value="">Seleccione un técnico</option>
              {tecnicos.map((tecnico) => (
                <option key={tecnico.id_tecnico} value={tecnico.id_tecnico}>
                  {tecnico.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Mostrar información del reclamo en todos los modos si hay reclamo */}
          {reclamoInfo && formData.id_reclamo && (
            <div className="bg-gray-50 p-4 rounded border">
              <h3 className="font-semibold mb-2">Información del Reclamo</h3>
              {reclamoInfo.id_equipo && (
                <div className="mb-2">
                  <Label className="text-sm font-medium">ID Equipo:</Label>
                  <p className="text-sm">{reclamoInfo.id_equipo}</p>
                </div>
              )}
              {reclamoInfo.id_orden && (
                <div className="mb-2">
                  <Label className="text-sm font-medium">ID Orden de Compra:</Label>
                  <p className="text-sm">{reclamoInfo.id_orden}</p>
                </div>
              )}
              {reclamoInfo.orden_descripcion && (
                <div>
                  <Label className="text-sm font-medium">Descripción del Item:</Label>
                  <p className="text-sm">{reclamoInfo.orden_descripcion}</p>
                </div>
              )}
            </div>
          )}

          <div>
            <Label htmlFor="fecha">Fecha *</Label>
            <Input
              id="fecha"
              name="fecha"
              type="date"
              value={formData.fecha}
              onChange={handleChange}
              disabled={isViewMode}
              required
            />
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
              <option value="ASIGNADA">Asignada</option>
              <option value="EN PROGRESO">En Progreso</option>
              <option value="SUSPENDIDA">Suspendida</option>
              <option value="FINALIZADA">Finalizada</option>
              <option value="VERIFICADA">Verificada</option>
            </select>
          </div>

          <div>
            <Label htmlFor="descripcion_problema">Descripción del Problema</Label>
            <textarea
              id="descripcion_problema"
              name="descripcion_problema"
              value={formData.descripcion_problema}
              onChange={handleChange}
              disabled={isViewMode}
              className="w-full border px-3 py-2 rounded min-h-[100px]"
              maxLength={500}
            />
          </div>

          <div>
            <Label htmlFor="descripcion_trabajo_realizado">Descripción del Trabajo Realizado</Label>
            <textarea
              id="descripcion_trabajo_realizado"
              name="descripcion_trabajo_realizado"
              value={formData.descripcion_trabajo_realizado}
              onChange={handleChange}
              disabled={isViewMode}
              className="w-full border px-3 py-2 rounded min-h-[100px]"
              maxLength={500}
            />
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
