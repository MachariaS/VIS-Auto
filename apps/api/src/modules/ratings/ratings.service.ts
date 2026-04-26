import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RatingEntity } from './rating.entity';

@Injectable()
export class RatingsService {
  constructor(
    @InjectRepository(RatingEntity)
    private readonly repo: Repository<RatingEntity>,
  ) {}

  async submit(
    customerId: string,
    roadsideRequestId: string,
    score: number,
    comment: string | undefined,
    providerId: string,
    requestOwnerId: string,
    requestStatus: string,
  ) {
    if (requestOwnerId !== customerId) {
      throw new ForbiddenException('You can only rate your own requests.');
    }
    if (requestStatus !== 'completed') {
      throw new BadRequestException('You can only rate completed requests.');
    }
    if (score < 1 || score > 5 || !Number.isInteger(score)) {
      throw new BadRequestException('Score must be an integer between 1 and 5.');
    }

    const existing = await this.repo.findOneBy({ roadsideRequestId });
    if (existing) {
      throw new BadRequestException('This request has already been rated.');
    }

    const rating = this.repo.create({ roadsideRequestId, customerId, providerId, score, comment });
    const saved = await this.repo.save(rating);
    return { ...saved, createdAt: saved.createdAt.toISOString() };
  }

  async getForProvider(providerId: string) {
    const ratings = await this.repo.find({
      where: { providerId },
      order: { createdAt: 'DESC' },
      take: 50,
    });

    const count = ratings.length;
    const average = count > 0
      ? Math.round((ratings.reduce((s, r) => s + r.score, 0) / count) * 10) / 10
      : null;

    const distribution = [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: ratings.filter((r) => r.score === star).length,
    }));

    return {
      average,
      count,
      distribution,
      reviews: ratings.map((r) => ({
        id: r.id,
        score: r.score,
        comment: r.comment,
        createdAt: r.createdAt.toISOString(),
      })),
    };
  }

  async hasRated(customerId: string, roadsideRequestId: string) {
    const exists = await this.repo.findOneBy({ customerId, roadsideRequestId });
    return { rated: !!exists };
  }
}
