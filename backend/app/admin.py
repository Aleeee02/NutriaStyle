from fastapi import APIRouter, Depends, HTTPException

from app.auth import olvidar_rol, require_admin
from app.asistencias import marcar_no_asistidas
from app.canjes import canjear_tarjeta
from app.concurrencia import en_paralelo
from app.constants import SELLOS_META
from app.schemas import ConfiguracionBody, EmpleadoBody, EstadoReservaBody, HorarioBody, RolBody, ServicioBody
from app.supabase_client import get_supabase_admin

router = APIRouter(prefix="/api/admin", dependencies=[Depends(require_admin)])

ESTADOS_RESERVA = ["pendiente", "confirmada", "completada", "cancelada", "no_asistio"]


# ---------- Servicios ----------


@router.get("/servicios")
def admin_servicios_list():
    admin = get_supabase_admin()
    return (
        admin.table("servicios")
        .select("*, categorias_servicio(nombre)")
        .order("created_at", desc=True)
        .execute()
        .data
    )


@router.get("/servicios/{servicio_id}")
def admin_servicio_get(servicio_id: str):
    admin = get_supabase_admin()
    row = admin.table("servicios").select("*").eq("id", servicio_id).single().execute().data
    if not row:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    return row


@router.post("/servicios")
def admin_servicio_crear(body: ServicioBody):
    admin = get_supabase_admin()
    fila = (
        admin.table("servicios")
        .insert(
            {
                "nombre": body.nombre,
                "categoria_id": body.categoria_id,
                "descripcion": body.descripcion,
                "precio": body.precio,
                "duracion_minutos": body.duracion_minutos,
                "imagen_url": body.imagen_url,
            }
        )
        .execute()
        .data
    )
    return fila[0]


@router.put("/servicios/{servicio_id}")
def admin_servicio_editar(servicio_id: str, body: ServicioBody):
    admin = get_supabase_admin()
    datos = {
        "nombre": body.nombre,
        "categoria_id": body.categoria_id,
        "descripcion": body.descripcion,
        "precio": body.precio,
        "duracion_minutos": body.duracion_minutos,
        "imagen_url": body.imagen_url,
    }
    if body.activo is not None:
        datos["activo"] = body.activo
    fila = admin.table("servicios").update(datos).eq("id", servicio_id).execute().data
    return fila[0]


@router.post("/servicios/{servicio_id}/toggle-activo")
def admin_servicio_toggle_activo(servicio_id: str):
    admin = get_supabase_admin()
    actual = admin.table("servicios").select("activo").eq("id", servicio_id).single().execute().data
    fila = admin.table("servicios").update({"activo": not actual["activo"]}).eq("id", servicio_id).execute().data
    return fila[0]


# ---------- Empleados ----------


@router.get("/empleados")
def admin_empleados_list():
    admin = get_supabase_admin()
    return admin.table("empleados").select("*").order("created_at", desc=True).execute().data


@router.get("/empleados/{empleado_id}")
def admin_empleado_get(empleado_id: str):
    admin = get_supabase_admin()
    row = admin.table("empleados").select("*").eq("id", empleado_id).single().execute().data
    if not row:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    return row


@router.post("/empleados")
def admin_empleado_crear(body: EmpleadoBody):
    admin = get_supabase_admin()
    fila = (
        admin.table("empleados")
        .insert(
            {
                "nombre": body.nombre,
                "apellido": body.apellido,
                "telefono": body.telefono,
                "descripcion": body.descripcion,
                "foto_url": body.foto_url,
            }
        )
        .execute()
        .data
    )
    return fila[0]


@router.put("/empleados/{empleado_id}")
def admin_empleado_editar(empleado_id: str, body: EmpleadoBody):
    admin = get_supabase_admin()
    datos = {
        "nombre": body.nombre,
        "apellido": body.apellido,
        "telefono": body.telefono,
        "descripcion": body.descripcion,
        "foto_url": body.foto_url,
    }
    if body.activo is not None:
        datos["activo"] = body.activo
    fila = admin.table("empleados").update(datos).eq("id", empleado_id).execute().data
    return fila[0]


