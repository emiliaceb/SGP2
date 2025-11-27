import { getConnection, sql } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { cuit } = await request.json()

    // 1. Validación básica de entrada
    if (!cuit) {
      return NextResponse.json(
        { success: false, error: 'El campo cuit es obligatorio.' },
        { status: 400 }
      )
    }

    const pool = await getConnection()

    // 2. Ejecutar el Procedimiento Almacenado
    const result = await pool
      .request()
      .input('cuit', sql.BigInt, cuit)
      .execute('sp_CalcularYGuardarCalificacion')

    // El SP devuelve la fila de la calificación actualizada/insertada
    const rating = result.recordset[0]

    // 3. Responder al Frontend
    // Nota: Como el cálculo crudo (promedios exactos) se quedó dentro del SP,
    // enviamos los puntajes finales (1, 2, 3) y usamos el campo 'comentarios' 
    // que genera el SP para mostrar el detalle.
    return NextResponse.json({
      success: true,
      data: rating,
      detalle: {
        puntaje_plazo: {
          valor: rating.puntaje_plazo,
          // El SP guarda el detalle en texto dentro de 'comentarios', 
          // ya no tenemos las variables sueltas como 'promedioDiasEntrega' aquí.
        },
        puntaje_tiempo_respuesta: {
          valor: rating.puntaje_tiempo_respuesta,
        },
        puntaje_disponibilidad: {
          valor: rating.puntaje_disponibilidad,
        },
        puntuacion_total: rating.puntuacion_total,
        // El SP ya genera el texto ej: "Calificación automática: Óptimo..."
        interpretacion_texto: rating.comentarios 
      },
    })

  } catch (error) {
    console.error('Error en POST /api/ratings/calculate:', error)

    // 4. Manejo de Errores de Negocio
    // Si el SP lanza el error 51000 ("No hay órdenes"), lo capturamos aquí
    // El mensaje de error vendrá de SQL Server
    if (error.message.includes('El proveedor no tiene órdenes') || error.number === 51000) {
       return NextResponse.json(
        { 
          success: false, 
          error: 'No se puede calificar: El proveedor no posee órdenes de compra registradas.' 
        },
        { status: 400 }
      )
    }

    // Cualquier otro error técnico
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
      )
  }
}