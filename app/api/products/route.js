import { getConnection, sql } from '@/lib/db'
import { NextResponse } from 'next/server'

const selectQuery = `
  SELECT 
    e.id_equipo,
    e.numero_serie,
    e.expiracion_garantia,
    e.estado,
    e.id_modelo,
    COALESCE(i.id_item, 
      CASE 
        WHEN e.numero_serie LIKE 'TEMP-%' THEN CAST(SUBSTRING(e.numero_serie, CHARINDEX('-', e.numero_serie, 6) + 1, CHARINDEX('-', e.numero_serie, CHARINDEX('-', e.numero_serie, 6) + 1) - CHARINDEX('-', e.numero_serie, 6) - 1) AS INT)
        ELSE NULL 
      END
    ) AS id_item,
    COALESCE(i.descripcion,
      (SELECT TOP 1 i2.descripcion 
       FROM ITEM_ORDEN_DE_COMPRA i2 
       WHERE e.numero_serie LIKE 'TEMP-' + CAST(i2.id_orden AS VARCHAR) + '-' + CAST(i2.id_item AS VARCHAR) + '-%')
    ) AS descripcion,
    COALESCE(o.id_orden,
      CASE 
        WHEN e.numero_serie LIKE 'TEMP-%' THEN CAST(SUBSTRING(e.numero_serie, 6, CHARINDEX('-', e.numero_serie, 6) - 6) AS INT)
        ELSE NULL 
      END
    ) AS id_orden,
    COALESCE(p.razon_social,
      (SELECT TOP 1 p2.razon_social 
       FROM ITEM_ORDEN_DE_COMPRA i2 
       INNER JOIN ORDEN_DE_COMPRA o2 ON i2.id_orden = o2.id_orden
       INNER JOIN PROVEEDOR p2 ON o2.cuit = p2.cuit
       WHERE e.numero_serie LIKE 'TEMP-' + CAST(i2.id_orden AS VARCHAR) + '-' + CAST(i2.id_item AS VARCHAR) + '-%')
    ) AS proveedor,
    COALESCE(p.cuit,
      (SELECT TOP 1 p2.cuit 
       FROM ITEM_ORDEN_DE_COMPRA i2 
       INNER JOIN ORDEN_DE_COMPRA o2 ON i2.id_orden = o2.id_orden
       INNER JOIN PROVEEDOR p2 ON o2.cuit = p2.cuit
       WHERE e.numero_serie LIKE 'TEMP-' + CAST(i2.id_orden AS VARCHAR) + '-' + CAST(i2.id_item AS VARCHAR) + '-%')
    ) AS cuit,
    m.nombre AS modelo_nombre,
    m.marca AS modelo_marca,
    m.especificaciones AS modelo_especificaciones
  FROM EQUIPO e
  LEFT JOIN ITEM_ORDEN_DE_COMPRA i ON e.id_equipo = i.id_equipo
  LEFT JOIN ORDEN_DE_COMPRA o ON i.id_orden = o.id_orden
  LEFT JOIN PROVEEDOR p ON o.cuit = p.cuit
  LEFT JOIN MODELO m ON e.id_modelo = m.id_modelo
`

async function fetchEquipoById(pool, id) {
  const result = await pool
    .request()
    .input('id_equipo', sql.Int, id)
    .query(`${selectQuery}\n  WHERE e.id_equipo = @id_equipo`)

  return result.recordset[0]
}

