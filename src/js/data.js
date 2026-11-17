// All catalogue content is static demo data. Swap this module for an API client later.

export const CURRENCY = "INR";
export const formatPrice = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: CURRENCY,
    maximumFractionDigits: 0,
  }).format(n);

// GAJJU bill of materials, taken from the component names in the GAJJU CAD assembly.
// `id` matches the `kind` of the CAD parts in gajju-model.js so the 3D view can highlight them.
export const KIT_COMPONENTS = [
  {
    id: "shell",
    name: "Torso shell",
    qty: 8,
    icon: "chassis",
    desc: "Torso body, electronics deck, hump cap, front and back clamps, battery door, tail plug and speaker ring.",
    spec: "8 printed parts",
  },
  {
    id: "legs",
    name: "Leg sets",
    qty: 4,
    icon: "leg",
    desc: "Each leg is a thigh, kneecap, shin, boot and rubber foot pad, driven at the hip and the knee.",
    spec: "20 printed parts",
  },
  {
    id: "head",
    name: "Head and neck",
    qty: 14,
    icon: "head",
    desc: "Left and right head shells, face panel, jaali cap, ears, IMU shelf, eye adapter and the pan-tilt neck stack.",
    spec: "14 printed parts",
  },
  {
    id: "trunk",
    name: "Trunk and gripper",
    qty: 13,
    icon: "gripper",
    desc: "Three trunk links on a root spool with sleeve rings, ending in a geared two-jaw gripper.",
    spec: "13 printed parts",
  },
  {
    id: "servo-l",
    name: "MG946R servos",
    qty: 9,
    icon: "servo",
    desc: "Metal-gear servos for the four hips, four knees and the head tilt.",
    spec: "Hip ×4 · knee ×4 · tilt",
  },
  {
    id: "servo-s",
    name: "MG90S micro servos",
    qty: 3,
    icon: "servo",
    desc: "Micro servos for head pan, the trunk and the gripper jaws.",
    spec: "Pan · trunk · gripper",
  },
  {
    id: "compute",
    name: "Compute boards",
    qty: 2,
    icon: "mcu",
    desc: "A Raspberry Pi Zero 2 W for high-level control and an ESP32 DevKit for real-time servo work.",
    spec: "Pi Zero 2 W + ESP32",
  },
  {
    id: "camera",
    name: "ESP32-CAM vision module",
    qty: 1,
    icon: "camera",
    desc: "ESP32-CAM board with an OV2640 camera, mounted behind the eye adapter.",
    spec: "OV2640",
  },
  {
    id: "sensors",
    name: "Sensor pack",
    qty: 4,
    icon: "sensor",
    desc: "VL53 time-of-flight depth sensor, MPU6050 IMUs in the head and torso, and an INMP441 microphone.",
    spec: "4 modules",
  },
  {
    id: "driver",
    name: "Servo driver",
    qty: 1,
    icon: "driver",
    desc: "PCA9685 board that drives all twelve servos over I²C.",
    spec: "PCA9685 · 16 ch",
  },
  {
    id: "power",
    name: "Power system",
    qty: 7,
    icon: "battery",
    desc: "2S1P 18650 pack, XL4016 servo converter, 5 V 3 A UBEC, 10 A fuse, main switch, DC charging socket and a Wago 221 bus.",
    spec: "2S Li-ion",
  },
  {
    id: "audio",
    name: "Audio",
    qty: 2,
    icon: "speaker",
    desc: "MAX98357A I²S amplifier and a 40 mm speaker behind the speaker ring.",
    spec: "I²S · 40 mm",
  },
  {
    id: "hardware",
    name: "Screws, nuts and bearing",
    qty: 15,
    icon: "screws",
    desc: "M3×20 servo-ear screws, M2.5×6 battery-door screws, M10 weight-pod nuts and a 608 pan bearing.",
    spec: "15 pcs",
  },
];

