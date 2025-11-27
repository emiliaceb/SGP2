import { getConnection, sql } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const pool = await getConnection()

    const result = await pool
      .request()
      .query(`
        SELECT 
          r.id_reclamo,
          r.fecha_reporte,
          r.descripcion,
          r.prioridad,
          r.estado,
          r.id_equipo,
          r.id_orden,
          r.id_empleado,
          i.descripcion AS item_descripcion
        FROM RECLAMO r
        LEFT JOIN EQUIPO e ON r.id_equipo = e.id_equipo
        LEFT JOIN ITEM_ORDEN_DE_COMPRA i ON e.id_equipo = i.id_equipo
        ORDER BY r.fecha_reporte DESC, r.id_reclamo DESC
      `)

    return NextResponse.json({
      success: true,
      data: result.recordset,
    })
  } catch (error) {
    console.error('Error en GET /api/reclamos:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const { id_empleado, id_equipo, id_orden, fecha_reporte, descripcion, prioridad, estado } = await request.json()

    if (!id_empleado || !fecha_reporte || !prioridad || !estado) {
      return NextResponse.json(
        { success: false, error: 'Los campos id_empleado, fecha_reporte, prioridad y estado son obligatorios.' },
        { status: 400 }
      )
    }

    if (!id_equipo && !id_orden) {
      return NextResponse.json(
        { success: false, error: 'Debe especificar al menos un id_equipo o un id_orden.' },
        { status: 400 }
      )
    }

    const pool = await getConnection()

    const result = await pool
      .request()
      .input('id_empleado', sql.Int, id_empleado)
      .input('id_equipo', sql.Int, id_equipo || null)
      .input('id_orden', sql.Int, id_orden || null)
      .input('fecha_reporte', sql.Date, fecha_reporte)
      .input('descripcion', sql.NVarChar(500), descripcion || null)
      .input('prioridad', sql.NVarChar(50), prioridad)
      .input('estado', sql.NVarChar(50), estado)
      .query(`
        INSERT INTO RECLAMO (id_empleado, id_equipo, id_orden, fecha_reporte, descripcion, prioridad, estado)
        OUTPUT INSERTED.id_reclamo
        VALUES (@id_empleado, @id_equipo, @id_orden, @fecha_reporte, @descripcion, @prioridad, @estado)
      `)

    const id_reclamo = result.recordset[0].id_reclamo

    const reclamoResult = await pool
      .request()
      .input('id_reclamo', sql.Int, id_reclamo)
      .query(`
        SELECT 
          r.id_reclamo,
          r.fecha_reporte,
          r.descripcion,
          r.prioridad,
          r.estado,
          r.id_equipo,
          r.id_orden,
          r.id_empleado,
          i.descripcion AS item_descripcion
        FROM RECLAMO r
        LEFT JOIN EQUIPO e ON r.id_equipo = e.id_equipo
        LEFT JOIN ITEM_ORDEN_DE_COMPRA i ON e.id_equipo = i.id_equipo
        WHERE r.id_reclamo = @id_reclamo
      `)

    return NextResponse.json(
      {
        success: true,
        data: reclamoResult.recordset[0],
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error en POST /api/reclamos:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request) {
  try {
    const { id_reclamo, id_empleado, id_equipo, id_orden, fecha_reporte, descripcion, prioridad, estado } = await request.json()

    if (!id_reclamo) {
      return NextResponse.json(
        { success: false, error: 'El campo id_reclamo es obligatorio.' },
        { status: 400 }
      )
    }

    if (!id_equipo && !id_orden) {
      return NextResponse.json(
        { success: false, error: 'Debe especificar al menos un id_equipo o un id_orden.' },
        { status: 400 }
      )
    }

    const pool = await getConnection()

    await pool
      .request()
      .input('id_reclamo', sql.Int, id_reclamo)
      .input('id_empleado', sql.Int, id_empleado)
      .input('id_equipo', sql.Int, id_equipo || null)
      .input('id_orden', sql.Int, id_orden || null)
      .input('fecha_reporte', sql.Date, fecha_reporte)
      .input('descripcion', sql.NVarChar(500), descripcion || null)
      .input('prioridad', sql.NVarChar(50), prioridad)
      .input('estado', sql.NVarChar(50), estado)
      .query(`
        UPDATE RECLAMO
        SET id_empleado = @id_empleado,
            id_equipo = @id_equipo,
            id_orden = @id_orden,
            fecha_reporte = @fecha_reporte,
            descripcion = @descripcion,
            prioridad = @prioridad,
            estado = @estado
        WHERE id_reclamo = @id_reclamo
      `)

    const reclamoResult = await pool
      .request()
      .input('id_reclamo', sql.Int, id_reclamo)
      .query(`
        SELECT 
          r.id_reclamo,
          r.fecha_reporte,
          r.descripcion,
          r.prioridad,
          r.estado,
          r.id_equipo,
          r.id_orden,
          r.id_empleado,
          i.descripcion AS item_descripcion
        FROM RECLAMO r
        LEFT JOIN EQUIPO e ON r.id_equipo = e.id_equipo
        LEFT JOIN ITEM_ORDEN_DE_COMPRA i ON e.id_equipo = i.id_equipo
        WHERE r.id_reclamo = @id_reclamo
      `)

    return NextResponse.json({
      success: true,
      data: reclamoResult.recordset[0],
    })
  } catch (error) {
    console.error('Error en PUT /api/reclamos:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID no proporcionado' },
        { status: 400 }
      )
    }

    const pool = await getConnection()

    const deleteResult = await pool
      .request()
      .input('id_reclamo', sql.Int, parseInt(id, 10))
      .query(`
        DELETE FROM RECLAMO WHERE id_reclamo = @id_reclamo
      `)

    if (deleteResult.rowsAffected[0] === 0) {
      return NextResponse.json(
        { success: false, error: 'Reclamo no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Reclamo eliminado exitosamente',
    })
  } catch (error) {
    console.error('Error en DELETE /api/reclamos:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
