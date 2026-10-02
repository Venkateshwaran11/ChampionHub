import { Body, Controller, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard.js';
import { PostsService } from './posts.service.js';
import { CreatePostDto } from './dto/create-post.dto.js';
import { Role, PostStatus } from '@prisma/client';
import { Roles } from '../auth/roles.decorator.js';
import { UpdatePostDto } from './dto/update-post.dto.js';

@Controller('posts')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class PostsController {
    constructor(private postsService: PostsService) {}
   @Post()
  @Roles(Role.CREATOR, Role.ADMIN)
  create(@Body() dto: CreatePostDto, @Request() req:any) {
    return this.postsService.create(dto, req.user.id);
  }

  @Get()
  @Roles(Role.ADMIN, Role.CREATOR, Role.REVIEWER)
  findAll(@Request() req:any) {
    return this.postsService.findAll(req.user);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.CREATOR, Role.REVIEWER)
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.CREATOR, Role.ADMIN)
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePostDto,
    @Request() req:any,
  ) {
    return this.postsService.update(id, dto, req.user.id);
  }

  // Change status (submit for review, approve, request changes, schedule...)
  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.CREATOR, Role.REVIEWER)
  changeStatus(
    @Param('id') id: string,
    @Body() body: { status: PostStatus; comment?: string },
    @Request() req:any,
  ) {
    return this.postsService.changeStatus(
      id,
      body.status,
      req.user,
      body.comment,
    );
  }
}
