import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

@Injectable()
export class S3Service {
    private s3Client: S3Client;
    private readonly logger = new Logger(S3Service.name);

    constructor(private readonly configService: ConfigService) {
        const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
        const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');

        if (!accessKeyId || !secretAccessKey) {
            this.logger.warn('AWS Credentials are missing');
        }

        this.s3Client = new S3Client({
            region: this.configService.get<string>('AWS_REGION') || 'auto',
            endpoint: this.configService.get<string>('AWS_URL'),
            credentials: {
                accessKeyId: accessKeyId || '',
                secretAccessKey: secretAccessKey || '',
            },
        });
    }

    async uploadFile(file: Express.Multer.File): Promise<{ key: string; url: string }> {
        const key = `${randomUUID()}-${file.originalname}`;
        const bucket = this.configService.get('AWS_S3_BUCKET_NAME');

        try {
            await this.s3Client.send(
                new PutObjectCommand({
                    Bucket: bucket,
                    Key: key,
                    Body: file.buffer,
                    ContentType: file.mimetype,
                    // ACL: 'public-read', // Uncomment if you need public read access directly on S3/R2
                }),
            );

            // Construct URL. This depends on your provider (R2, AWS S3, etc)
            // For R2 with a custom domain or the r2.cloudflarestorage.com endpoint:
            // If using the endpoint in .env (AWS_URL), we can try to construct it.
            // Often for R2: https://<accountid>.r2.cloudflarestorage.com/<bucket>/<key>
            // Or if you have a public domain setup.
            // Let's assume the endpoint + bucket + key format for now, or just the stored key if using signed URLs later.

            const endpoint = this.configService.get('AWS_URL');
            const url = `${endpoint}/${bucket}/${key}`;

            return { key, url };
        } catch (error) {
            this.logger.error('Error uploading to S3', error);
            throw error;
        }
    }
}
