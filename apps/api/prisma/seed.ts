/**
 * EKUSA Digital Platform - Database Seeder
 * Initializes default permissions, roles, and a root Super Admin account
 */

import { PrismaClient, AccountStatus } from '@prisma/client';
import * as argon2 from 'argon2';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

const PERMISSIONS = [
  { name: 'publish_announcements', description: 'Publish and manage institutional announcements' },
  { name: 'approve_membership', description: 'Approve or reject student membership applications' },
  { name: 'create_events', description: 'Create and organize official events' },
  { name: 'manage_welfare', description: 'Review and disburse welfare requests' },
  { name: 'manage_finances', description: 'Access financial records and transaction audits' },
  { name: 'manage_admins', description: 'Assign roles and permissions to other leaders' },
  { name: 'view_audit_logs', description: 'Inspect institutional compliance and security logs' },
  { name: 'manage_settings', description: 'Configure platform-level system settings' },
  { name: 'manage_community', description: 'Moderate community groups and public discussions' },
  { name: 'manage_leadership', description: 'Manage leadership transitions and officer rosters' },
];

const ROLES = [
  {
    name: 'super_admin',
    displayName: 'Super Administrator',
    description: 'Full unconstrained platform control and administrative privileges',
    permissions: PERMISSIONS.map((p) => p.name),
  },
  {
    name: 'chairperson',
    displayName: 'Chairperson',
    description: 'Executive head with institutional oversight',
    permissions: [
      'publish_announcements',
      'approve_membership',
      'create_events',
      'manage_welfare',
      'manage_finances',
      'view_audit_logs',
      'manage_leadership',
    ],
  },
  {
    name: 'secretary',
    displayName: 'Secretary General',
    description: 'Official communications and records',
    permissions: ['publish_announcements', 'approve_membership', 'create_events', 'view_audit_logs'],
  },
  {
    name: 'treasurer',
    displayName: 'Treasurer',
    description: 'Financial records and welfare disbursements',
    permissions: ['manage_finances', 'manage_welfare', 'view_audit_logs'],
  },
  {
    name: 'ordinary_member',
    displayName: 'Ordinary Member',
    description: 'Verified student member with standard access',
    permissions: [],
  },
];

async function main() {
  console.log('Starting EKUSA database seeding...');

  // 1. Seed Permissions
  console.log('Seeding permissions...');
  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: { description: perm.description },
      create: { name: perm.name, description: perm.description },
    });
  }

  const allPerms = await prisma.permission.findMany();
  const permMap = new Map(allPerms.map((p) => [p.name, p.id]));

  // 2. Seed Roles
  console.log('Seeding roles...');
  const roleMap = new Map<string, string>();

  for (const roleDef of ROLES) {
    const role = await prisma.role.upsert({
      where: { name: roleDef.name },
      update: {
        displayName: roleDef.displayName,
        description: roleDef.description,
        permissions: roleDef.permissions,
      },
      create: {
        name: roleDef.name,
        displayName: roleDef.displayName,
        description: roleDef.description,
        permissions: roleDef.permissions,
      },
    });
    roleMap.set(roleDef.name, role.id);

    // Link RolePermission records
    for (const permName of roleDef.permissions) {
      const permId = permMap.get(permName);
      if (permId) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: permId,
            },
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId: permId,
          },
        });
      }
    }
  }

  // 3. Seed Super Admin User
  const adminUsername = 'superadmin';
  const adminEmail = 'admin@ekusa.ac.ke';
  const adminPhone = '+254700000000';
  const adminPassword = 'AdminPassword@2026!';

  console.log(`Hashing password and creating Super Admin user (${adminUsername})...`);

  const passwordHash = await argon2.hash(adminPassword, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16,
    timeCost: 3,
    parallelism: 1,
  });

  const existingAdmin = await prisma.user.findFirst({
    where: {
      OR: [{ username: adminUsername }, { email: adminEmail }],
    },
  });

  let adminUser: any;
  if (existingAdmin) {
    adminUser = await prisma.user.update({
      where: { id: existingAdmin.id },
      data: {
        passwordHash,
        accountStatus: AccountStatus.verified_member,
      },
    });
    console.log('Super Admin user updated.');
  } else {
    adminUser = await prisma.user.create({
      data: {
        username: adminUsername,
        email: adminEmail,
        phoneNumber: adminPhone,
        passwordHash,
        accountStatus: AccountStatus.verified_member,
      },
    });
    console.log('Super Admin user created.');
  }

  // Ensure Profile exists
  await prisma.profile.upsert({
    where: { userId: adminUser.id },
    update: {
      displayName: 'Super Administrator',
    },
    create: {
      userId: adminUser.id,
      displayName: 'Super Administrator',
    },
  });

  // Assign super_admin role
  const superAdminRoleId = roleMap.get('super_admin');
  if (superAdminRoleId) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: adminUser.id,
          roleId: superAdminRoleId,
        },
      },
      update: {},
      create: {
        userId: adminUser.id,
        roleId: superAdminRoleId,
        assignedBy: adminUser.id,
      },
    });
    console.log('Super Admin role assigned successfully.');
  }

  // 4. Seed Published Announcements
  console.log('Seeding published announcements...');
  const SAMPLE_ANNOUNCEMENTS = [
    {
      title: 'Annual General Meeting (AGM) Notice',
      body: 'Notice is hereby given that the Annual General Meeting of EKUSA will be held at the Main Auditorium on March 15th. All verified members are invited.',
      category: 'general',
      priority: 'urgent',
      pinned: true,
      status: 'published',
    },
    {
      title: 'Emergency Welfare Support Disbursement',
      body: 'The Welfare Committee has approved KES 500,000 for emergency student financial support. Eligible students can apply via the Welfare tab.',
      category: 'welfare',
      priority: 'important',
      pinned: true,
      status: 'published',
    },
    {
      title: 'EKUSA Inter-Campus Sports Tournament',
      body: 'Registration is open for the upcoming Inter-Campus Sports Tournament. Form your teams and register under the Events section.',
      category: 'event',
      priority: 'normal',
      pinned: false,
      status: 'published',
    },
    {
      title: 'Student Leadership Dialogue Series',
      body: 'Join the EKUSA Executive Council this Friday for an interactive townhall session addressing student affairs and campus welfare.',
      category: 'leadership',
      priority: 'important',
      pinned: false,
      status: 'published',
    },
  ];

  for (const item of SAMPLE_ANNOUNCEMENTS) {
    const existing = await prisma.announcement.findFirst({
      where: { title: item.title },
    });

    if (!existing) {
      await prisma.announcement.create({
        data: {
          title: item.title,
          body: item.body,
          category: item.category as any,
          priority: item.priority as any,
          status: 'published',
          pinned: item.pinned,
          publishedAt: new Date(),
          publisherId: adminUser.id,
          targets: {
            create: [{ targetType: 'everyone', targetValue: 'all' }],
          },
        },
      });
    }
  }

  console.log('EKUSA database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
