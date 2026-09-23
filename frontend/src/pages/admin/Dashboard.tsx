import { Link } from "react-router-dom";

const CARDS = [
  { to: "/admin/servicios", icon: "content_cut", title: "Servicios", desc: "Crea, edita y activa/desactiva los servicios y precios que se muestran en Tarifas y Reservas." },
  { to: "/admin/empleados", icon: "groups", title: "Empleados", desc: "Gestiona tu equipo de barberos y el horario semanal de cada uno." },
  { to: "/admin/usuarios", icon: "person", title: "Usuarios", desc: "Consulta tus clientes registrados y marca sellos de fidelización." },
  { to: "/admin/reservas", icon: "event_available", title: "Reservas", desc: "Ve la agenda completa y confirma, cancela o marca citas como completadas." },
  { to: "/admin/resenas", icon: "reviews", title: "Reseñas", desc: "Revisa las reseñas de tus clientes y decide cuáles se publican en el sitio." },
  { to: "/admin/configuracion", icon: "settings", title: "Configuración", desc: "Datos del negocio: WhatsApp, dirección, horario y redes sociales." },
];

export default function Dashboard() {
  return (
    <>
      <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold">Panel de Administración</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md">
        {CARDS.map((c) => (
          <Link
            key={c.to}
            className="flex flex-col gap-space-2xs bg-surface-container-low hover:bg-surface-container p-space-lg rounded-xl shadow-lg transition-colors"
            to={c.to}
          >
            <span className="material-symbols-outlined text-primary text-[28px]">{c.icon}</span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">{c.title}</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">{c.desc}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
