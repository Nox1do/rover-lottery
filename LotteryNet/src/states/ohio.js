// Identidades aprobadas; las URLs 3/4 se validarán antes de habilitar consultas.
export const ohio = Object.freeze([
  {
    "id": "oh-am",
    "state": "OH",
    "slug": "ohio",
    "timeZone": "America/New_York",
    "turn": "MIDDAY",
    "roverLabel": "OHIO MIDDAY",
    "games": [
      "p3",
      "p4"
    ]
  },
  {
    "id": "oh-pm",
    "state": "OH",
    "slug": "ohio",
    "timeZone": "America/New_York",
    "turn": "EVENING",
    "roverLabel": "OHIO EVENING",
    "games": [
      "p3",
      "p4"
    ]
  }
].map((draw) => Object.freeze({ ...draw, games: Object.freeze(draw.games) })));
