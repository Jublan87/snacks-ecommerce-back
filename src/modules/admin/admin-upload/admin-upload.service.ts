import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ERROR_CODES } from '../../../common/constants/error-codes';
import { IMAGE_STORAGE_ADAPTER, ImageStorageAdapter } from './interfaces/image-storage.interface';

/** Tipos MIME permitidos para subida de imágenes */
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

/** Tamaño máximo de archivo: 5 MB */
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

@Injectable()
export class AdminUploadService {
  constructor(
    @Inject(IMAGE_STORAGE_ADAPTER)
    private readonly storageAdapter: ImageStorageAdapter,
  ) {}

  /**
   * Valida y sube un archivo de imagen usando el adaptador configurado.
   * La validación de tipo y tamaño ocurre aquí para que aplique a cualquier adaptador.
   */
  async uploadImage(file: Express.Multer.File): Promise<{ url: string }> {
    this.validateFile(file);
    return this.storageAdapter.upload(file);
  }

  // ─── Validaciones ─────────────────────────────────────────────────────────────

  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException({
        code: ERROR_CODES.BAD_REQUEST,
        message: 'No se recibió ningún archivo',
      });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException({
        code: ERROR_CODES.BAD_REQUEST,
        message: `Tipo de archivo no permitido. Solo se aceptan: jpg, jpeg, png, webp, gif`,
      });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException({
        code: ERROR_CODES.BAD_REQUEST,
        message: `El archivo supera el tamaño máximo permitido de 5 MB`,
      });
    }
  }
}
