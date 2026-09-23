const LLENA = { fontVariationSettings: "'FILL' 1" };

/** Estrellas solo para mostrar (admite medias, p. ej. 4.5). */
export function Estrellas({ valor, tamano = 20 }: { valor: number; tamano?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-primary" aria-label={`${valor} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          aria-hidden="true"
          className="material-symbols-outlined"
          style={{ fontSize: tamano, ...(valor >= i - 0.25 ? LLENA : {}) }}
        >
          {valor >= i - 0.25 ? "star" : valor >= i - 0.75 ? "star_half" : "star"}
        </span>
      ))}
    </span>
  );
}

/** Estrellas para elegir una calificacion. */
export function EstrellasInput({ valor, onChange }: { valor: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-space-2xs">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          aria-label={`${i} ${i === 1 ? "estrella" : "estrellas"}`}
          aria-pressed={valor === i}
          className={`material-symbols-outlined text-[34px] transition-colors ${i <= valor ? "text-primary" : "text-outline hover:text-secondary"}`}
          onClick={() => onChange(i)}
          style={i <= valor ? LLENA : undefined}
          type="button"
        >
          star
        </button>
      ))}
    </div>
  );
}
