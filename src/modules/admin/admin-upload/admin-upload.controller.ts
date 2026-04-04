import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { THROTTLE_OPTIONS } from '../../../common/constants/throttler.constants';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { AdminUploadService } from './admin-upload.service';
import { UploadResponseDto } from './dto/upload-response.dto';
import { PendingUploadCleanupService } from './pending-upload-cleanup.service';

@ApiTags('admin-upload')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Throttle({ admin: THROTTLE_OPTIONS.admin })
@Controller('admin/upload')
export class AdminUploadController {
  constructor(
    private readonly adminUploadService: AdminUploadService,
    private readonly cleanupService: PendingUploadCleanupService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Subir imagen (retorna URL)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Archivo de imagen a subir (jpg, jpeg, png, webp, gif — máx 5 MB)',
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Imagen subida exitosamente', type: UploadResponseDto })
  @ApiResponse({ status: 400, description: 'Tipo o tamaño de archivo inválido' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos de admin' })
  upload(@UploadedFile() file: Express.Multer.File): Promise<UploadResponseDto> {
    return this.adminUploadService.uploadImage(file);
  }

  @Post('cleanup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar uploads huérfanos (más de 60 min sin confirmar)' })
  @ApiResponse({ status: 200, description: 'Limpieza completada' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos de admin' })
  cleanupPending(): Promise<{ deleted: number; failed: number }> {
    return this.cleanupService.cleanup();
  }
}
