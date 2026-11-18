// Plain-English names for the parts of the Gajju Mini 3D model, used by the Home page viewer.
//
// Source: the part labels in js/gajju-model.js (taken from the CAD assembly's component names).
// Names translate those labels into everyday words; nothing here adds a function or claim that
// isn't in the labels themselves ("pan" = turns left and right, "tilt" = nods up and down).
// Part numbers and CAD file names are never shown. Anything not matched below is shown as
// "Robot component".

const TBC_CAMERA =
  'The 3D model shows an ESP32-CAM camera board here. The content document describes the camera as run by the Raspberry Pi. Which board runs the camera is to be confirmed.';

/** [label pattern, plain name, optional "to be confirmed" note]. The first match wins. */
const NAMES = [
  // Body shell
  [/^Torso body$/, 'Body shell'],
  [/^Battery door$/, 'Battery door'],
  [/^Electronics deck$/, 'Electronics deck'],
  [/^Hump cap$/, 'Hump cap'],
  [/^Front clamp$/, 'Front clamp'],
  [/^Back clamp$/, 'Back clamp'],
  [/^Tail plug$/, 'Tail plug'],
  [/^Speaker ring$/, 'Speaker ring'],
  // Legs (keep the side: "Thigh, front-left")
  [/^(Thigh|Kneecap|Shin|Boot|Foot pad), (.+)$/, (m) => `${m[1]}, ${m[2]}`],
  [/^MG946R hip servo, (.+)$/, (m) => `Hip motor, ${m[1]}`],
  [/^MG946R knee servo, (.+)$/, (m) => `Knee motor, ${m[1]}`],
  [/^M3×20 servo-ear screw/, 'Screw'],
  // Trunk and gripper
  [/^Gripper gear cover$/, 'Gripper gear cover'],
  [/^Gripper (idler|servo) gear$/, 'Gripper gear'],
  [/^Gripper jaw/, 'Gripper jaw'],
  [/^Trunk tip servo cover$/, 'Trunk tip motor cover'],
  [/^Trunk tip$/, 'Trunk tip'],
  [/^Trunk link (\d)$/, (m) => `Trunk link ${m[1]}`],
  [/^Trunk sleeve ring/, 'Trunk ring'],
  [/^Trunk root spool$/, 'Trunk base'],
  [/^MG90S trunk servo$/, 'Trunk motor'],
  [/^MG90S gripper servo$/, 'Gripper motor'],
  // Head and neck
  [/^Head shell, (left|right)$/, (m) => `Head shell, ${m[1]}`],
  [/^Face panel$/, 'Face panel'],
  [/^Eye adapter$/, 'Eye mount'],
  [/^Jaali \(lattice\) cap$/, 'Jaali cap'],
  [/^Ear, (left|right)$/, (m) => `Ear, ${m[1]}`],
  [/^Neck, (lower|upper)$/, (m) => `Neck, ${m[1]}`],
  [/^Neck hub$/, 'Neck hub'],
  [/^Neck turret top$/, 'Neck top'],
  [/^Tilt pivot sleeve$/, 'Head nod pivot'],
  [/^MG946R head tilt servo$/, 'Head nod motor (up and down)'],
  [/^MG90S head pan servo$/, 'Head turn motor (left and right)'],
  [/^608 bearing, head pan$/, 'Head turn bearing'],
  [/^IMU shelf$/, 'Motion sensor shelf'],
  [/^Depth sensor spacer$/, 'Distance sensor spacer'],
  [/^ESP32-CAM board$/, 'Camera board', TBC_CAMERA],
  [/^ESP32-CAM pins and jumpers$/, 'Camera board pins', TBC_CAMERA],
  [/^OV2640 camera$/, 'Camera'],
  [/^Camera lens/, 'Camera lens'],
  [/^VL53 time-of-flight depth sensor$/, 'Distance sensor'],
  [/^MPU6050 IMU, head$/, 'Motion sensor, head'],
  [/^MPU6050 IMU, torso$/, 'Motion sensor, body'],
  [/^INMP441 microphone$/, 'Microphone'],
  // Electronics inside the body
  [/^Raspberry Pi Zero 2 W$/, 'Raspberry Pi Zero 2 W ("brain")'],
  [/^ESP32 DevKit$/, 'ESP32 board ("spinal cord")'],
  [/^PCA9685 .*servo driver$/, 'Motor driver board'],
  [/^2S1P 18650 battery pack$/, 'Battery pack'],
  [/^XL4016 servo power converter$/, 'Motor power converter'],
  [/^XL4016 terminals/, 'Power converter terminals'],
  [/^5 V 3 A UBEC regulator$/, '5 V power regulator'],
  [/^Main power switch$/, 'Power switch'],
  [/^10 A fuse holder$/, 'Fuse holder'],
  [/^DC charging socket$/, 'Charging socket'],
  [/^Wago 221 power bus/, 'Power wiring block'],
  [/^MAX98357A audio amplifier$/, 'Speaker amplifier'],
  [/^40 mm speaker$/, 'Speaker'],
  // Fixings
  [/^M2\.5×6 battery door screw/, 'Battery door screw'],
  [/^M10 nut/, 'Nut'],
];

export const UNKNOWN_PART = 'Robot component';

/** @returns {{ name: string, tbc?: string }} */
export function plainPart(label = '') {
  for (const [re, name, tbc] of NAMES) {
    const m = label.match(re);
    if (m) return { name: typeof name === 'function' ? name(m) : name, ...(tbc && { tbc }) };
  }
  return { name: UNKNOWN_PART };
}

/** Plain group names and descriptions, written only from the parts each group contains. */
const LEG = 'A thigh, kneecap, shin, boot and foot pad, moved by a hip motor and a knee motor.';
export const PLAIN_GROUPS = {
  torso: {
    label: 'Body',
    desc: 'The body shell: main body, electronics deck, hump cap, front and back clamps, battery door, tail plug and speaker ring.',
  },
  electronics: {
    label: 'Electronics inside the body',
    desc: 'The battery pack, power switch, fuse, power converters, motor driver board, the Raspberry Pi Zero 2 W and ESP32 boards, a motion sensor, and the speaker with its amplifier.',
  },
  'leg-FL': { label: 'Front-left leg', desc: LEG },
  'leg-FR': { label: 'Front-right leg', desc: LEG },
  'leg-BL': { label: 'Rear-left leg', desc: LEG },
  'leg-BR': { label: 'Rear-right leg', desc: LEG },
  head: {
    label: 'Head and neck',
    desc: 'Head shells, face panel, jaali cap, ears and the neck, with one motor to turn the head left and right and one to nod it. The head holds the camera, a distance sensor, a motion sensor and the microphone.',
  },
  trunk: {
    label: 'Trunk and gripper',
    desc: 'Three trunk links on a base, ending in a two-jaw gripper. One motor moves the trunk and one works the gripper.',
  },
};
