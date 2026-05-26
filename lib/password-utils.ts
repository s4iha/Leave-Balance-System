import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * Hash a plain text password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a plain text password with a hashed password
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a default password for new employees
 * Pattern: LBS@<NamePrefix><Year>
 */
export function generateDefaultPassword(name: string): string {
  const prefix = name.split(' ')[0].replace(/[^a-zA-Z0-9]/g, '');
  const year = new Date().getFullYear();
  return `LBS@${prefix}${year}`;
}
