import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePatrolPlanDto } from './dto/create-patrol-plan.dto';
import { UpdatePatrolPlanDto } from './dto/update-patrol-plan.dto';
import { CreateCheckpointDto } from './dto/create-checkpoint.dto';
import { AssignmentStatus } from '@prisma/client';

@Injectable()
export class PatrolPlanService {
    constructor(private prisma: PrismaService) { }

    async create(createDto: CreatePatrolPlanDto, userId: string) {
        const { checkpoints, ...planData } = createDto;

        return this.prisma.patrolPlan.create({
            data: {
                ...planData,
                createdById: userId,
                checkpoints: checkpoints ? {
                    create: checkpoints.map((cp, index) => ({
                        ...cp,
                        sequence: cp.sequence ?? index + 1,
                    })),
                } : undefined,
            },
            include: {
                station: true,
                createdBy: {
                    select: { id: true, firstName: true, lastName: true, rank: true },
                },
                checkpoints: {
                    orderBy: { sequence: 'asc' },
                    include: { poi: true },
                },
                assignments: {
                    include: {
                        user: {
                            select: { id: true, firstName: true, lastName: true, rank: true },
                        },
                    },
                },
            },
        });
    }

    async findAll(filters?: {
        stationId?: string;
        isActive?: boolean;
        fromDate?: Date;
        toDate?: Date;
    }) {
        return this.prisma.patrolPlan.findMany({
            where: {
                ...(filters?.stationId && { stationId: filters.stationId }),
                isActive: filters?.isActive ?? true,
                ...(filters?.fromDate && {
                    startTime: { gte: filters.fromDate },
                }),
                ...(filters?.toDate && {
                    endTime: { lte: filters.toDate },
                }),
            },
            include: {
                station: { select: { id: true, name: true } },
                createdBy: {
                    select: { id: true, firstName: true, lastName: true, rank: true },
                },
                checkpoints: {
                    orderBy: { sequence: 'asc' },
                },
                assignments: {
                    include: {
                        user: {
                            select: { id: true, firstName: true, lastName: true, rank: true },
                        },
                    },
                },
                _count: {
                    select: { checkpoints: true, assignments: true },
                },
            },
            orderBy: { startTime: 'desc' },
        });
    }

    async findById(id: string) {
        const plan = await this.prisma.patrolPlan.findUnique({
            where: { id },
            include: {
                station: { include: { province: true } },
                createdBy: {
                    select: { id: true, firstName: true, lastName: true, rank: true },
                },
                checkpoints: {
                    orderBy: { sequence: 'asc' },
                    include: {
                        poi: true,
                        completions: {
                            orderBy: { arrivedAt: 'desc' },
                            take: 10,
                            include: {
                                user: {
                                    select: { id: true, firstName: true, lastName: true, rank: true },
                                },
                            },
                        },
                    },
                },
                assignments: {
                    include: {
                        user: {
                            select: { id: true, firstName: true, lastName: true, rank: true, avatar: true },
                        },
                    },
                    orderBy: { scheduledDate: 'desc' },
                },
            },
        });

        if (!plan) {
            throw new NotFoundException('ไม่พบแผนการตรวจ');
        }

        return plan;
    }

    async update(id: string, updateDto: UpdatePatrolPlanDto) {
        await this.findById(id);

        return this.prisma.patrolPlan.update({
            where: { id },
            data: updateDto,
            include: {
                station: true,
                checkpoints: { orderBy: { sequence: 'asc' } },
                assignments: true,
            },
        });
    }

    async delete(id: string) {
        await this.findById(id);

        return this.prisma.patrolPlan.update({
            where: { id },
            data: { isActive: false },
        });
    }

    // ==================== CHECKPOINTS ====================

    async addCheckpoint(planId: string, checkpointDto: CreateCheckpointDto) {
        await this.findById(planId);

        // Get max sequence number
        const maxSeq = await this.prisma.patrolCheckpoint.aggregate({
            where: { planId },
            _max: { sequence: true },
        });

        return this.prisma.patrolCheckpoint.create({
            data: {
                ...checkpointDto,
                planId,
                sequence: checkpointDto.sequence ?? (maxSeq._max.sequence || 0) + 1,
            },
            include: { poi: true },
        });
    }

    async updateCheckpoint(checkpointId: string, updateData: Partial<CreateCheckpointDto>) {
        return this.prisma.patrolCheckpoint.update({
            where: { id: checkpointId },
            data: updateData,
            include: { poi: true },
        });
    }

    async deleteCheckpoint(checkpointId: string) {
        return this.prisma.patrolCheckpoint.delete({
            where: { id: checkpointId },
        });
    }

    async reorderCheckpoints(planId: string, checkpointIds: string[]) {
        await this.findById(planId);

        const updates = checkpointIds.map((id, index) =>
            this.prisma.patrolCheckpoint.update({
                where: { id },
                data: { sequence: index + 1 },
            })
        );

        await this.prisma.$transaction(updates);

        return this.prisma.patrolCheckpoint.findMany({
            where: { planId },
            orderBy: { sequence: 'asc' },
        });
    }

    // ==================== ASSIGNMENTS ====================