export const PRODUCTS = [
  {
    id: "GAJJU",
    sku: "GJ-GAJJU",
    name: "GAJJU Fully Assembled",
    subtitle: "Advanced quadruped robotics platform, ready to run",
    short: "GAJJU",
    category: "assembled",
    categoryLabel: "Fully assembled robot",
    price: 20000,
    compareAt: null,
    rating: 4.8,
    reviewCount: 126,
    tagline:
      "GAJJU built, wired and calibrated for you. Charge it, switch it on and it’s ready.",
    description:
      "The four-legged GAJJU robot, fully built and calibrated: servo-driven legs, a pan-and-tilt head with camera and depth sensing, and a trunk that grips.",
    long: "Your GAJJU arrives fully assembled from the same 104 parts as the kit, with every servo centred and calibrated. Twelve servos drive the hips, knees, head, trunk and gripper, a Raspberry Pi Zero 2 W and an ESP32 share the work, and an ESP32-CAM, depth sensor, two IMUs and a microphone let it see, balance and listen.",
    features: [
      "Fully assembled and calibrated",
      "Quadruped with 12 servo joints",
      "Trunk with servo gripper",
      "Camera, depth and IMU sensing",
      "Raspberry Pi Zero 2 W + ESP32",
      "Rechargeable 18650 power",
    ],
    specs: [
      ["Dimensions", "327 × 193 × 217 mm (L × W × H)"],
      ["Assembly", "Done for you"],
      ["Servos", "9 × MG946R, 3 × MG90S"],
      ["Compute", "Raspberry Pi Zero 2 W + ESP32 DevKit"],
      ["Vision", "ESP32-CAM with OV2640 camera"],
      ["Sensors", "VL53 depth, 2 × MPU6050 IMU, INMP441 mic"],
      ["Power", "2S1P 18650 Li-ion, XL4016 converter, 5 V 3 A UBEC"],
    ],
    included: [
      "GAJJU robot, fully assembled",
      "2S 18650 battery pack (fitted)",
      "DC charger",
      "Quick start guide",
    ],
    technical: [
      ["Legs", "Hip and knee joint on each leg, MG946R servos"],
      ["Head", "Pan (MG90S) on a 608 bearing, tilt (MG946R)"],
      ["Trunk", "Three links on a root spool, MG90S-driven gripper"],
      ["Servo control", "PCA9685, 16 channels over I²C"],
      ["Power safety", "10 A fuse, main switch, DC charging socket"],
    ],
    difficulty: null,
    buildTime: null,
    accent: "#3de8ff",
    views: ["assembled", "side", "exploded", "detail"],
  },
  {
    id: "GAJJU-kit",
    sku: "GJ-GAJJU-KIT",
    name: "GAJJU DIY Parts Kit",
    subtitle: "Build your own GAJJU from 104 parts",
    short: "GAJJU Kit",
    category: "diy",
    categoryLabel: "DIY parts kit",
    price: 15000,
    compareAt: null,
    rating: 4.9,
    reviewCount: 538,
    tagline:
      "Every part to build GAJJU yourself: 104 pieces, 12 servos, all the electronics.",
    description:
      "The complete GAJJU parts pack: printed shells, 12 servos, boards, sensors, battery and hardware, ready for you to build the four-legged robot yourself.",
    long: "GAJJU is built from 104 parts. Twelve servos drive the hips, knees, head, trunk and gripper through a PCA9685 driver, while a Raspberry Pi Zero 2 W and an ESP32 share the work. An ESP32-CAM, a VL53 depth sensor, two IMUs and a microphone let it see, balance and listen, and a 2S 18650 pack powers it all.",
    features: [
      "Quadruped with 12 servo joints",
      "Trunk with servo gripper",
      "Camera, depth and IMU sensing",
      "Raspberry Pi Zero 2 W + ESP32",
      "Speaker and microphone",
      "Rechargeable 18650 power",
    ],
    specs: [
      ["Dimensions", "327 × 193 × 217 mm (L × W × H)"],
      ["Parts", "104 (from the CAD assembly)"],
      ["Servos", "9 × MG946R, 3 × MG90S"],
      ["Compute", "Raspberry Pi Zero 2 W + ESP32 DevKit"],
      ["Vision", "ESP32-CAM with OV2640 camera"],
      ["Sensors", "VL53 depth, 2 × MPU6050 IMU, INMP441 mic"],
      ["Power", "2S1P 18650 Li-ion, XL4016 converter, 5 V 3 A UBEC"],
    ],
    included: KIT_COMPONENTS.map(
      (c) => `${c.qty > 1 ? c.qty + " × " : ""}${c.name}`,
    ),
    technical: [
      ["Legs", "Hip and knee joint on each leg, MG946R servos"],
      ["Head", "Pan (MG90S) on a 608 bearing, tilt (MG946R)"],
      ["Trunk", "Three links on a root spool, MG90S-driven gripper"],
      ["Servo control", "PCA9685, 16 channels over I²C"],
      ["Power safety", "10 A fuse, main switch, DC charging socket"],
    ],
    difficulty: 4,
    difficultyLabel: "Advanced",
    buildTime: null,
    accent: "#2f6bff",
    views: ["assembled", "side", "exploded", "detail"],
  },
];

const ALIASES = { "rbk-2": "GAJJU-kit", "aru-1": "GAJJU" }; // links to retired products
export const getProduct = (id) =>
  PRODUCTS.find((p) => p.id === (ALIASES[id] || id));

