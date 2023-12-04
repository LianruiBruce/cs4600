// This function takes the translation and two rotation angles (in radians) as input arguments.
// The two rotations are applied around x and y axes.
// It returns the combined 4x4 transformation matrix as an array in column-major order.
// You can use the MatrixMult function defined in project5.html to multiply two 4x4 matrices in the same format.
function GetModelViewMatrix(translationX, translationY, translationZ, rotationX, rotationY) {
    // Create the translation matrix
    var trans = [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        translationX, translationY, translationZ, 1
    ];

    // Rotation matrix around the X-axis
    var rotationMatrixX = [
        1, 0, 0, 0,
        0, Math.cos(rotationX), Math.sin(rotationX), 0,
        0, -Math.sin(rotationX), Math.cos(rotationX), 0,
        0, 0, 0, 1
    ];

    // Rotation matrix around the Y-axis
    var rotationMatrixY = [
        Math.cos(rotationY), 0, -Math.sin(rotationY), 0,
        0, 1, 0, 0,
        Math.sin(rotationY), 0, Math.cos(rotationY), 0,
        0, 0, 0, 1
    ];

    // Combine the rotation matrices
    // Assuming MatrixMult is a function to multiply two 4x4 matrices.
    var combinedRotationMatrix = MatrixMult(rotationMatrixY, rotationMatrixX);
    // Combine the translation matrix
    mv = MatrixMult(trans, combinedRotationMatrix);
    return mv;
}


// [TO-DO] Complete the implementation of the following class.

class MeshDrawer
{
	// The constructor is a good place for taking care of the necessary initializations.
	constructor()
	{
		// [TO-DO] initializations
		this.numTriangles = 0;
        this.prog = InitShaderProgram(meshVS, meshFS);

        // Updated uniform locations
        this.mvpMatrixUniform = gl.getUniformLocation(this.prog, 'modelViewProjectionMatrix');
        this.modelViewMatrixUniform = gl.getUniformLocation(this.prog, 'modelViewMatrix');
        this.normalMatrixUniform = gl.getUniformLocation(this.prog, 'normalMatrix');

        // Updated attribute locations, assuming you need to retrieve these
        this.vertexPositionAttribute = gl.getAttribLocation(this.prog, 'vertexPosition');
        this.vertexNormalAttribute = gl.getAttribLocation(this.prog, 'vertexNormal');
        this.vertexTexCoordAttribute = gl.getAttribLocation(this.prog, 'vertexTexCoord');

        // These don't correspond directly to the shader code, create the buffer here
        // They will be null until assigned appropriate buffer objects
        this.vertPos = gl.createBuffer();
        this.texCoords = gl.createBuffer();
        this.normal = gl.createBuffer();

        this.texture = null;

        this.showTextureFlag = false;
        this.swapYZFlag = false;

        this.lightDir = gl.getUniformLocation(this.prog, 'lightDirection');
        this.shininess = gl.getUniformLocation(this.prog, 'materialShininess');
	}
	
