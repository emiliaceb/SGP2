import { getConnection, sql } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const pool = await getConnection()
    
    const result = await pool
      .request()
      .query(`
        SELECT 
          e.id_equipo,
          e.numero_serie,
          m.nombre AS modelo_nombre,
          m.marca
        FROM EQUIPO e
        INNER JOIN MODELO m ON e.id_modelo = m.id_modelo
        WHERE e.estado = 'OPERATIVO'
        ORDER BY m.marca, m.nombre
      `)

    return NextResponse.json({
      success: true,
      data: result.recordset,
    })
  } catch (error) {
    console.error('Error en GET /api/equipos:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
