export * from '../generated/prisma/enums';

// Use type-only exports for the heavy client runtime to keep Client Components safe
// This resolves the Turbopack 'Export Prisma doesn't exist' error by explicitly defining it as a type
export type { 
  Prisma, 
  PrismaClient,
  HolidayDefinition, 
  HolidayOccurrence, 
  ManualHoliday 
} from '../generated/prisma/client';
