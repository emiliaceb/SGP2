import { NextResponse } from "next/server"
import { getConnection } from "@/lib/db"

export async function GET() {
  try {
    const pool = await getConnection()
    const result = await pool.request().execute("sp_AlertaContratosPorVencer")

    return NextResponse.json(result.recordset)
  } catch (error) {
    console.error("Error al obtener contratos por vencer:", error)
    return NextResponse.json(
      { error: "Error al obtener contratos por vencer" },
      { status: 500 }
    )
  }
}
