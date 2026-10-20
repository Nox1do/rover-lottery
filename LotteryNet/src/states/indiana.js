// Identidades aprobadas; las URLs 3/4 se validarán antes de habilitar consultas.
export const indiana = Object.freeze([
  {
    "id": "in-am",
    "state": "IN",
    "slug": "indiana",
    "timeZone": "America/New_York",
    "turn": "MIDDAY",
    "roverLabel": "INDIANA MIDDAY",
    "games": [
      "p3",
      "p4"
    ]
  },
  {
    "id": "in-pm",
    "state": "IN",
    "slug": "indiana",
    "timeZone": "America/New_York",
    "turn": "EVENING",
    "roverLabel": "INDIANA EVENING",
    "games": [
      "p3",
      "p4"
    ]
  }
].map((draw) => Object.freeze({ ...draw, games: Object.freeze(draw.games) })));
