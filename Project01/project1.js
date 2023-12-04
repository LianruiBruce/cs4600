/**
 * Author: Lianrui Geng
 * CS 4600 Project 1: finish the composite method for the image.
 * Date: 09/03/2023
 */

/**
 * This function performs alpha compositing of a foreground image onto a 
 * background image with a specified opacity, combining their pixel values
 *  while considering the position of the foreground image.
 * @param {the background image to be modified.} bgImg 
 * @param {the foreground image.} fgImg 
 * @param {the opacity of the foreground image.} fgOpac 
 * @param {fgPos is the position of the foreground image in pixels.
 *          It can be negative and (0,0) means the top-left pixels of the foreground 
 *          and background are aligned.} fgPos
 */
function composite(bgImg, fgImg, fgOpac, fgPos) {
    for (var x = 0; x < fgImg.width; x++) {
        for (var y = 0; y < fgImg.height; y++) {
            // find the actual position of the bg
            const bgX = x + fgPos.x;
            const bgY = y + fgPos.y;
            // find the pixel position(index) in the data array
            const bgIdx = (bgY * bgImg.width + bgX) * 4;
            const fgIdx = (y * fgImg.width + x) * 4;
            // store the original Alpha data of the fg and bg
            const fgAlpha = fgImg.data[fgIdx + 3] / 255;
            const bgAlpha = bgImg.data[bgIdx + 3] / 255;
            // check the boundary
            if (bgX < 0 || bgX >= bgImg.width || bgY < 0 || bgY >= bgImg.height)
                continue;
            // check if the image is transparent
            else if (fgAlpha === 0)
                continue;
            // Compute the new alpha channel after compositing
            const newAlpha = fgAlpha * fgOpac + bgAlpha * (1 - fgAlpha * fgOpac);
            // change color in every channel
            for (let channel = 0; channel < 3; channel++) {
                const bgValue = bgImg.data[bgIdx + channel];
                const fgValue = fgImg.data[fgIdx + channel];
                // Compute the new value for each channel
                const newValue = ((fgValue * fgAlpha * fgOpac) + (bgValue * bgAlpha * (1 - fgAlpha * fgOpac))) / newAlpha;
                // Store the new value back in the background image
                bgImg.data[bgIdx + channel] = Math.round(newValue);
            }
            // Store the new alpha value
            bgImg.data[bgIdx + 3] = Math.round(newAlpha * 255);
        }
    }
}


