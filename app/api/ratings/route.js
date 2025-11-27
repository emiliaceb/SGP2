import { getConnection, sql } from '@/lib/db'
import { NextResponse } from 'next/server'

const selectQuery = `
  SELECT 
    c.id_calificacion,
    c.cuit,
    c.puntaje_plazo,
    c.puntaje_calidad,
    c.puntaje_tiempo_respuesta,
    c.puntaje_disponibilidad,
    c.comentarios,
    c.puntuacion_total,
    p.razon_social AS proveedor_nombre
  FROM CALIFICACION c
  INNER JOIN PROVEEDOR p ON c.cuit = p.cuit
`

async function fetchRatingById(pool, id) {
  const result = await pool
    .request()
    .input('id_calificacion', sql.Int, id)
    .query(`${selectQuery} WHERE c.id_calificacion = @id_calificacion`)

  return result.recordset[0]
}

export async function GET() {
  try {
    const pool = await getConnection()

    const result = await pool
      .request()
      .query(`${selectQuery} ORDER BY c.id_calificacion DESC`)

    return NextResponse.json({
      success: true,
      data: result.recordset,
    })
  } catch (error) {
    console.error('Error en GET /api/ratings:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const { cuit, puntaje_plazo, puntaje_calidad, puntaje_tiempo_respuesta, puntaje_disponibilidad, comentarios, puntuacion_total } = await request.json()

    if (!cuit) {
      return NextResponse.json(
        { success: false, error: 'El campo cuit es obligatorio.' },
        { status: 400 }
      )
    }

    const pool = await getConnection()

    const insertResult = await pool
      .request()
      .input('cuit', sql.BigInt, cuit)
      .input('puntaje_plazo', sql.TinyInt, puntaje_plazo || null)
      .input('puntaje_calidad', sql.TinyInt, puntaje_calidad || null)
      .input('puntaje_tiempo_respuesta', sql.TinyInt, puntaje_tiempo_respuesta || null)
      .input('puntaje_disponibilidad', sql.TinyInt, puntaje_disponibilidad || null)
      .input('comentarios', sql.NVarChar(600), comentarios || null)
      .input('puntuacion_total', sql.TinyInt, puntuacion_total || null)
      .query(`
        INSERT INTO CALIFICACION (cuit, puntaje_plazo, puntaje_calidad, puntaje_tiempo_respuesta, puntaje_disponibilidad, comentarios, puntuacion_total)
        OUTPUT INSERTED.id_calificacion AS id_calificacion
        VALUES (@cuit, @puntaje_plazo, @puntaje_calidad, @puntaje_tiempo_respuesta, @puntaje_disponibilidad, @comentarios, @puntuacion_total)
      `)

    const rating = await fetchRatingById(pool, insertResult.recordset[0].id_calificacion)

    return NextResponse.json(
      {
        success: true,
        data: rating,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error en POST /api/ratings:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request) {
  try {
    const { id_calificacion, cuit, puntaje_plazo, puntaje_calidad, puntaje_tiempo_respuesta, puntaje_disponibilidad, comentarios, puntuacion_total } = await request.json()

    if (!id_calificacion) {
      return NextResponse.json(
        { success: false, error: 'id_calificacion es obligatorio.' },
        { status: 400 }
      )
    }

    const pool = await getConnection()

    const updateResult = await pool
      .request()
      .input('id_calificacion', sql.Int, id_calificacion)
      .input('cuit', sql.BigInt, cuit || null)
      .input('puntaje_plazo', sql.TinyInt, puntaje_plazo || null)
      .input('puntaje_calidad', sql.TinyInt, puntaje_calidad || null)
      .input('puntaje_tiempo_respuesta', sql.TinyInt, puntaje_tiempo_respuesta || null)
      .input('puntaje_disponibilidad', sql.TinyInt, puntaje_disponibilidad || null)
      .input('comentarios', sql.NVarChar(600), comentarios || null)
      .input('puntuacion_total', sql.TinyInt, puntuacion_total || null)
      .query(`
        UPDATE CALIFICACION
        SET cuit = COALESCE(@cuit, cuit),
            puntaje_plazo = @puntaje_plazo,
            puntaje_calidad = @puntaje_calidad,
            puntaje_tiempo_respuesta = @puntaje_tiempo_respuesta,
            puntaje_disponibilidad = @puntaje_disponibilidad,
            comentarios = @comentarios,
            puntuacion_total = @puntuacion_total
        WHERE id_calificacion = @id_calificacion
      `)

    if (updateResult.rowsAffected[0] === 0) {
      return NextResponse.json(
        { success: false, error: 'Calificación no encontrada' },
        { status: 404 }
      )
    }

    const rating = await fetchRatingById(pool, id_calificacion)

    return NextResponse.json({
      success: true,
      data: rating,
    })
  } catch (error) {
    console.error('Error en PUT /api/ratings:', error)
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
      .input('id_calificacion', sql.Int, parseInt(id, 10))
      .query(`
        DELETE FROM CALIFICACION WHERE id_calificacion = @id_calificacion
      `)

    if (deleteResult.rowsAffected[0] === 0) {
      return NextResponse.json(
        { success: false, error: 'Calificación no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Calificación eliminada exitosamente',
    })
  } catch (error) {
    console.error('Error en DELETE /api/ratings:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
