import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { notFound } from '../utils/http-error.js';

// Works with AWS S3 and S3-compatible services (MinIO, Cloudflare R2, DigitalOcean Spaces).
export class S3Storage {
  constructor({ region, bucket, endpoint, publicUrl, accessKeyId, secretAccessKey }, { client } = {}) {
    this.bucket = bucket;
    this.publicUrl = publicUrl ?? `https://${bucket}.s3.${region}.amazonaws.com`;
    this.client =
      client ??
      new S3Client({
        region,
        endpoint: endpoint || undefined,
        forcePathStyle: Boolean(endpoint), // MinIO uses http://host:9000/<bucket>/<key>
        credentials: accessKeyId ? { accessKeyId, secretAccessKey } : undefined,
      });
  }

  async put(key, buffer, contentType) {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000, immutable', // keys are unique per upload, so cache forever
      }),
    );
    return this.urlFor(key);
  }

  async get(key) {
    try {
      const res = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
      return Buffer.from(await res.Body.transformToByteArray());
    } catch (err) {
      if (err.name === 'NoSuchKey') throw notFound('Uploaded file not found');
      throw err;
    }
  }

  async delete(key) {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  urlFor(key) {
    return `${this.publicUrl}/${key}`;
  }

  /**
   * A presigned PUT URL lets the BROWSER upload straight to S3 — the file never passes through
   * our server. Content-Type and Content-Length are part of the signature, so the client must
   * upload exactly the type and size it declared (S3 rejects anything else with 403).
   */
  async createPresignedUpload({ key, contentType, size, expiresIn = 300 }) {
    const command = new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: contentType, ContentLength: size });
    const url = await getSignedUrl(this.client, command, {
      expiresIn, // seconds
      signableHeaders: new Set(['content-type', 'content-length']),
    });
    return { url, method: 'PUT', headers: { 'Content-Type': contentType, 'Content-Length': String(size) }, expiresIn };
  }
}
