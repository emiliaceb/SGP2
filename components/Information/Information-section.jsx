"use client"

import { useState, useEffect } from "react"

export default function InformationSection() {
  const [loading, setLoading] = useState(false)
  const [contratosVencidos, setContratosVencidos] = useState([])
  const [garantiasVencidas, setGarantiasVencidas] = useState([])

  const fetchVencimientos = async () => {
    setLoading(true)
    try {
      const responseContratos = await fetch('/api/contratos/por-vencer')
      if (responseContratos.ok) {
        const dataContratos = await responseContratos.json()
        setContratosVencidos(dataContratos)
      }
      
      const responseGarantias = await fetch('/api/equipos/garantias-vencidas')
      if (responseGarantias.ok) {
        const dataGarantias = await responseGarantias.json()
        setGarantiasVencidas(dataGarantias)
      }
    } catch (error) {
      console.error("Error al cargar vencimientos:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVencimientos()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Informes</h2>
          <p className="text-gray-600 mt-1">
            Avisos de vencimientos y alertas importantes
          </p>
        </div>
        <button 
          onClick={fetchVencimientos} 
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={loading ? "animate-spin" : ""}>
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
          </svg>
          Actualizar
        </button>
      </div>

      {/* Avisos de Vencimientos */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            Avisos de Vencimientos
          </h3>
          <p className="text-gray-600 text-sm mt-1">
            Contratos y garantías próximas a vencer o vencidas
          </p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Vencimientos de Contratos */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h4 className="text-lg font-semibold flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  Vencimientos de Contratos
                </h4>
                <span className="inline-flex items-center justify-center rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-800">
                  {contratosVencidos.length}
                </span>
              </div>
              
              <div className="space-y-3">
                {loading ? (
                  <p className="text-sm text-gray-500">Cargando...</p>
                ) : contratosVencidos.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No hay contratos próximos a vencer
                  </p>
                ) : (
                  contratosVencidos.map((contrato) => (
                    <div key={contrato.id_contrato} className="p-4 bg-gray-50 rounded-lg border">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{contrato.razon_social}</p>
                            <p className="text-sm text-gray-600">
                              Contrato #{contrato.id_contrato}
                            </p>
                            {contrato.descripcion_contrato && (
                              <p className="text-xs text-gray-500 mt-1">
                                {contrato.descripcion_contrato}
                              </p>
                            )}
                          </div>
                          <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                            contrato.dias_para_vencer <= 30 
                              ? 'bg-red-50 text-red-700 ring-red-600/10' 
                              : contrato.dias_para_vencer <= 60 
                              ? 'bg-yellow-50 text-yellow-700 ring-yellow-600/10'
                              : 'bg-orange-50 text-orange-700 ring-orange-600/10'
                          }`}>
                            {contrato.dias_para_vencer} días
                          </span>
                        </div>
                        <div className="text-sm text-gray-700">
                          <p>Vence: {new Date(contrato.fecha_vencimiento).toLocaleDateString('es-AR')}</p>
                          {contrato.telefono && <p>Tel: {contrato.telefono}</p>}
                          {contrato.email && <p>Email: {contrato.email}</p>}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Vencimientos de Garantías */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h4 className="text-lg font-semibold flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  Vencimientos de Garantías de Equipos
                </h4>
                <span className="inline-flex items-center justify-center rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-800">
                  {garantiasVencidas.length}
                </span>
              </div>
              
              <div className="space-y-3">
                {loading ? (
                  <p className="text-sm text-gray-500">Cargando...</p>
                ) : garantiasVencidas.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No hay garantías próximas a vencer
                  </p>
                ) : (
                  garantiasVencidas.map((equipo) => (
                    <div key={equipo.id_equipo} className="p-4 bg-gray-50 rounded-lg border">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{equipo.marca} {equipo.modelo}</p>
                            <p className="text-sm text-gray-600">
                              N° Serie: {equipo.numero_serie}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {equipo.descripcion_item}
                            </p>
                          </div>
                          <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                            equipo.dias_para_vencer <= 30 
                              ? 'bg-red-50 text-red-700 ring-red-600/10' 
                              : equipo.dias_para_vencer <= 60 
                              ? 'bg-yellow-50 text-yellow-700 ring-yellow-600/10'
                              : 'bg-orange-50 text-orange-700 ring-orange-600/10'
                          }`}>
                            {equipo.dias_para_vencer} días
                          </span>
                        </div>
                        <div className="text-sm text-gray-700">
                          <p>Garantía vence: {new Date(equipo.expiracion_garantia).toLocaleDateString('es-AR')}</p>
                          <p>Estado: <span className={`font-medium ${
                            equipo.estado === 'OPERATIVO' ? 'text-green-600' : 'text-yellow-600'
                          }`}>{equipo.estado}</span></p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
