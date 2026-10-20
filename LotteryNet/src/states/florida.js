// Identidades aprobadas; las URLs 3/4 se validarán antes de habilitar consultas.
export const florida = Object.freeze([
  {
    "id": "fl-am",
    "state": "FL",
    "slug": "florida",
    "timeZone": "America/New_York",
    "turn": "MIDDAY",
    "roverLabel": "FLORIDA AM",
    "roverCode": "FL-AM",
    "games": [
      "p3",
      "p4"
    ]
  },
  {
    "id": "fl-pm",
    "state": "FL",
    "slug": "florida",
    "timeZone": "America/New_York",
    "turn": "EVENING",
    "roverLabel": "FLORIDA PM",
    "roverCode": "FL-PM",
    "games": [
      "p3",
      "p4"
    ]
  }
].map((draw) => Object.freeze({ ...draw, games: Object.freeze(draw.games) })));