@router.post("/empleados/{empleado_id}/toggle-activo")
def admin_empleado_toggle_activo(empleado_id: str):
    admin = get_supabase_admin()
    actual = admin.table("empleados").select("activo").eq("id", empleado_id).single().execute().data
    fila = admin.table("empleados").update({"activo": not actual["activo"]}).eq("id", empleado_id).execute().data
    return fila[0]


# ---------- Horarios de empleado ----------


@router.get("/empleados/{empleado_id}/horarios")
def admin_empleado_horarios(empleado_id: str):
    admin = get_supabase_admin()
    return (
        admin.table("horarios_empleado")
        .select("*")
        .eq("empleado_id", empleado_id)
        .order("dia_semana")
        .execute()
        .data
    )


@router.post("/empleados/{empleado_id}/horarios")
def admin_horario_nuevo(empleado_id: str, body: HorarioBody):
    admin = get_supabase_admin()
    fila = (
        admin.table("horarios_empleado")
        .insert(
            {
                "empleado_id": empleado_id,
                "dia_semana": body.dia_semana,
                "hora_inicio": body.hora_inicio,
                "hora_fin": body.hora_fin,
            }
        )
        .execute()
        .data
    )
    return fila[0]


@router.delete("/empleados/{empleado_id}/horarios/{horario_id}")
def admin_horario_eliminar(empleado_id: str, horario_id: str):
    get_supabase_admin().table("horarios_empleado").delete().eq("id", horario_id).execute()
    return {"ok": True}


# ---------- Usuarios y fidelizacion ----------


@router.get("/usuarios")
def admin_usuarios_list():
    admin = get_supabase_admin()
    usuarios, tarjetas = en_paralelo(
        lambda: admin.table("usuarios").select("*").order("fecha_registro", desc=True).execute().data,
        lambda: admin.table("tarjetas_fidelizacion").select("id, usuario_id, sellos, nivel").execute().data,
    )
    tarjeta_por_usuario = {t["usuario_id"]: t for t in tarjetas}

    for u in usuarios:
        tarjeta = tarjeta_por_usuario.get(u["id"])
        u["sellos"] = tarjeta["sellos"] if tarjeta else 0
        u["nivel"] = tarjeta["nivel"] if tarjeta else "-"
        u["faltan"] = max(0, SELLOS_META - u["sellos"])
        u["listo_para_canjear"] = u["sellos"] >= SELLOS_META

    return {"usuarios": usuarios, "sellos_meta": SELLOS_META}


@router.post("/usuarios/{usuario_id}/sello")
def admin_usuario_agregar_sello(usuario_id: str):
    admin = get_supabase_admin()

    # El update exige que los sellos sigan siendo los leidos. Sin eso, dos
    # clics seguidos leian el mismo valor y uno de los sellos se perdia.
    for _ in range(5):
        tarjeta = admin.table("tarjetas_fidelizacion").select("id, sellos").eq("usuario_id", usuario_id).limit(1).execute().data
        if not tarjeta:
            creada = admin.table("tarjetas_fidelizacion").insert({"usuario_id": usuario_id, "sellos": 1}).execute().data
            tarjeta_id, nuevo_total = creada[0]["id"], 1
            break
        nuevo_total = tarjeta[0]["sellos"] + 1
        actualizado = (
            admin.table("tarjetas_fidelizacion")
            .update({"sellos": nuevo_total})
            .eq("id", tarjeta[0]["id"])
            .eq("sellos", tarjeta[0]["sellos"])
            .execute()
            .data
        )
        if actualizado:
            tarjeta_id = tarjeta[0]["id"]
            break
    else:
        raise HTTPException(status_code=409, detail="La tarjeta cambió mientras se sellaba. Inténtalo de nuevo.")

    admin.table("movimientos_fidelizacion").insert(
        {"tarjeta_id": tarjeta_id, "tipo": "ganancia", "cantidad": 1, "descripcion": "Sello agregado por el salón"}
    ).execute()

    return {"sellos": nuevo_total}


