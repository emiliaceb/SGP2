import { getConnection, sql } from '@/lib/db'
import { NextResponse } from 'next/server'

function mapOrders(ordersRows, detailsRows) {
  const ordersMap = new Map()

  ordersRows.forEach((row) => {
    ordersMap.set(row.id_orden, {
      id_orden: row.id_orden,
      fecha_pedido: row.fecha_pedido,
      fecha_recepcion: row.fecha_recepcion,
      estado: row.estado,
      cuit: row.cuit,
      proveedor_nombre: row.proveedor_nombre,
      detalles: [],
      monto_total: 0,
    })
  })

  detailsRows.forEach((detail) => {
    const order = ordersMap.get(detail.id_orden)
    if (order) {
      const subtotal = Number(detail.subtotal)
      order.detalles.push({
        id_item: detail.id_item,
        id_equipo: detail.id_equipo,
        producto_nombre: detail.nombre_producto,
        cantidad: detail.cantidad,
        precio_unitario: Number(detail.precio_unitario),
        subtotal: subtotal,
      })
      order.monto_total += subtotal
    }
  })

  return Array.from(ordersMap.values())
}

async function fetchOrders(pool) {
  const result = await pool
    .request()
    .query(`
      SELECT 
        o.id_orden,
        o.fecha_pedido,
        o.fecha_recepcion,
        o.estado,
        o.cuit,
        p.razon_social AS proveedor_nombre
      FROM ORDEN_DE_COMPRA o
        INNER JOIN PROVEEDOR p ON o.cuit = p.cuit
      ORDER BY o.fecha_pedido DESC, o.id_orden DESC;

      SELECT 
        i.id_item,
        i.id_orden,
        i.id_equipo,
        i.descripcion AS nombre_producto,
        i.cantidad,
        i.precio_unitario,
        i.subtotal
      FROM ITEM_ORDEN_DE_COMPRA i
      ORDER BY i.id_orden ASC, i.id_item ASC;
    `)

  const ordersRows = result.recordsets[0]
  const detailsRows = result.recordsets[1]

  return mapOrders(ordersRows, detailsRows)
}

async function fetchOrderById(pool, id) {
  const result = await pool
    .request()
    .input('id_orden', sql.Int, id)
    .query(`
      SELECT 
        o.id_orden,
        o.fecha_pedido,
        o.fecha_recepcion,
        o.estado,
        o.cuit,
        p.razon_social AS proveedor_nombre
      FROM ORDEN_DE_COMPRA o
        INNER JOIN PROVEEDOR p ON o.cuit = p.cuit
      WHERE o.id_orden = @id_orden;

      SELECT 
        i.id_item,
        i.id_orden,
        i.id_equipo,
        i.descripcion AS nombre_producto,
        i.cantidad,
        i.precio_unitario,
        i.subtotal
      FROM ITEM_ORDEN_DE_COMPRA i
      WHERE i.id_orden = @id_orden
      ORDER BY i.id_item ASC;
    `)

  if (result.recordsets[0].length === 0) {
    return null
  }

  return mapOrders(result.recordsets[0], result.recordsets[1])[0]
}