    async assignToUser(planId: string, userId: string, scheduledDate: Date) {
        await this.findById(planId);

        // Check if already assigned for this date
        const existing = await this.prisma.patrolAssignment.findFirst({
            where: {
                planId,
                userId,
                scheduledDate: {
                    gte: new Date(scheduledDate.setHours(0, 0, 0, 0)),
                    lt: new Date(scheduledDate.setHours(23, 59, 59, 999)),
                },
            },
        });

        if (existing) {
            throw new BadRequestException('สายตรวจนี้ได้รับมอบหมายแผนนี้แล้วในวันที่กำหนด');
        }

        return this.prisma.patrolAssignment.create({
            data: {
                planId,
                userId,
                scheduledDate,
            },
            include: {
                user: {
                    select: { id: true, firstName: true, lastName: true, rank: true },
                },
                plan: { select: { id: true, name: true } },
            },
        });
    }

    async updateAssignmentStatus(assignmentId: string, status: AssignmentStatus) {
        return this.prisma.patrolAssignment.update({
            where: { id: assignmentId },
            data: {
                status,
                completedAt: status === AssignmentStatus.COMPLETED ? new Date() : undefined,
            },
        });
    }

    async getMyAssignments(userId: string, date?: Date) {
        const whereDate = date ? {
            scheduledDate: {
                gte: new Date(date.setHours(0, 0, 0, 0)),
                lt: new Date(date.setHours(23, 59, 59, 999)),
            },
        } : {};

        return this.prisma.patrolAssignment.findMany({
            where: {
                userId,
                ...whereDate,
            },
            include: {
                plan: {
                    include: {
                        checkpoints: {
                            orderBy: { sequence: 'asc' },
                            include: { poi: true },
                        },
                        station: true,
                    },
                },
            },
            orderBy: { scheduledDate: 'asc' },
        });
    }

    // ==================== CHECKPOINT COMPLETION ====================

    async recordCheckpointVisit(
        checkpointId: string,
        userId: string,
        visitData: {
            latitude: number;
            longitude: number;
            photo?: string;
            note?: string;
        }
    ) {
        const checkpoint = await this.prisma.patrolCheckpoint.findUnique({
            where: { id: checkpointId },
            include: { plan: true },
        });

        if (!checkpoint) {
            throw new NotFoundException('ไม่พบ Checkpoint');
        }

        // Calculate distance to checkpoint
        const distance = this.calculateDistance(
            visitData.latitude,
            visitData.longitude,
            checkpoint.latitude,
            checkpoint.longitude
        );

        // Check if within radius (in kilometers, convert checkpoint radius from meters)
        if (distance * 1000 > checkpoint.radius) {
            throw new BadRequestException(
                `คุณอยู่ห่างจากจุดตรวจ ${Math.round(distance * 1000)} เมตร (ต้องอยู่ภายใน ${checkpoint.radius} เมตร)`
            );
        }

        return this.prisma.checkpointCompletion.create({
            data: {
                checkpointId,
                userId,
                arrivedAt: new Date(),
                ...visitData,
            },
            include: {
                checkpoint: true,
                user: {
                    select: { id: true, firstName: true, lastName: true, rank: true },
                },
            },
        });
    }

    async markCheckpointLeft(completionId: string) {
        return this.prisma.checkpointCompletion.update({
            where: { id: completionId },
            data: { leftAt: new Date() },
        });
    }

    // ==================== PROGRESS & STATS ====================

    async getPlanProgress(planId: string, date: Date) {
        const plan = await this.findById(planId);

        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const completions = await this.prisma.checkpointCompletion.findMany({
            where: {
                checkpoint: { planId },
                arrivedAt: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
            },
            include: {
                checkpoint: true,
                user: {
                    select: { id: true, firstName: true, lastName: true, rank: true },
                },
            },
        });

        const totalCheckpoints = plan.checkpoints.length;
        const completedCheckpointIds = new Set(completions.map(c => c.checkpointId));
        const completedCount = completedCheckpointIds.size;
        const complianceRate = totalCheckpoints > 0
            ? (completedCount / totalCheckpoints) * 100
            : 0;

        return {
            plan,
            date,
            totalCheckpoints,
            completedCount,
            complianceRate: Math.round(complianceRate * 100) / 100,
            completions,
            pendingCheckpoints: plan.checkpoints.filter(
                cp => !completedCheckpointIds.has(cp.id)
            ),
        };
    }

    async getStats(stationId?: string) {
        const where = stationId ? { stationId, isActive: true } : { isActive: true };

        const [totalPlans, totalCheckpoints, totalAssignments, todayCompletions] = await Promise.all([
            this.prisma.patrolPlan.count({ where }),
            this.prisma.patrolCheckpoint.count({
                where: { plan: where },
            }),
            this.prisma.patrolAssignment.count({
                where: { plan: where },
            }),
            this.prisma.checkpointCompletion.count({
                where: {
                    checkpoint: { plan: where },
                    arrivedAt: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    },
                },
            }),
        ]);

        return {
            totalPlans,
            totalCheckpoints,
            totalAssignments,
            todayCompletions,
        };
    }

    // Helper: Haversine distance
    private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
        const R = 6371;
        const dLat = this.toRad(lat2 - lat1);
        const dLng = this.toRad(lng2 - lng1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private toRad(deg: number): number {
        return deg * (Math.PI / 180);
    }
}
