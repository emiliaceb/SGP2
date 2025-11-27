import { getConnection, sql } from '@/lib/db'
import { NextResponse } from 'next/server'

const selectQuery = `
  SELECT 
    c.id_contrato,
    c.cuit,
    c.fecha_inicio,
    c.fecha_vencimiento,
    c.descripcion,
    c.ruta_archivo,
    c.tiempo_respuesta,
    c.disponibilidad,
    p.razon_social AS proveedor_nombre
  FROM CONTRATO c
  INNER JOIN PROVEEDOR p ON c.cuit = p.cuit
`

function mapContrato(row) {
  return {
    id_contrato: row.id_contrato,
    cuit: row.cuit,
    fecha_inicio: row.fecha_inicio,
    fecha_vencimiento: row.fecha_vencimiento,
    descripcion: row.descripcion,
    ruta_archivo: row.ruta_archivo,
    tiempo_respuesta: row.tiempo_respuesta,
    disponibilidad: row.disponibilidad,
    proveedor_nombre: row.proveedor_nombre,
  }
}

async function fetchContratos(pool) {
  const result = await pool
    .request()
    .query(`${selectQuery} ORDER BY c.fecha_vencimiento DESC`)

  return result.recordset.map(mapContrato)
}

async function fetchContratoById(pool, id) {
  const result = await pool
    .request()
    .input('id_contrato', sql.Int, id)
    .query(`${selectQuery} WHERE c.id_contrato = @id_contrato`)

  if (result.recordset.length === 0) {
    return null
  }

  return mapContrato(result.recordset[0])
}

export async function GET(request) {
  try {
    const pool = await getConnection()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (id) {
      const contrato = await fetchContratoById(pool, id)
      if (!contrato) {
        return NextResponse.json(
          { success: false, error: 'Contrato no encontrado' },
          { status: 404 }
        )
      }
      return NextResponse.json({
        success: true,
        data: contrato,
      })
    }

    const contratos = await fetchContratos(pool)

    return NextResponse.json({
      success: true,
      data: contratos,
    })
  } catch (error) {
    console.error('Error en GET /api/contratos:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const { cuit, fecha_inicio, fecha_vencimiento, descripcion, ruta_archivo, tiempo_respuesta, disponibilidad } = await request.json()

    if (!cuit || !fecha_inicio || !fecha_vencimiento) {
      return NextResponse.json(
        { success: false, error: 'Los campos cuit, fecha_inicio y fecha_vencimiento son obligatorios.' },
        { status: 400 }
      )
    }

    const pool = await getConnection()

    const insertResult = await pool
      .request()
      .input('cuit', sql.BigInt, cuit)
      .input('fecha_inicio', sql.Date, fecha_inicio)
      .input('fecha_vencimiento', sql.Date, fecha_vencimiento)
      .input('descripcion', sql.NVarChar(500), descripcion || null)
      .input('ruta_archivo', sql.NVarChar(500), ruta_archivo || null)
      .input('tiempo_respuesta', sql.NVarChar(50), tiempo_respuesta || null)
      .input('disponibilidad', sql.Decimal(3, 2), disponibilidad || null)
      .query(`
        INSERT INTO CONTRATO (cuit, fecha_inicio, fecha_vencimiento, descripcion, ruta_archivo, tiempo_respuesta, disponibilidad)
        OUTPUT INSERTED.id_contrato
        VALUES (@cuit, @fecha_inicio, @fecha_vencimiento, @descripcion, @ruta_archivo, @tiempo_respuesta, @disponibilidad)
      `)

    const contrato = await fetchContratoById(pool, insertResult.recordset[0].id_contrato)

    return NextResponse.json(
      {
        success: true,
        data: contrato,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error en POST /api/contratos:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request) {
  try {
    const { id_contrato, cuit, fecha_inicio, fecha_vencimiento, descripcion, ruta_archivo, tiempo_respuesta, disponibilidad } = await request.json()

    if (!id_contrato) {
      return NextResponse.json(
        { success: false, error: 'id_contrato es obligatorio.' },
        { status: 400 }
      )
    }

    const pool = await getConnection()

    const updateResult = await pool
      .request()
      .input('id_contrato', sql.Int, id_contrato)
      .input('cuit', sql.BigInt, cuit || null)
      .input('fecha_inicio', sql.Date, fecha_inicio || null)
      .input('fecha_vencimiento', sql.Date, fecha_vencimiento || null)
      .input('descripcion', sql.NVarChar(500), descripcion || null)
      .input('ruta_archivo', sql.NVarChar(500), ruta_archivo || null)
      .input('tiempo_respuesta', sql.NVarChar(50), tiempo_respuesta || null)
      .input('disponibilidad', sql.Decimal(3, 2), disponibilidad || null)
      .query(`
        UPDATE CONTRATO
        SET cuit = COALESCE(@cuit, cuit),
            fecha_inicio = COALESCE(@fecha_inicio, fecha_inicio),
            fecha_vencimiento = COALESCE(@fecha_vencimiento, fecha_vencimiento),
            descripcion = @descripcion,
            ruta_archivo = @ruta_archivo,
            tiempo_respuesta = @tiempo_respuesta,
            disponibilidad = @disponibilidad
        WHERE id_contrato = @id_contrato
      `)

    if (updateResult.rowsAffected[0] === 0) {
      return NextResponse.json(
        { success: false, error: 'Contrato no encontrado' },
        { status: 404 }
      )
    }

    const contrato = await fetchContratoById(pool, id_contrato)

    return NextResponse.json({
      success: true,
      data: contrato,
    })
  } catch (error) {
    console.error('Error en PUT /api/contratos:', error)
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
      .input('id_contrato', sql.Int, id)
      .query(`
        DELETE FROM CONTRATO WHERE id_contrato = @id_contrato
      `)

    if (deleteResult.rowsAffected[0] === 0) {
      return NextResponse.json(
        { success: false, error: 'Contrato no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Contrato eliminado exitosamente',
    })
  } catch (error) {
    console.error('Error en DELETE /api/contratos:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
