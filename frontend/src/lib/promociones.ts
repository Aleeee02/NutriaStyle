// Promociones vigentes que se muestran al publico.
//
// OJO: todo lo que esta en este archivo termina en el JavaScript del sitio y
// cualquiera puede leerlo. Aqui va SOLO lo que el cliente debe saber. Datos
// internos del equipo (comision del barbero por combo, como verificar el
// carnet, etc.) no se ponen aqui.

export interface Combo {
  id: string;
  nombre: string;
  titulo: string;
  precio: number;
  incluye: string[];
  cortesia: string;
}

export const COMBOS: Combo[] = [
  {
    id: "combo-1",
    nombre: "Combo 1",
    titulo: "Corte Clásico",
    precio: 20,
    incluye: ["Corte clásico", "Mascarilla facial"],
    cortesia: "Una bebida de cortesía",
  },
  {
    id: "combo-2",
    nombre: "Combo 2",
    titulo: "Corte con Diseño",
    precio: 25,
    incluye: ["Corte con diseño", "Arreglo de ceja", "Mascarilla facial"],
    cortesia: "Una bebida de cortesía",
  },
];

// Servicios a los que aplica el 20% de FF.AA./PNP (nombres como estan en
// Admin > Servicios). Si se renombra alguno alli, actualizarlo tambien aqui.
const SERVICIOS_CON_DESCUENTO_FFAA = ["Corte Clásico", "Corte con Diseño"];

function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
}

/** ¿El 20% de FF.AA./PNP aplica a este servicio? (combos, barba, cejas: no) */
export function aplicaDescuentoFfaa(nombreServicio: string): boolean {
  const nombre = normalizar(nombreServicio);
  return SERVICIOS_CON_DESCUENTO_FFAA.some((s) => normalizar(s) === nombre);
}

export const DESCUENTO_FFAA_PNP = {
  porcentaje: 20,
  titulo: "Descuento para FF.AA. y PNP",
  mensaje: "Porque valoramos tu vocación de servicio y amor a la patria.",
  instituciones: ["Ejército del Perú", "Marina de Guerra", "Fuerza Aérea (FAP)", "Policía Nacional (PNP)"],
  condiciones: [
    "Presenta tu carnet y/o CIP vigente al momento de pagar.",
    "Válido solo para el titular del carnet; no aplica para familiares.",
    `Válido solo en ${SERVICIOS_CON_DESCUENTO_FFAA.join(" y ")}.`,
    "No aplica en combos, barba ni cejas.",
  ],
};

export const NOTA_NO_ACUMULABLE =
  "Las promociones no son acumulables: si eres de FF.AA. o PNP, eliges el combo a su precio o el 20% de descuento en tu corte.";
