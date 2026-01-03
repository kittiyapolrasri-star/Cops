import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
    constructor(private usersService: UsersService) { }

    @Post()
    @Roles(UserRole.STATION, UserRole.PROVINCE, UserRole.BUREAU, UserRole.HQ)
    create(@Body() createUserDto: CreateUserDto) {
        return this.usersService.create(createUserDto);
    }

    @Get()
    @Roles(UserRole.STATION, UserRole.PROVINCE, UserRole.BUREAU, UserRole.HQ)
    findAll(@Query('role') role?: UserRole, @Query('stationId') stationId?: string) {
        return this.usersService.findAll(role, stationId);
    }

    @Get('patrol-officers')
    getPatrolOfficers(@Query('stationId') stationId?: string) {
        return this.usersService.getPatrolOfficers(stationId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.usersService.findById(id);
    }

    @Patch(':id')
    @Roles(UserRole.STATION, UserRole.PROVINCE, UserRole.BUREAU, UserRole.HQ)
    update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
        return this.usersService.update(id, updateUserDto);
    }

    @Delete(':id')
    @Roles(UserRole.STATION, UserRole.PROVINCE, UserRole.BUREAU, UserRole.HQ)
    remove(@Param('id') id: string) {
        return this.usersService.remove(id);
    }
}
