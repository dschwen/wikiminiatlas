function wmaGlobe3d(canvas,textureCanvas) {
  var gl, easing = true;


  function getShader(gl, id) {
    var ss = $('#'+id), str = ss.text(), shader;

    switch(ss.attr('type')) { 
      case "x-shader/x-fragment" : 
        shader = gl.createShader(gl.FRAGMENT_SHADER);
        break;
      case "x-shader/x-vertex" :
        shader = gl.createShader(gl.VERTEX_SHADER);
        break;
      default:
        return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    /*if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }*/

    return shader;
  }


  var shaderProgram;

  function initShaders() {
      var fragmentShader = getShader(gl, "shader-fs");
      var vertexShader = getShader(gl, "shader-vs");

      shaderProgram = gl.createProgram();
      gl.attachShader(shaderProgram, vertexShader);
      gl.attachShader(shaderProgram, fragmentShader);
      gl.linkProgram(shaderProgram);

      if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
          alert("Could not initialise shaders");
      }

      gl.useProgram(shaderProgram);

      shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
      gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

      shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
      gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

      shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
      gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

      shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
      shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
      shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
      shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
      shaderProgram.ambientColorUniform = gl.getUniformLocation(shaderProgram, "uAmbientColor");
      shaderProgram.lightingDirectionUniform = gl.getUniformLocation(shaderProgram, "uLightingDirection");
      shaderProgram.directionalColorUniform = gl.getUniformLocation(shaderProgram, "uDirectionalColor");
  }



  var wmaglobeTexture;
  function updateTexture() {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.bindTexture(gl.TEXTURE_2D, wmaglobeTexture );
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, wmaglobeTexture.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.bindTexture(gl.TEXTURE_2D, null);
  }
  function initTexture() {
    wmaglobeTexture = gl.createTexture();
    wmaglobeTexture.image = textureCanvas;
    updateTexture(wmaglobeTexture);
  }

  var mvMatrix = mat4.create();
  var pMatrix = mat4.create();
  function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);

    var normalMatrix = mat3.create();
    mat4.toInverseMat3(mvMatrix, normalMatrix);
    mat3.transpose(normalMatrix);
    gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, normalMatrix);
  }


  function degToRad(degrees) {
      return degrees * Math.PI / 180;
  }

  var wmaglobeRotationMatrix = mat4.create();
  var tlat=0, tlon=0, lat=0, lon=0;
  function setLatLon(nlat,nlon) {
    tlat=nlat; tlon=nlon;
    if( !easing ) {
      easing = true;
      tick();
    }
  }

  var wmaglobeVertexPositionBuffer;
  var wmaglobeVertexNormalBuffer;
  var wmaglobeVertexTextureCoordBuffer;
  var wmaglobeVertexIndexBuffer;

  function initBuffers() {
    var latitudeBands = 30;
    var longitudeBands = 30;
    var radius = 2;

    var vertexPositionData = [];
    var normalData = [];
    var textureCoordData = [];
    for (var latNumber=0; latNumber <= latitudeBands; latNumber++) {
      var theta = latNumber * Math.PI / latitudeBands;
      var sinTheta = Math.sin(theta);
      var cosTheta = Math.cos(theta);

      for (var longNumber=0; longNumber <= longitudeBands; longNumber++) {
        var phi = longNumber * 2 * Math.PI / longitudeBands;
        var sinPhi = Math.sin(phi);
        var cosPhi = Math.cos(phi);

        var x = cosPhi * sinTheta;
        var y = cosTheta;
        var z = sinPhi * sinTheta;
        var u = 1 - (longNumber / longitudeBands);
        var v = 1 - (latNumber / latitudeBands);

        normalData.push(x);
        normalData.push(y);
        normalData.push(z);
        textureCoordData.push(u);
        textureCoordData.push(v);
        vertexPositionData.push(radius * x);
        vertexPositionData.push(radius * y);
        vertexPositionData.push(radius * z);
      }
    }

    var indexData = [];
    for (var latNumber=0; latNumber < latitudeBands; latNumber++) {
      for (var longNumber=0; longNumber < longitudeBands; longNumber++) {
        var first = (latNumber * (longitudeBands + 1)) + longNumber;
        var second = first + longitudeBands + 1;
        indexData.push(first);
        indexData.push(second);
        indexData.push(first + 1);

        indexData.push(second);
        indexData.push(second + 1);
        indexData.push(first + 1);
      }
    }

    wmaglobeVertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, wmaglobeVertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalData), gl.STATIC_DRAW);
    wmaglobeVertexNormalBuffer.itemSize = 3;
    wmaglobeVertexNormalBuffer.numItems = normalData.length / 3;

    wmaglobeVertexTextureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, wmaglobeVertexTextureCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordData), gl.STATIC_DRAW);
    wmaglobeVertexTextureCoordBuffer.itemSize = 2;
    wmaglobeVertexTextureCoordBuffer.numItems = textureCoordData.length / 2;

    wmaglobeVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, wmaglobeVertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPositionData), gl.STATIC_DRAW);
    wmaglobeVertexPositionBuffer.itemSize = 3;
    wmaglobeVertexPositionBuffer.numItems = vertexPositionData.length / 3;

    wmaglobeVertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, wmaglobeVertexIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexData), gl.STATIC_DRAW);
    wmaglobeVertexIndexBuffer.itemSize = 1;
    wmaglobeVertexIndexBuffer.numItems = indexData.length;
  }


  function drawScene() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.colorMask(1,1,1,0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.colorMask(1,1,1,1);
    // center view on lat,lon
    mat4.identity(wmaglobeRotationMatrix);
    var theta = degToRad(-(lon+90));
    mat4.rotate(wmaglobeRotationMatrix, theta, [0, 1, 0]);
    mat4.rotate(wmaglobeRotationMatrix, degToRad(lat), [Math.cos(theta), 0, Math.sin(theta)]);

    mat4.perspective(3.85, gl.viewportWidth / gl.viewportHeight, 1, 100.0, pMatrix);

    mat4.identity(mvMatrix);
    mat4.translate(mvMatrix, [0, 0, -60]);
    mat4.multiply(mvMatrix, wmaglobeRotationMatrix);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, wmaglobeTexture);
    gl.uniform1i(shaderProgram.samplerUniform, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, wmaglobeVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, wmaglobeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, wmaglobeVertexTextureCoordBuffer);
    gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, wmaglobeVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, wmaglobeVertexNormalBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, wmaglobeVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, wmaglobeVertexIndexBuffer);
    setMatrixUniforms();
    gl.drawElements(gl.TRIANGLES, wmaglobeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
  }


  function tick() {
    // ease to target
    var dlat = tlat-lat, dlon = tlon-lon;
    dlon -= Math.round(dlat/360.0)*360.0;
    lon += 0.1*Math.pow(Math.abs(dlon),0.85)*(dlon<0?-1:1);
    lat += 0.1*Math.pow(Math.abs(dlat),0.85)*(dlat<0?-1:1);
    if( (Math.abs(dlat)+Math.abs(dlon)) > 0.1 ) {
      requestAnimFrame(tick);
    } else {
      easing = false;
    }
    drawScene();
  }


  try {
    gl = canvas.getContext("experimental-webgl");
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
  } catch (e) { }
  if (!gl) {
     //alert("Could not initialise WebGL, sorry :-(");
    return false;
  }
  
  initShaders();
  initBuffers();
  initTexture();

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  var lightingDirection = [ 5, -10, -50 ];
  var adjustedLD = vec3.create();
  vec3.normalize(lightingDirection, adjustedLD);
  vec3.scale(adjustedLD, -1);
  gl.uniform3fv(shaderProgram.lightingDirectionUniform, adjustedLD);
  gl.uniform3f( shaderProgram.directionalColorUniform, 0.3,0.3,0.3 );
  gl.uniform3f( shaderProgram.ambientColorUniform, 0.7, 0.7, 0.7 );

  tick();

  return setLatLon;
}

// export for closure compiler
window['wmaGlobe3d']=wmaGlobe3d;
