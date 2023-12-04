/**
 * This function computes the transformation matrix based on the input projection matrix, translation, and rotations.
 * @param {Array} projectionMatrix - The 4x4 projection matrix in column-major order.
 * @param {number} translationX - Translation along the X axis.
 * @param {number} translationY - Translation along the Y axis.
 * @param {number} translationZ - Translation along the Z axis.
 * @param {number} rotationX - Rotation angle (in radians) around the X axis.
 * @param {number} rotationY - Rotation angle (in radians) around the Y axis.
 * @returns {Array} - The combined 4x4 transformation matrix in column-major order.
 */
function GetModelViewProjection(projectionMatrix, translationX, translationY, translationZ, rotationX, rotationY) {
	// Modify the code below to form the transformation matrix.
	// Rotation matrix around X-axis
	var RotX = [
		1, 0, 0, 0,
		0, Math.cos(rotationX), -Math.sin(rotationX), 0,
		0, Math.sin(rotationX), Math.cos(rotationX), 0,
		0, 0, 0, 1
	];
	// Rotation matrix around Y-axis
	var RotY = [
		Math.cos(rotationY), 0, Math.sin(rotationY), 0,
		0, 1, 0, 0,
		-Math.sin(rotationY), 0, Math.cos(rotationY), 0,
		0, 0, 0, 1
	];
	var trans = [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		translationX, translationY, translationZ, 1
	];
	// Compute the combined transformation matrix
	var combinedTransform = MatrixMult(RotY, RotX);
	combinedTransform = MatrixMult(trans, combinedTransform);
	var mvp = MatrixMult(projectionMatrix, combinedTransform);
	return mvp;
}

class MeshDrawer {
	/**
     * Constructor initializes necessary WebGL resources and shader programs.
     */
	constructor() {
		this.showTextureFlag = false;
		this.texCoords = null;
		this.texture = null;
		this.vertPos = null;
		this.swapYZFlag = false;
		this.numTriangles = 0;
		this.prog = InitShaderProgram(meshVS, meshFS);
		this.mvp = gl.getUniformLocation(this.prog, 'mvp');
	}

    /**
     * Updates the contents of the vertex buffer objects with new mesh data.
     * @param {Array} vertPos - Array of 3D vertex positions.
     * @param {Array} texCoords - Array of 2D texture coordinates.
     */
	setMesh(vertPos, texCoords) {
		// [TO-DO] Update the contents of the vertex buffer objects.
		this.numTriangles = vertPos.length / 3;
		gl.useProgram(this.prog);
		this.texCoords = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoords);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
		this.vertPos = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertPos);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);
	}

    /**
     * Switches the Y and Z axes based on the user's input.
     * @param {boolean} swap - Indicates if the Y-Z axes should be swapped.
     */
	swapYZ(swap) {
		this.swap = swap;
	}

    /**
     * Renders the triangular mesh using the provided transformation matrix.
     * @param {Array} trans - The 4x4 transformation matrix.
     */
	draw(trans) {
		if (!this.vertPos) return;
		gl.useProgram(this.prog);
		gl.uniformMatrix4fv(this.mvp, false, trans);
		gl.uniform1i(gl.getUniformLocation(this.prog, 'swap'), this.swap);

		if (this.showTextureFlag) {
			gl.uniform1i(gl.getUniformLocation(this.prog, 'showTexture'), 1);
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, this.texture);
			gl.uniform1i(gl.getUniformLocation(this.prog, 'uSampler'), 0);
		}
		else 
			gl.uniform1i(gl.getUniformLocation(this.prog, 'showTexture'), 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertPos);
		var position = gl.getAttribLocation(this.prog, "pos");
		gl.enableVertexAttribArray(position);
		gl.vertexAttribPointer(position, 3, gl.FLOAT, false, 0, 0);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoords);
		var texCoord = gl.getAttribLocation(this.prog, "texcoord");
		gl.enableVertexAttribArray(texCoord);
		gl.vertexAttribPointer(texCoord, 2, gl.FLOAT, false, 0, 0);
		gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles);
	}

    /**
     * Sets the texture of the mesh based on the provided image data.
     * @param {Object} img - HTML IMG element containing the texture data.
     */
	setTexture(img) {
		this.showTextureFlag = true;
		// Bind the texture
		gl.useProgram(this.prog);
		this.texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, this.texture);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
	}

    /**
     * Toggles the display of the texture based on the user's input.
     * @param {boolean} show - Indicates if the texture should be displayed.
     */
	showTexture(show) {
		this.showTextureFlag = show;
	}

}

// Vertex shader that transforms the input vertices based on the model-view-projection (MVP) matrix 
// and optionally swaps the Y-Z axes.
var meshVS = `
  attribute vec3 pos;
  attribute vec2 texcoord;
  uniform mat4 mvp;
  uniform bool swap;
  varying vec2 fragTexCoord;
  void main() {
	vec3 newPos;
    if(swap) {
      newPos = vec3(pos.x, pos.z, -pos.y);
    } else {
      newPos = pos;
    }
	gl_Position = mvp * vec4(newPos, 1.0);
    fragTexCoord = vec2(texcoord.x, 1.0 - texcoord.y);
  }
`;

// Fragment shader that either displays the texture of the mesh or a default color.
var meshFS = `
  precision mediump float;
  uniform bool showTexture;
  varying vec2 fragTexCoord;
  uniform sampler2D uSampler;
  void main() {
    if (showTexture) {
      gl_FragColor = texture2D(uSampler, fragTexCoord);
    } else {
      gl_FragColor = vec4(1.0, gl_FragCoord.z * gl_FragCoord.z, 0.0, 1.0);
    }
  }
`;

