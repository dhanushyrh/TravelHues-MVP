import 'reflect-metadata';
import * as path from 'path';
import * as bcrypt from 'bcrypt';
// Load tsconfig paths so @common/* etc. resolve
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('tsconfig-paths').register({
  baseUrl: path.resolve(__dirname, '../../..'),
  paths: {
    '@common/*': ['src/common/*'],
    '@config/*': ['src/config/*'],
    '@database/*': ['src/database/*'],
    '@modules/*': ['src/modules/*'],
  },
});

import * as dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import { DataSource } from 'typeorm';
import slugify from 'slugify';
import { destinationData, DestinationSeed } from './destinations.data';
import { subscriptionPlanData } from './subscription-plans.data';

// ── Inline DataSource (avoids full NestJS bootstrap) ─────────────────────────
const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'travelhues',
  password: process.env.DB_PASSWORD || 'travelhues_secret',
  database: process.env.DB_DATABASE || 'travelhues_db',
  synchronize: false,
  entities: [path.resolve(__dirname, '../entities/*.entity.{ts,js}')],
});

// ── Helpers ───────────────────────────────────────────────────────────────────
async function uniqueSlug(base: string, existing: Set<string>): Promise<string> {
  let slug = slugify(base, { lower: true, strict: true });
  let i = 0;
  while (existing.has(slug)) {
    i++;
    slug = `${slugify(base, { lower: true, strict: true })}-${i}`;
  }
  existing.add(slug);
  return slug;
}

// ── Seed destinations ─────────────────────────────────────────────────────────
async function seedDestinations() {
  const repo = AppDataSource.getRepository('destinations');
  const usedSlugs = new Set<string>(
    (await repo.find({ select: ['slug'] })).map((d: any) => d.slug).filter(Boolean),
  );

  let countryCount = 0;
  let cityCount = 0;

  for (const country of destinationData) {
    // Skip if already exists
    const exists = await repo.findOne({ where: { name: country.name, type: country.type } });
    if (exists) {
      console.log(`  skip (exists): ${country.name}`);
      continue;
    }

    const slug = await uniqueSlug(country.name, usedSlugs);
    const saved = await repo.save(
      repo.create({
        name: country.name,
        slug,
        type: country.type,
        continent: country.continent,
        countryCode: country.countryCode,
        currency: country.currency,
        timezone: country.timezone,
        bestTimeToVisit: country.bestTimeToVisit,
        description: country.description,
        isActive: true,
      }),
    );
    countryCount++;
    console.log(`  ✓ ${country.name} (${country.continent})`);

    // Insert cities
    for (const city of country.cities || []) {
      const cityExists = await repo.findOne({ where: { name: city.name, parentId: saved.id } });
      if (cityExists) continue;

      const citySlug = await uniqueSlug(city.name, usedSlugs);
      await repo.save(
        repo.create({
          name: city.name,
          slug: citySlug,
          type: city.type,
          continent: country.continent,
          countryCode: country.countryCode,
          currency: country.currency,
          timezone: country.timezone,
          bestTimeToVisit: city.bestTimeToVisit || country.bestTimeToVisit,
          description: city.description,
          parentId: saved.id,
          isActive: true,
        }),
      );
      cityCount++;
      console.log(`      └─ ${city.name}`);
    }
  }

  return { countryCount, cityCount };
}

// ── Seed subscription plans ───────────────────────────────────────────────────
async function seedSubscriptionPlans() {
  const repo = AppDataSource.getRepository('subscription_plans');
  let count = 0;

  for (const plan of subscriptionPlanData) {
    const exists = await repo.findOne({ where: { name: plan.name } });
    if (exists) {
      console.log(`  skip (exists): ${plan.name}`);
      continue;
    }
    await repo.save(repo.create(plan));
    count++;
    console.log(`  ✓ ${plan.name} — ₹${plan.price} / ${plan.billingPeriod}`);
  }

  return count;
}

// ── Seed admin user ───────────────────────────────────────────────────────────
async function seedAdminUser() {
  const repo = AppDataSource.getRepository('users');
  const email = 'admin@travelhues.com';
  const exists = await repo.findOne({ where: { email } });
  if (exists) {
    console.log(`  skip (exists): ${email}`);
    return false;
  }

  const passwordHash = await bcrypt.hash('Admin@123', 10);
  await repo.save(
    repo.create({
      email,
      passwordHash,
      firstName: 'TravelHues',
      lastName: 'Admin',
      role: 'admin',
      isEmailVerified: true,
      isActive: true,
    }),
  );
  console.log(`  ✓ ${email}  (password: Admin@123)`);
  return true;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🌱  TravelHues seed starting...\n');

  try {
    await AppDataSource.initialize();
    console.log('✅  Database connected\n');

    console.log('👤  Seeding Admin User...');
    await seedAdminUser();
    console.log('');

    console.log('📍  Seeding Destinations...');
    const { countryCount, cityCount } = await seedDestinations();
    console.log(`\n    → ${countryCount} countries, ${cityCount} cities inserted\n`);

    console.log('💳  Seeding Subscription Plans...');
    const planCount = await seedSubscriptionPlans();
    console.log(`\n    → ${planCount} plans inserted\n`);

    console.log('🎉  Seed complete!\n');
  } catch (err) {
    console.error('❌  Seed failed:', err);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
  }
}

main();
