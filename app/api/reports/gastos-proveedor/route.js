import { NextResponse } from "next/server"
import { getConnection, sql } from "@/lib/db"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const fechaDesde = searchParams.get('fechaDesde')
    const fechaHasta = searchParams.get('fechaHasta')

    if (!fechaDesde || !fechaHasta) {
      return NextResponse.json(
        { error: "Los parámetros fechaDesde y fechaHasta son obligatorios" },
        { status: 400 }
      )
    }

    const pool = await getConnection()
    const result = await pool
      .request()
      .input('FechaDesde', sql.Date, fechaDesde)
      .input('FechaHasta', sql.Date, fechaHasta)
      .execute("sp_ReporteGastoPorProveedor")

    return NextResponse.json(result.recordset)
  } catch (error) {
    console.error("Error al obtener reporte de gastos:", error)
    return NextResponse.json(
      { error: "Error al obtener reporte de gastos por proveedor" },
      { status: 500 }
    )
  }
}
