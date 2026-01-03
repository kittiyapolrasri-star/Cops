import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async create(createUserDto: CreateUserDto) {
        const existingUser = await this.prisma.user.findUnique({
            where: { username: createUserDto.username },
        });

        if (existingUser) {
            throw new ConflictException('ชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว');
        }

        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

        return this.prisma.user.create({
            data: {
                ...createUserDto,
                password: hashedPassword,
            },
            select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                rank: true,
                position: true,
                phone: true,
                avatar: true,
                role: true,
                stationId: true,
                isActive: true,
                createdAt: true,
            },
        });
    }

    async findAll(role?: UserRole, stationId?: string) {
        return this.prisma.user.findMany({
            where: {
                ...(role && { role }),
                ...(stationId && { stationId }),
                isActive: true,
            },
            select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                rank: true,
                position: true,
                phone: true,
                avatar: true,
                role: true,
                station: true,
                isActive: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findById(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: { station: { include: { province: { include: { bureau: true } } } } },
        });

        if (!user) {
            throw new NotFoundException('ไม่พบผู้ใช้');
        }

        return user;
    }

    async findByUsername(username: string) {
        return this.prisma.user.findUnique({
            where: { username },
            include: { station: { include: { province: { include: { bureau: true } } } } },
        });
    }

    async update(id: string, updateUserDto: UpdateUserDto) {
        const user = await this.findById(id);

        if (updateUserDto.password) {
            updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
        }

        return this.prisma.user.update({
            where: { id },
            data: updateUserDto,
            select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                rank: true,
                position: true,
                phone: true,
                avatar: true,
                role: true,
                stationId: true,
                isActive: true,
            },
        });
    }

    async remove(id: string) {
        await this.findById(id);
        return this.prisma.user.update({
            where: { id },
            data: { isActive: false },
        });
    }

    async getPatrolOfficers(stationId?: string) {
        return this.prisma.user.findMany({
            where: {
                role: 'PATROL',
                isActive: true,
                ...(stationId && { stationId }),
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                rank: true,
                avatar: true,
                station: true,
            },
        });
    }
}