	// This method is called every time the user opens an OBJ file.
	// The arguments of this function is an array of 3D vertex positions,
	// an array of 2D texture coordinates, and an array of vertex normals.
	// Every item in these arrays is a floating point value, representing one
	// coordinate of the vertex position or texture coordinate.
	// Every three consecutive elements in the vertPos array forms one vertex
	// position and every three consecutive vertex positions form a triangle.
	// Similarly, every two consecutive elements in the texCoords array
	// form the texture coordinate of a vertex and every three consecutive 
	// elements in the normals array form a vertex normal.
	// Note that this method can be called multiple times.
	setMesh( vertPos, texCoords, normals )
	{
		// [TO-DO] Update the contents of the vertex buffer objects.
		this.numTriangles = vertPos.length / 3; // Three vertices per triangle
        gl.useProgram(this.prog);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertPos);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoords);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.normal);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
	}
	
	// This method is called when the user changes the state of the
	// "Swap Y-Z Axes" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	swapYZ( swap )
	{
		// [TO-DO] Set the uniform parameter(s) of the vertex shader
		this.swapYZFlag = swap;
	}
	
	// This method is called to draw the triangular mesh.
	// The arguments are the model-view-projection transformation matrixMVP,
	// the model-view transformation matrixMV, the same matrix returned
	// by the GetModelViewProjection function above, and the normal
	// transformation matrix, which is the inverse-transpose of matrixMV.
	draw( matrixMVP, matrixMV, matrixNormal )
	{
		if (!this.vertPos) return;
        // Bind the shader program
        gl.useProgram(this.prog);
        // Set the uniforms
        gl.uniformMatrix4fv(this.mvpMatrixUniform, false, matrixMVP);
        gl.uniformMatrix4fv(this.modelViewMatrixUniform, false, matrixMV);
        gl.uniformMatrix3fv(this.normalMatrixUniform, false, matrixNormal);

        gl.uniform1i(gl.getUniformLocation(this.prog, 'shouldSwapYZ'), this.swapYZFlag);

        if (this.showTextureFlag) {
            gl.uniform1i(gl.getUniformLocation(this.prog, 'shouldUseTexture'), 1);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.uniform1i(gl.getUniformLocation(this.prog, 'meshTexture'), 0);
        }
        else {
            gl.uniform1i(gl.getUniformLocation(this.prog, 'shouldUseTexture'), 0);
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertPos);
        var position = gl.getAttribLocation(this.prog, "vertexPosition");
        gl.enableVertexAttribArray(position);
        gl.vertexAttribPointer(position, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoords);
        var texCoord = gl.getAttribLocation(this.prog, "vertexTexCoord");
        gl.enableVertexAttribArray(texCoord);
        gl.vertexAttribPointer(texCoord, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.normal);
        var normal = gl.getAttribLocation(this.prog, "vertexNormal");
        gl.enableVertexAttribArray(normal);
        gl.vertexAttribPointer(normal, 3, gl.FLOAT, false, 0, 0);
        // Draw the triangles
        gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles);
	}
	
	// This method is called to set the texture of the mesh.
	// The argument is an HTML IMG element containing the texture data.
	setTexture( img )
	{
        this.showTextureFlag = true;
        gl.useProgram(this.prog);
        this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

        // You can set the texture image data using the following command.
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
	}
	
	// This method is called when the user changes the state of the
	// "Show Texture" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	showTexture( show )
	{
		// [TO-DO] set the uniform parameter(s) of the fragment shader to specify if it should use the texture.
		this.showTextureFlag = show;
	}
	
	// This method is called to set the incoming light direction
	setLightDir( x, y, z )
	{
		// [TO-DO] set the uniform parameter(s) of the fragment shader to specify the light direction.
		gl.useProgram(this.prog);
        gl.uniform3fv(this.lightDir, [x, y, z]);
	}
	
	// This method is called to set the shininess of the material
	setShininess( shininess )
	{
		// [TO-DO] set the uniform parameter(s) of the fragment shader to specify the shininess.
		gl.useProgram(this.prog);
        gl.uniform1f(this.shininess, shininess);
	}
}


// This function is called for every step of the simulation.
// Its job is to advance the simulation for the given time step duration dt.
// It updates the given positions and velocities.
// function SimTimeStep( dt, positions, velocities, springs, stiffness, damping, particleMass, gravity, restitution )
function SimTimeStep(dt, positions, velocities, springs, stiffness, damping, particleMass, gravity, restitution) {
    var forces = new Array(positions.length);

    // Initialize forces to gravity
    for (var i = 0; i < positions.length; i++) {
        forces[i] = gravity.mul(particleMass);
    }
    // Compute spring and damping forces
    springs.forEach(spring => {
        var firstPos = positions[spring.p0];
        var secondPos = positions[spring.p1];
        var vel1 = velocities[spring.p0];
        var vel2 = velocities[spring.p1];

        var springVector = secondPos.sub(firstPos);
        var currentLength = springVector.len();
		// now normalized the vector
        var direction = springVector.div(currentLength);
        var restLength = spring.rest;
		// calculate the physical force
        var springForce = direction.mul(stiffness * (currentLength - restLength));
        var dampingForce = direction.mul(damping * vel2.sub(vel1).dot(direction));

        forces[spring.p0].inc(springForce.add(dampingForce));
        forces[spring.p1].dec(springForce.add(dampingForce));
    });

    // Update positions and velocities
    for (var i = 0; i < positions.length; i++) {
        var acceleration = forces[i].div(particleMass);
        velocities[i].inc(acceleration.mul(dt));
        positions[i].inc(velocities[i].mul(dt));
    }

    // Handle collisions
    positions.forEach((position, index) => {
        ['x', 'y', 'z'].forEach(axis => {
			// check the boundary of the space
            if (position[axis] < -1.0 || position[axis] > 1.0) {
                position[axis] = Math.sign(position[axis]) * (1 - restitution * Math.abs(position[axis] - Math.sign(position[axis])));
                // now we set the speed to negative to show the collisions. 
				velocities[index][axis] *= -restitution;
            }
        });
    });
}


