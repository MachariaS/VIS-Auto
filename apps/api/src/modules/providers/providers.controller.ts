import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Controller('providers')
export class ProvidersController {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  @Get(':id/profile')
  async getPublicProfile(@Param('id') providerId: string) {
    const [userRows, serviceRows, ratingRows, recentReviews] = await Promise.all([
      this.ds.query(
        `SELECT id, name, "accountType", "createdAt"
         FROM users WHERE id = $1 AND "accountType" = 'provider'`,
        [providerId],
      ),
      this.ds.query(
        `SELECT "serviceName", "serviceCategory", "basePriceKsh", "catalogCode", "visibility"
         FROM provider_services
         WHERE "providerId" = $1 AND "isAcceptingJobs" = true AND visibility = 'public'
         ORDER BY "createdAt" ASC`,
        [providerId],
      ),
      this.ds.query(
        `SELECT
           COUNT(*) FILTER (WHERE status = 'completed') AS completed_jobs,
           COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled_jobs
         FROM roadside_requests WHERE "providerId" = $1`,
        [providerId],
      ),
      this.ds.query(
        `SELECT r.score, r.comment, r."createdAt", u.name AS "customerName"
         FROM ratings r
         LEFT JOIN users u ON u.id = r."customerId"
         WHERE r."providerId" = $1 AND r.comment IS NOT NULL AND r.comment != ''
         ORDER BY r."createdAt" DESC
         LIMIT 5`,
        [providerId],
      ),
    ]);

    if (!userRows.length) throw new NotFoundException('Provider not found.');

    const provider = userRows[0];
    const completedJobs = Number(ratingRows[0]?.completed_jobs ?? 0);
    const cancelledJobs = Number(ratingRows[0]?.cancelled_jobs ?? 0);
    const total = completedJobs + cancelledJobs;
    const completionRate = total > 0 ? Math.round((completedJobs / total) * 100) : null;

    // Compute avgRating separately from the reviews with comments
    const allRatings = await this.ds.query(
      `SELECT AVG(score) AS avg_rating, COUNT(*) AS rating_count FROM ratings WHERE "providerId" = $1`,
      [providerId],
    );

    const avgRating = allRatings[0]?.avg_rating
      ? Math.round(Number(allRatings[0].avg_rating) * 10) / 10
      : null;
    const ratingCount = Number(allRatings[0]?.rating_count ?? 0);

    // Star breakdown (1–5 counts)
    const breakdown = await this.ds.query(
      `SELECT score, COUNT(*) AS count FROM ratings WHERE "providerId" = $1 GROUP BY score ORDER BY score DESC`,
      [providerId],
    );
    const starBreakdown = [5, 4, 3, 2, 1].map((star) => {
      const row = breakdown.find((b: { score: number }) => Number(b.score) === star);
      return { star, count: Number(row?.count ?? 0) };
    });

    return {
      id: provider.id,
      name: provider.name,
      memberSince: provider.createdAt,
      services: serviceRows,
      avgRating,
      ratingCount,
      starBreakdown,
      completedJobs,
      cancelledJobs,
      completionRate,
      recentReviews: recentReviews.map((r: { score: number; comment: string; createdAt: string; customerName: string }) => ({
        score: r.score,
        comment: r.comment,
        customerName: r.customerName || 'Customer',
        createdAt: r.createdAt,
      })),
    };
  }
}
