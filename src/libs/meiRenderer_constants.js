export default {
  primarySymbols: {
    clefs: ["treble_clef", "sing_clef", "clef8"],
    timeSignatures: [
      "o_timesig",
      "o_dot_timesig",
      "o_I_timesig",
      "o__I_dot_timesig",
      "c_timesig",
      "c_dot_timesig",
      "c_I_timesig",
      "c_I_dot_timesig",
      "inverted_c_timesig",
      "inverted_c_dot_timesig",
      "inverted_c_I_timesig",
      "inverted_c_I_dot_timesig"
    ],
    notes: [
      "longa_down",
      "longa_up",
      "breve",
      "breve_full",
      "semibreve",
      "semibreve_full",
      "minim_down",
      "semiminim_down",
      "fusa_down",
      "semifusa_down",
      "minim_up",
      "semiminim_up",
      "fusa_up",
      "semifusa_up"
    ],
    rests: [
      "imperfect_long_rest",
      "breve_rest",
      "semibreve_rest",
      "minim_rest",
      "crotchet_rest",
      "semiquaver_rest"
    ],
    varia: ["bar_line"]
  },
  noteInfo: {
    longa_down: { dur: 1 },
    longa_up: { dur: 1 },
    breve: { dur: 1 },
    breve_full: { dur: 1 },
    semibreve: { dur: 1 },
    semibreve_full: { dur: 1 },
    minim_down: { dur: 2, dir: "down" },
    semiminim_down: { dur: 4, dir: "down" },
    fusa_down: { dur: 8, dir: "down" },
    semifusa_down: { dur: 16, dir: "up" },
    minim_up: { dur: 2, dir: "up" },
    semiminim_up: { dur: 4, dir: "up" },
    fusa_up: { dur: 8, dir: "up" },
    semifusa_up: { dur: 16, dir: "up" }
  },
  restInfo: {
    imperfect_long_rest: { dur: "breve" },
    breve_rest: { dur: "breve" },
    semibreve_rest: { dur: 1 },
    minim_rest: { dur: 2 },
    crotchet_rest: { dur: 4 },
    semiquaver_rest: { dur: 8 }
  },
  halfDurations: {
    semibreve: "minim_down",
    semibreve_full: "minim_down",
    minim_down: "semiminim_down",
    semiminim_down: "fusa_down",
    fusa_down: "semifusa_down",
    minim_up: "semiminim_up",
    semiminim_up: "fusa_up",
    fusa_up: "semifusa_up"
  },
  timeSigMappings: {
    null: {
      scoreDef: 'meter.count="4" meter.unit="4"'
    },
    c_timesig: {
      scoreDef: 'meter.count="4" meter.sym="cut" meter.unit="1"'
    },
    c_I_timesig: {
      scoreDef: 'meter.count="2" meter.sym="cut" meter.unit="breve"'
    }
  }
};