// meshVS is the vertex shader's source code in GLSL (OpenGL Shading Language).
// It takes in vertex positions, texture coordinates, and normals as attributes.
// Uniforms for model-view-projection matrix, model-view matrix, and normal matrix are declared for vertex transformation.
// The shader also handles an optional Y-Z axis swap for coordinate system adjustments.
// The transformed vertex position and texture coordinates are passed to the fragment shader for further processing.
var meshVS = `
attribute vec3 vertexPosition;
attribute vec2 vertexTexCoord;
attribute vec3 vertexNormal;

uniform mat4 modelViewProjectionMatrix;
uniform mat4 modelViewMatrix;
uniform mat3 normalMatrix;
uniform bool shouldSwapYZ;

varying vec2 textureCoord;
varying vec3 transformedNormal;
varying vec3 viewPosition;

void main() {
    vec3 adjustedPosition = shouldSwapYZ ? vec3(vertexPosition.x, vertexPosition.z, -vertexPosition.y) : vertexPosition;
    gl_Position = modelViewProjectionMatrix * vec4(adjustedPosition, 1.0);
    textureCoord = vec2(vertexTexCoord.x, 1.0 - vertexTexCoord.y);
    transformedNormal = normalMatrix * vertexNormal;
    viewPosition = vec3(modelViewMatrix * vec4(vertexPosition, 1.0));
}
`;

// meshFS is the fragment shader's source code in GLSL.
// It uses the interpolated data from the vertex shader (texture coordinates, normals, view positions).
// The shader has a uniform for toggling texture use and a sampler2D uniform for the actual texture.
// Lighting calculations are performed using the transformed normals and a light direction uniform.
// Material shininess is also factored into the lighting calculation for specular highlights.
// The final color is computed by combining ambient, diffuse, and specular lighting contributions.
// The final color is assigned to gl_FragColor to determine the color of each pixel on the rendered mesh.
var meshFS = `
precision mediump float;

uniform bool shouldUseTexture;
uniform sampler2D meshTexture;
uniform vec3 lightDirection;
uniform float materialShininess;

varying vec2 textureCoord;
varying vec3 transformedNormal;
varying vec3 viewPosition;

void main() {
    vec4 textureColor;
    vec4 diffuseColor;
    vec4 ambientColor;
    vec4 specularColor = vec4(1.0, 1.0, 1.0, 1.0);

    if (shouldUseTexture) {
        textureColor = texture2D(meshTexture, textureCoord);
        ambientColor = textureColor;
        diffuseColor = textureColor;
    } else {
        textureColor = vec4(1.0, 1.0, 1.0, 1.0);
        ambientColor = textureColor;
        diffuseColor = textureColor;
    }

    vec4 ambientLight = 0.2 * ambientColor;
    vec3 normalizedNormal = normalize(transformedNormal);
    float cosTheta = max(dot(normalizedNormal, lightDirection), 0.0);
    vec4 diffuseLight = 1.0 * cosTheta * diffuseColor;

    vec3 viewDir = normalize(-viewPosition);
    vec3 halfVector = normalize(lightDirection + viewDir);
    float specAngle = max(dot(normalizedNormal, halfVector), 0.0);
    vec4 specularLight = 1.0 * pow(specAngle, materialShininess) * specularColor;

    vec4 finalColor = ambientLight + diffuseLight + specularLight;
    gl_FragColor = finalColor;
}
`;
