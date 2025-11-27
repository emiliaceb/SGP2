import { getConnection, sql } from '@/lib/db'
import { NextResponse } from 'next/server'

/**
 * Calcula el puntaje de Plazos de Entrega
 * 3 - Buena: <= 4 días
 * 2 - Media: 5-9 días
 * 1 - Mala: >= 10 días
 */
function calcularPuntajePlazo(diasDiferencia) {
  if (diasDiferencia <= 4) return 3
  if (diasDiferencia <= 9) return 2
  return 1
}

/**
 * Calcula el puntaje de Tiempo de Respuesta a Reclamos
 * 3 - Buena: <= 2 días
 * 2 - Media: 3-5 días
 * 1 - Mala: > 5 días
 */
function calcularPuntajeTiempoRespuesta(diasDiferencia) {
  if (diasDiferencia <= 2) return 3
  if (diasDiferencia <= 5) return 2
  return 1
}

/**
 * Calcula el puntaje de Disponibilidad
 * 3 - Buena: 0 reclamos pendientes
 * 2 - Media: 1-2 reclamos pendientes
 * 1 - Mala: >= 3 reclamos pendientes
 */
function calcularPuntajeDisponibilidad(reclamosPendientes) {
  if (reclamosPendientes === 0) return 3
  if (reclamosPendientes <= 2) return 2
  return 1
}

/**
 * Calcula la calificación final
 * CF = (PE + TR + D) / 3
 */
function calcularCalificacionFinal(puntajePlazo, puntajeTiempoRespuesta, puntajeDisponibilidad) {
  return (puntajePlazo + puntajeTiempoRespuesta + puntajeDisponibilidad) / 3
}

/**
 * Obtiene la interpretación de la calificación final
 */
function obtenerInterpretacion(calificacionFinal) {
  if (calificacionFinal >= 2.7) return 'Óptimo'
  if (calificacionFinal >= 1.7) return 'Aceptable'
  return 'Insatisfactorio'
}

