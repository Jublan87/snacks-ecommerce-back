import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { CloudinaryImageAdapter } from './adapters/cloudinary-image.adapter';
import { AdminUploadController } from './admin-upload.controller';
import { AdminUploadService } from './admin-upload.service';
import { IMAGE_STORAGE_ADAPTER } from './interfaces/image-storage.interface';

@Module({
  imports: [AuthModule],
  controllers: [AdminUploadController],
  providers: [
    { provide: IMAGE_STORAGE_ADAPTER, useClass: CloudinaryImageAdapter },
    AdminUploadService,
  ],
  exports: [AdminUploadService, IMAGE_STORAGE_ADAPTER],
})
export class AdminUploadModule {}