export const REVIEWS = {
  GAJJU: [
    {
      name: "Priya S.",
      rating: 5,
      date: "Nov 2026",
      title: "Walked out of the box",
      body: "Charged it overnight, flipped the switch and it stood up and looked around. The trunk gripper is the part everyone wants to try.",
    },
    {
      name: "Karthik V.",
      rating: 5,
      date: "Oct 2026",
      title: "Great for our robotics club",
      body: "We wanted to start programming straight away rather than spend weeks building. Every servo was already calibrated.",
    },
    {
      name: "Meera J.",
      rating: 4,
      date: "Sep 2026",
      title: "Solid build, keep it charged",
      body: "Well put together and the camera stream works nicely. Twelve servos do use the battery, so charge between sessions.",
    },
  ],
  "GAJJU-kit": [
    {
      name: "Daniel R.",
      rating: 5,
      date: "Nov 2026",
      title: "Built it with my 13-year-old",
      body: "Took us two weekends. The parts are grouped by step, and seeing the exploded CAD view first made every stage make sense. It now waves its trunk at the cat.",
    },
    {
      name: "Aisha M.",
      rating: 5,
      date: "Oct 2026",
      title: "Best kit I’ve used for teaching",
      body: "Twelve servos, two IMUs and a camera give my class real problems to solve: gait, balance and vision all on one robot.",
    },
    {
      name: "Tom B.",
      rating: 4,
      date: "Sep 2026",
      title: "Great value, plan your cable routing",
      body: "Everything works and the Pi plus ESP32 split is sensible. Take your time routing the servo leads before closing the torso.",
    },
  ],
};

export const ASSEMBLY_STEPS = [
  {
    title: "Explore the components",
    text: "Lay out all 104 parts. Printed shells, servos, boards and hardware are grouped by the step they belong to.",
    parts: ["104 CAD parts", "13 component groups"],
    time: "15 min",
  },
  {
    title: "Build the torso",
    text: "Fit the deck into the torso body, add the front and back clamps and the hump cap, then close the battery door with its four M2.5 screws.",
    parts: ["Torso body", "Deck", "Clamps", "Hump cap", "Battery door"],
    time: "30 min",
  },
  {
    title: "Install the electronics",
    text: "Mount the 18650 pack, XL4016 converter, UBEC, PCA9685, Raspberry Pi Zero 2 W and ESP32, then wire the fuse, switch and Wago bus.",
    parts: ["Battery pack", "PCA9685", "Pi Zero 2 W", "ESP32", "Power parts"],
    time: "60 min",
  },
  {
    title: "Attach the legs",
    text: "Seat a hip servo at each corner, then build each leg from thigh, knee servo, kneecap, shin, boot and foot pad.",
    parts: ["8 × MG946R", "4 × leg sets", "8 × M3×20 screws"],
    time: "60 min",
  },
  {
    title: "Mount the head",
    text: "Stack the neck on the 608 pan bearing, add the pan and tilt servos, then close the head shells around the ESP32-CAM, depth sensor, IMU and microphone.",
    parts: ["Neck stack", "Head shells", "ESP32-CAM", "Sensors"],
    time: "40 min",
  },
  {
    title: "Fit the trunk and gripper",
    text: "Thread the three trunk links onto the root spool, connect the trunk servo, then assemble the gripper jaws and gear train.",
    parts: ["3 × trunk links", "Gripper", "2 × MG90S"],
    time: "40 min",
  },
  {
    title: "Power on and test",
    text: "Charge through the DC socket, flip the main switch and run the servo self-test to centre all twelve joints.",
    parts: ["DC charger", "Self-test firmware"],
    time: "15 min",
  },
];

export const LESSONS = [
  {
    id: "start",
    title: "Getting started with robotics",
    level: "Beginner",
    mins: 12,
    icon: "rocket",
    summary:
      "What makes a machine a robot: sensing, deciding and acting, and how the three loop together.",
    points: [
      "The sense–think–act loop",
      "Choosing your first platform",
      "Safety basics for the workbench",
    ],
  },
  {
    id: "sensors",
    title: "Understanding sensors",
    level: "Beginner",
    mins: 18,
    icon: "radar",
    summary:
      "How ultrasonic, infrared and inertial sensors turn the physical world into numbers.",
    points: [
      "Time-of-flight ranging",
      "Reading IR reflectance",
      "Filtering noisy IMU data",
    ],
  },
  {
    id: "motors",
    title: "Motor control",
    level: "Intermediate",
    mins: 22,
    icon: "gauge",
    summary:
      "Drive DC motors with PWM and keep them on speed with encoder feedback and PID.",
    points: [
      "PWM and duty cycle",
      "H-bridge direction control",
      "Tuning a PID loop",
    ],
  },
  {
    id: "mcu",
    title: "Microcontrollers",
    level: "Intermediate",
    mins: 20,
    icon: "cpu",
    summary:
      "GPIO, interrupts and timers on the ESP32, explained with code you can run today.",
    points: [
      "Digital and analog pins",
      "Interrupts vs polling",
      "Flashing firmware over USB",
    ],
  },
  {
    id: "assembly",
    title: "DIY robot assembly",
    level: "Intermediate",
    mins: 35,
    icon: "wrench",
    summary:
      "A guided build of GAJJU with the mistakes we see most often and how to avoid them.",
    points: [
      "Torque and thread care",
      "Clean cable routing",
      "First power-on checks",
    ],
  },
  {
    id: "projects",
    title: "Robotics projects",
    level: "Advanced",
    mins: 45,
    icon: "flask-conical",
    summary:
      "Five projects that build on each other, from a first walking gait to a robot that streams what it sees.",
    points: [
      "First steps: a walking gait",
      "Trunk and gripper control",
      "Camera streaming with telemetry",
    ],
  },
];
