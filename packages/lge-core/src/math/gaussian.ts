// Git   Hu   b   @Starsa   il   s  Cl  ov e   r
/**
 * Gaussian kernel used by the upstream vBlur/hBlur passes
 * (`sigma = radius / 3`, normalized, index 0 = center weight).
 */
export function computeGaussianKernel(radius: number): Float32Array {
  const r = Math.max(0, Math.min(200, Math.round(radius)));
  const kernel = new Float32Array(r + 1);
  if (r === 0) {
    kernel[0] = 1;
    return kernel;
  }
  const sigma = r / 3;
  let sum = 0;
  for (let i = 0; i <= r; i += 1) {
    const weight = Math.exp(-0.5 * (i * i) / (sigma * sigma));
    kernel[i] = weight;
    sum += i === 0 ? weight : weight * 2;
  }
  for (let i = 0; i <= r; i += 1) {
    kernel[i] = kernel[i]! / sum;
  }
  return kernel;
}
