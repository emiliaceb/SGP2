import { getConnection, sql } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const pool = await getConnection()

    const result = await pool
      .request()
      .query(`
        SELECT 
          i.id_intervencion,
          i.id_equipo AS intervencion_id_equipo,
          i.id_tecnico,
          i.id_reclamo,
          i.fecha,
          i.estado,
          i.descripcion_problema,
          i.descripcion_trabajo_realizado,
          t.nombre AS tecnico_nombre,
          r.id_equipo AS reclamo_id_equipo,
          r.id_orden AS reclamo_id_orden,
          ioc.descripcion AS orden_descripcion
        FROM INTERVENCION i
        LEFT JOIN TECNICO t ON i.id_tecnico = t.id_tecnico
        LEFT JOIN RECLAMO r ON i.id_reclamo = r.id_reclamo
        LEFT JOIN ITEM_ORDEN_DE_COMPRA ioc ON r.id_orden = ioc.id_orden AND r.id_equipo = ioc.id_equipo
        ORDER BY i.fecha DESC, i.id_intervencion DESC
      `)

    return NextResponse.json({
      success: true,
      data: result.recordset,
    })
  } catch (error) {
    console.error('Error en GET /api/intervenciones:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const { id_equipo, id_tecnico, id_reclamo, fecha, estado, descripcion_problema, descripcion_trabajo_realizado } = await request.json()

    if (!id_equipo || !id_tecnico || !fecha || !estado) {
      return NextResponse.json(
        { success: false, error: 'Los campos id_equipo, id_tecnico, fecha y estado son obligatorios.' },
        { status: 400 }
      )
    }

    const pool = await getConnection()

    const result = await pool
      .request()
      .input('id_equipo', sql.Int, id_equipo)
      .input('id_tecnico', sql.Int, id_tecnico)
      .input('id_reclamo', sql.Int, id_reclamo || null)
      .input('fecha', sql.Date, fecha)
      .input('estado', sql.NVarChar(50), estado)
      .input('descripcion_problema', sql.NVarChar(500), descripcion_problema || null)
      .input('descripcion_trabajo_realizado', sql.NVarChar(500), descripcion_trabajo_realizado || null)
      .query(`
        INSERT INTO INTERVENCION (id_equipo, id_tecnico, id_reclamo, fecha, estado, descripcion_problema, descripcion_trabajo_realizado)
        OUTPUT INSERTED.id_intervencion
        VALUES (@id_equipo, @id_tecnico, @id_reclamo, @fecha, @estado, @descripcion_problema, @descripcion_trabajo_realizado)
      `)

    const id_intervencion = result.recordset[0].id_intervencion

    const intervencionResult = await pool
      .request()
      .input('id_intervencion', sql.Int, id_intervencion)
      .query(`
        SELECT 
          i.id_intervencion,
          i.id_equipo AS intervencion_id_equipo,
          i.id_tecnico,
          i.id_reclamo,
          i.fecha,
          i.estado,
          i.descripcion_problema,
          i.descripcion_trabajo_realizado,
          t.nombre AS tecnico_nombre,
          r.id_equipo AS reclamo_id_equipo,
          r.id_orden AS reclamo_id_orden,
          ioc.descripcion AS orden_descripcion
        FROM INTERVENCION i
        LEFT JOIN TECNICO t ON i.id_tecnico = t.id_tecnico
        LEFT JOIN RECLAMO r ON i.id_reclamo = r.id_reclamo
        LEFT JOIN ITEM_ORDEN_DE_COMPRA ioc ON r.id_orden = ioc.id_orden AND r.id_equipo = ioc.id_equipo
        WHERE i.id_intervencion = @id_intervencion
      `)

    return NextResponse.json(
      {
        success: true,
        data: intervencionResult.recordset[0],
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error en POST /api/intervenciones:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request) {
  try {
    const { id_intervencion, id_equipo, id_tecnico, id_reclamo, fecha, estado, descripcion_problema, descripcion_trabajo_realizado } = await request.json()

    if (!id_intervencion) {
      return NextResponse.json(
        { success: false, error: 'El campo id_intervencion es obligatorio.' },
        { status: 400 }
      )
    }

    const pool = await getConnection()

    await pool
      .request()
      .input('id_intervencion', sql.Int, id_intervencion)
      .input('id_equipo', sql.Int, id_equipo)
      .input('id_tecnico', sql.Int, id_tecnico)
      .input('id_reclamo', sql.Int, id_reclamo || null)
      .input('fecha', sql.Date, fecha)
      .input('estado', sql.NVarChar(50), estado)
      .input('descripcion_problema', sql.NVarChar(500), descripcion_problema || null)
      .input('descripcion_trabajo_realizado', sql.NVarChar(500), descripcion_trabajo_realizado || null)
      .query(`
        UPDATE INTERVENCION
        SET id_equipo = @id_equipo,
            id_tecnico = @id_tecnico,
            id_reclamo = @id_reclamo,
            fecha = @fecha,
            estado = @estado,
            descripcion_problema = @descripcion_problema,
            descripcion_trabajo_realizado = @descripcion_trabajo_realizado
        WHERE id_intervencion = @id_intervencion
      `)

    const intervencionResult = await pool
      .request()
      .input('id_intervencion', sql.Int, id_intervencion)
      .query(`
        SELECT 
          i.id_intervencion,
          i.id_equipo AS intervencion_id_equipo,
          i.id_tecnico,
          i.id_reclamo,
          i.fecha,
          i.estado,
          i.descripcion_problema,
          i.descripcion_trabajo_realizado,
          t.nombre AS tecnico_nombre,
          r.id_equipo AS reclamo_id_equipo,
          r.id_orden AS reclamo_id_orden,
          ioc.descripcion AS orden_descripcion
        FROM INTERVENCION i
        LEFT JOIN TECNICO t ON i.id_tecnico = t.id_tecnico
        LEFT JOIN RECLAMO r ON i.id_reclamo = r.id_reclamo
        LEFT JOIN ITEM_ORDEN_DE_COMPRA ioc ON r.id_orden = ioc.id_orden AND r.id_equipo = ioc.id_equipo
        WHERE i.id_intervencion = @id_intervencion
      `)

    return NextResponse.json({
      success: true,
      data: intervencionResult.recordset[0],
    })
  } catch (error) {
    console.error('Error en PUT /api/intervenciones:', error)
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
      .input('id_intervencion', sql.Int, parseInt(id, 10))
      .query(`
        DELETE FROM INTERVENCION WHERE id_intervencion = @id_intervencion
      `)

    if (deleteResult.rowsAffected[0] === 0) {
      return NextResponse.json(
        { success: false, error: 'Intervención no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Intervención eliminada exitosamente',
    })
  } catch (error) {
    console.error('Error en DELETE /api/intervenciones:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
