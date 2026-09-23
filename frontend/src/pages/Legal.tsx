import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { api } from "../lib/api";
import { SELLOS_META } from "../lib/promociones";
import type { Configuracion } from "../lib/types";

// Ultima revision del texto. Se actualiza a mano cuando cambie el contenido.
const ACTUALIZADO = "23 de septiembre de 2026";

function Pagina({ titulo, intro, children, config }: { titulo: string; intro: string; children: ReactNode; config?: Configuracion }) {
  return (
    <main className="w-full pt-20 bg-background min-h-screen">
      <section className="w-full bg-surface-container-lowest px-margin-mobile md:px-margin-desktop py-space-3xl">
        <div className="max-w-3xl mx-auto flex flex-col gap-space-sm">
          <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary">
            {config?.nombre_barberia ?? "Nutria Style"} · Última actualización: {ACTUALIZADO}
          </span>
          <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight">{titulo}</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">{intro}</p>
        </div>
      </section>
      <div className="max-w-3xl mx-auto px-margin-mobile md:px-margin-desktop py-space-2xl flex flex-col gap-space-xl">
        {children}
      </div>
    </main>
  );
}

function Bloque({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-space-sm">
      <h2 className="font-headline-md text-headline-md text-primary">{titulo}</h2>
      <div className="flex flex-col gap-space-sm font-body-md text-body-md text-on-surface-variant [&_strong]:text-on-surface [&_strong]:font-medium">
        {children}
      </div>
    </section>
  );
}

function Lista({ puntos }: { puntos: ReactNode[] }) {
  return (
    <ul className="flex flex-col gap-space-xs">
      {puntos.map((p, i) => (
        <li key={i} className="flex items-start gap-space-xs">
          <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">chevron_right</span>
          <span>{p}</span>
        </li>
      ))}
    </ul>
  );
}

function useConfig() {
  return useQuery({ queryKey: ["config"], queryFn: () => api.get<Configuracion>("/config") }).data;
}

function Contacto({ config }: { config?: Configuracion }) {
  if (config?.telefono_whatsapp) {
    return (
      <a className="text-primary hover:underline" href={`https://wa.me/${config.telefono_whatsapp}`} target="_blank" rel="noreferrer">
        WhatsApp {config.telefono_whatsapp}
      </a>
    );
  }
  return <span>el salón</span>;
}

export function Privacidad() {
  const config = useConfig();

  return (
    <Pagina
      config={config}
      titulo="Política de Privacidad"
      intro="Qué datos tuyos guardamos, para qué los usamos y cómo puedes pedir que los borremos."
    >
      <Bloque titulo="Quiénes somos">
        <p>
          {config?.nombre_barberia ?? "Nutria Style"}, barbería ubicada en {config?.direccion ?? "Iquitos, Perú"}. Para
          cualquier consulta sobre tus datos, escríbenos por <Contacto config={config} />.
        </p>
      </Bloque>

      <Bloque titulo="Qué datos recogemos">
        <Lista
          puntos={[
            <>
              <strong>Al crear tu cuenta:</strong> nombre, apellido, correo electrónico y teléfono. Si entras con
              Google, recibimos de tu cuenta el nombre, el correo y la foto de perfil.
            </>,
            <>
              <strong>Al reservar:</strong> el servicio, el barbero, la fecha y hora, y cualquier observación que
              escribas.
            </>,
            <>
              <strong>Tu tarjeta de fidelidad:</strong> los sellos acumulados y los cortes de cortesía canjeados.
            </>,
            <>
              <strong>No pedimos ni guardamos datos de pago.</strong> El sitio no cobra nada; los pagos se hacen en el
              salón.
            </>,
          ]}
        />
      </Bloque>

      <Bloque titulo="Para qué los usamos">
        <Lista
          puntos={[
            "Agendar tus citas y evitar que dos personas reserven el mismo horario.",
            "Saber quién llega al salón y llevar el control de asistencias.",
            "Llevar la cuenta de tus sellos y de tu corte de cortesía.",
            "Comunicarnos contigo por tu cita, si hace falta.",
          ]}
        />
        <p>
          No vendemos ni cedemos tus datos a terceros, y no los usamos para publicidad de otras empresas.
        </p>
      </Bloque>

      <Bloque titulo="Dónde se guardan">
        <p>
          Tus datos se guardan en servidores de <strong>Supabase</strong> (base de datos en Brasil) y la aplicación
          corre en <strong>Render</strong> y <strong>Vercel</strong>. El acceso está restringido: solo el personal del
          salón con cuenta de administrador puede ver la lista de clientes y las reservas.
        </p>
      </Bloque>

      <Bloque titulo="Cookies">
        <p>
          Usamos una sola cookie, la que mantiene tu sesión abierta después de iniciar sesión. No usamos cookies de
          publicidad ni de seguimiento, ni compartimos tu navegación con nadie.
        </p>
      </Bloque>

      <Bloque titulo="Tus derechos">
        <p>
          De acuerdo con la Ley N.° 29733, Ley de Protección de Datos Personales del Perú, puedes pedirnos en cualquier
          momento:
        </p>
        <Lista
          puntos={[
            "Ver qué datos tuyos tenemos.",
            "Corregirlos si están equivocados (el nombre, apellido y teléfono también puedes cambiarlos tú desde tu perfil).",
            "Eliminar tu cuenta y tus datos personales.",
            "Oponerte a que los usemos.",
          ]}
        />
        <p>
          Para cualquiera de estas solicitudes, escríbenos por <Contacto config={config} />.
        </p>
      </Bloque>

      <Bloque titulo="Menores de edad">
        <p>
          Las cuentas son para mayores de edad. Los menores son bienvenidos en el salón, pero la reserva debe hacerla
          un adulto responsable.
        </p>
      </Bloque>

      <Bloque titulo="Cambios">
        <p>
          Si cambiamos esta política, actualizaremos la fecha que aparece arriba. Te recomendamos revisarla de vez en
          cuando.
        </p>
      </Bloque>
    </Pagina>
  );
}

