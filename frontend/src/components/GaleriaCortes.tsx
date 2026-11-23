import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

// Fotos reales de cortes hechos en el salon (frontend/public/img/cortes).
// Para agregar una: copiar la imagen a esa carpeta y sumarla aqui.
const CORTES = [
  { src: "/img/cortes/corte-diseno-lateral.webp", titulo: "Corte con diseño", detalle: "Degradado con líneas laterales" },
  { src: "/img/cortes/corte-clasico-peinado.webp", titulo: "Corte clásico", detalle: "Peinado de lado con raya" },
  { src: "/img/cortes/degradado-con-raya.webp", titulo: "Degradado con raya", detalle: "Fade bajo y raya marcada" },
  { src: "/img/cortes/diseno-en-la-nuca.webp", titulo: "Diseño en la nuca", detalle: "Degradado con trazos" },
];

export function GaleriaCortes() {
  const [abierta, setAbierta] = useState<number | null>(null);

  // Escape cierra; las flechas pasan de foto.
  useEffect(() => {
    if (abierta === null) return;
    const teclas = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbierta(null);
      if (e.key === "ArrowRight") setAbierta((i) => (i === null ? i : (i + 1) % CORTES.length));
      if (e.key === "ArrowLeft") setAbierta((i) => (i === null ? i : (i - 1 + CORTES.length) % CORTES.length));
    };
    window.addEventListener("keydown", teclas);
    return () => window.removeEventListener("keydown", teclas);
  }, [abierta]);

  const actual = abierta !== null ? CORTES[abierta] : null;

  return (
    <section className="w-full bg-background pt-space-3xl" id="cortes">
      <div className="max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop flex flex-col gap-space-lg">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-space-sm">
          <div className="flex flex-col gap-space-2xs">
            <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary">Nuestro trabajo</span>
            <h2 className="font-headline-lg text-headline-lg text-on-surface">Cortes hechos en Nutria Style</h2>
          </div>
          <Link className="font-label-md text-label-md uppercase tracking-wider text-primary hover:underline" to="/reservas">
            Reserva el tuyo →
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-space-sm md:gap-space-md">
          {CORTES.map((c, i) => (
            <button
              key={c.src}
              aria-label={`Ver en grande: ${c.titulo}`}
              className="group relative aspect-[3/4] rounded-xl overflow-hidden bg-surface-container shadow-lg text-left"
              onClick={() => setAbierta(i)}
              type="button"
            >
              <img
                alt={`${c.titulo}: ${c.detalle}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                decoding="async"
                height={1280}
                loading="lazy"
                src={c.src}
                width={960}
              />
              <div className="absolute inset-x-0 bottom-0 p-space-sm md:p-space-md bg-gradient-to-t from-black/85 via-black/40 to-transparent">
                <p className="font-headline-sm text-[15px] md:text-headline-sm text-on-surface leading-tight">{c.titulo}</p>
                <p className="hidden sm:block font-body-sm text-body-sm text-on-surface-variant">{c.detalle}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {actual && abierta !== null && (
        <div
          aria-label={actual.titulo}
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-space-md"
          onClick={() => setAbierta(null)}
          role="dialog"
        >
          <button
            aria-label="Cerrar"
            className="absolute top-4 right-4 text-on-surface hover:text-primary"
            onClick={() => setAbierta(null)}
            type="button"
          >
            <span className="material-symbols-outlined text-[32px]">close</span>
          </button>
          <button
            aria-label="Foto anterior"
            className="absolute left-2 md:left-6 text-on-surface hover:text-primary"
            onClick={(e) => {
              e.stopPropagation();
              setAbierta((abierta - 1 + CORTES.length) % CORTES.length);
            }}
            type="button"
          >
            <span className="material-symbols-outlined text-[40px]">chevron_left</span>
          </button>
          <figure className="flex flex-col items-center gap-space-sm max-h-full" onClick={(e) => e.stopPropagation()}>
            <img alt={`${actual.titulo}: ${actual.detalle}`} className="max-h-[80vh] w-auto rounded-xl shadow-2xl" src={actual.src} />
            <figcaption className="text-center">
              <span className="font-headline-sm text-headline-sm text-primary">{actual.titulo}</span>
              <span className="block font-body-sm text-body-sm text-on-surface-variant">{actual.detalle}</span>
            </figcaption>
          </figure>
          <button
            aria-label="Foto siguiente"
            className="absolute right-2 md:right-6 text-on-surface hover:text-primary"
            onClick={(e) => {
              e.stopPropagation();
              setAbierta((abierta + 1) % CORTES.length);
            }}
            type="button"
          >
            <span className="material-symbols-outlined text-[40px]">chevron_right</span>
          </button>
        </div>
      )}
    </section>
  );
}
