import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { join } from 'path';

@Injectable()
export class UploadService {
    private uploadDir: string;

    constructor(private configService: ConfigService) {
        this.uploadDir = this.configService.get('UPLOAD_DIR') || './uploads';
        this.ensureUploadDir();
    }

    private ensureUploadDir() {
        if (!existsSync(this.uploadDir)) {
            mkdirSync(this.uploadDir, { recursive: true });
        }
    }

    getFilePath(filename: string): string {
        return join(this.uploadDir, filename);
    }

    getFileUrl(filename: string): string {
        return `/uploads/${filename}`;
    }

    deleteFile(filename: string): boolean {
        try {
            const filepath = this.getFilePath(filename);
            if (existsSync(filepath)) {
                unlinkSync(filepath);
                return true;
            }
            return false;
        } catch (error) {
            return false;
        }
    }
}
