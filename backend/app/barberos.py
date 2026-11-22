"""Vinculo entre la cuenta de un barbero (usuarios.rol) y su ficha en Empleados.

Son dos cosas distintas: el rol es un permiso (poder escanear QR) y la ficha
de Empleados es lo que ven los clientes al reservar, con su horario. Cuando
el admin cambia el rol desde el panel, la ficha se mantiene en sintonia.
"""

import unicodedata

from app.supabase_client import get_supabase_admin


def _normalizar(texto: str | None) -> str:
    sin_tildes = unicodedata.normalize("NFD", texto or "").encode("ascii", "ignore").decode()
    return " ".join(sin_tildes.lower().split())


def _mismo_nombre(empleado: dict, usuario: dict) -> bool:
    """Mismo nombre y mismo primer apellido ('Miguel Salazar' = 'Miguel Salazar Sencia')."""
    if _normalizar(empleado.get("nombre")) != _normalizar(usuario.get("nombre")):
        return False
    ap_e = _normalizar(empleado.get("apellido")).split()
    ap_u = _normalizar(usuario.get("apellido")).split()
    if not ap_e or not ap_u:
        return not ap_e and not ap_u
    return ap_e[0] == ap_u[0]


def sincronizar_ficha(usuario: dict, rol: str) -> dict | None:
    """Ajusta la ficha de Empleados tras un cambio de rol.

    Devuelve {"accion": ..., "empleado": ...} para que el panel avise que paso.
    """
    admin = get_supabase_admin()
    vinculada = admin.table("empleados").select("*").eq("usuario_id", usuario["id"]).limit(1).execute().data

    if rol != "barbero":
        # Deja de aparecer para reservar, pero no se borra: sus citas pasadas
        # y las ya agendadas siguen apuntando a esta ficha.
        if vinculada and vinculada[0].get("activo"):
            fila = admin.table("empleados").update({"activo": False}).eq("id", vinculada[0]["id"]).execute().data
            return {"accion": "desactivado", "empleado": fila[0]}
        return None

    if vinculada:
        if not vinculada[0].get("activo"):
            fila = admin.table("empleados").update({"activo": True}).eq("id", vinculada[0]["id"]).execute().data
            return {"accion": "activado", "empleado": fila[0]}
        return {"accion": "ya_vinculado", "empleado": vinculada[0]}

    # Si el admin ya habia creado la ficha a mano, se conecta en vez de duplicarla.
    sueltas = admin.table("empleados").select("*").is_("usuario_id", "null").execute().data
    coincidencias = [e for e in sueltas if _mismo_nombre(e, usuario)]
    if len(coincidencias) == 1:
        fila = (
            admin.table("empleados")
            .update({"usuario_id": usuario["id"], "activo": True})
            .eq("id", coincidencias[0]["id"])
            .execute()
            .data
        )
        return {"accion": "vinculado", "empleado": fila[0]}

    fila = (
        admin.table("empleados")
        .insert(
            {
                "nombre": (usuario.get("nombre") or "Barbero").strip(),
                "apellido": (usuario.get("apellido") or "").strip() or None,
                "telefono": usuario.get("telefono"),
                "usuario_id": usuario["id"],
                "activo": True,
            }
        )
        .execute()
        .data
    )
    return {"accion": "creado", "empleado": fila[0]}
