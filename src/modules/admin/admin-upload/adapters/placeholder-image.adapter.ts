import { Injectable } from '@nestjs/common';
import { ImageStorageAdapter } from '../interfaces/image-storage.interface';

/**
 * Adaptador de desarrollo que genera URLs de placehold.co en lugar de subir a un proveedor real.
 * Para producción, crear un adaptador CloudinaryImageAdapter o S3ImageAdapter que implemente
 * ImageStorageAdapter y reemplazarlo en el módulo vía el token IMAGE_STORAGE_ADAPTER.
 */
@Injectable()
export class PlaceholderImageAdapter implements ImageStorageAdapter {
  async upload(file: Express.Multer.File): Promise<{ url: string }> {
    const text = this.cleanFilename(file.originalname);
    const url = `https://placehold.co/600x600/EEE/31343C/png?text=${text}`;
    return { url };
  }

  /**
   * Limpia el nombre del archivo para usarlo como texto en la URL:
   * - Remueve la extensión
   * - Reemplaza espacios y caracteres especiales con guiones
   * - Colapsa guiones consecutivos
   */
  private cleanFilename(filename: string): string {
    const withoutExtension = filename.replace(/\.[^/.]+$/, '');
    return withoutExtension
      .replace(/[^a-zA-Z0-9\s-]/g, '-')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