export async function GET() {
  try {
    const pool = await getConnection()

    const result = await pool
      .request()
      .query(`${selectQuery}\n  ORDER BY e.id_equipo DESC`)

    return NextResponse.json({
      success: true,
      data: result.recordset,
    })
  } catch (error) {
    console.error('Error en GET /api/products:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const { numero_serie, id_modelo, expiracion_garantia, estado } = await request.json()

    const pool = await getConnection()

    const insertResult = await pool
      .request()
      .input('id_modelo', sql.Int, id_modelo || null)
      .input('numero_serie', sql.NVarChar(100), numero_serie || null)
      .input('expiracion_garantia', sql.Date, expiracion_garantia || null)
      .input('estado', sql.NVarChar(50), estado || 'OPERATIVO')
      .query(`
        INSERT INTO EQUIPO (id_modelo, numero_serie, expiracion_garantia, estado)
        OUTPUT INSERTED.id_equipo AS id_equipo
        VALUES (@id_modelo, @numero_serie, @expiracion_garantia, @estado)
      `)

    const equipo = await fetchEquipoById(pool, insertResult.recordset[0].id_equipo)

    return NextResponse.json(
      {
        success: true,
        data: equipo,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error en POST /api/products:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request) {
  const transaction = new sql.Transaction(await getConnection())

  try {
    const { 
      id_equipo, 
      numero_serie, 
      id_modelo, 
      expiracion_garantia, 
      estado,
      modelo_nombre,
      modelo_marca,
      modelo_especificaciones
    } = await request.json()

    if (!id_equipo) {
      return NextResponse.json(
        { success: false, error: 'id_equipo es obligatorio.' },
        { status: 400 }
      )
    }

    await transaction.begin()

    let modeloId = id_modelo

    // Si se proporcionan datos del modelo, crear o actualizar
    if (modelo_nombre || modelo_marca || modelo_especificaciones) {
      if (id_modelo) {
        // Actualizar modelo existente
        await transaction
          .request()
          .input('id_modelo', sql.Int, id_modelo)
          .input('nombre', sql.NVarChar(100), modelo_nombre || null)
          .input('marca', sql.NVarChar(100), modelo_marca || null)
          .input('especificaciones', sql.NVarChar(500), modelo_especificaciones || null)
          .query(`
            UPDATE MODELO
            SET nombre = @nombre,
                marca = @marca,
                especificaciones = @especificaciones
            WHERE id_modelo = @id_modelo
          `)
      } else {
        // Crear nuevo modelo
        const modeloResult = await transaction
          .request()
          .input('nombre', sql.NVarChar(100), modelo_nombre || null)
          .input('marca', sql.NVarChar(100), modelo_marca || null)
          .input('especificaciones', sql.NVarChar(500), modelo_especificaciones || null)
          .query(`
            INSERT INTO MODELO (nombre, marca, especificaciones)
            OUTPUT INSERTED.id_modelo
            VALUES (@nombre, @marca, @especificaciones)
          `)
        
        modeloId = modeloResult.recordset[0].id_modelo
      }
    }

    // Actualizar equipo
    const updateResult = await transaction
      .request()
      .input('id_equipo', sql.Int, id_equipo)
      .input('id_modelo', sql.Int, modeloId || null)
      .input('numero_serie', sql.NVarChar(100), numero_serie || null)
      .input('expiracion_garantia', sql.Date, expiracion_garantia || null)
      .input('estado', sql.NVarChar(50), estado || 'OPERATIVO')
      .query(`
        UPDATE EQUIPO
        SET id_modelo = @id_modelo,
            numero_serie = @numero_serie,
            expiracion_garantia = @expiracion_garantia,
            estado = @estado
        WHERE id_equipo = @id_equipo
      `)

    if (updateResult.rowsAffected[0] === 0) {
      await transaction.rollback()
      return NextResponse.json(
        { success: false, error: 'Equipo no encontrado' },
        { status: 404 }
      )
    }

    await transaction.commit()

    const pool = await getConnection()
    const equipo = await fetchEquipoById(pool, id_equipo)

    return NextResponse.json({
      success: true,
      data: equipo,
    })
  } catch (error) {
    try {
      await transaction.rollback()
    } catch (rollbackError) {
      console.error('Error en rollback PUT /api/products:', rollbackError)
    }

    console.error('Error en PUT /api/products:', error)
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
      .input('id_equipo', sql.Int, parseInt(id, 10))
      .query(`
        DELETE FROM EQUIPO WHERE id_equipo = @id_equipo
      `)

    if (deleteResult.rowsAffected[0] === 0) {
      return NextResponse.json(
        { success: false, error: 'Equipo no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Equipo eliminado exitosamente',
    })
  } catch (error) {
    console.error('Error en DELETE /api/products:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
