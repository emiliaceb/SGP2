import { getConnection, sql } from '@/lib/db'
import { NextResponse } from 'next/server'

/**
 * Endpoint para recalcular todas las calificaciones existentes
 * Útil después de cambios en la estructura de estados o datos
 */
export async function POST() {
  try {
    const pool = await getConnection()

    // Obtener todos los proveedores que tienen calificaciones
    const providersWithRatings = await pool
      .request()
      .query(`
        SELECT DISTINCT cuit 
        FROM CALIFICACION
      `)

    const results = {
      total: providersWithRatings.recordset.length,
      actualizados: 0,
      errores: [],
    }

    // Recalcular cada calificación
    for (const provider of providersWithRatings.recordset) {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/ratings/calculate`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ cuit: Number(provider.cuit) }),
          }
        )

        const data = await response.json()

        if (data.success) {
          results.actualizados++
        } else {
          results.errores.push({
            cuit: provider.cuit,
            error: data.error,
          })
        }
      } catch (error) {
        results.errores.push({
          cuit: provider.cuit,
          error: error.message,
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Recalculadas ${results.actualizados} de ${results.total} calificaciones`,
      data: results,
    })
  } catch (error) {
    console.error('Error en POST /api/ratings/recalculate-all:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
