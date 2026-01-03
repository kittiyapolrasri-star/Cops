import {
    Controller,
    Post,
    UseInterceptors,
    UploadedFile,
    UploadedFiles,
    UseGuards,
    Delete,
    Param,
    Get,
    Res,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { existsSync } from 'fs';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
    constructor(private uploadService: UploadService) { }

    @Post('single')
    @UseInterceptors(FileInterceptor('file'))
    uploadSingle(@UploadedFile() file: Express.Multer.File) {
        return {
            filename: file.filename,
            url: this.uploadService.getFileUrl(file.filename),
            originalName: file.originalname,
            size: file.size,
            mimetype: file.mimetype,
        };
    }

    @Post('multiple')
    @UseInterceptors(FilesInterceptor('files', 10))
    uploadMultiple(@UploadedFiles() files: Express.Multer.File[]) {
        return files.map((file) => ({
            filename: file.filename,
            url: this.uploadService.getFileUrl(file.filename),
            originalName: file.originalname,
            size: file.size,
            mimetype: file.mimetype,
        }));
    }

    @Delete(':filename')
    deleteFile(@Param('filename') filename: string) {
        const deleted = this.uploadService.deleteFile(filename);
        return { deleted };
    }

    @Get(':filename')
    getFile(@Param('filename') filename: string, @Res() res: Response) {
        const filepath = this.uploadService.getFilePath(filename);
        if (existsSync(filepath)) {
            return res.sendFile(filepath, { root: '.' });
        }
        return res.status(404).json({ message: 'File not found' });
    }
}