export function Terminos() {
  const config = useConfig();

  return (
    <Pagina
      config={config}
      titulo="Términos y Condiciones"
      intro="Las reglas del sitio: cómo funcionan las reservas, las promociones y la tarjeta de sellos."
    >
      <Bloque titulo="Tu cuenta">
        <Lista
          puntos={[
            "Regístrate con datos verdaderos: los necesitamos para ubicarte si hay un cambio con tu cita.",
            "Cada correo puede tener una sola cuenta, ya sea con contraseña o entrando con Google.",
            "Eres responsable de tu contraseña y de lo que se haga desde tu cuenta.",
          ]}
        />
      </Bloque>

      <Bloque titulo="Reservas">
        <Lista
          puntos={[
            <>
              Al reservar, tu cita queda como <strong>pendiente</strong> hasta que el salón la confirme.
            </>,
            "Los horarios que ves son los que están libres en ese momento; si alguien toma el mismo horario antes, tendrás que elegir otro.",
            <>
              Al llegar, muestra el <strong>QR de tu cita</strong> para registrar tu asistencia.
            </>,
            <>
              Si no llegas, la cita se marca como <strong>no asistió</strong> pasados 30 minutos de la hora en que
              terminaba.
            </>,
          ]}
        />
      </Bloque>

      <Bloque titulo="Cancelaciones">
        <p>
          Puedes cancelar tu cita desde tu cuenta, en la sección de fidelización, mientras siga pendiente o confirmada.
          Te pedimos cancelar con anticipación: el horario queda libre de inmediato para otro cliente.
        </p>
      </Bloque>

      <Bloque titulo="Precios y promociones">
        <Lista
          puntos={[
            "Los precios están en soles e incluyen el servicio indicado. Pueden cambiar; el precio válido es el vigente en el salón al momento de atenderte.",
            <>
              <strong>Descuento FF.AA. y PNP (20%):</strong> solo para el titular que presente su carnet y/o CIP
              vigente, no para familiares. Se aplica en Corte Clásico y Corte con Diseño.
            </>,
            <>
              <strong>Combos:</strong> tienen precio fijo para todos y no admiten descuentos.
            </>,
            "Las promociones no son acumulables: se aplica una sola por atención.",
          ]}
        />
      </Bloque>

      <Bloque titulo="Tarjeta de fidelidad">
        <Lista
          puntos={[
            <>
              Al juntar <strong>{SELLOS_META} sellos</strong> obtienes un corte de cortesía.
            </>,
            "Los sellos los marca el personal del salón por cada servicio pagado.",
            "Los sellos y el corte de cortesía son personales: no se transfieren, no se canjean por dinero ni se suman a otras promociones.",
            "Para canjear, muestra el QR de tu tarjeta; es de un solo uso y al canjearlo la tarjeta vuelve a empezar.",
            "Si hay un error al marcar sellos, el salón puede corregirlo.",
          ]}
        />
      </Bloque>

      <Bloque titulo="Uso del sitio">
        <p>
          Puede haber momentos en que el sitio no esté disponible por mantenimiento o por fallas de los servicios que
          usamos. Si eso ocurre, puedes reservar escribiéndonos por <Contacto config={config} />.
        </p>
      </Bloque>

      <Bloque titulo="Contacto y ley aplicable">
        <p>
          Cualquier consulta o reclamo, escríbenos por <Contacto config={config} /> o acércate a{" "}
          {config?.direccion ?? "nuestro local"}. Estos términos se rigen por las leyes del Perú.
        </p>
      </Bloque>
    </Pagina>
  );
}
