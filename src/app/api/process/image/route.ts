import { NextResponse } from "next/server"
import sharp from "sharp"

export async function POST(req: Request) {
  try {
    const { imageUrl, width, height, format = "jpg", fit = "cover" } = await req.json()

    if (!imageUrl || !width || !height) {
      return new NextResponse("Missing required parameters", { status: 400 })
    }

    // 1. 下载图片
    const response = await fetch(imageUrl)
    if (!response.ok) {
      return new NextResponse("Failed to fetch image", { status: 400 })
    }
    const arrayBuffer = await response.arrayBuffer()
    const inputBuffer = Buffer.from(arrayBuffer)

    let pipeline = sharp(inputBuffer)

    // 2. 调整尺寸
    if (fit === "contain") {
      // iPad 模式：高斯模糊背景
      // 先生成模糊背景
      const background = await sharp(inputBuffer)
        .resize(width, height, { fit: "cover" })
        .blur(20)
        .modulate({ brightness: 0.7 }) // 稍微变暗
        .toBuffer()

      // 再生成前景图
      const foreground = await sharp(inputBuffer)
        .resize(width, height, { fit: "inside" })
        .toBuffer()

      // 合成
      pipeline = sharp(background).composite([{ input: foreground }])
    } else {
      // 手机模式：直接裁切 (Cover)
      pipeline = pipeline.resize(width, height, {
        fit: "cover",
        position: "center", // 居中裁切
      })
    }

    // 3. 格式转换与压缩
    // 强制转 RGB (去除 Alpha)
    if (format === "jpg" || format === "jpeg") {
      pipeline = pipeline
        .flatten({ background: { r: 255, g: 255, b: 255 } }) // 透明背景变白
        .jpeg({
          quality: 85, // 80-85%
          mozjpeg: true, // 使用 mozjpeg 算法，压缩率更高
        })
    } else if (format === "png") {
      pipeline = pipeline.png({
        compressionLevel: 9, // 最高压缩比 (Lossless)
        adaptiveFiltering: true,
        palette: true,
      })
    }

    const outputBuffer = await pipeline.toBuffer()
    
    // 4. 返回 Base64
    const base64 = outputBuffer.toString("base64")
    const mimeType = format === "png" ? "image/png" : "image/jpeg"
    const dataUrl = `data:${mimeType};base64,${base64}`

    return NextResponse.json({ url: dataUrl })

  } catch (error) {
    console.error("[IMAGE_PROCESS_ERROR]", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
