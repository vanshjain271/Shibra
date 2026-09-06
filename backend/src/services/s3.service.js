/**
 * S3 Service - MVP
 * 
 * Handles file uploads to AWS S3
 * Service-first architecture: all S3 logic here
 */

const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');
const crypto = require('crypto');

class S3Service {
  constructor() {
    this.initialized = false;
    this.client = null;
    this.bucket = null;
    this.region = null;
    this.init();
  }

  /**
   * Initialize S3 client
   */
  init() {
    try {
      const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
      const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
      // Hardcode correct bucket name as fallback to prevent PM2 env-cache issues
      this.bucket = process.env.AWS_S3_BUCKET || 'shibra-production-images';
      this.region = process.env.AWS_REGION || 'ap-south-1';

      // Auto-correct common typos
      if (this.bucket === 'shibra-production-image' || this.bucket === 'shibra-production-imagess') {
        console.warn(`⚠️  Correcting S3 bucket name typo: ${this.bucket} → shibra-production-images`);
        this.bucket = 'shibra-production-images';
      }

      console.log(`🪣  S3 bucket: ${this.bucket} | region: ${this.region}`);

      if (!accessKeyId || !secretAccessKey || !this.bucket) {
        console.log('⚠️  AWS S3 not configured - uploads will use local storage');
        return;
      }

      this.client = new S3Client({
        region: this.region,
        credentials: {
          accessKeyId,
          secretAccessKey
        }
      });

      this.initialized = true;
      console.log('✅ AWS S3 initialized successfully');
    } catch (error) {
      console.error('S3 initialization error:', error.message);
    }
  }

  /**
   * Generate unique filename
   * @param {string} originalName - Original filename
   * @param {string} folder - Folder prefix
   * @returns {string} Unique key
   */
  generateKey(originalName, folder = 'uploads') {
    const ext = path.extname(originalName).toLowerCase();
    const uniqueId = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    return `${folder}/${timestamp}-${uniqueId}${ext}`;
  }

  /**
   * Upload file to S3
   * @param {Object} file - Multer file object { buffer, originalname, mimetype }
   * @param {string} folder - Folder prefix
   * @returns {Promise<Object>} { success, url?, key?, error? }
   */
  async uploadFile(file, folder = 'products') {
    if (!this.initialized) {
      return this._localFallback(file, folder);
    }

    try {
      const key = this.generateKey(file.originalname, folder);

      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      await this.client.send(command);

      const url = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;

      return {
        success: true,
        url,
        key
      };
    } catch (error) {
      console.error('S3 upload error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Upload multiple files
   * @param {Array} files - Array of multer file objects
   * @param {string} folder - Folder prefix
   * @returns {Promise<Object>} { success, urls?, errors? }
   */
  async uploadMultiple(files, folder = 'products') {
    if (!files || files.length === 0) {
      return { success: true, urls: [] };
    }

    const results = await Promise.all(
      files.map(file => this.uploadFile(file, folder))
    );

    const urls = results.filter(r => r.success).map(r => r.url);
    const errors = results.filter(r => !r.success).map(r => r.error);

    return {
      success: errors.length === 0,
      urls,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  /**
   * Delete file from S3
   * @param {string} url - Full S3 URL or key
   * @returns {Promise<Object>} { success, error? }
   */
  async deleteFile(url) {
    if (!this.initialized) {
      return { success: true }; // No-op for local fallback
    }

    try {
      const key = this.extractKeyFromUrl(url);

      if (!key) {
        return { success: false, error: 'Invalid URL' };
      }

      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key
      });

      await this.client.send(command);

      return { success: true };
    } catch (error) {
      console.error('S3 delete error:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete multiple files
   * @param {Array} urls - Array of S3 URLs
   * @returns {Promise<Object>} { success, deletedCount, errors? }
   */
  async deleteMultiple(urls) {
    if (!urls || urls.length === 0) {
      return { success: true, deletedCount: 0 };
    }

    const results = await Promise.all(
      urls.map(url => this.deleteFile(url))
    );

    const deletedCount = results.filter(r => r.success).length;
    const errors = results.filter(r => !r.success).map(r => r.error);

    return {
      success: errors.length === 0,
      deletedCount,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  /**
   * Extract S3 key from URL
   * @param {string} url - Full S3 URL
   * @returns {string|null} Key or null
   */
  extractKeyFromUrl(url) {
    try {
      // If it's already a key (no http)
      if (!url.startsWith('http')) {
        return url;
      }

      const urlObj = new URL(url);
      // Remove leading slash
      return urlObj.pathname.substring(1);
    } catch {
      return null;
    }
  }

  /**
   * Local fallback for development without S3
   * @private
   */
  _localFallback(file, folder) {
    // In development, return a placeholder URL
    const key = this.generateKey(file.originalname, folder);
    const url = `/uploads/${key}`;

    console.log(`[DEV] File would be uploaded to: ${url}`);

    return {
      success: true,
      url,
      key,
      isLocal: true
    };
  }

  /**
   * Validate file type
   * @param {string} mimetype - File MIME type
   * @param {Array} allowedTypes - Allowed MIME types
   * @returns {boolean}
   */
  isValidFileType(mimetype, allowedTypes = ['image/jpeg', 'image/png', 'image/webp']) {
    return allowedTypes.includes(mimetype);
  }

  /**
   * Validate file size
   * @param {number} size - File size in bytes
   * @param {number} maxSize - Max size in bytes (default 5MB)
   * @returns {boolean}
   */
  isValidFileSize(size, maxSize = 5 * 1024 * 1024) {
    return size <= maxSize;
  }
}

module.exports = new S3Service();
