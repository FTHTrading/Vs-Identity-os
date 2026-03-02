/**
 * Prisma Seed Script
 * Creates initial tenant, super admin user, and sample profiles
 *
 * Run: pnpm db:seed
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Identity Capsule OS...');

  // ─────────────────────────────────────────────
  // Tenant
  // ─────────────────────────────────────────────
  const tenantName = process.env.SEED_TENANT_NAME ?? 'HQ';
  const tenantDomain = process.env.SEED_TENANT_DOMAIN ?? 'identitycapsule.internal';

  const tenant = await prisma.tenant.upsert({
    where: { domain: tenantDomain },
    update: {},
    create: {
      name: tenantName,
      domain: tenantDomain,
      primaryColor: '#1e293b',
      accentColor: '#6366f1',
    },
  });
  console.log(`✅ Tenant: ${tenant.name} (${tenant.id})`);

  // ─────────────────────────────────────────────
  // Super Admin User
  // ─────────────────────────────────────────────
  const adminEmail = process.env.SEED_SUPER_ADMIN_EMAIL ?? 'admin@identitycapsule.internal';
  const adminPassword = process.env.SEED_SUPER_ADMIN_PASSWORD ?? 'ChangeMe_SuperSecure_2024!';
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: adminEmail } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: adminEmail,
      name: 'System Administrator',
      passwordHash,
      role: 'SUPER_ADMIN',
    },
  });
  console.log(`✅ Admin user: ${admin.email}`);

  // ─────────────────────────────────────────────
  // Sample Profiles
  // ─────────────────────────────────────────────
  const sampleProfiles = [
    {
      slug: 'alex-chen',
      fullName: 'Alexandra Chen',
      title: 'Chief Technology Officer',
      organization: tenantName,
      email: 'alex.chen@example.com',
      phone: '+1 (555) 001-0001',
      website: 'https://example.com',
      linkedIn: 'https://linkedin.com/in/alex-chen',
      bio: 'Scaling engineering culture and infrastructure. 15+ years in distributed systems.',
      department: 'Technology',
      location: 'San Francisco, CA',
      roleTags: ['Leadership', 'Engineering', 'C-Suite'],
      isPublic: true,
    },
    {
      slug: 'marcus-wells',
      fullName: 'Marcus Wells',
      title: 'Head of Security',
      organization: tenantName,
      email: 'marcus.wells@example.com',
      phone: '+1 (555) 001-0002',
      bio: 'Zero-trust architecture advocate. Former CISO at two Fortune 500 companies.',
      department: 'Security',
      location: 'Austin, TX',
      roleTags: ['Security', 'Leadership'],
      isPublic: true,
    },
    {
      slug: 'priya-kapoor',
      fullName: 'Priya Kapoor',
      title: 'Principal Engineer',
      organization: tenantName,
      email: 'priya.kapoor@example.com',
      github: 'priyakapoor',
      bio: 'Open-source contributor. Specializes in Rust, WebAssembly, and distributed consensus.',
      department: 'Engineering',
      location: 'New York, NY',
      roleTags: ['Engineering', 'Open Source'],
      isPublic: true,
    },
  ];

  for (const profileData of sampleProfiles) {
    const profile = await prisma.profile.upsert({
      where: { tenantId_slug: { tenantId: tenant.id, slug: profileData.slug } },
      update: {},
      create: {
        ...profileData,
        tenantId: tenant.id,
        createdById: admin.id,
      },
    });
    console.log(`✅ Profile: ${profile.fullName} (/${profile.slug})`);
  }

  console.log('\n🎉 Seed complete!');
  console.log(`\n🔑 Admin login:`);
  console.log(`   Email:    ${adminEmail}`);
  console.log(`   Password: ${adminPassword}`);
  console.log(`\n🌐 Start the app: pnpm dev`);
  console.log(`   Dashboard: http://localhost:3000/dashboard`);
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