export async function POST(request) {
  try {
    const { cuit } = await request.json()

    if (!cuit) {
      return NextResponse.json(
        { success: false, error: 'El campo cuit es obligatorio.' },
        { status: 400 }
      )
    }

    const pool = await getConnection()

    // Verificar si el proveedor tiene al menos una orden de compra
    const ordenesCount = await pool
      .request()
      .input('cuit', sql.BigInt, cuit)
      .query(`
        SELECT COUNT(*) AS total
        FROM ORDEN_DE_COMPRA
        WHERE cuit = @cuit
      `)

    const totalOrdenesProveedor = ordenesCount.recordset[0]?.total || 0

    if (totalOrdenesProveedor === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No se puede crear una calificación hasta que se realice al menos una orden de compra al proveedor.' 
        },
        { status: 400 }
      )
    }

    // 1. Calcular Puntaje de Plazos de Entrega (PE)
    // Obtener promedio de días entre fecha_pedido y fecha_recepcion de órdenes del proveedor
    const plazosResult = await pool
      .request()
      .input('cuit', sql.BigInt, cuit)
      .query(`
        SELECT 
          AVG(CAST(DATEDIFF(DAY, fecha_pedido, fecha_recepcion) AS FLOAT)) AS promedio_dias_entrega,
          COUNT(*) AS total_ordenes,
          MIN(DATEDIFF(DAY, fecha_pedido, fecha_recepcion)) AS min_dias,
          MAX(DATEDIFF(DAY, fecha_pedido, fecha_recepcion)) AS max_dias
        FROM ORDEN_DE_COMPRA
        WHERE cuit = @cuit 
          AND fecha_recepcion IS NOT NULL
          AND estado IN ('Recibida', 'Confirmada')
      `)

    const promedioDiasEntrega = plazosResult.recordset[0]?.promedio_dias_entrega || 0
    const totalOrdenes = plazosResult.recordset[0]?.total_ordenes || 0
    const minDias = plazosResult.recordset[0]?.min_dias || 0
    const maxDias = plazosResult.recordset[0]?.max_dias || 0
    const puntajePlazo = totalOrdenes > 0 ? calcularPuntajePlazo(promedioDiasEntrega) : 3

    // 2. Calcular Puntaje de Tiempo de Respuesta a Reclamos (TR)
    // Obtener promedio de días entre fecha_reporte del reclamo y fecha de la primera intervención
    // Incluye reclamos con id_equipo Y reclamos directos a la orden (id_orden sin id_equipo)
    const tiempoRespuestaResult = await pool
      .request()
      .input('cuit', sql.BigInt, cuit)
      .query(`
        SELECT 
          AVG(DATEDIFF(DAY, R.fecha_reporte, I.fecha)) AS promedio_dias_respuesta,
          COUNT(DISTINCT R.id_reclamo) AS total_reclamos
        FROM RECLAMO R
        LEFT JOIN EQUIPO E ON R.id_equipo = E.id_equipo
        LEFT JOIN ITEM_ORDEN_DE_COMPRA IOC ON E.id_equipo = IOC.id_equipo
        LEFT JOIN ORDEN_DE_COMPRA OC1 ON IOC.id_orden = OC1.id_orden
        LEFT JOIN ORDEN_DE_COMPRA OC2 ON R.id_orden = OC2.id_orden
        INNER JOIN INTERVENCION I ON R.id_reclamo = I.id_reclamo
        WHERE (OC1.cuit = @cuit OR OC2.cuit = @cuit)
          AND I.fecha IS NOT NULL
          AND I.fecha >= R.fecha_reporte
      `)

    const promedioDiasRespuesta = tiempoRespuestaResult.recordset[0]?.promedio_dias_respuesta || 0
    const totalReclamos = tiempoRespuestaResult.recordset[0]?.total_reclamos || 0
    const puntajeTiempoRespuesta = totalReclamos > 0 ? calcularPuntajeTiempoRespuesta(promedioDiasRespuesta) : 3

    // 3. Calcular Puntaje de Disponibilidad (D)
    // Contar reclamos pendientes (solo estado PENDIENTE)
    // Incluye reclamos con id_equipo Y reclamos directos a la orden (id_orden sin id_equipo)
    const disponibilidadResult = await pool
      .request()
      .input('cuit', sql.BigInt, cuit)
      .query(`
        SELECT COUNT(DISTINCT R.id_reclamo) AS reclamos_pendientes
        FROM RECLAMO R
        LEFT JOIN EQUIPO E ON R.id_equipo = E.id_equipo
        LEFT JOIN ITEM_ORDEN_DE_COMPRA IOC ON E.id_equipo = IOC.id_equipo
        LEFT JOIN ORDEN_DE_COMPRA OC1 ON IOC.id_orden = OC1.id_orden
        LEFT JOIN ORDEN_DE_COMPRA OC2 ON R.id_orden = OC2.id_orden
        WHERE (OC1.cuit = @cuit OR OC2.cuit = @cuit)
          AND R.estado = 'PENDIENTE'
      `)

    const reclamosPendientes = disponibilidadResult.recordset[0]?.reclamos_pendientes || 0
    const puntajeDisponibilidad = calcularPuntajeDisponibilidad(reclamosPendientes)

    // 4. Calcular Calificación Final
    const puntuacionTotal = calcularCalificacionFinal(puntajePlazo, puntajeTiempoRespuesta, puntajeDisponibilidad)
    const interpretacion = obtenerInterpretacion(puntuacionTotal)

    // 5. Verificar si ya existe una calificación para este proveedor
    const existingRating = await pool
      .request()
      .input('cuit', sql.BigInt, cuit)
      .query(`
        SELECT id_calificacion FROM CALIFICACION WHERE cuit = @cuit
      `)

    let rating
    if (existingRating.recordset.length > 0) {
      // Actualizar calificación existente
      const id_calificacion = existingRating.recordset[0].id_calificacion
      
      await pool
        .request()
        .input('id_calificacion', sql.Int, id_calificacion)
        .input('puntaje_plazo', sql.TinyInt, puntajePlazo)
        .input('puntaje_tiempo_respuesta', sql.TinyInt, puntajeTiempoRespuesta)
        .input('puntaje_disponibilidad', sql.TinyInt, puntajeDisponibilidad)
        .input('puntuacion_total', sql.Decimal(3, 2), puntuacionTotal)
        .input('comentarios', sql.NVarChar(600), `Calificación automática: ${interpretacion}. PE: ${puntajePlazo} (${promedioDiasEntrega.toFixed(1)} días), TR: ${puntajeTiempoRespuesta} (${promedioDiasRespuesta.toFixed(1)} días), D: ${puntajeDisponibilidad} (${reclamosPendientes} pendientes)`)
        .query(`
          UPDATE CALIFICACION
          SET puntaje_plazo = @puntaje_plazo,
              puntaje_calidad = NULL,
              puntaje_tiempo_respuesta = @puntaje_tiempo_respuesta,
              puntaje_disponibilidad = @puntaje_disponibilidad,
              comentarios = @comentarios,
              puntuacion_total = @puntuacion_total
          WHERE id_calificacion = @id_calificacion
        `)

      const updatedRating = await pool
        .request()
        .input('id_calificacion', sql.Int, id_calificacion)
        .query(`
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
          WHERE c.id_calificacion = @id_calificacion
        `)
      
      rating = updatedRating.recordset[0]
    } else {
      // Crear nueva calificación
      const insertResult = await pool
        .request()
        .input('cuit', sql.BigInt, cuit)
        .input('puntaje_plazo', sql.TinyInt, puntajePlazo)
        .input('puntaje_tiempo_respuesta', sql.TinyInt, puntajeTiempoRespuesta)
        .input('puntaje_disponibilidad', sql.TinyInt, puntajeDisponibilidad)
        .input('puntuacion_total', sql.Decimal(3, 2), puntuacionTotal)
        .input('comentarios', sql.NVarChar(600), `Calificación automática: ${interpretacion}. PE: ${puntajePlazo} (${promedioDiasEntrega.toFixed(1)} días), TR: ${puntajeTiempoRespuesta} (${promedioDiasRespuesta.toFixed(1)} días), D: ${puntajeDisponibilidad} (${reclamosPendientes} pendientes)`)
        .query(`
          INSERT INTO CALIFICACION (cuit, puntaje_plazo, puntaje_calidad, puntaje_tiempo_respuesta, puntaje_disponibilidad, comentarios, puntuacion_total)
          OUTPUT INSERTED.id_calificacion
          VALUES (@cuit, @puntaje_plazo, NULL, @puntaje_tiempo_respuesta, @puntaje_disponibilidad, @comentarios, @puntuacion_total)
        `)

      const newRating = await pool
        .request()
        .input('id_calificacion', sql.Int, insertResult.recordset[0].id_calificacion)
        .query(`
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
          WHERE c.id_calificacion = @id_calificacion
        `)
      
      rating = newRating.recordset[0]
    }

    return NextResponse.json({
      success: true,
      data: rating,
      detalle: {
        puntaje_plazo: {
          valor: puntajePlazo,
          promedio_dias: promedioDiasEntrega.toFixed(1),
          min_dias: minDias,
          max_dias: maxDias,
          total_ordenes: totalOrdenes,
        },
        puntaje_tiempo_respuesta: {
          valor: puntajeTiempoRespuesta,
          promedio_dias: promedioDiasRespuesta.toFixed(1),
          total_reclamos: totalReclamos,
        },
        puntaje_disponibilidad: {
          valor: puntajeDisponibilidad,
          reclamos_pendientes: reclamosPendientes,
        },
        puntuacion_total: puntuacionTotal.toFixed(2),
        interpretacion: interpretacion,
      },
    })
  } catch (error) {
    console.error('Error en POST /api/ratings/calculate:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
