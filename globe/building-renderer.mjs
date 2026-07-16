const VERTEX_SHADER = `
  attribute vec3 a_position;
  attribute vec3 a_normal;
  uniform mat4 u_viewProjection;
  varying float v_light;

  void main() {
    vec3 lightDirection = normalize(vec3(0.8, 0.55, 1.0));
    v_light = 0.62 + 0.38 * max(dot(normalize(a_normal), lightDirection), 0.0);
    gl_Position = u_viewProjection * vec4(a_position, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision mediump float;
  varying float v_light;

  void main() {
    vec3 color = vec3(0.78, 0.74, 0.70) * v_light;
    gl_FragColor = vec4(color, 0.82);
  }
`;

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || 'Building shader compilation failed';
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

function createProgram(gl) {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  const program = gl.createProgram();
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) || 'Building program link failed';
    gl.deleteProgram(program);
    throw new Error(message);
  }
  return program;
}

export class BuildingRenderer {
  constructor(gl) {
    this.gl = gl;
    this.program = createProgram(gl);
    this.locations = {
      position: gl.getAttribLocation(this.program, 'a_position'),
      normal: gl.getAttribLocation(this.program, 'a_normal'),
      viewProjection: gl.getUniformLocation(this.program, 'u_viewProjection')
    };
  }

  upload(mesh) {
    if (!mesh || mesh.vertexCount === 0) return null;
    const gl = this.gl;
    const positionBuffer = gl.createBuffer();
    const normalBuffer = gl.createBuffer();
    try {
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, mesh.positions, gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, mesh.normals, gl.STATIC_DRAW);
      return {
        positionBuffer,
        normalBuffer,
        vertexCount: mesh.vertexCount,
        buildingCount: mesh.buildingCount,
        bytes: mesh.positions.byteLength + mesh.normals.byteLength
      };
    } catch (error) {
      gl.deleteBuffer(positionBuffer);
      gl.deleteBuffer(normalBuffer);
      throw error;
    }
  }

  delete(resource) {
    if (!resource) return;
    this.gl.deleteBuffer(resource.positionBuffer);
    this.gl.deleteBuffer(resource.normalBuffer);
  }

  draw(resources, viewProjection) {
    if (resources.length === 0) return;
    const gl = this.gl;
    gl.useProgram(this.program);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.uniformMatrix4fv(this.locations.viewProjection, false, viewProjection);
    gl.enableVertexAttribArray(this.locations.position);
    gl.enableVertexAttribArray(this.locations.normal);
    for (const resource of resources) {
      gl.bindBuffer(gl.ARRAY_BUFFER, resource.positionBuffer);
      gl.vertexAttribPointer(this.locations.position, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, resource.normalBuffer);
      gl.vertexAttribPointer(this.locations.normal, 3, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, resource.vertexCount);
    }
    // Attribute enable state is global in WebGL 1, not program-local. Leaving
    // these arrays enabled makes later globe draws invalid after their tile-
    // owned building buffers are evicted.
    gl.disableVertexAttribArray(this.locations.position);
    if (this.locations.normal !== this.locations.position) {
      gl.disableVertexAttribArray(this.locations.normal);
    }
    gl.disable(gl.BLEND);
  }

  destroy() {
    this.gl.deleteProgram(this.program);
  }
}
