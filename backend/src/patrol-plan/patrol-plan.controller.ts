import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
import { PatrolPlanService } from './patrol-plan.service';
import { CreatePatrolPlanDto } from './dto/create-patrol-plan.dto';
import { UpdatePatrolPlanDto } from './dto/update-patrol-plan.dto';
import { CreateCheckpointDto } from './dto/create-checkpoint.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AssignmentStatus } from '@prisma/client';

@Controller('api/patrol-plans')
@UseGuards(JwtAuthGuard)
export class PatrolPlanController {
    constructor(private readonly patrolPlanService: PatrolPlanService) { }

    // ==================== PLANS ====================

    @Post()
    create(@Body() createDto: CreatePatrolPlanDto, @Request() req: any) {
        return this.patrolPlanService.create(createDto, req.user.sub);
    }

    @Get()
    findAll(
        @Query('stationId') stationId?: string,
        @Query('isActive') isActive?: string,
        @Query('fromDate') fromDate?: string,
        @Query('toDate') toDate?: string,
    ) {
        return this.patrolPlanService.findAll({
            stationId,
            isActive: isActive === 'false' ? false : true,
            fromDate: fromDate ? new Date(fromDate) : undefined,
            toDate: toDate ? new Date(toDate) : undefined,
        });
    }

    @Get('stats')
    getStats(@Query('stationId') stationId?: string) {
        return this.patrolPlanService.getStats(stationId);
    }

    @Get('my-assignments')
    getMyAssignments(
        @Request() req: any,
        @Query('date') date?: string,
    ) {
        return this.patrolPlanService.getMyAssignments(
            req.user.sub,
            date ? new Date(date) : undefined,
        );
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.patrolPlanService.findById(id);
    }

    @Get(':id/progress')
    getPlanProgress(
        @Param('id') id: string,
        @Query('date') date?: string,
    ) {
        return this.patrolPlanService.getPlanProgress(
            id,
            date ? new Date(date) : new Date(),
        );
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateDto: UpdatePatrolPlanDto) {
        return this.patrolPlanService.update(id, updateDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.patrolPlanService.delete(id);
    }

    // ==================== CHECKPOINTS ====================

    @Post(':id/checkpoints')
    addCheckpoint(
        @Param('id') planId: string,
        @Body() checkpointDto: CreateCheckpointDto,
    ) {
        return this.patrolPlanService.addCheckpoint(planId, checkpointDto);
    }

    @Patch('checkpoints/:checkpointId')
    updateCheckpoint(
        @Param('checkpointId') checkpointId: string,
        @Body() updateData: Partial<CreateCheckpointDto>,
    ) {
        return this.patrolPlanService.updateCheckpoint(checkpointId, updateData);
    }

    @Delete('checkpoints/:checkpointId')
    deleteCheckpoint(@Param('checkpointId') checkpointId: string) {
        return this.patrolPlanService.deleteCheckpoint(checkpointId);
    }

    @Post(':id/checkpoints/reorder')
    reorderCheckpoints(
        @Param('id') planId: string,
        @Body() body: { checkpointIds: string[] },
    ) {
        return this.patrolPlanService.reorderCheckpoints(planId, body.checkpointIds);
    }

    // ==================== ASSIGNMENTS ====================

    @Post(':id/assign')
    assignToUser(
        @Param('id') planId: string,
        @Body() body: { userId: string; scheduledDate: string },
    ) {
        return this.patrolPlanService.assignToUser(
            planId,
            body.userId,
            new Date(body.scheduledDate),
        );
    }

    @Patch('assignments/:assignmentId/status')
    updateAssignmentStatus(
        @Param('assignmentId') assignmentId: string,
        @Body() body: { status: AssignmentStatus },
    ) {
        return this.patrolPlanService.updateAssignmentStatus(assignmentId, body.status);
    }

    // ==================== CHECKPOINT COMPLETION ====================

    @Post('checkpoints/:checkpointId/visit')
    recordCheckpointVisit(
        @Param('checkpointId') checkpointId: string,
        @Request() req: any,
        @Body() visitData: {
            latitude: number;
            longitude: number;
            photo?: string;
            note?: string;
        },
    ) {
        return this.patrolPlanService.recordCheckpointVisit(
            checkpointId,
            req.user.sub,
            visitData,
        );
    }

    @Patch('completions/:completionId/leave')
    markCheckpointLeft(@Param('completionId') completionId: string) {
        return this.patrolPlanService.markCheckpointLeft(completionId);
    }
}
