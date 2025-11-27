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

export async function DELETE(request) {
  const transaction = new sql.Transaction(await getConnection())

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID de equipo no proporcionado' },
        { status: 400 }
      )
    }

    await transaction.begin()

    // 1. Eliminar intervenciones de reclamos relacionados con el equipo
    await transaction
      .request()
      .input('id_equipo', sql.Int, parseInt(id, 10))
      .query(`
        DELETE FROM INTERVENCION
        WHERE id_reclamo IN (
          SELECT id_reclamo 
          FROM RECLAMO 
          WHERE id_equipo = @id_equipo
        )
      `)

    // 2. Eliminar reclamos del equipo
    await transaction
      .request()
      .input('id_equipo', sql.Int, parseInt(id, 10))
      .query(`
        DELETE FROM RECLAMO
        WHERE id_equipo = @id_equipo
      `)

    // 3. Eliminar el equipo
    const deleteResult = await transaction
      .request()
      .input('id_equipo', sql.Int, parseInt(id, 10))
      .query(`
        DELETE FROM EQUIPO
        WHERE id_equipo = @id_equipo
      `)

    if (deleteResult.rowsAffected[0] === 0) {
      await transaction.rollback()
      return NextResponse.json(
        { success: false, error: 'Equipo no encontrado' },
        { status: 404 }
      )
    }

    await transaction.commit()

    return NextResponse.json({
      success: true,
      message: 'Equipo eliminado exitosamente',
    })
  } catch (error) {
    try {
      await transaction.rollback()
    } catch (rollbackError) {
      console.error('Error en rollback DELETE /api/equipos:', rollbackError)
    }

    console.error('Error en DELETE /api/equipos:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
