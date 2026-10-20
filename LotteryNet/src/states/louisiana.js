// Identidades aprobadas; las URLs 3/4 se validarán antes de habilitar consultas.
export const louisiana = Object.freeze([
  {
    "id": "la-pm",
    "state": "LA",
    "slug": "louisiana",
    "timeZone": "America/Chicago",
    "turn": "EVENING",
    "roverLabel": "LOUISIANA EVENING",
    "games": [
      "p3",
      "p4"
    ]
  }
].map((draw) => Object.freeze({ ...draw, games: Object.freeze(draw.games) })));
