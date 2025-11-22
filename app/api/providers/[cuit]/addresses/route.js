import { getConnection, sql } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
  try {
    const { cuit } = await params
    const pool = await getConnection()

    const result = await pool
      .request()
      .input('cuit', sql.BigInt, cuit)
      .query(`
        SELECT 
          D.id_direccion,
          D.tipo,
          D.calle,
          D.numero,
          L.nombre AS localidad,
          PR.nombre AS provincia,
          PA.nombre AS pais
        FROM DIRECCION D
        LEFT JOIN LOCALIDAD L ON D.id_localidad = L.idLocalidad
        LEFT JOIN PROVINCIA PR ON L.idProvincia = PR.idProvincia
        LEFT JOIN PAIS PA ON PR.idPais = PA.idPais
        WHERE D.cuit = @cuit
        ORDER BY 
          CASE 
            WHEN D.tipo = 'CASA CENTRAL' THEN 1 
            ELSE 2 
          END,
          D.id_direccion
      `)

    return NextResponse.json({
      success: true,
      addresses: result.recordset,
    })
  } catch (error) {
    console.error('Error en GET addresses:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request, { params }) {
  try {
    const { cuit } = await params
    const { tipo, calle, numero, localidad, provincia, pais } = await request.json()
    
    console.log('📍 POST Address - Datos recibidos:', {
      cuit, tipo, calle, numero, localidad, provincia, pais
    })
    
    const pool = await getConnection()
    
    // Verificar/crear País (SIN TRANSACCIÓN)
    console.log('🌍 Verificando/creando país:', pais)
    const paisCheck = await pool.request()
      .input('nombre_pais', sql.NVarChar(100), pais)
      .query('SELECT idPais FROM PAIS WHERE nombre = @nombre_pais')
    
    let idPais
    if (paisCheck.recordset.length === 0) {
      console.log('➕ Creando nuevo país')
      const paisInsert = await pool.request()
        .input('nombre_pais', sql.NVarChar(100), pais)
        .query('INSERT INTO PAIS (nombre) OUTPUT INSERTED.idPais VALUES (@nombre_pais)')
      idPais = paisInsert.recordset[0].idPais
    } else {
      idPais = paisCheck.recordset[0].idPais
    }
    console.log('✅ País ID:', idPais)

    // Verificar/crear Provincia (SIN TRANSACCIÓN)
    console.log('🌎 Verificando/creando provincia:', provincia)
    const provCheck = await pool.request()
      .input('nombre_provincia', sql.NVarChar(100), provincia)
      .input('idPais', sql.Int, idPais)
      .query('SELECT idProvincia FROM PROVINCIA WHERE nombre = @nombre_provincia AND idPais = @idPais')
    
    let idProvincia
    if (provCheck.recordset.length === 0) {
      console.log('➕ Creando nueva provincia')
      const provInsert = await pool.request()
        .input('nombre_provincia', sql.NVarChar(100), provincia)
        .input('idPais', sql.Int, idPais)
        .query('INSERT INTO PROVINCIA (nombre, idPais) OUTPUT INSERTED.idProvincia VALUES (@nombre_provincia, @idPais)')
      idProvincia = provInsert.recordset[0].idProvincia
    } else {
      idProvincia = provCheck.recordset[0].idProvincia
    }
    console.log('✅ Provincia ID:', idProvincia)

    // Verificar/crear Localidad (SIN TRANSACCIÓN)
    console.log('🏙️ Verificando/creando localidad:', localidad)
    const locCheck = await pool.request()
      .input('nombre_localidad', sql.NVarChar(100), localidad)
      .input('idProvincia', sql.Int, idProvincia)
      .query('SELECT idLocalidad FROM LOCALIDAD WHERE nombre = @nombre_localidad AND idProvincia = @idProvincia')
    
    let idLocalidad
    if (locCheck.recordset.length === 0) {
      console.log('➕ Creando nueva localidad')
      const locInsert = await pool.request()
        .input('nombre_localidad', sql.NVarChar(100), localidad)
        .input('idProvincia', sql.Int, idProvincia)
        .query('INSERT INTO LOCALIDAD (nombre, idProvincia) OUTPUT INSERTED.idLocalidad VALUES (@nombre_localidad, @idProvincia)')
      idLocalidad = locInsert.recordset[0].idLocalidad
    } else {
      idLocalidad = locCheck.recordset[0].idLocalidad
    }
    console.log('✅ Localidad ID:', idLocalidad)

    // Insertar dirección (SIN TRANSACCIÓN)
    console.log('🏠 Insertando dirección:', {cuit, tipo, calle, numero, idLocalidad})
    const addressInsert = await pool.request()
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

    console.log('✅ Dirección insertada exitosamente, ID:', addressInsert.recordset[0].id_direccion)

    return NextResponse.json({
      success: true,
      message: 'Dirección agregada exitosamente',
    })
  } catch (error) {
    console.error('❌ Error en POST addresses:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}export async function DELETE(request, { params }) {
  try {
    const { cuit } = await params
    const { searchParams } = new URL(request.url)
    const addressId = searchParams.get('id')

    if (!addressId) {
      return NextResponse.json(
        { success: false, error: 'ID de dirección no proporcionado' },
        { status: 400 }
      )
    }

    const pool = await getConnection()
    
    await pool
      .request()
      .input('id_direccion', sql.Int, addressId)
      .input('cuit', sql.BigInt, cuit)
      .query(`
        DELETE FROM DIRECCION 
        WHERE id_direccion = @id_direccion AND cuit = @cuit
      `)

    return NextResponse.json({
      success: true,
      message: 'Dirección eliminada exitosamente',
    })
  } catch (error) {
    console.error('Error en DELETE addresses:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}