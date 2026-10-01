import { Body, Controller, Get, Param, Post, UseGuards, } from '@nestjs/common';
import {ClientsService} from './clients.service.js'
import { createClientDto } from './dto/create-client.dto.js';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard.js';
@Controller('clients')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ClientsController {
    constructor(private readonly clientService:ClientsService){}
    @Post()
    @Roles(Role.ADMIN)
    async create(@Body() dto: createClientDto) {
        return this.clientService.create(dto);
    }

    @Get()
    @Roles(Role.ADMIN, Role.CREATOR, Role.REVIEWER)
    async findAll() {
        return this.clientService.findAll();
    }

    @Get(':id')
    @Roles(Role.ADMIN, Role.CREATOR, Role.REVIEWER)
    async findOne(@Param('id') id: string) {
        return this.clientService.findOne(id);
    }
}
