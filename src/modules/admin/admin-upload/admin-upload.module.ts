import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { PlaceholderImageAdapter } from './adapters/placeholder-image.adapter';
import { AdminUploadController } from './admin-upload.controller';
import { AdminUploadService } from './admin-upload.service';
import { IMAGE_STORAGE_ADAPTER } from './interfaces/image-storage.interface';

@Module({
  imports: [AuthModule],
  controllers: [AdminUploadController],
  providers: [
    // Para cambiar el proveedor de almacenamiento, reemplazar PlaceholderImageAdapter
    // por CloudinaryImageAdapter, S3ImageAdapter, etc. sin modificar nada más.
    { provide: IMAGE_STORAGE_ADAPTER, useClass: PlaceholderImageAdapter },
    AdminUploadService,
  ],
  exports: [AdminUploadService],
})
export class AdminUploadModule {}
