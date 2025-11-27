import { NextResponse } from "next/server"
import { getConnection } from "@/lib/db"

export async function GET() {
  try {
    const pool = await getConnection()
    const result = await pool.request().execute("sp_AlertaVencimientoGarantias")

    return NextResponse.json(result.recordset)
  } catch (error) {
    console.error("Error al obtener garantías por vencer:", error)
    return NextResponse.json(
      { error: "Error al obtener garantías por vencer" },
      { status: 500 }
    )
  }
}
