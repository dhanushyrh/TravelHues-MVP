import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StorageService {
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly endpoint: string;
  private readonly logger = new Logger(StorageService.name);

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('minio.endpoint', 'localhost');
    const port = this.configService.get<number>('minio.port', 9000);
    const useSSL = this.configService.get<boolean>('minio.useSsl', false);
    this.endpoint = `${useSSL ? 'https' : 'http'}://${host}:${port}`;
    this.bucket = this.configService.get<string>('minio.bucket', 'travelhues');

    this.s3 = new S3Client({
      endpoint: this.endpoint,
      region: 'us-east-1',
      credentials: {
        accessKeyId: this.configService.get<string>('minio.accessKey', 'minioadmin'),
        secretAccessKey: this.configService.get<string>('minio.secretKey', 'minioadmin'),
      },
      forcePathStyle: true,
    });
  }

  async upload(buffer: Buffer, mimeType: string, folder = 'uploads'): Promise<{ key: string; url: string }> {
    const ext = mimeType.split('/')[1] || 'bin';
    const key = `${folder}/${uuidv4()}.${ext}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      }),
    );

    return { key, url: `${this.endpoint}/${this.bucket}/${key}` };
  }

  async delete(key: string): Promise<void> {
    await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  async getPresignedUrl(key: string, expiresIn = 3600): Promise<string> {
    return getSignedUrl(this.s3, new GetObjectCommand({ Bucket: this.bucket, Key: key }), { expiresIn });
  }
}
