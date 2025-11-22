import { NextResponse } from 'next/server'
import { getConnection } from '../../../lib/db'

export async function GET() {
  try {
    const pool = await getConnection()
    
    // Consultar todas las direcciones con todos los detalles
    const result = await pool.request().query(`
      SELECT 
        d.id_direccion,
        d.cuit,
        d.tipo,
        d.calle,
        d.numero,
        l.nombre as localidad,
        p.nombre as provincia,
        pa.nombre as pais,
        pr.razonSocial as proveedor
      FROM DIRECCION d
      LEFT JOIN LOCALIDAD l ON d.id_localidad = l.idLocalidad
      LEFT JOIN PROVINCIA p ON l.idProvincia = p.idProvincia
      LEFT JOIN PAIS pa ON p.idPais = pa.idPais
      LEFT JOIN PROVEEDOR pr ON d.cuit = pr.cuit
      ORDER BY d.cuit, d.id_direccion
    `)

    console.log(`📊 Encontradas ${result.recordset.length} direcciones en la base de datos`)
    
    return NextResponse.json({
      success: true,
      addresses: result.recordset,
      count: result.recordset.length
    })
  } catch (error) {
    console.error('❌ Error en debug addresses:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}