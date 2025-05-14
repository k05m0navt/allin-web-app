import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.ADMIN_PASSWORD || 'admin12345';
  const role = 'ADMIN';
  const name = process.env.ADMIN_NAME || 'Admin';

  // Validation
  if (!email || !password) {
    console.error("ADMIN_EMAIL and ADMIN_PASSWORD must be set in your .env file.");
    process.exit(1);
  }
  if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
    console.error("ADMIN_EMAIL does not look like a valid email address.");
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("ADMIN_PASSWORD should be at least 8 characters.");
    process.exit(1);
  }

  // Check if admin already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role !== role) {
      await prisma.user.update({ where: { email }, data: { role } });
      console.log(`Updated user ${email} to ADMIN role.`);
    } else {
      console.log(`Admin user ${email} already exists.`);
    }
    return;
  }

  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      email,
      password: hashed,
      role,
      name,
    },
  });
  console.log(`Created admin user: ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
