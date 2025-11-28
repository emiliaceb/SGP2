"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CircleUser } from "lucide-react"
import "./login-page.css"
import { useRouter } from "next/navigation";

export default function LoginPage () {
    const router = useRouter();
    const [isRegistering, setIsRegistering] = useState(false);
    const [formData, setFormData] = useState({
        username: "",
        password: "",
        nombre: "",
        perfil: ""
    });

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
        const login: any = {
            usuario: formData.username,
            password: formData.password,
        }
        const register: any = {
            usuario: formData.username,
            password: formData.password,
            nombre: formData.nombre,
            perfil: formData.perfil
        };

        const payload: any = isRegistering ? register : login;

        console.log(register)

        const res = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (data.success) {
            localStorage.setItem("userData", JSON.stringify(data.data));
            alert(data.message);
            router.push("/dashboard")
        } else {
            alert(data.error || "Error al ingresar el usuario");
        }
    } catch (error) {
        console.error("Error al guardar reclamo:", error);
        alert("Error al guardar el reclamo");
    }
};

    return(
        <>
            <div className="login-container">

                <span className="text-3xl font-bold">SGP</span>

                {/* Imagen circular */}
                <div className="login-avatar">
                    {/* <img src="../guest.png" alt="user" /> */}
                    <CircleUser size={120}></CircleUser>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* LOGIN FORM */}
                    {!isRegistering && (
                        <>
                            <h2>Iniciar Sesión</h2>

                            <Label htmlFor="username">Usuario</Label>
                            <Input id="username" placeholder="usuario_1" type="user" onChange={(e) => setFormData({...formData, username: e.target.value})} required/>
                            <Label htmlFor="password">Contraseña</Label>
                            <Input id="password" placeholder="contraseña1" type="password" onChange={(e) => setFormData({...formData, password: e.target.value})} required/>

                            <Button type="submit">Ingresar</Button>

                            <p className="switch-text">
                                ¿No tenés cuenta?
                                <span onClick={() => setIsRegistering(true)}> Registrarse</span>
                            </p>
                        </>
                    )}

                    {/* REGISTER FORM */}
                    {isRegistering && (
                        <>
                            <h2>Registrarse</h2>
                            
                            <Label htmlFor="userRegister">Usuario *</Label>
                            <Input id="userRegister" placeholder="usuario_1" type="user" onChange={(e) => setFormData({...formData, username: e.target.value})} required/>

                            <Label htmlFor="passRegister">Contraseña *</Label>
                            <Input id="passRegister" placeholder="Contraseña" type="password" onChange={(e) => setFormData({...formData, password: e.target.value})} required/>

                            <Label htmlFor="nameRegister">Nombre *</Label>
                            <Input id="nameRegister" placeholder="Nombre" onChange={(e) => setFormData({...formData, nombre: e.target.value})} required/>

                            <div className="space-y-2">
                                <Label htmlFor="tipoEmpleado">Tipo de Empleado *</Label>
                                <select
                                id="tipoEmpleado"
                                name="Seleccionar tipo"
                                onChange={(e) => setFormData({...formData, perfil: e.target.value})}
                                disabled={false}
                                className="w-full border px-3 py-2 rounded"
                                required
                                >
                                <option value="Compras">Comprador</option>
                                <option value="Reposicion">Repositor</option>
                                <option value="Gerencias">Gerente</option>
                                <option value="Administracion">Administrador</option>
                                </select>
                                {/* <Select>
                                <SelectTrigger id="tipoEmpleado">
                                    <SelectValue placeholder="Seleccionar tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="COMPRAS">Comprador</SelectItem>
                                    <SelectItem value="GERENCIA">Gerente</SelectItem>
                                </SelectContent>
                                </Select> */}
                            </div>

                            <Button type="submit">Crear Cuenta</Button>

                            <p className="switch-text">
                                ¿Ya tenés cuenta?
                                <span onClick={() => setIsRegistering(false)}> Iniciar sesión</span>
                            </p>
                        </>
                    )}
                </form>
                

            </div>

        </>
    )
}