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

export const DESCUENTO_FFAA_PNP = {
  porcentaje: 20,
  titulo: "Descuento para FF.AA. y PNP",
  mensaje: "Porque valoramos tu vocación de servicio y amor a la patria.",
  instituciones: ["Ejército del Perú", "Marina de Guerra", "Fuerza Aérea (FAP)", "Policía Nacional (PNP)"],
  condiciones: [
    "Presenta tu carnet y/o CIP vigente al momento de pagar.",
    "Válido solo para el titular del carnet; no aplica para familiares.",
    "Se aplica sobre el precio de cualquier servicio individual.",
    "No aplica sobre los combos, que mantienen su precio.",
  ],
};

export const NOTA_NO_ACUMULABLE =
  "Las promociones no son acumulables: si eres de FF.AA. o PNP, eliges el combo a su precio o el 20% de descuento en un servicio individual.";
