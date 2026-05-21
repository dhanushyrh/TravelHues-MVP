import {
  Controller, Post, Delete, Param, UseGuards, UseInterceptors,
  UploadedFile, ParseUUIDPipe, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { MediaService } from './media.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../database/entities/user.entity';

@ApiTags('media')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload a file (image, video, document)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  upload(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: User) {
    if (!file) throw new BadRequestException('No file uploaded');
    const folder = file.mimetype.startsWith('video/') ? 'videos' : 'images';
    return this.mediaService.upload(file, user.id, folder);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete uploaded file' })
  delete(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.mediaService.delete(id, user.id);
  }
}
