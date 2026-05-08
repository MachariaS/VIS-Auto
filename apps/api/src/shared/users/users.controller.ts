import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { IsString } from 'class-validator';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

class DeleteAccountDto {
  @IsString()
  password!: string;
}
import { JwtAuthGuard, type AuthenticatedRequest } from '../../shared/auth/jwt-auth.guard';
import { UpdateMyPasswordDto } from './dto/update-my-password.dto';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto';
import { UsersService } from './users.service';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    @InjectDataSource() private readonly ds: DataSource,
  ) {}

  @Get('me/profile')
  getMyProfile(@Request() req: AuthenticatedRequest) {
    return this.usersService.getProfile(req.user.sub);
  }

  @Patch('me/profile')
  updateMyProfile(
    @Request() req: AuthenticatedRequest,
    @Body() dto: UpdateMyProfileDto,
  ) {
    return this.usersService.updateProfile(req.user.sub, dto);
  }

  @Post('me/password')
  updateMyPassword(
    @Request() req: AuthenticatedRequest,
    @Body() dto: UpdateMyPasswordDto,
  ) {
    return this.usersService.updatePassword(req.user.sub, dto);
  }

  @Patch('me/availability')
  toggleAvailability(@Request() req: AuthenticatedRequest) {
    return this.usersService.toggleAvailability(req.user.sub);
  }

  @Delete('me')
  @HttpCode(HttpStatus.OK)
  deleteAccount(@Request() req: AuthenticatedRequest, @Body() dto: DeleteAccountDto) {
    return this.usersService.deleteAccount(req.user.sub, dto.password);
  }

  @Get('me/provider-stats')
  async providerStats(@Request() req: AuthenticatedRequest) {
    const providerId = req.user.sub;
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [jobRows, ratingRows] = await Promise.all([
      this.ds.query(
        `SELECT
           status,
           "issueType",
           SUM("estimatedPriceKsh") AS earnings,
           COUNT(*) AS count,
           MAX("createdAt") AS last_job
         FROM roadside_requests
         WHERE "providerId" = $1
         GROUP BY status, "issueType"`,
        [providerId],
      ),
      this.ds.query(
        `SELECT AVG(score) AS avg_rating, COUNT(*) AS rating_count
         FROM ratings WHERE "providerId" = $1`,
        [providerId],
      ),
    ]);

    const completed = jobRows.filter((r: { status: string }) => r.status === 'completed');
    const cancelled = jobRows.filter((r: { status: string }) => r.status === 'cancelled');

    const totalEarnings = completed.reduce((s: number, r: { earnings: string }) => s + Number(r.earnings), 0);
    const completedCount = completed.reduce((s: number, r: { count: string }) => s + Number(r.count), 0);
    const cancelledCount = cancelled.reduce((s: number, r: { count: string }) => s + Number(r.count), 0);
    const completionRate = completedCount + cancelledCount > 0
      ? Math.round((completedCount / (completedCount + cancelledCount)) * 100)
      : 100;

    // Earnings this month and last month from raw query
    const [thisMonthRow, lastMonthRow] = await Promise.all([
      this.ds.query(
        `SELECT COALESCE(SUM("estimatedPriceKsh"), 0) AS earnings
         FROM roadside_requests
         WHERE "providerId" = $1 AND status = 'completed' AND "createdAt" >= $2`,
        [providerId, startOfThisMonth],
      ),
      this.ds.query(
        `SELECT COALESCE(SUM("estimatedPriceKsh"), 0) AS earnings
         FROM roadside_requests
         WHERE "providerId" = $1 AND status = 'completed'
           AND "createdAt" >= $2 AND "createdAt" < $3`,
        [providerId, startOfLastMonth, startOfThisMonth],
      ),
    ]);

    // Top earning service type
    const byService = completed.map((r: { issueType: string; earnings: string; count: string }) => ({
      name: r.issueType,
      earnings: Number(r.earnings),
      count: Number(r.count),
    }));
    byService.sort((a: { earnings: number }, b: { earnings: number }) => b.earnings - a.earnings);

    return {
      totalEarnings: Math.round(totalEarnings),
      thisMonthEarnings: Math.round(Number(thisMonthRow[0]?.earnings ?? 0)),
      lastMonthEarnings: Math.round(Number(lastMonthRow[0]?.earnings ?? 0)),
      completedJobs: completedCount,
      cancelledJobs: cancelledCount,
      completionRate,
      avgRating: ratingRows[0]?.avg_rating ? Math.round(Number(ratingRows[0].avg_rating) * 10) / 10 : null,
      ratingCount: Number(ratingRows[0]?.rating_count ?? 0),
      topService: byService[0] ?? null,
    };
  }
}
