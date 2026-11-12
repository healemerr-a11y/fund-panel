// Ekran görüntüsünü JPEG'e küçültür (grafik okunabilsin diye 1600px).
export async function shrink(file, max = 1600) {
  const bmp = await createImageBitmap(file)
  const k = Math.min(1, max / Math.max(bmp.width, bmp.height))
  const c = document.createElement('canvas')
  c.width = Math.round(bmp.width * k)
  c.height = Math.round(bmp.height * k)
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height)
  return c.toDataURL('image/jpeg', 0.85)
}
