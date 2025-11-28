import { getConnection, sql } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const body = await request.json();

    const { usuario, password, nombre, perfil } = body;

    const pool = await getConnection();

    // CASO 1: LOGIN
    if (!nombre && !perfil) {
      if (!usuario || !password) {
        return NextResponse.json(
          { success: false, error: "Usuario y contraseña son obligatorios" },
          { status: 400 }
        );
      }

      const result = await pool
        .request()
        .input("usuario", sql.NVarChar(50), usuario)
        .input("password", sql.NVarChar(100), password)
        .query(`
          SELECT TOP 1 *
          FROM EMPLEADO
          WHERE usuario = @usuario AND contrasena = @password
        `);

      if (result.recordset.length === 0) {
        return NextResponse.json(
          { success: false, error: "Credenciales incorrectas" },
          { status: 401 }
        );
      }

      const user = result.recordset[0];

      return NextResponse.json({
        success: true,
        message: "Logueo exitoso!",
        data: {
            usuario: user.usuario,
            nombre: user.nombre,
            perfil: user.perfil,
        },
      });
    }

    // CASO 2: REGISTRO
    if (!usuario || !password || !nombre || !perfil) {
      return NextResponse.json(
        { success: false, error: "Todos los campos son obligatorios para registrarse" },
        { status: 400 }
      );
    }

    const insertResult = await pool
      .request()
      .input("usuario", sql.NVarChar(50), usuario)
      .input("password", sql.NVarChar(100), password)
      .input("nombre", sql.NVarChar(100), nombre)
      .input("perfil", sql.NVarChar(50), perfil)
      .query(`
        INSERT INTO EMPLEADO (usuario, contrasena, nombre, perfil)
        OUTPUT INSERTED.id_empleado
        VALUES (@usuario, @password, @nombre, @perfil)
      `);

    const id_empleado = insertResult.recordset[0].id_empleado;

    return NextResponse.json({
      success: true,
      message: "Registro exitoso!",
      data: { usuario, nombre, perfil },
    });

  } catch (error) {
    console.error("Error POST /api/login:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}