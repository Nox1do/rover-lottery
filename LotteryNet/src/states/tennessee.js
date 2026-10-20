// Identidades aprobadas; las URLs 3/4 se validarán antes de habilitar consultas.
export const tennessee = Object.freeze([
  {
    "id": "tn-morning",
    "state": "TN",
    "slug": "tennessee",
    "timeZone": "America/Chicago",
    "turn": "MORNING",
    "roverLabel": "TENNESSEE MORNING",
    "roverCode": "TN-MORNING",
    "games": [
      "p3",
      "p4"
    ]
  },
  {
    "id": "tn-midday",
    "state": "TN",
    "slug": "tennessee",
    "timeZone": "America/Chicago",
    "turn": "MIDDAY",
    "roverLabel": "TENNESSEE MIDDAY",
    "roverCode": "TN-MD",
    "games": [
      "p3",
      "p4"
    ]
  },
  {
    "id": "tn-pm",
    "state": "TN",
    "slug": "tennessee",
    "timeZone": "America/Chicago",
    "turn": "EVENING",
    "roverLabel": "TENNESSEE EVENING",
    "roverCode": "TN-EVEN",
    "games": [
      "p3",
      "p4"
    ]
  }
].map((draw) => Object.freeze({ ...draw, games: Object.freeze(draw.games) })));
