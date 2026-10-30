// An in-memory stand-in for S3Storage with the SAME methods. Injected via the container in tests.
export class MemoryStorage {
  files = new Map();

  async put(key, buffer, contentType) {
    this.files.set(key, { buffer, contentType });
    return this.urlFor(key);
  }

  async get(key) {
    const file = this.files.get(key);
    if (!file) throw Object.assign(new Error('Uploaded file not found'), { status: 404 });
    return file.buffer;
  }

  async delete(key) {
    this.files.delete(key);
  }

  urlFor(key) {
    return `https://bucket.example.com/${key}`;
  }

  async createPresignedUpload({ key, contentType, size }) {
    return {
      url: `https://bucket.example.com/${key}?X-Amz-Signature=fake`,
      method: 'PUT',
      headers: { 'Content-Type': contentType, 'Content-Length': String(size) },
      expiresIn: 300,
    };
  }
}