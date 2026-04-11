import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'

function loadKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY
    if (!key) throw new Error('Missing required env var: ENCRYPTION_KEY')
    return Buffer.from(key, 'hex')
}

const KEY = loadKey()

export function encrypt(text: string): string {
    const iv = randomBytes(12)
    const cipher = createCipheriv(ALGORITHM, KEY, iv)
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
    const tag = cipher.getAuthTag()
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`
}

export function decrypt(data: string): string {
    const [ivHex, tagHex, encryptedHex] = data.split(':')
    const decipher = createDecipheriv(ALGORITHM, KEY, Buffer.from(ivHex, 'hex'))
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'))
    return decipher.update(encryptedHex, 'hex', 'utf8') + decipher.final('utf8')
}
