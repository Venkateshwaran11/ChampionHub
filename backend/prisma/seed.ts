import { PrismaClient, Role, Platform, PostStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clear existing data
  await prisma.auditLog.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();

  const password = await bcrypt.hash('password123', 10);

  // Users
  const admin = await prisma.user.create({
    data: { name: 'Admin User', email: 'admin@test.com', password, role: Role.ADMIN },
  });

  const creator1 = await prisma.user.create({
    data: { name: 'Creator One', email: 'creator1@test.com', password, role: Role.CREATOR },
  });

  const creator2 = await prisma.user.create({
    data: { name: 'Creator Two', email: 'creator2@test.com', password, role: Role.CREATOR },
  });

  const reviewer1 = await prisma.user.create({
    data: { name: 'Reviewer One', email: 'reviewer1@test.com', password, role: Role.REVIEWER },
  });

  const reviewer2 = await prisma.user.create({
    data: { name: 'Reviewer Two', email: 'reviewer2@test.com', password, role: Role.REVIEWER },
  });

  // Clients
  const client1 = await prisma.client.create({
    data: {
      brandName: 'Nike',
      reviewers: { connect: [{ id: reviewer1.id }, { id: reviewer2.id }] },
    },
  });

  const client2 = await prisma.client.create({
    data: {
      brandName: 'Adidas',
      reviewers: { connect: [{ id: reviewer1.id }] },
    },
  });

  const client3 = await prisma.client.create({
    data: {
      brandName: 'Puma',
      reviewers: { connect: [{ id: reviewer2.id }] },
    },
  });

  // Helper to create posts
  const createPost = async (data: any) => {
    return prisma.post.create({ data });
  };

  // 15+ posts across statuses
  await createPost({ clientId: client1.id, platform: Platform.INSTAGRAM, caption: 'Nike new collection drop!', status: PostStatus.DRAFT, createdById: creator1.id });
  await createPost({ clientId: client1.id, platform: Platform.FACEBOOK, caption: 'Just do it campaign', status: PostStatus.IN_REVIEW, createdById: creator1.id });
  await createPost({ clientId: client1.id, platform: Platform.X, caption: 'Sneaker release soon', status: PostStatus.CHANGES_REQUESTED, createdById: creator2.id });
  await createPost({ clientId: client1.id, platform: Platform.LINKEDIN, caption: 'Corporate partnership news', status: PostStatus.APPROVED, createdById: creator1.id });
  await createPost({ clientId: client2.id, platform: Platform.INSTAGRAM, caption: 'Adidas original series', status: PostStatus.SCHEDULED, scheduledAt: new Date(Date.now() + 86400000), createdById: creator2.id });
  await createPost({ clientId: client2.id, platform: Platform.FACEBOOK, caption: 'Impossible is nothing', status: PostStatus.PUBLISHED, createdById: creator1.id });
  await createPost({ clientId: client2.id, platform: Platform.X, caption: 'New running shoes', status: PostStatus.DRAFT, createdById: creator2.id });
  await createPost({ clientId: client3.id, platform: Platform.INSTAGRAM, caption: 'Puma speed series', status: PostStatus.IN_REVIEW, createdById: creator1.id });
  await createPost({ clientId: client3.id, platform: Platform.LINKEDIN, caption: 'Athlete sponsorship', status: PostStatus.APPROVED, createdById: creator2.id });
  await createPost({ clientId: client1.id, platform: Platform.FACEBOOK, caption: 'Summer collection', status: PostStatus.DRAFT, createdById: creator1.id });
  await createPost({ clientId: client2.id, platform: Platform.INSTAGRAM, caption: 'Limited edition drop', status: PostStatus.CHANGES_REQUESTED, createdById: creator2.id });
  await createPost({ clientId: client3.id, platform: Platform.X, caption: 'Fastest shoe alive', status: PostStatus.SCHEDULED, scheduledAt: new Date(Date.now() + 172800000), createdById: creator1.id });
  await createPost({ clientId: client1.id, platform: Platform.LINKEDIN, caption: 'Sustainability report', status: PostStatus.PUBLISHED, createdById: creator2.id });
  await createPost({ clientId: client2.id, platform: Platform.FACEBOOK, caption: 'Team sports gear', status: PostStatus.IN_REVIEW, createdById: creator1.id });
  await createPost({ clientId: client3.id, platform: Platform.INSTAGRAM, caption: 'Urban style collection', status: PostStatus.DRAFT, createdById: creator2.id });
  await createPost({ clientId: client1.id, platform: Platform.X, caption: 'Flash sale tomorrow', status: PostStatus.APPROVED, createdById: creator1.id });

  console.log('Seed completed!');
  console.log('----- Login Credentials -----');
  console.log('Admin     → admin@test.com / password123');
  console.log('Creator 1 → creator1@test.com / password123');
  console.log('Creator 2 → creator2@test.com / password123');
  console.log('Reviewer 1→ reviewer1@test.com / password123');
  console.log('Reviewer 2→ reviewer2@test.com / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });