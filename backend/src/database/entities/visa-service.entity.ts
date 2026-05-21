import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from './product.entity';

@Entity('visa_services')
export class VisaService {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  visaType: string; // tourist, business, student, transit

  @Column({ nullable: true })
  targetCountry: string;

  @Column({ type: 'simple-array', nullable: true })
  eligibleNationalities: string[];

  @Column({ nullable: true })
  processingTime: string; // e.g. "5-7 business days"

  @Column({ nullable: true })
  validityPeriod: string;

  @Column({ nullable: true })
  entryType: string; // single, double, multiple

  @Column({ nullable: true })
  maxStayDuration: string;

  @Column({ type: 'simple-array', nullable: true })
  requiredDocuments: string[];

  @Column({ type: 'simple-array', nullable: true })
  includes: string[];

  @Column({ nullable: true })
  successRate: string;

  @Column({ nullable: true })
  consultationIncluded: boolean;

  @Column({ nullable: true })
  expediteAvailable: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  governmentFee: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  // Relations
  @OneToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column()
  productId: string;
}
