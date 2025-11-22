import { getConnection, sql } from '@/lib/db'
import { NextResponse } from 'next/server'

const selectQuery = `
  SELECT 
    t.id_tecnico,
    t.cuit,
    t.nombre,
    t.telefono,
    prov.razon_social AS proveedor
  FROM TECNICO t
    LEFT JOIN PROVEEDOR prov ON t.cuit = prov.cuit
`

function mapTechnicians(rows) {
  return rows.map(row => ({
    id_tecnico: row.id_tecnico,
    cuit: row.cuit,
    nombre: row.nombre,
    telefono: row.telefono,
    proveedor: row.proveedor,
  }))
}

async function fetchTechnicians(pool) {
  const result = await pool
    .request()
    .query(`${selectQuery}\n  ORDER BY t.nombre ASC`)

  return mapTechnicians(result.recordset)
}

async function fetchTechnicianById(pool, id) {
  const result = await pool
    .request()
    .input('id_tecnico', sql.Int, id)
    .query(`${selectQuery}\n  WHERE t.id_tecnico = @id_tecnico`)

  const technicians = mapTechnicians(result.recordset)
  return technicians[0]
}

export async function GET() {
  try {
    const pool = await getConnection()
    const technicians = await fetchTechnicians(pool)

    return NextResponse.json({
      success: true,
      data: technicians,
    })
  } catch (error) {
    console.error('Error en GET /api/technicians:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const { nombre, telefono, cuit } = await request.json()

    if (!nombre || !telefono || !cuit) {
      return NextResponse.json(
        { success: false, error: 'Los campos nombre, teléfono y proveedor (cuit) son obligatorios.' },
        { status: 400 }
      )
    }

    const pool = await getConnection()

    const tecnicoResult = await pool
      .request()
      .input('cuit', sql.BigInt, cuit)
      .input('nombre', sql.NVarChar(100), nombre)
      .input('telefono', sql.NVarChar(20), telefono)
      .query(`
        INSERT INTO TECNICO (cuit, nombre, telefono)
        OUTPUT INSERTED.id_tecnico AS id_tecnico
        VALUES (@cuit, @nombre, @telefono)
      `)

    const id_tecnico = tecnicoResult.recordset[0].id_tecnico
    const technician = await fetchTechnicianById(pool, id_tecnico)

    return NextResponse.json(
      {
        success: true,
        data: technician,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error en POST /api/technicians:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request) {
  try {
    const {
      id_tecnico,
      nombre,
      telefono,
      cuit,
    } = await request.json()

    if (!id_tecnico) {
      return NextResponse.json(
        { success: false, error: 'Falta identificador de técnico.' },
        { status: 400 }
      )
    }

    const pool = await getConnection()

    await pool
      .request()
      .input('id_tecnico', sql.Int, id_tecnico)
      .input('cuit', sql.BigInt, cuit || null)
      .input('nombre', sql.NVarChar(100), nombre || null)
      .input('telefono', sql.NVarChar(20), telefono || null)
      .query(`
        UPDATE TECNICO
        SET cuit = @cuit,
            nombre = @nombre,
            telefono = @telefono
        WHERE id_tecnico = @id_tecnico
      `)

    const technician = await fetchTechnicianById(pool, id_tecnico)

    if (!technician) {
      return NextResponse.json(
        { success: false, error: 'Técnico no encontrado después de la actualización.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: technician,
    })
  } catch (error) {
    console.error('Error en PUT /api/technicians:', error)
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
      .input('id_tecnico', sql.Int, parseInt(id, 10))
      .query(`
        DELETE FROM TECNICO WHERE id_tecnico = @id_tecnico
      `)

    if (deleteResult.rowsAffected[0] === 0) {
      return NextResponse.json(
        { success: false, error: 'Técnico no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Técnico eliminado exitosamente',
    })
  } catch (error) {
    console.error('Error en DELETE /api/technicians:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
