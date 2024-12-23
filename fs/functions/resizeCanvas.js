export const resizeCanvas = (canvas, new_w, new_h) => {
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    let temp = ctx.getImageData(0, 0, canvas.width, canvas.height);
    canvas.width = new_w;
    canvas.height = new_h;
    ctx.putImageData(temp, 0, 0);
};
