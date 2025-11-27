import { getConnection, sql } from '@/lib/db'
import { NextResponse } from 'next/server'

const baseSelectQuery = `
  SELECT 
    P.cuit,
    P.razon_social,
    P.telefono,
    P.email,
    
    -- Dirección concatenada
    COALESCE(
      (SELECT STRING_AGG(
        D.calle + ' ' + CAST(D.numero AS NVARCHAR(10)) + 
        ' (' + D.tipo + 
        COALESCE(', ' + LOC.nombre, '') + 
        COALESCE(', ' + PROV.nombre, '') + 
        COALESCE(', ' + PAIS.nombre, '') + ')', 
        ' - ') 
       FROM DIRECCION D
       LEFT JOIN LOCALIDAD LOC ON D.id_localidad = LOC.idLocalidad
       LEFT JOIN PROVINCIA PROV ON LOC.idProvincia = PROV.idProvincia
       LEFT JOIN PAIS ON PROV.idPais = PAIS.idPais
       WHERE D.cuit = P.cuit)
      , 'Sin dirección registrada') as direccion,

    T1.localidad,
    T1.provincia,
    T1.pais,
    
    COALESCE((SELECT STRING_AGG(R.nombre, ', ')
            FROM PROVEEDOR_RUBRO PR
            JOIN RUBRO R ON PR.id_rubro = R.id_rubro
            WHERE PR.cuit = P.cuit), '') as rubros,
    COALESCE((SELECT ROUND(AVG(CAST(C.puntuacion_total AS DECIMAL(3,2))), 1)
            FROM CALIFICACION C
            WHERE C.cuit = P.cuit), 0) as calificacion
  FROM PROVEEDOR P
  
  -- Obtener campos individuales de la dirección principal
  OUTER APPLY (
    SELECT TOP 1 
        LOC.nombre AS localidad,
        PROV.nombre AS provincia,
        PAIS.nombre AS pais
    FROM DIRECCION D
    LEFT JOIN LOCALIDAD LOC ON D.id_localidad = LOC.idLocalidad
    LEFT JOIN PROVINCIA PROV ON LOC.idProvincia = PROV.idProvincia
    LEFT JOIN PAIS ON PROV.idPais = PAIS.idPais
    WHERE D.cuit = P.cuit
    ORDER BY 
        CASE WHEN D.tipo = 'CASA CENTRAL' THEN 1 ELSE 2 END,
        D.id_direccion
  ) AS T1

  WHERE (P.baja IS NULL OR P.baja > GETDATE())`

function mapProvider(row) {
  return {
    cuit: row.cuit,
    razon_social: row.razon_social,
    telefono: row.telefono,
    email: row.email,
    rubros: row.rubros || '',
    direccion: row.direccion,
    localidad: row.localidad,
    provincia: row.provincia,
    pais: row.pais,
    calificacion_total_promedio: row.calificacion !== null ? Number(row.calificacion) : 0,
  }
}

// Función para obtener todas las direcciones de un proveedor
async function fetchProviderAddresses(pool, cuit) {
  const result = await pool
    .request()
    .input('cuit', sql.BigInt, cuit)
    .query(`
      SELECT 
        D.id_direccion,
        D.tipo,
        D.calle,
        D.numero,
        L.nombre AS localidad,
        PR.nombre AS provincia,
        PA.nombre AS pais,
        L.idLocalidad,
        PR.idProvincia,
        PA.idPais
      FROM DIRECCION D
      LEFT JOIN LOCALIDAD L ON D.id_localidad = L.idLocalidad
      LEFT JOIN PROVINCIA PR ON L.idProvincia = PR.idProvincia
      LEFT JOIN PAIS PA ON PR.idPais = PA.idPais
      WHERE D.cuit = @cuit
      ORDER BY 
        CASE 
          WHEN D.tipo = 'CASA CENTRAL' THEN 1 
          ELSE 2 
        END,
        D.tipo
    `)

  return result.recordset
}

async function fetchProviders(pool) {
  const result = await pool
    .request()
    .query(`${baseSelectQuery}
    ORDER BY P.razon_social ASC`)

  return result.recordset.map(mapProvider)
}

async function fetchProviderById(pool, cuit) {
 const result = await pool
    .request()
    .input('cuit', sql.BigInt, cuit)
    .query(`${baseSelectQuery}
    AND P.cuit = @cuit`) 

  if (result.recordset.length === 0) {
    return null
  }

  return mapProvider(result.recordset[0])
}

