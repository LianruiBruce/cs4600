/**
 * Author: Lianrui Geng
 * CS 4600 Project 2: finish the composite method for the image.
 * Date: 09/10/2023
 */

/**
 * Generates a 3x3 transformation matrix based on given position, rotation, and scale values.
 * The matrix returned represents the transformations in the following order: scaling, rotation, and then translation.
 * 
 * @param {number} positionX - X-coordinate for translation.
 * @param {number} positionY - Y-coordinate for translation.
 * @param {number} rotation - Rotation angle in degrees.
 * @param {number} scale - Scaling factor.
 * @returns {number[]} - A 3x3 transformation matrix in column-major order.
 */
function GetTransform(positionX, positionY, rotation, scale) {
	// Convert the rotation from degrees to radians.
	var rad = rotation * (Math.PI / 180);
	// Return the transformation matrix.
	return [scale * Math.cos(rad), scale * Math.sin(rad), 0
		, -scale * Math.sin(rad), scale * Math.cos(rad), 0,
		positionX, positionY, 1];
}

/**
 * Combines two 3x3 transformation matrices into a single transformation matrix.
 * The resulting matrix first applies the transformation from trans1 and then from trans2.
 * 
 * @param {number[]} trans1 - The first transformation matrix in column-major order.
 * @param {number[]} trans2 - The second transformation matrix in column-major order.
 * @returns {number[]} - A combined 3x3 transformation matrix in column-major order.
 */
function ApplyTransform(trans1, trans2) {
	var result = [];
	for (var i = 0; i < 3; i++) {
		for (var j = 0; j < 3; j++) {
			var value = 0;
			// Multiply and sum the appropriate components of the matrices.
			for (var k = 0; k < 3; k++) {
				// remind that trans2 times trans1.
				value += trans2[i + k * 3] * trans1[k + j * 3];
			}
			result[i + j * 3] = value;
		}
	}
	// Return the combined transformation matrix.
	return result;
}
