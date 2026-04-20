import { Body, Controller, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SessionUser } from '../auth/interfaces/session-user.interface';
import { MeResponse } from '../auth/interfaces/auth-response.interface';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserInput } from './interfaces/update-user-input.interface';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('me')
  @ApiOperation({ summary: 'Actualizar perfil del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Perfil actualizado' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async updateMe(
    @CurrentUser() user: SessionUser,
    @Body() dto: UpdateProfileDto,
  ): Promise<MeResponse> {
    const input: UpdateUserInput = {
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
    };
    const updated = await this.usersService.update(user.id, input);
    return { user: updated };
  }
}