@router.post("/usuarios/{usuario_id}/canjear")
def admin_usuario_canjear(usuario_id: str):
    admin = get_supabase_admin()
    tarjeta_rows = admin.table("tarjetas_fidelizacion").select("*").eq("usuario_id", usuario_id).limit(1).execute().data
    if not tarjeta_rows or tarjeta_rows[0]["sellos"] < SELLOS_META:
        raise HTTPException(status_code=400, detail="El usuario no tiene sellos suficientes para canjear")

    return {"sellos": canjear_tarjeta(tarjeta_rows[0], "Corte de cortesía canjeado desde el panel")}


ROLES_ASIGNABLES = ["cliente", "barbero"]


@router.put("/usuarios/{usuario_id}/rol")
def admin_usuario_cambiar_rol(usuario_id: str, body: RolBody):
    # Desde el panel solo se alterna cliente <-> barbero. Dar o quitar admin
    # sigue siendo manual en Supabase, para que un clic no cree otro admin.
    if body.rol not in ROLES_ASIGNABLES:
        raise HTTPException(status_code=400, detail="Rol no válido")

    admin = get_supabase_admin()
    actual = admin.table("usuarios").select("rol").eq("id", usuario_id).limit(1).execute().data
    if not actual:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if actual[0].get("rol") == "admin":
        raise HTTPException(status_code=400, detail="No se puede cambiar el rol de un administrador desde el panel")

    admin.table("usuarios").update({"rol": body.rol}).eq("id", usuario_id).execute()
    olvidar_rol(usuario_id)
    return {"rol": body.rol}


# ---------- Reservas ----------


@router.get("/reservas")
def admin_reservas_list(estado: str = ""):
    admin = get_supabase_admin()
    marcar_no_asistidas()
    query = (
        admin.table("reservas")
        .select("*, usuarios(nombre, apellido, email), servicios(nombre), empleados(nombre, apellido)")
        .order("fecha", desc=True)
        .order("hora_inicio", desc=True)
    )
    if estado:
        query = query.eq("estado", estado)
    return query.limit(200).execute().data


@router.post("/reservas/{reserva_id}/estado")
def admin_reserva_cambiar_estado(reserva_id: str, body: EstadoReservaBody):
    if body.estado not in ESTADOS_RESERVA:
        raise HTTPException(status_code=400, detail="Estado inválido")
    fila = get_supabase_admin().table("reservas").update({"estado": body.estado}).eq("id", reserva_id).execute().data
    return fila[0]


# ---------- Configuracion del negocio ----------


@router.get("/configuracion")
def admin_configuracion_get():
    rows = get_supabase_admin().table("configuracion").select("*").limit(1).execute().data
    return rows[0] if rows else None


@router.put("/configuracion")
def admin_configuracion_actualizar(body: ConfiguracionBody):
    admin = get_supabase_admin()
    datos = body.model_dump()

    existente = admin.table("configuracion").select("id").limit(1).execute().data

    def guardar(valores: dict):
        if existente:
            return admin.table("configuracion").update(valores).eq("id", existente[0]["id"]).execute().data
        return admin.table("configuracion").insert(valores).execute().data

    try:
        fila = guardar(datos)
    except Exception as e:
        # La columna tiktok_url se agrega con un ALTER TABLE en Supabase. Si
        # todavia no existe, se guarda el resto en vez de fallar entero.
        if "tiktok_url" not in str(e):
            raise
        fila = guardar({k: v for k, v in datos.items() if k != "tiktok_url"})
    return fila[0]
