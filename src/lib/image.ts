// Downscale + recompress an image in the browser before upload. Phone photos
// are often 4–10MB; shrinking them to a sane max dimension and JPEG quality
// cuts upload time dramatically and keeps us under the server's 5MB limit.
// Falls back to the original file if anything goes wrong or it's not an image.
export async function compressImage(
  file: File,
  maxDim = 1600,
  quality = 0.8,
): Promise<File> {
  if (!file.type.startsWith("image/")) return file

  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height))
    // Already small enough — don't re-encode and risk making it bigger.
    if (scale === 1 && file.size <= 1_500_000) {
      bitmap.close()
      return file
    }

    const width = Math.round(bitmap.width * scale)
    const height = Math.round(bitmap.height * scale)
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      bitmap.close()
      return file
    }
    ctx.drawImage(bitmap, 0, 0, width, height)
    bitmap.close()

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    )
    if (!blob || blob.size >= file.size) return file

    const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg"
    return new File([blob], newName, { type: "image/jpeg", lastModified: Date.now() })
  } catch {
    return file
  }
}
