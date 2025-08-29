import { PrismaClient } from '@prisma/client';
import { hashPassword } from '@/utils/password';
import { logger } from '@/utils/logger';

const prisma = new PrismaClient();

async function initDatabase() {
  try {
    logger.info('Starting database initialization...');

    // Check if database is already seeded
    const existingUsers = await prisma.user.count();
    if (existingUsers > 0) {
      logger.info('Database already contains data. Skipping seed.');
      return;
    }

    // Create default admin user
    const adminPassword = await hashPassword('Admin123!@#');
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@mayalens.com',
        password: adminPassword,
        firstName: 'System',
        lastName: 'Administrator',
        role: 'SYSTEM_ADMIN',
        isEmailVerified: true,
        isActive: true
      }
    });

    logger.info(`Created admin user: ${adminUser.email}`);

    // Create default team for admin
    const adminTeam = await prisma.team.create({
      data: {
        name: 'MayaLens Admin Team',
        description: 'Default administrative team',
        ownerId: adminUser.id,
        isActive: true
      }
    });

    // Update admin user with team
    await prisma.user.update({
      where: { id: adminUser.id },
      data: { teamId: adminTeam.id }
    });

    logger.info(`Created admin team: ${adminTeam.name}`);

    // Create sample team owner
    const ownerPassword = await hashPassword('Owner123!@#');
    const ownerUser = await prisma.user.create({
      data: {
        email: 'owner@example.com',
        password: ownerPassword,
        firstName: 'Team',
        lastName: 'Owner',
        role: 'TEAM_OWNER',
        isEmailVerified: true,
        isActive: true
      }
    });

    // Create team for owner
    const ownerTeam = await prisma.team.create({
      data: {
        name: 'Example Team',
        description: 'Sample team for demonstration',
        ownerId: ownerUser.id,
        isActive: true
      }
    });

    // Update owner user with team
    await prisma.user.update({
      where: { id: ownerUser.id },
      data: { teamId: ownerTeam.id }
    });

    logger.info(`Created owner user: ${ownerUser.email}`);
    logger.info(`Created owner team: ${ownerTeam.name}`);

    // Create sample team member
    const memberPassword = await hashPassword('Member123!@#');
    const memberUser = await prisma.user.create({
      data: {
        email: 'member@example.com',
        password: memberPassword,
        firstName: 'Team',
        lastName: 'Member',
        role: 'TEAM_MEMBER',
        teamId: ownerTeam.id,
        isEmailVerified: true,
        isActive: true
      }
    });

    logger.info(`Created member user: ${memberUser.email}`);

    // Create sample products
    const sampleProducts = [
      {
        name: 'Luxury Watch',
        description: 'Premium timepiece with elegant design',
        category: 'Accessories',
        price: 299.99,
        sku: 'LW-001',
        isActive: true,
        teamId: ownerTeam.id,
        createdById: ownerUser.id
      },
      {
        name: 'Designer Handbag',
        description: 'Stylish leather handbag for modern professionals',
        category: 'Fashion',
        price: 199.99,
        sku: 'DH-001',
        isActive: true,
        teamId: ownerTeam.id,
        createdById: ownerUser.id
      },
      {
        name: 'Wireless Headphones',
        description: 'High-quality audio with noise cancellation',
        category: 'Electronics',
        price: 149.99,
        sku: 'WH-001',
        isActive: true,
        teamId: ownerTeam.id,
        createdById: memberUser.id
      }
    ];

    for (const productData of sampleProducts) {
      const product = await prisma.product.create({
        data: productData
      });
      logger.info(`Created product: ${product.name}`);
    }

    logger.info('Database initialization completed successfully!');
    logger.info('\n=== Default Accounts ===');
    logger.info('Admin: admin@mayalens.com / Admin123!@#');
    logger.info('Owner: owner@example.com / Owner123!@#');
    logger.info('Member: member@example.com / Member123!@#');
    logger.info('========================\n');

  } catch (error) {
    logger.error('Database initialization failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run initialization if called directly
if (require.main === module) {
  initDatabase()
    .then(() => {
      logger.info('Database initialization script completed.');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Database initialization script failed:', error);
      process.exit(1);
    });
}

export { initDatabase };