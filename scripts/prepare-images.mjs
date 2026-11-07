// 一次性素材处理脚本：将项目根目录的实拍照片压缩到 public/stations/
// 运行：node scripts/prepare-images.mjs
import sharp from 'sharp'
import { mkdirSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = process.cwd()
const OUT = join(ROOT, 'public', 'stations')
mkdirSync(OUT, { recursive: true })

const files = readdirSync(ROOT).filter((f) =>
  /^IMG_\d+_\d+\.jpg$|^QQ图片\d+\.jpg$/i.test(f),
)
const slug = (name) =>
  name
    .replace(/^IMG_(\d+)_(\d+)$/, (_m, d, t) => `${d}-${t}`) // IMG_20261107_164355 -> 20261107-164355
    .replace(/^QQ图片(\d{8})(\d{6})$/i, (_m, d, t) => `qq-${d}-${t}`) // QQ图片20261107195749 -> qq-20261107-195749
    .toLowerCase()

for (const f of files) {
  const src = join(ROOT, f)
  const out = join(OUT, `${slug(f.replace(/\.jpg$/i, ''))}.jpg`)
  await sharp(src)
    .rotate() // 按 EXIF 摆正
    .resize({ width: 1600, withoutEnlargement: true })
    .jpeg({ quality: 78, mozjpeg: true })
    .toFile(out)
  console.log('OK', f, '->', out)
}
console.log(`done: ${files.length} images`)
