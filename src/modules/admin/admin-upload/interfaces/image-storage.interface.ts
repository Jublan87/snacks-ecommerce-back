/**
 * Token de inyección para el adaptador de almacenamiento de imágenes.
 * Permite intercambiar el proveedor (placeholder, Cloudinary, S3, etc.) sin tocar el servicio.
 */
export const IMAGE_STORAGE_ADAPTER = 'IMAGE_STORAGE_ADAPTER';

/**
 * Contrato que deben implementar todos los adaptadores de almacenamiento de imágenes.
 * El servicio depende de esta interfaz, nunca de la implementación concreta.
 */
export interface ImageStorageAdapter {
  upload(file: Express.Multer.File): Promise<{ url: string }>;
}
