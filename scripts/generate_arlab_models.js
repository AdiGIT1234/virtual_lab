const fs = require("fs");
const path = require("path");

function createBoxGeometry(width, height, depth) {
  const hx = width / 2;
  const hy = height / 2;
  const hz = depth / 2;

  const positions = [
    // +X
    hx, -hy, -hz,
    hx, hy, -hz,
    hx, hy, hz,
    hx, -hy, hz,
    // -X
    -hx, -hy, hz,
    -hx, hy, hz,
    -hx, hy, -hz,
    -hx, -hy, -hz,
    // +Y
    -hx, hy, -hz,
    hx, hy, -hz,
    hx, hy, hz,
    -hx, hy, hz,
    // -Y
    -hx, -hy, hz,
    hx, -hy, hz,
    hx, -hy, -hz,
    -hx, -hy, -hz,
    // +Z
    -hx, -hy, hz,
    -hx, hy, hz,
    hx, hy, hz,
    hx, -hy, hz,
    // -Z
    hx, -hy, -hz,
    hx, hy, -hz,
    -hx, hy, -hz,
    -hx, -hy, -hz,
  ];

  const normals = [
    // +X
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    // -X
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,
    // +Y
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    // -Y
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,
    // +Z
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    // -Z
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,
  ];

  const indices = [];
  for (let face = 0; face < 6; face += 1) {
    const offset = face * 4;
    indices.push(offset, offset + 1, offset + 2, offset, offset + 2, offset + 3);
  }

  return { positions, normals, indices };
}

function computeMinMax(array, stride) {
  const min = new Array(stride).fill(Infinity);
  const max = new Array(stride).fill(-Infinity);
  const count = array.length / stride;
  for (let i = 0; i < count; i += 1) {
    for (let j = 0; j < stride; j += 1) {
      const value = array[i * stride + j];
      if (value < min[j]) min[j] = value;
      if (value > max[j]) max[j] = value;
    }
  }
  return { min, max };
}

function buildGLTF({ positions, normals, indices }, color, name) {
  const positionArray = new Float32Array(positions);
  const normalArray = new Float32Array(normals);
  const indexArray = new Uint16Array(indices);

  const positionBuffer = Buffer.from(positionArray.buffer);
  const normalBuffer = Buffer.from(normalArray.buffer);
  const indexBuffer = Buffer.from(indexArray.buffer);

  const combined = Buffer.concat([positionBuffer, normalBuffer, indexBuffer]);

  const bufferViews = [
    { buffer: 0, byteOffset: 0, byteLength: positionBuffer.length, target: 34962 },
    { buffer: 0, byteOffset: positionBuffer.length, byteLength: normalBuffer.length, target: 34962 },
    { buffer: 0, byteOffset: positionBuffer.length + normalBuffer.length, byteLength: indexBuffer.length, target: 34963 },
  ];

  const positionStats = computeMinMax(positions, 3);

  const accessors = [
    { bufferView: 0, componentType: 5126, count: positions.length / 3, type: "VEC3", min: positionStats.min, max: positionStats.max },
    { bufferView: 1, componentType: 5126, count: normals.length / 3, type: "VEC3" },
    { bufferView: 2, componentType: 5123, count: indices.length, type: "SCALAR", min: [0], max: [Math.max(...indices)] },
  ];

  const gltf = {
    asset: { version: "2.0", generator: "ar-lab-model-script" },
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0, name }],
    meshes: [
      {
        name,
        primitives: [
          {
            attributes: { POSITION: 0, NORMAL: 1 },
            indices: 2,
            material: 0,
          },
        ],
      },
    ],
    materials: [
      {
        name: `${name}Material`,
        pbrMetallicRoughness: {
          baseColorFactor: [color[0], color[1], color[2], 1],
          metallicFactor: color[3] ?? 0.1,
          roughnessFactor: color[4] ?? 0.7,
        },
      },
    ],
    buffers: [
      {
        byteLength: combined.length,
        uri: `data:application/octet-stream;base64,${combined.toString("base64")}`,
      },
    ],
    bufferViews,
    accessors,
  };

  return gltf;
}

function writeGLTF(filePath, gltf) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(gltf, null, 2));
  console.log(`Wrote ${filePath}`);
}

function main() {
  const boardGeometry = createBoxGeometry(1.5, 0.08, 0.9);
  const boardColor = [0.04, 0.23, 0.32, 0.1, 0.6];
  const boardGLTF = buildGLTF(boardGeometry, boardColor, "ArduinoUnoBoard");
  writeGLTF(path.join(__dirname, "../frontend/src/assets/models/arduino_uno.gltf"), boardGLTF);

  const breadboardGeometry = createBoxGeometry(0.85, 0.06, 1.6);
  const breadboardColor = [0.95, 0.97, 1.0, 0.05, 0.9];
  const breadboardGLTF = buildGLTF(breadboardGeometry, breadboardColor, "BreadboardBase");
  writeGLTF(path.join(__dirname, "../frontend/src/assets/models/breadboard_half.gltf"), breadboardGLTF);
}

main();
