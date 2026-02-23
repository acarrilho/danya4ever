/**
 * Cloudinary image hosting integration.
 * Server-side only — never import in client components.
 *
 * Free tier: 25GB storage, 25GB bandwidth/month.
 * Sign up at cloudinary.com — no credit card required.
 */

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME
const API_KEY = process.env.CLOUDINARY_API_KEY
const API_SECRET = process.env.CLOUDINARY_API_SECRET

function assertConfig() {
  if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
    throw new Error(
      'Missing Cloudinary env vars. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.'
    )
  }
}

export interface CloudinaryUploadResult {
  url: string        // https secure URL
  publicId: string   // used for deletion later
}

/**
 * Upload a base64-encoded image to Cloudinary.
 * The base64 string should include the data URI prefix, e.g. "data:image/jpeg;base64,..."
 */
export async function uploadImage(base64DataUri: string): Promise<CloudinaryUploadResult> {
  assertConfig()

  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`

  const formData = new FormData()
  formData.append('file', base64DataUri)
  formData.append('upload_preset', 'unsigned_memorial') // created below in setup notes
  formData.append('folder', 'danya-memorial')
  formData.append('api_key', API_KEY!)

  // Use signed upload for security (we have server-side access to the secret)
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const paramsToSign = `folder=danya-memorial&timestamp=${timestamp}`
  const signature = signRequest(paramsToSign)

  const signedData = new FormData()
  signedData.append('file', base64DataUri)
  signedData.append('folder', 'danya-memorial')
  signedData.append('timestamp', timestamp)
  signedData.append('api_key', API_KEY!)
  signedData.append('signature', signature)

  const res = await fetch(url, { method: 'POST', body: signedData })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Cloudinary upload failed: ${err}`)
  }

  const data = await res.json() as { secure_url: string; public_id: string }
  return { url: data.secure_url, publicId: data.public_id }
}

/**
 * Delete an image from Cloudinary by its public_id.
 * Called when a message is deleted by an admin.
 */
export async function deleteImage(publicId: string): Promise<void> {
  assertConfig()

  const timestamp = Math.floor(Date.now() / 1000).toString()
  const paramsToSign = `public_id=${publicId}&timestamp=${timestamp}`
  const signature = signRequest(paramsToSign)

  const formData = new FormData()
  formData.append('public_id', publicId)
  formData.append('timestamp', timestamp)
  formData.append('api_key', API_KEY!)
  formData.append('signature', signature)

  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/destroy`
  const res = await fetch(url, { method: 'POST', body: formData })

  if (!res.ok) {
    const err = await res.text()
    console.error(`Cloudinary delete failed for ${publicId}: ${err}`)
    // Non-fatal — log but don't throw; the DB record is still being deleted
  }
}

/**
 * Generate a Cloudinary request signature.
 * Cloudinary uses plain SHA-1( params_string + api_secret ) — NOT HMAC.
 * This runs server-side only (API routes), so Node's crypto is available.
 */
function signRequest(params: string): string {
  const { createHash } = require('crypto') as typeof import('crypto')
  return createHash('sha1')
    .update(`${params}${API_SECRET!}`)
    .digest('hex')
}