export async function GET() {
  try {
    const pool = await getConnection()
    const orders = await fetchOrders(pool)

    return NextResponse.json({
      success: true,
      data: orders,
    })
  } catch (error) {
    console.error('Error en GET /api/orders:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

function normalizeItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('La orden debe incluir al menos un producto.')
  }

  return items.map((item) => {
    const cantidad = parseInt(item.cantidad, 10)
    const precioUnitario = Number(item.precio_unitario)

    if (Number.isNaN(cantidad) || cantidad <= 0) {
      throw new Error('La cantidad de cada equipo debe ser un número entero positivo.')
    }

    if (Number.isNaN(precioUnitario) || precioUnitario <= 0) {
      throw new Error('El precio unitario debe ser un número positivo.')
    }

    const subtotal = item.subtotal !== undefined ? Number(item.subtotal) : cantidad * precioUnitario

    return {
      id_equipo: item.id_equipo,
      descripcion: item.descripcion || '',
      cantidad,
      precio_unitario: precioUnitario,
      subtotal: Number(subtotal.toFixed(2)),
    }
  })
}

function computeTotal(items) {
  const total = items.reduce((sum, item) => sum + item.subtotal, 0)
  return Number(total.toFixed(2))
}

export async function POST(request) {
  const transaction = new sql.Transaction(await getConnection())

  try {
    const { cuit, fecha_pedido, fecha_recepcion, estado, items, id_empleado = 1 } = await request.json()

    if (!cuit || !fecha_pedido || !estado) {
      return NextResponse.json(
        { success: false, error: 'Los campos cuit, fecha_pedido y estado son obligatorios.' },
        { status: 400 }
      )
    }

    // Validar que si el estado es "Recibida" debe tener fecha_recepcion
    if (estado === 'Recibida' && !fecha_recepcion) {
      return NextResponse.json(
        { success: false, error: 'Si el estado es "Recibida" debe especificar la fecha de recepción.' },
        { status: 400 }
      )
    }

    const normalizedItems = normalizeItems(items)

    await transaction.begin()

    const orderResult = await transaction
      .request()
      .input('id_empleado', sql.Int, id_empleado)
      .input('cuit', sql.BigInt, cuit)
      .input('fecha_pedido', sql.Date, fecha_pedido)
      .input('fecha_recepcion', sql.Date, fecha_recepcion || null)
      .input('estado', sql.NVarChar(50), estado)
      .query(`
        INSERT INTO ORDEN_DE_COMPRA (id_empleado, cuit, fecha_pedido, fecha_recepcion, estado)
        OUTPUT INSERTED.id_orden
        VALUES (@id_empleado, @cuit, @fecha_pedido, @fecha_recepcion, @estado)
      `)

    const id_orden = orderResult.recordset[0].id_orden

    for (const item of normalizedItems) {
      await transaction
        .request()
        .input('id_orden', sql.Int, id_orden)
        .input('id_equipo', sql.Int, item.id_equipo || null)
        .input('descripcion', sql.NVarChar(255), item.descripcion)
        .input('cantidad', sql.SmallInt, item.cantidad)
        .input('precio_unitario', sql.Decimal(10, 2), item.precio_unitario)
        .input('subtotal', sql.Decimal(10, 2), item.subtotal)
        .query(`
          INSERT INTO ITEM_ORDEN_DE_COMPRA (id_orden, id_equipo, descripcion, cantidad, precio_unitario, subtotal)
          VALUES (@id_orden, @id_equipo, @descripcion, @cantidad, @precio_unitario, @subtotal)
        `)
    }

    await transaction.commit()

    const pool = await getConnection()
    const order = await fetchOrderById(pool, id_orden)

    return NextResponse.json(
      {
        success: true,
        data: order,
      },
      { status: 201 }
    )
  } catch (error) {
    try {
      await transaction.rollback()
    } catch (rollbackError) {
      console.error('Error en rollback POST /api/orders:', rollbackError)
    }

    console.error('Error en POST /api/orders:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request) {
  const transaction = new sql.Transaction(await getConnection())

  try {
    const { id_orden, cuit, fecha_pedido, fecha_recepcion, estado, items } = await request.json()

    if (!id_orden || !cuit || !fecha_pedido || !estado) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos obligatorios para actualizar la orden.' },
        { status: 400 }
      )
    }

    // Validar que si el estado es "Recibida" debe tener fecha_recepcion
    if (estado === 'Recibida' && !fecha_recepcion) {
      return NextResponse.json(
        { success: false, error: 'Si el estado es "Recibida" debe especificar la fecha de recepción.' },
        { status: 400 }
      )
    }

    const normalizedItems = normalizeItems(items)

    await transaction.begin()

    // Obtener el estado anterior de la orden
    const previousOrderResult = await transaction
      .request()
      .input('id_orden', sql.Int, id_orden)
      .query(`SELECT estado FROM ORDEN_DE_COMPRA WHERE id_orden = @id_orden`)

    if (previousOrderResult.recordset.length === 0) {
      await transaction.rollback()
      return NextResponse.json(
        { success: false, error: 'Orden no encontrada' },
        { status: 404 }
      )
    }

    const previousEstado = previousOrderResult.recordset[0].estado

    const updateOrderResult = await transaction
      .request()
      .input('id_orden', sql.Int, id_orden)
      .input('cuit', sql.BigInt, cuit)
      .input('fecha_pedido', sql.Date, fecha_pedido)
      .input('fecha_recepcion', sql.Date, fecha_recepcion || null)
      .input('estado', sql.NVarChar(50), estado)
      .query(`
        UPDATE ORDEN_DE_COMPRA
        SET cuit = @cuit,
            fecha_pedido = @fecha_pedido,
            fecha_recepcion = @fecha_recepcion,
            estado = @estado
        WHERE id_orden = @id_orden
      `)

    if (updateOrderResult.rowsAffected[0] === 0) {
      await transaction.rollback()
      return NextResponse.json(
        { success: false, error: 'Orden no encontrada' },
        { status: 404 }
      )
    }

    // Si el estado cambia a "Confirmada", crear los equipos vacíos
    if (previousEstado !== 'Confirmada' && estado === 'Confirmada') {
      // Obtener TODOS los ítems de la orden (sin filtrar por id_equipo)
      const itemsResult = await transaction
        .request()
        .input('id_orden', sql.Int, id_orden)
        .query(`
          SELECT id_item, cantidad, descripcion, id_equipo
          FROM ITEM_ORDEN_DE_COMPRA
          WHERE id_orden = @id_orden
        `)

      // Para cada ítem, crear tantos equipos como la cantidad especificada
      for (const item of itemsResult.recordset) {
        // Si el ítem ya tiene equipos creados, saltarlo
        if (item.id_equipo !== null) {
          continue
        }

        for (let i = 0; i < item.cantidad; i++) {
          // Generar un número de serie temporal único
          const timestamp = Date.now()
          const random = Math.floor(Math.random() * 10000)
          const numero_serie_temp = `TEMP-${id_orden}-${item.id_item}-${i + 1}-${timestamp}-${random}`
          
          // Crear equipo vacío con número de serie temporal
          const equipoResult = await transaction
            .request()
            .input('numero_serie', sql.NVarChar(100), numero_serie_temp)
            .query(`
              INSERT INTO EQUIPO (id_modelo, numero_serie, estado)
              OUTPUT INSERTED.id_equipo
              VALUES (NULL, @numero_serie, 'OPERATIVO')
            `)

          const id_equipo_nuevo = equipoResult.recordset[0].id_equipo

          // Actualizar el ítem para asignarle el equipo (solo el primer equipo del lote)
          if (i === 0) {
            await transaction
              .request()
              .input('id_item', sql.Int, item.id_item)
              .input('id_equipo', sql.Int, id_equipo_nuevo)
              .query(`
                UPDATE ITEM_ORDEN_DE_COMPRA
                SET id_equipo = @id_equipo
                WHERE id_item = @id_item
              `)
          }
        }
      }
    }

    // Solo permitir modificar ítems si la orden NO está confirmada
    if (previousEstado !== 'Confirmada' && estado !== 'Confirmada') {
      await transaction
        .request()
        .input('id_orden', sql.Int, id_orden)
        .query(`
          DELETE FROM ITEM_ORDEN_DE_COMPRA WHERE id_orden = @id_orden
        `)

      for (const item of normalizedItems) {
        await transaction
          .request()
          .input('id_orden', sql.Int, id_orden)
          .input('id_equipo', sql.Int, item.id_equipo || null)
          .input('descripcion', sql.NVarChar(255), item.descripcion)
          .input('cantidad', sql.SmallInt, item.cantidad)
          .input('precio_unitario', sql.Decimal(10, 2), item.precio_unitario)
          .input('subtotal', sql.Decimal(10, 2), item.subtotal)
          .query(`
            INSERT INTO ITEM_ORDEN_DE_COMPRA (id_orden, id_equipo, descripcion, cantidad, precio_unitario, subtotal)
            VALUES (@id_orden, @id_equipo, @descripcion, @cantidad, @precio_unitario, @subtotal)
          `)
      }
    }

    await transaction.commit()

    const pool = await getConnection()
    const order = await fetchOrderById(pool, id_orden)

    return NextResponse.json({
      success: true,
      data: order,
    })
  } catch (error) {
    try {
      await transaction.rollback()
    } catch (rollbackError) {
      console.error('Error en rollback PUT /api/orders:', rollbackError)
    }

    console.error('Error en PUT /api/orders:', error)
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
        { success: false, error: 'ID no proporcionado' },
        { status: 400 }
      )
    }

    await transaction.begin()

    // Primero eliminar calificaciones asociadas
    await transaction
      .request()
      .input('id_orden', sql.Int, parseInt(id, 10))
      .query(`
        DELETE FROM CALIFICACION WHERE id_orden = @id_orden
      `)

    // Eliminar items de la orden
    await transaction
      .request()
      .input('id_orden', sql.Int, parseInt(id, 10))
      .query(`
        DELETE FROM ITEM_ORDEN_DE_COMPRA WHERE id_orden = @id_orden
      `)

    // Finalmente eliminar la orden
    const deleteOrderResult = await transaction
      .request()
      .input('id_orden', sql.Int, parseInt(id, 10))
      .query(`
        DELETE FROM ORDEN_DE_COMPRA WHERE id_orden = @id_orden
      `)

    if (deleteOrderResult.rowsAffected[0] === 0) {
      await transaction.rollback()
      return NextResponse.json(
        { success: false, error: 'Orden no encontrada' },
        { status: 404 }
      )
    }

    await transaction.commit()

    return NextResponse.json({
      success: true,
      message: 'Orden eliminada exitosamente',
    })
  } catch (error) {
    try {
      await transaction.rollback()
    } catch (rollbackError) {
      console.error('Error en rollback DELETE /api/orders:', rollbackError)
    }

    console.error('Error en DELETE /api/orders:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
