"use client"

import { useState, useEffect } from "react"

export default function InformationSection() {
  const [loading, setLoading] = useState(false)
  const [contratosVencidos, setContratosVencidos] = useState([])
  const [garantiasVencidas, setGarantiasVencidas] = useState([])
  const [gastosData, setGastosData] = useState([])
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')

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

  const fetchGastos = async () => {
    if (!fechaDesde || !fechaHasta) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/reports/gastos-proveedor?fechaDesde=${fechaDesde}&fechaHasta=${fechaHasta}`)
      if (response.ok) {
        const data = await response.json()
        setGastosData(data)
      }
    } catch (error) {
      console.error("Error al cargar gastos:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVencimientos()
    
    // fechas por defecto (últimos 30 días)
    const hoy = new Date()
    const hace30Dias = new Date()
    hace30Dias.setDate(hoy.getDate() - 30)
    
    const desde = hace30Dias.toISOString().split('T')[0]
    const hasta = hoy.toISOString().split('T')[0]
    
    setFechaDesde(desde)
    setFechaHasta(hasta)
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

      {/* Distribución de Gastos */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            Distribución de los Gastos
          </h3>
          <p className="text-gray-600 text-sm mt-1">
            Top 10 proveedores por inversión en el período seleccionado
          </p>
        </div>
        <div className="p-6">
          {/* Filtros de fecha */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Desde
              </label>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Hasta
              </label>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchGastos}
                disabled={loading || !fechaDesde || !fechaHasta}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10"/>
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                </svg>
                Consultar
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Torta */}
            <div className="flex items-center justify-center">
              {loading ? (
                <p className="text-sm text-gray-500">Cargando...</p>
              ) : gastosData.length === 0 ? (
                <p className="text-sm text-gray-500">No hay datos para el período seleccionado</p>
              ) : (
                <PieChart data={gastosData} />
              )}
            </div>

            {/* Tabla de detalles por rubro */}
            <div className="space-y-3">
              {loading ? (
                <p className="text-sm text-gray-500">Cargando...</p>
              ) : gastosData.length === 0 ? (
                <p className="text-sm text-gray-500">No hay datos para mostrar</p>
              ) : (
                (() => {
                  // Agrupar por rubro
                  const gruposPorRubro = gastosData.reduce((acc, item) => {
                    const rubro = item.rubro_principal || 'Sin rubro'
                    if (!acc[rubro]) {
                      acc[rubro] = {
                        rubro: rubro,
                        proveedores: [],
                        total_invertido: 0,
                        cantidad_compras: 0,
                        porcentaje_total: 0
                      }
                    }
                    acc[rubro].proveedores.push(item.razon_social)
                    acc[rubro].total_invertido += parseFloat(item.total_invertido || 0)
                    acc[rubro].cantidad_compras += parseInt(item.cantidad_compras || 0)
                    acc[rubro].porcentaje_total += parseFloat(item.porcentaje_del_gasto_total || 0)
                    return acc
                  }, {})

                  const rubrosArray = Object.values(gruposPorRubro).sort((a, b) => b.total_invertido - a.total_invertido)

                  return rubrosArray.map((rubro, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg border">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">{rubro.rubro}</p>
                          <p className="text-xs text-gray-500">
                            {rubro.proveedores.length} proveedor(es): {rubro.proveedores.join(', ')}
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-blue-600">
                          {rubro.porcentaje_total.toFixed(2)}%
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">Total invertido:</span>
                          <p className="font-semibold">${rubro.total_invertido?.toLocaleString('es-AR')}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Compras:</span>
                          <p className="font-semibold">{rubro.cantidad_compras}</p>
                        </div>
                      </div>
                    </div>
                  ))
                })()
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Componente de gráfico de torta agrupado por rubro
function PieChart({ data }) {
  // Agrupar datos por rubro
  const gruposPorRubro = data.reduce((acc, item) => {
    const rubro = item.rubro_principal || 'Sin rubro'
    if (!acc[rubro]) {
      acc[rubro] = {
        rubro: rubro,
        total_invertido: 0,
        porcentaje_total: 0
      }
    }
    acc[rubro].total_invertido += parseFloat(item.total_invertido || 0)
    acc[rubro].porcentaje_total += parseFloat(item.porcentaje_del_gasto_total || 0)
    return acc
  }, {})

  const rubrosArray = Object.values(gruposPorRubro).sort((a, b) => b.total_invertido - a.total_invertido)
  
  const colors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
  ]

  let currentAngle = -90

  return (
    <div className="relative w-64 h-64">
      <svg viewBox="0 0 100 100" className="transform -rotate-90">
        {rubrosArray.map((rubro, index) => {
          const percentage = parseFloat(rubro.porcentaje_total || 0)
          const angle = (percentage / 100) * 360
          const endAngle = currentAngle + angle
          
          const startX = 50 + 40 * Math.cos((currentAngle * Math.PI) / 180)
          const startY = 50 + 40 * Math.sin((currentAngle * Math.PI) / 180)
          const endX = 50 + 40 * Math.cos((endAngle * Math.PI) / 180)
          const endY = 50 + 40 * Math.sin((endAngle * Math.PI) / 180)
          
          const largeArcFlag = angle > 180 ? 1 : 0
          
          const pathData = [
            `M 50 50`,
            `L ${startX} ${startY}`,
            `A 40 40 0 ${largeArcFlag} 1 ${endX} ${endY}`,
            `Z`
          ].join(' ')
          
          const slice = (
            <path
              key={index}
              d={pathData}
              fill={colors[index % colors.length]}
              stroke="white"
              strokeWidth="0.5"
            />
          )
          
          currentAngle = endAngle
          return slice
        })}
      </svg>
      
      {/* Leyenda por rubro */}
      <div className="absolute -right-32 top-0 space-y-1">
        {rubrosArray.map((rubro, index) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <div 
              className="w-3 h-3 rounded-sm" 
              style={{ backgroundColor: colors[index % colors.length] }}
            />
            <span className="text-gray-700 truncate max-w-[100px]" title={rubro.rubro}>
              {rubro.rubro}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
