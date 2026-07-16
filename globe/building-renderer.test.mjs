import test from 'node:test';
import assert from 'node:assert/strict';

import { BuildingRenderer } from './building-renderer.mjs';

function fakeGl() {
  const calls = [];
  return {
    calls,
    VERTEX_SHADER: 1,
    FRAGMENT_SHADER: 2,
    COMPILE_STATUS: 3,
    LINK_STATUS: 4,
    ARRAY_BUFFER: 5,
    STATIC_DRAW: 6,
    FLOAT: 7,
    TRIANGLES: 8,
    BLEND: 9,
    SRC_ALPHA: 10,
    ONE_MINUS_SRC_ALPHA: 11,
    createShader: () => ({}),
    shaderSource() {},
    compileShader() {},
    getShaderParameter: () => true,
    getShaderInfoLog: () => '',
    deleteShader() {},
    createProgram: () => ({}),
    attachShader() {},
    linkProgram() {},
    getProgramParameter: () => true,
    getProgramInfoLog: () => '',
    deleteProgram() {},
    getAttribLocation: (program, name) => name === 'a_position' ? 0 : 1,
    getUniformLocation: () => ({}),
    useProgram() {},
    uniformMatrix4fv() {},
    uniform3fv: (...values) => calls.push(['uniform3fv', ...values]),
    enable: (value) => calls.push(['enable', value]),
    disable: (value) => calls.push(['disable', value]),
    disableVertexAttribArray: (value) => calls.push(['disableAttribute', value]),
    blendFunc: (...values) => calls.push(['blendFunc', ...values]),
    enableVertexAttribArray() {},
    bindBuffer() {},
    vertexAttribPointer() {},
    drawArrays() {}
  };
}

test('draws buildings with conventional alpha blending', () => {
  const gl = fakeGl();
  const renderer = new BuildingRenderer(gl);
  const lightDirection = [1, 0, 0];
  renderer.draw([{
    positionBuffer: {}, normalBuffer: {}, vertexCount: 3
  }], new Float32Array(16), lightDirection);

  assert.ok(gl.calls.some((call) => call[0] === 'enable' && call[1] === gl.BLEND));
  assert.ok(gl.calls.some((call) =>
    call[0] === 'blendFunc' &&
    call[1] === gl.SRC_ALPHA && call[2] === gl.ONE_MINUS_SRC_ALPHA
  ));
  assert.ok(gl.calls.some((call) => call[0] === 'disable' && call[1] === gl.BLEND));
  assert.ok(gl.calls.some((call) =>
    call[0] === 'uniform3fv' && call[2] === lightDirection
  ));
  assert.equal(
    gl.calls.filter((call) => call[0] === 'disableAttribute').length,
    2
  );
});
