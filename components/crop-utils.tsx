export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener("load", () => resolve(image))
    image.addEventListener("error", (error) => reject(error))
    image.setAttribute("crossOrigin", "anonymous")
    image.src = url
  })

export const getCroppedImg = async (
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  maxWidth = 200,
  maxHeight = 200,
): Promise<string> => {
  const image = await createImage(imageSrc)
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")

  if (!ctx) {
    throw new Error("Could not get canvas context")
  }

  // Calculate the scale to fit within max dimensions while maintaining aspect ratio
  const scale = Math.min(maxWidth / pixelCrop.width, maxHeight / pixelCrop.height)

  canvas.width = pixelCrop.width * scale
  canvas.height = pixelCrop.height * scale

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = "high"

  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, canvas.width, canvas.height)

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.readAsDataURL(blob)
        }
      },
      "image/jpeg",
      0.8,
    )
  })
}
