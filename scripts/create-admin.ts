import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const adminEmail = process.env.ADMIN_EMAIL!;
const adminPassword = process.env.ADMIN_PASSWORD!;

if (!supabaseUrl || !supabaseServiceRoleKey || !adminEmail || !adminPassword) {
  console.error('Missing environment variables. Please check .env and provide NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL, and ADMIN_PASSWORD.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function main() {
  // Check if admin already exists
  const { data: users, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('Error fetching users:', listError.message);
    process.exit(1);
  }
  const exists = users.users.some(user => user.email === adminEmail);
  if (exists) {
    console.log('Admin user already exists.');
    process.exit(0);
  }

  // Create admin user
  const { data, error } = await supabase.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
    user_metadata: {
      name: 'Admin',
      role: 'ADMIN',
    },
  });

  if (error) {
    console.error('Error creating admin user:', error.message);
    process.exit(1);
  }
  console.log('Admin user created:', data.user.email);
}

main();
