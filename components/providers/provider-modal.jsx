"use client"

import { useState, useEffect } from "react"
import { X, Plus, MapPin, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ProviderModal({ isOpen, onClose, onSave, provider, onDataChange, viewMode = false }) {
  const [formData, setFormData] = useState({
    cuit: "",
    razon_social: "",
    telefono: "",
    email: "",
    rubro: "",
    // Dirección nueva
    tipo_direccion: "CASA CENTRAL",
    calle: "",
    numero: "",
    localidad: "",
    provincia: "",
    pais: "",
  })
  
  const [addresses, setAddresses] = useState([])
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [loadingAddresses, setLoadingAddresses] = useState(false)

  // Función para cargar direcciones del proveedor
  const loadAddresses = async (cuit) => {
    if (!cuit) return
    
    setLoadingAddresses(true)
    try {
      const response = await fetch(`/api/providers/${cuit}/addresses`)
      if (response.ok) {
        const data = await response.json()
        setAddresses(data.addresses || [])
      } else {
        console.error('Error al cargar direcciones')
        setAddresses([])
      }
    } catch (error) {
      console.error('Error al cargar direcciones:', error)
      setAddresses([])
    } finally {
      setLoadingAddresses(false)
    }
  }

  // Función para eliminar dirección
  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta dirección?')) {
      return
    }

    try {
      const response = await fetch(`/api/providers/${formData.cuit}/addresses?id=${addressId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Recargar direcciones del modal
        await loadAddresses(formData.cuit)
        // Actualizar la tabla principal
        if (onDataChange) {
          await onDataChange()
        }
      } else {
        const errorData = await response.json()
        alert(`Error al eliminar dirección: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error al eliminar dirección:', error)
      alert('Error al eliminar dirección')
    }
  }

  // Función para agregar nueva dirección
  const handleAddAddress = async () => {
    console.log('🚀 Iniciando handleAddAddress')
    console.log('📝 Form data completo:', formData)
    
    if (!formData.calle || !formData.numero || !formData.localidad || !formData.provincia || !formData.pais) {
      console.log('❌ Validación fallida - campos faltantes')
      alert('Por favor completa todos los campos de dirección')
      return
    }

    console.log('✅ Validación pasada, enviando solicitud...')
    try {
      const requestBody = {
        tipo: formData.tipo_direccion,
        calle: formData.calle,
        numero: parseInt(formData.numero),
        localidad: formData.localidad,
        provincia: formData.provincia,
        pais: formData.pais,
      }
      console.log('📤 Datos a enviar:', requestBody)
      
      const response = await fetch(`/api/providers/${formData.cuit}/addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      console.log('📥 Respuesta recibida:', response.status, response.statusText)

      if (response.ok) {
        const result = await response.json()
        console.log('Dirección agregada:', result.message)
        // Limpiar el formulario de dirección
        setFormData(prev => ({
          ...prev,
          calle: '',
          numero: '',
          localidad: '',
          provincia: '',
          pais: ''
        }))
        setShowAddressForm(false)
        // Recargar direcciones del modal
        await loadAddresses(formData.cuit)
        // Actualizar la tabla principal
        if (onDataChange) {
          await onDataChange()
        }
      } else {
        let errorMessage = 'Error al agregar dirección'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (jsonError) {
          // Si la respuesta no es JSON válido, usar mensaje genérico
          console.error('Error parsing JSON:', jsonError)
        }
        alert(errorMessage)
      }
    } catch (error) {
      console.error('Error al agregar dirección:', error)
      alert('Error de conexión al agregar dirección')
    }
  }

  useEffect(() => {
    if (provider) {
      setFormData({
        cuit: provider.cuit || "",
        razon_social: provider.razon_social || "",
        telefono: provider.telefono || "",
        email: provider.email || "",
        rubro: provider.rubros || "",
        // Dirección - limpiar para nueva dirección
        tipo_direccion: "CASA CENTRAL",
        calle: "",
        numero: "",
        localidad: "",
        provincia: "",
        pais: "",
      })
      // Cargar direcciones existentes
      loadAddresses(provider.cuit)
    } else {
      setFormData({
        cuit: "",
        razon_social: "",
        telefono: "",
        email: "",
        rubro: "",
        tipo_direccion: "CASA CENTRAL",
        calle: "",
        numero: "",
        localidad: "",
        provincia: "",
        pais: "",
      })
      setAddresses([])
    }
    setShowAddressForm(false)
  }, [provider, isOpen])

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Validar CUIT como número
    const cuitNumber = formData.cuit ? parseInt(formData.cuit.replace(/\D/g, ''), 10) : null
    if (!cuitNumber || isNaN(cuitNumber)) {
      alert('El CUIT debe ser un número válido')
      return
    }
    
    // Solo enviar datos básicos del proveedor (sin campos de dirección)
    // Las direcciones se manejan por separado con handleAddAddress
    const payload = {
      cuit: cuitNumber,
      razon_social: formData.razon_social,
      telefono: formData.telefono.trim() || null,
      email: formData.email.trim() || null,
      rubro: formData.rubro.trim() || null,
    }

    onSave(payload)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-border flex-shrink-0">
          <h2 className="text-xl font-semibold text-foreground">
            {viewMode ? "Detalles del Proveedor" : provider ? "Editar Proveedor" : "Nuevo Proveedor"}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="space-y-2">
            <Label htmlFor="razon_social">Razón Social</Label>
            <Input
              id="razon_social"
              type="text"
              value={formData.razon_social}
              onChange={(e) => setFormData({ ...formData, razon_social: e.target.value })}
              required
              disabled={viewMode}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cuit">CUIT</Label>
            <Input
              id="cuit"
              type="text"
              value={formData.cuit}
              onChange={(e) => setFormData({ ...formData, cuit: e.target.value })}
              placeholder="30654321008"
              required
              disabled={!!provider || viewMode} // No permitir editar CUIT si es edición o vista
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefono">Teléfono</Label>
            <Input
              id="telefono"
              type="text"
              value={formData.telefono || ""}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              placeholder="11-1234-5678"
              disabled={viewMode}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email || ""}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="correo@proveedor.com"
              disabled={viewMode}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rubro">Rubro</Label>
            <Input
              id="rubro"
              type="text"
              value={formData.rubro || ""}
              onChange={(e) => setFormData({ ...formData, rubro: e.target.value })}
              placeholder="Ej: Hardware, Software, Servicios de Mantenimiento"
              disabled={viewMode}
            />
          </div>

          {/* Sección de Direcciones */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Direcciones</h3>
              {provider && !viewMode && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddressForm(!showAddressForm)}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Agregar Dirección
                </Button>
              )}
            </div>

            {/* Formulario para nueva dirección */}
            {showAddressForm && (
              <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/20">
                <h4 className="text-md font-medium">Nueva Dirección</h4>
                
                <div className="space-y-2">
                  <Label htmlFor="tipo_direccion">Tipo</Label>
                  <select
                    id="tipo_direccion"
                    value={formData.tipo_direccion}
                    onChange={(e) => setFormData({ ...formData, tipo_direccion: e.target.value })}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="CASA CENTRAL">CASA CENTRAL</option>
                    <option value="SUCURSAL">SUCURSAL</option>
                    <option value="ALMACEN">ALMACEN</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="calle">Calle</Label>
                    <Input
                      id="calle"
                      type="text"
                      value={formData.calle}
                      onChange={(e) => setFormData({ ...formData, calle: e.target.value })}
                      placeholder="Av. Corrientes"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numero">Número</Label>
                    <Input
                      id="numero"
                      type="number"
                      value={formData.numero || ""}
                      onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                      placeholder="1234"
                      min="1"
                      max="99999"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="localidad">Localidad</Label>
                    <Input
                      id="localidad"
                      type="text"
                      value={formData.localidad}
                      onChange={(e) => setFormData({ ...formData, localidad: e.target.value })}
                      placeholder="CABA"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="provincia">Provincia</Label>
                    <Input
                      id="provincia"
                      type="text"
                      value={formData.provincia}
                      onChange={(e) => setFormData({ ...formData, provincia: e.target.value })}
                      placeholder="Buenos Aires"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pais">País</Label>
                    <Input
                      id="pais"
                      type="text"
                      value={formData.pais}
                      onChange={(e) => setFormData({ ...formData, pais: e.target.value })}
                      placeholder="Argentina"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddAddress}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddressForm(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            {/* Lista de direcciones existentes - solo mostrar cuando se edita un proveedor */}
            {provider && formData.cuit && (
              <div className="space-y-2">
                <h4 className="text-md font-medium">Direcciones Existentes</h4>
                
                {loadingAddresses ? (
                  <div className="p-4 text-center text-muted-foreground">
                    Cargando direcciones...
                  </div>
                ) : addresses.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground border border-dashed border-border rounded-lg">
                    No hay direcciones registradas
                  </div>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {addresses.map((address, index) => (
                      <div
                        key={`${address.id_direccion || index}`}
                        className="flex items-center justify-between p-3 border border-border rounded-lg bg-card"
                      >
                        <div className="flex items-start gap-3">
                          <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" />
                          <div>
                            <div className="font-medium text-sm">
                              {address.tipo}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {address.calle} {address.numero}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {address.localidad}, {address.provincia}, {address.pais}
                            </div>
                          </div>
                        </div>
                        {!viewMode && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteAddress(address.id_direccion)}
                            className="text-destructive hover:text-destructive/80"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-border">
            {viewMode ? (
              <Button type="button" onClick={onClose} className="flex-1">
                Cerrar
              </Button>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent">
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1">
                  Guardar
                </Button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
