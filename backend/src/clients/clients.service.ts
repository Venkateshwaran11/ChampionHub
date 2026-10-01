import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import  {createClientDto} from '../clients/dto/create-client.dto.js'
import { connect } from 'http2';
@Injectable()
export class ClientsService {
    constructor(private  prisma: PrismaService){}

    async create(dto:createClientDto){
        return this.prisma.client.create({
            data:{
                brandName:dto.brandName,
                reviewers:dto.reviewerIds?{connect:dto.reviewerIds.map((id)=>({id:id}))}:undefined,
                
            },
            include:{
                reviewers:{
                    select:{id:true,name:true,email:true},
                },
            }
        })
    }
    
    async findAll() {
    return this.prisma.client.findMany({
      include: {
        reviewers: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        reviewers: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    return client;
  }
}