export async function GET(request) {
  try {
    const pool = await getConnection()
    const mode = request.nextUrl.searchParams.get('mode')

    if (mode === 'options') {
      const result = await pool.request().query(`
        SELECT 
          P.cuit,
          P.razon_social
        FROM PROVEEDOR P
        ORDER BY P.razon_social ASC
      `)

      return NextResponse.json({
        success: true,
        data: result.recordset,
      })
    }

    if (mode === 'debug') {
      const debugResult = await pool.request().query(`
        SELECT 
          P.cuit,
          P.razon_social,
          D.calle,
          D.numero,
          D.tipo,
          LOC.nombre as localidad,
          PROV.nombre as provincia,
          PAIS.nombre as pais,
          CASE WHEN D.cuit IS NULL THEN 'NO_DIRECCION' ELSE 'CON_DIRECCION' END as tiene_direccion
        FROM PROVEEDOR P
        LEFT JOIN DIRECCION D ON P.cuit = D.cuit
        LEFT JOIN LOCALIDAD LOC ON D.id_localidad = LOC.idLocalidad
        LEFT JOIN PROVINCIA PROV ON LOC.idProvincia = PROV.idProvincia
        LEFT JOIN PAIS ON PROV.idPais = PAIS.idPais
        WHERE (P.baja IS NULL OR P.baja > GETDATE())
        ORDER BY P.razon_social, D.id_direccion
      `)

      return NextResponse.json({
        success: true,
        debug: true,
        data: debugResult.recordset,
      })
    }

    const providers = await fetchProviders(pool)

    return NextResponse.json({
      success: true,
      data: providers,
    })
  } catch (error) {
    console.error('Error en GET /api/providers:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  const transaction = new sql.Transaction(await getConnection())

  try {
    const {
      razon_social,
      cuit,
      telefono,
      email,
      rubro,
      tipo_direccion,
      calle,
      numero,
      localidad,
      provincia,
      pais
    } = await request.json()

    if (!razon_social || !cuit) {
      return NextResponse.json(
        { success: false, error: 'Los campos razón social y CUIT son obligatorios.' },
        { status: 400 }
      )
    }

    await transaction.begin()

    // Insertar proveedor
    await transaction
      .request()
      .input('razon_social', sql.NVarChar(255), razon_social)
      .input('cuit', sql.BigInt, cuit)
      .input('telefono', sql.NVarChar(20), telefono || null)
      .input('email', sql.NVarChar(100), email || null)
      .input('alta', sql.Date, new Date())
      .query(`
        INSERT INTO PROVEEDOR (razon_social, cuit, telefono, email, alta)
        VALUES (@razon_social, @cuit, @telefono, @email, @alta)
      `)

    // Si hay datos de dirección, insertarlos
    if (tipo_direccion && calle && localidad && provincia && pais) {
      // Primero verificar/crear País
      const paisResult = await transaction
        .request()
        .input('nombre_pais', sql.NVarChar(100), pais)
        .query(`
          IF NOT EXISTS (SELECT 1 FROM PAIS WHERE nombre = @nombre_pais)
            INSERT INTO PAIS (nombre) VALUES (@nombre_pais)
          SELECT idPais FROM PAIS WHERE nombre = @nombre_pais
        `)
      
      const idPais = paisResult.recordset[0].idPais

      // Verificar/crear Provincia
      const provinciaResult = await transaction
        .request()
        .input('nombre_provincia', sql.NVarChar(100), provincia)
        .input('idPais', sql.Int, idPais)
        .query(`
          IF NOT EXISTS (SELECT 1 FROM PROVINCIA WHERE nombre = @nombre_provincia AND idPais = @idPais)
            INSERT INTO PROVINCIA (nombre, idPais) VALUES (@nombre_provincia, @idPais)
          SELECT idProvincia FROM PROVINCIA WHERE nombre = @nombre_provincia AND idPais = @idPais
        `)
      
      const idProvincia = provinciaResult.recordset[0].idProvincia

      // Verificar/crear Localidad
      const localidadResult = await transaction
        .request()
        .input('nombre_localidad', sql.NVarChar(100), localidad)
        .input('idProvincia', sql.Int, idProvincia)
        .query(`
          IF NOT EXISTS (SELECT 1 FROM LOCALIDAD WHERE nombre = @nombre_localidad AND idProvincia = @idProvincia)
            INSERT INTO LOCALIDAD (nombre, idProvincia) VALUES (@nombre_localidad, @idProvincia)
          SELECT idLocalidad FROM LOCALIDAD WHERE nombre = @nombre_localidad AND idProvincia = @idProvincia
        `)
      
      const idLocalidad = localidadResult.recordset[0].idLocalidad

      // Convertir numero a entero small, manejando valores vacíos o null
      const numeroValue = numero && numero.toString().trim() !== '' ? parseInt(numero, 10) : null

      // Insertar dirección
      await transaction
        .request()
        .input('cuit', sql.BigInt, cuit)
        .input('tipo', sql.NVarChar(50), tipo_direccion)
        .input('calle', sql.NVarChar(255), calle)
        .input('numero', sql.SmallInt, numeroValue)
        .input('id_localidad', sql.Int, idLocalidad)
        .query(`
          INSERT INTO DIRECCION (cuit, tipo, calle, numero, id_localidad)
          VALUES (@cuit, @tipo, @calle, @numero, @id_localidad)
        `)
    }

    // Si hay rubro, manejarlo (asumiendo que existe en la tabla RUBRO)
    if (rubro) {
      const rubroResult = await transaction
        .request()
        .input('nombre_rubro', sql.NVarChar(100), rubro)
        .query(`
          IF NOT EXISTS (SELECT 1 FROM RUBRO WHERE nombre = @nombre_rubro)
            INSERT INTO RUBRO (nombre) VALUES (@nombre_rubro)
          SELECT id_rubro FROM RUBRO WHERE nombre = @nombre_rubro
        `)
      
      if (rubroResult.recordset.length > 0) {
        const idRubro = rubroResult.recordset[0].id_rubro
        
        await transaction
          .request()
          .input('cuit', sql.BigInt, cuit)
          .input('id_rubro', sql.Int, idRubro)
          .query(`
            INSERT INTO PROVEEDOR_RUBRO (cuit, id_rubro)
            VALUES (@cuit, @id_rubro)
          `)
      }
    }

    await transaction.commit()

    const pool = await getConnection()
    const provider = await fetchProviderById(pool, cuit)

    return NextResponse.json(
      {
        success: true,
        data: provider,
      },
      { status: 201 }
    )
  } catch (error) {
    try {
      await transaction.rollback()
    } catch (rollbackError) {
      console.error('Error en rollback POST /api/providers:', rollbackError)
    }

    console.error('Error en POST /api/providers:', error)
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
      cuit,
      razon_social,
      telefono,
      email,
      rubro
    } = await request.json()

    if (!cuit) {
      return NextResponse.json(
        { success: false, error: 'El CUIT es obligatorio para actualizar.' },
        { status: 400 }
      )
    }

    await transaction.begin()

    // Actualizar datos básicos del proveedor
    await transaction
      .request()
      .input('cuit', sql.BigInt, cuit)
      .input('razon_social', sql.NVarChar(255), razon_social || null)
      .input('telefono', sql.NVarChar(20), telefono || null)
      .input('email', sql.NVarChar(100), email || null)
      .query(`
        UPDATE PROVEEDOR
        SET razon_social = @razon_social,
            telefono = @telefono,
            email = @email
        WHERE cuit = @cuit
      `)

    // Actualizar rubros
    if (rubro !== undefined) {
      // Eliminar rubros existentes
      await transaction
        .request()
        .input('cuit', sql.BigInt, cuit)
        .query(`
          DELETE FROM PROVEEDOR_RUBRO WHERE cuit = @cuit
        `)

      // Insertar nuevo rubro si existe
      if (rubro && rubro.trim()) {
        const rubroResult = await transaction
          .request()
          .input('nombre_rubro', sql.NVarChar(100), rubro.trim())
          .query(`
            IF NOT EXISTS (SELECT 1 FROM RUBRO WHERE nombre = @nombre_rubro)
              INSERT INTO RUBRO (nombre) VALUES (@nombre_rubro)
            SELECT id_rubro FROM RUBRO WHERE nombre = @nombre_rubro
          `)
        
        if (rubroResult.recordset.length > 0) {
          const idRubro = rubroResult.recordset[0].id_rubro
          
          await transaction
            .request()
            .input('cuit', sql.BigInt, cuit)
            .input('id_rubro', sql.Int, idRubro)
            .query(`
              INSERT INTO PROVEEDOR_RUBRO (cuit, id_rubro)
              VALUES (@cuit, @id_rubro)
            `)
        }
      }
    }

    // NOTA: Las direcciones se gestionan a través del endpoint /api/providers/[cuit]/addresses
    // No se manejan en este endpoint para evitar conflictos

    await transaction.commit()

    const pool = await getConnection()
    const provider = await fetchProviderById(pool, cuit)

    if (!provider) {
      return NextResponse.json(
        { success: false, error: 'Proveedor no encontrado después de la actualización.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: provider,
    })
  } catch (error) {
    try {
      await transaction.rollback()
    } catch (rollbackError) {
      console.error('Error en rollback PUT /api/providers:', rollbackError)
    }

    console.error('Error en PUT /api/providers:', error)
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
    const cuit = searchParams.get('cuit')

    if (!cuit) {
      return NextResponse.json(
        { success: false, error: 'CUIT no proporcionado' },
        { status: 400 }
      )
    }

    await transaction.begin()

    // Verificar que el proveedor existe
    const providerResult = await transaction
      .request()
      .input('cuit', sql.BigInt, cuit)
      .query(`
        SELECT cuit FROM PROVEEDOR WHERE cuit = @cuit
      `)

    if (providerResult.recordset.length === 0) {
      await transaction.rollback()
      return NextResponse.json(
        { success: false, error: 'Proveedor no encontrado' },
        { status: 404 }
      )
    }

    // Eliminar en orden para evitar violaciones de clave foránea
    
    // 1. Eliminar calificaciones relacionadas
    await transaction
      .request()
      .input('cuit', sql.BigInt, cuit)
      .query(`
        DELETE FROM CALIFICACION WHERE cuit = @cuit
      `)

    // 2. Eliminar intervenciones de reclamos relacionados con las órdenes del proveedor
    await transaction
      .request()
      .input('cuit', sql.BigInt, cuit)
      .query(`
        DELETE FROM INTERVENCION
        WHERE id_reclamo IN (
          SELECT R.id_reclamo 
          FROM RECLAMO R
          WHERE R.id_orden IN (
            SELECT id_orden FROM ORDEN_DE_COMPRA WHERE cuit = @cuit
          )
        )
      `)

    // 3. Eliminar reclamos relacionados con las órdenes del proveedor
    await transaction
      .request()
      .input('cuit', sql.BigInt, cuit)
      .query(`
        DELETE FROM RECLAMO
        WHERE id_orden IN (
          SELECT id_orden FROM ORDEN_DE_COMPRA WHERE cuit = @cuit
        )
      `)

    // 4. Eliminar reclamos relacionados con equipos de las órdenes del proveedor
    await transaction
      .request()
      .input('cuit', sql.BigInt, cuit)
      .query(`
        DELETE FROM INTERVENCION
        WHERE id_reclamo IN (
          SELECT R.id_reclamo 
          FROM RECLAMO R
          INNER JOIN EQUIPO E ON R.id_equipo = E.id_equipo
          INNER JOIN ITEM_ORDEN_DE_COMPRA IOC ON E.id_equipo = IOC.id_equipo
          WHERE IOC.id_orden IN (
            SELECT id_orden FROM ORDEN_DE_COMPRA WHERE cuit = @cuit
          )
        )
      `)

    // 5. Eliminar reclamos de equipos
    await transaction
      .request()
      .input('cuit', sql.BigInt, cuit)
      .query(`
        DELETE FROM RECLAMO
        WHERE id_equipo IN (
          SELECT E.id_equipo
          FROM EQUIPO E
          INNER JOIN ITEM_ORDEN_DE_COMPRA IOC ON E.id_equipo = IOC.id_equipo
          WHERE IOC.id_orden IN (
            SELECT id_orden FROM ORDEN_DE_COMPRA WHERE cuit = @cuit
          )
        )
      `)

    // 6. Eliminar items de órdenes de compra
    await transaction
      .request()
      .input('cuit', sql.BigInt, cuit)
      .query(`
        DELETE FROM ITEM_ORDEN_DE_COMPRA
        WHERE id_orden IN (
          SELECT id_orden FROM ORDEN_DE_COMPRA WHERE cuit = @cuit
        )
      `)

    // 7. Eliminar órdenes de compra
    await transaction
      .request()
      .input('cuit', sql.BigInt, cuit)
      .query(`
        DELETE FROM ORDEN_DE_COMPRA WHERE cuit = @cuit
      `)

    // 8. Eliminar contratos
    await transaction
      .request()
      .input('cuit', sql.BigInt, cuit)
      .query(`
        DELETE FROM CONTRATO WHERE cuit = @cuit
      `)

    // 9. Eliminar técnicos
    await transaction
      .request()
      .input('cuit', sql.BigInt, cuit)
      .query(`
        DELETE FROM TECNICO WHERE cuit = @cuit
      `)

    // 10. Eliminar relación con rubros
    await transaction
      .request()
      .input('cuit', sql.BigInt, cuit)
      .query(`
        DELETE FROM PROVEEDOR_RUBRO WHERE cuit = @cuit
      `)

    // 11. Eliminar direcciones del proveedor
    await transaction
      .request()
      .input('cuit', sql.BigInt, cuit)
      .query(`
        DELETE FROM DIRECCION WHERE cuit = @cuit
      `)

    // 12. Finalmente eliminar el proveedor
    await transaction
      .request()
      .input('cuit', sql.BigInt, cuit)
      .query(`
        DELETE FROM PROVEEDOR WHERE cuit = @cuit
      `)

    await transaction.commit()

    return NextResponse.json({
      success: true,
      message: 'Proveedor eliminado exitosamente',
    })
  } catch (error) {
    try {
      await transaction.rollback()
    } catch (rollbackError) {
      console.error('Error en rollback DELETE /api/providers:', rollbackError)
    }

    console.error('Error en DELETE /api/providers:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
