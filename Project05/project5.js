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

// The MeshDrawer class encapsulates functionality for drawing 3D meshes using WebGL.
// It initializes shader programs and maintains references to various attributes and uniform locations.
// MeshDrawer can manage the mesh's vertices, normals, texture coordinates, and texture image.
// Methods such as setMesh and draw are provided to set the mesh data and render it, respectively.
// Additional methods like swapYZ, setTexture, showTexture, setLightDir, and setShininess allow customization of the rendering.
// The class interacts with the GL context to set buffer data and apply transformations according to the provided matrices.
// It assumes the existence of certain uniform and attribute names in the shaders, which should be declared in the provided shader code.
// Uniforms for matrix transformations, texture application, and lighting parameters are updated before drawing.
class MeshDrawer {

    constructor() {
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

    setMesh(vertPos, texCoords, normals) {
        this.numTriangles = vertPos.length / 9; // Three vertices per triangle
        gl.useProgram(this.prog);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertPos);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoords);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.normal);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
    }

    swapYZ(swap) {
        this.swapYZFlag = swap;
    }

    draw(matrixMVP, matrixMV, matrixNormal) {
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
        gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles * 3);
    }

    setTexture(img) {
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

    showTexture(show) {
        this.showTextureFlag = show;
    }

    setLightDir(x, y, z) {
        gl.useProgram(this.prog);
        gl.uniform3fv(this.lightDir, [x, y, z]);
    }

    setShininess(shininess) {
        gl.useProgram(this.prog);
        gl.uniform1f(this.shininess, shininess);
    }
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
