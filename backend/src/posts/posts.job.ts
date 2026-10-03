import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service.js';
import { PostStatus } from '@prisma/client';

@Injectable()
export class PostsJob{
    private readonly logger = new Logger(PostsJob.name);

    
    constructor(private prisma: PrismaService){}

    @Cron(CronExpression.EVERY_MINUTE)
    async publishScheduledPosts(){
        const now = new Date();

        const posts = await this.prisma.post.findMany({
            where:{
                status:PostStatus.SCHEDULED,
                scheduledAt:{
                    lte:now
                }
            }
        })
        for (const post of posts) {
      await this.prisma.post.update({
        where: { id: post.id },
        data: { status: PostStatus.PUBLISHED },
      });

      await this.prisma.auditLog.create({
        data: {
          postId: post.id,
          actorId: post.createdById, // system action, using creator
          fromStatus: PostStatus.SCHEDULED,
          toStatus: PostStatus.PUBLISHED,
        },
      });

      this.logger.log(`Published post ${post.id}`);
    }
    }
}