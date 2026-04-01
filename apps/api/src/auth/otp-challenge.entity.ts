import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'otp_challenges' })
export class OtpChallengeEntity {
  @PrimaryColumn()
  email!: string;

  @Column()
  code!: string;

  @Column({ type: 'bigint' })
  expiresAt!: number;
}
