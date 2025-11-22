import { getConnection, sql } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { cuit, tipo, calle, numero, localidad, provincia, pais } = await request.json()
    
    console.log('🧪 TEST - Datos recibidos:', {
      cuit, tipo, calle, numero, localidad, provincia, pais
    })
    
    const pool = await getConnection()
    
    // Buscar IDs existentes primero
    const paisQuery = await pool.request()
      .input('pais', sql.NVarChar(100), pais)
      .query('SELECT idPais FROM PAIS WHERE nombre = @pais')
    
    console.log('🌍 País encontrado:', paisQuery.recordset)
    
    if (paisQuery.recordset.length === 0) {
      console.log('❌ País no existe')
      return NextResponse.json({ error: 'País no encontrado' }, { status: 400 })
    }
    
    const idPais = paisQuery.recordset[0].idPais
    
    const provQuery = await pool.request()
      .input('provincia', sql.NVarChar(100), provincia)
      .input('idPais', sql.Int, idPais)
      .query('SELECT idProvincia FROM PROVINCIA WHERE nombre = @provincia AND idPais = @idPais')
    
    console.log('🌎 Provincia encontrada:', provQuery.recordset)
    
    if (provQuery.recordset.length === 0) {
      console.log('❌ Provincia no existe')
      return NextResponse.json({ error: 'Provincia no encontrada' }, { status: 400 })
    }
    
    const idProvincia = provQuery.recordset[0].idProvincia
    
    const locQuery = await pool.request()
      .input('localidad', sql.NVarChar(100), localidad)
      .input('idProvincia', sql.Int, idProvincia)
      .query('SELECT idLocalidad FROM LOCALIDAD WHERE nombre = @localidad AND idProvincia = @idProvincia')
    
    console.log('🏙️ Localidad encontrada:', locQuery.recordset)
    
    if (locQuery.recordset.length === 0) {
      console.log('❌ Localidad no existe')
      return NextResponse.json({ error: 'Localidad no encontrada' }, { status: 400 })
    }
    
    const idLocalidad = locQuery.recordset[0].idLocalidad
    
    // Insertar dirección directamente
    console.log('🏠 Insertando dirección:', { cuit, tipo, calle, numero, idLocalidad })
    
    const insertResult = await pool.request()
      .input('cuit', sql.BigInt, cuit)
      .input('tipo', sql.NVarChar(50), tipo)
      .input('calle', sql.NVarChar(255), calle)
      .input('numero', sql.SmallInt, numero)
      .input('id_localidad', sql.Int, idLocalidad)
      .query(`
        INSERT INTO DIRECCION (cuit, tipo, calle, numero, id_localidad)
        OUTPUT INSERTED.id_direccion
        VALUES (@cuit, @tipo, @calle, @numero, @id_localidad)
      `)
    
    console.log('✅ Dirección insertada, ID:', insertResult.recordset[0]?.id_direccion)
    
    // Verificar que se insertó
    const verifyResult = await pool.request()
      .input('cuit', sql.BigInt, cuit)
      .query('SELECT COUNT(*) as count FROM DIRECCION WHERE cuit = @cuit')
    
    console.log('📊 Total direcciones para CUIT:', verifyResult.recordset[0].count)
    
    return NextResponse.json({
      success: true,
      message: 'Test exitoso',
      insertedId: insertResult.recordset[0]?.id_direccion,
      totalAddresses: verifyResult.recordset[0].count
    })
    
  } catch (error) {
    console.error('❌ Error en test:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}