import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreatePostDto } from './dto/create-post.dto.js';
import { Platform, PostStatus, Role } from '@prisma/client';
import { UpdatePostDto } from './dto/update-post.dto.js';

@Injectable()
export class PostsService {
    constructor(private prisma: PrismaService) { }
    private captionLimits = {
        X: 280,
        INSTAGRAM: 2200,
        LINKEDIN: 3000,
        FACEBOOK: 5000
    };
  private allowedTransitions: Record<PostStatus, PostStatus[]> = {
    DRAFT: [PostStatus.IN_REVIEW],
    IN_REVIEW: [PostStatus.APPROVED, PostStatus.CHANGES_REQUESTED],
    CHANGES_REQUESTED: [PostStatus.IN_REVIEW],
    APPROVED: [PostStatus.SCHEDULED],
    SCHEDULED: [PostStatus.PUBLISHED],
    PUBLISHED: [],
  };
    async create(dto: CreatePostDto,userId:string) {

        const { platform, caption } = dto;
        this.validateCaption(platform, caption);
        if(dto.scheduledAt){
            this.validateScheduledTime(dto.scheduledAt);
            await this.checkSchedulingConflict(dto.clientId, dto.platform, dto.scheduledAt);
        }
        return this.prisma.post.create({
            data:{
                clientId:dto.clientId,
                platform:dto.platform,
                caption:dto.caption,
                status:PostStatus.DRAFT,
                createdById: userId,
                scheduledAt:dto.scheduledAt? new Date(dto.scheduledAt) : null,
            },
            include:{
                client:true,
                createdBy:{
                    select:{id:true,name:true,email:true}
                }
            }
        })
    }
    async findAll(user:{id:string,role:Role}){
        if(user.role ===Role.REVIEWER){
            return this.prisma.post.findMany({
                where:{
                    client:{
                        reviewers:{some:{id:user.id}}
                    }
                },
                include:{
                    client:true,
                    createdBy:{select:{id:true,name:true}}
                },
                orderBy:{
                    createdAt:"desc"
                }
            })
        }
        return this.prisma.post.findMany({
      include: {
        client: true,
        createdBy: { select: { id: true, name: true } },
      },
      orderBy:{createdAt:"desc"}
    });
}
async findOne(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        client: true,
        createdBy: { select: { id: true, name: true, email: true } },
        comments: {
          include: { author: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'asc' },
        },
        auditLogs: {
          include: { actor: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async update(id: string, dto: UpdatePostDto, userId: string) {
    const post = await this.findOne(id);

    // Only creator can edit, and only in DRAFT or CHANGES_REQUESTED
    if (post.createdById !== userId) {
      throw new ForbiddenException('Only the creator can edit this post');
    }

    if (post.status !== PostStatus.DRAFT && post.status !== PostStatus.CHANGES_REQUESTED) {
      throw new BadRequestException('Post can only be edited in DRAFT or CHANGES_REQUESTED status');
    }

    // Optimistic locking
    if (post.version !== dto.version) {
      throw new ConflictException('Post was updated by someone else. Please refresh.');
    }

    if (dto.caption && dto.platform) {
      this.validateCaption(dto.platform, dto.caption);
    } else if (dto.caption) {
      this.validateCaption(post.platform, dto.caption);
    }

    return this.prisma.post.update({
      where: { id },
      data: {
        caption: dto.caption,
        platform: dto.platform,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
        version: { increment: 1 },
      },
    });
  }

  async changeStatus(id: string, newStatus: PostStatus,user: { id: string; role: Role }, comment?: string,) {
  const post = await this.findOne(id);

  // Check allowed transition
  const allowed: PostStatus[] = this.allowedTransitions[post.status] || [];
  if (!allowed.includes(newStatus)) {
    throw new BadRequestException(
      `Cannot change status from ${post.status} to ${newStatus}`,
    );
  }

  // User cannot approve their own post
  if (newStatus === PostStatus.APPROVED && post.createdById === user.id) {
    throw new ForbiddenException('You cannot approve your own post');
  }

  // Requesting changes needs a comment of at least 10 characters
  if (newStatus === PostStatus.CHANGES_REQUESTED) {
    if (!comment || comment.length < 10) {
      throw new BadRequestException(
        'Comment of at least 10 characters is required when requesting changes',
      );
    }

    await this.prisma.comment.create({
      data: {
        postId: id,
        authorId: user.id,
        message: comment,
      },
    });
  }

  // Create audit log
  await this.prisma.auditLog.create({
    data: {
      postId: id,
      actorId: user.id,
      fromStatus: post.status,
      toStatus: newStatus,
    },
  });

  // Update status
  return this.prisma.post.update({
    where: { id },
    data: {
      status: newStatus,
      version: { increment: 1 },
    },
  });
}
    private validateCaption(platform: Platform, caption: string) {
        const limit = this.captionLimits[platform];
        if (caption.length > limit) {
            throw new BadRequestException(
                `Caption too long for ${platform}. Max ${limit} characters.`,
            )
        }
    }
    private validateScheduledTime(scheduledAt:string){
        const scheduleTime = new Date(scheduledAt);
        if(isNaN(scheduleTime.getTime())){
            throw new BadRequestException("Invalid date");
        }
        if(scheduleTime <= new Date()){
            throw new BadRequestException("Scheduled time must be in the future");
        }
    }
    private async checkSchedulingConflict(clientId:string,platform:Platform,scheduledAt:string){
        const time = new Date(scheduledAt);
        const twoHours = 2*60*60*1000;
        const conflict = await this.prisma.post.findFirst({
            where:{
                clientId,
                platform,
                scheduledAt:{
                    gte: new Date(time.getTime()-twoHours),
                    lte: new Date(time.getTime()+twoHours)
                },
                status:{
                    in:[PostStatus.SCHEDULED,PostStatus.APPROVED]
                },
                }
            });
        if(conflict){
            throw new ConflictException({
                message: 'Scheduling conflict: another post is scheduled within 2 hours',
                conflictingPostId: conflict.id,
            });
        }
    }
}
