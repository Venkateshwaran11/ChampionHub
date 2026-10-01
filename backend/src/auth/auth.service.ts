import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';
import { RegisterDto } from '../auth/dto/register.dto.js';
import { LoginDto } from '../auth/dto/login.dto.js';
@Injectable()
export class AuthService {

    constructor(private prisma: PrismaService, private jwtService: JwtService) { }
    async register(dto: RegisterDto) {

        const isExistingUser = await this.prisma.user.findUnique({
            where: {
                email: dto.email
            }
        })
        if (isExistingUser) {
            throw new ConflictException('Email already registered');
        }

        const hashedPwd = await bcrypt.hash(dto.password,10);
        const newUser = await this.prisma.user.create({
           data:{
            name: dto.name,
            email: dto.email,
            password: hashedPwd,
            role: dto.role,
           }
        })
        return newUser;
    }
    async login(dto: LoginDto){
        const user = await this.prisma.user.findUnique({
            where:{
                email: dto.email,
            }
        })

        if (!user){
            throw new UnauthorizedException("Invalid Credentials");
        }

        const isPasswordValid = await bcrypt.compare(dto.password, user.password);

        if (!isPasswordValid){
            throw new UnauthorizedException("Invalid Credentials");
        }
        return this.generateToken(user.id,user.email,user.role)
    }
    private generateToken(userId:string,email:string,role:string){
        const payload = {sub:userId,email,role}
        return {
            access_token: this.jwtService.sign(payload),
            user:{
                id:userId,email,role
            }
        }
    }
}

