---
title: Hirebase Schema Optimization Plan
impact: HIGH
impactDescription: Tailored optimization for Hirebase project
tags: hirebase, schema, optimization
---

## Hirebase Specific Optimizations

This document applies generic best practices to the specific `prisma/schema.prisma` in Hirebase.

### 1. Table: `Agency`

- **Primary Key:** `id` (cuid) - Good distribution.
- **Indexes:**
  - `email`: Already `@unique`, so index exists. Good.
- **RLS Policy (SQL Migration):**
  - **Policy:** `auth.uid() = id` (If Agency ID matches Auth UID).
  - **Alternative:** Create a link table `AgencyUser` if multiple users manage one agency.

### 2. Table: `Job`

- **Relation:** `agencyID` (Foreign Key to Agency).
- **Missing Index:** Prisma adds FK constraints but not always indexes on the FK column.
  - **Action:** Add `@@index([agencyID])`.
- **Filtering:** Jobs are often filtered by `status` ("Active").
  - **Action:** Add `@@index([status])` or composite `@@index([agencyID, status])`.
- **Sorting:** Jobs are often sorted by date.
  - **Action:** Add `@@index([createdAt(sort: Desc)])`.

**Optimized Schema Snippet:**
```prisma
model Job {
  // ... fields
  agencyID String
  status   String @default("Active")
  
  agency   Agency @relation(fields: [agencyID], references: [id])
  
  @@index([agencyID])          // Optimize: Find all jobs for an agency
  @@index([status])            // Optimize: Filter active jobs
  @@index([createdAt])         // Optimize: Sort by newest
}
```

### 3. Table: `Candidate`

- **Relation:** `jobId` (Foreign Key to Job).
- **Lookups:** Candidates are looked up by `email`.
- **Sorting:** Candidates are sorted by `score` (descending).
- **Missing Indexes:**
  - **Action:** Add `@@index([jobId])`.
  - **Action:** Add `@@index([email])`.
  - **Action:** Add `@@index([jobId, score(sort: Desc)])` for "Top Candidates per Job".

**Optimized Schema Snippet:**
```prisma
model Candidate {
  // ... fields
  jobId String
  email String?
  score Int @default(0)
  
  job   Job @relation(fields: [jobId], references: [id])
  
  @@index([jobId])             // Optimize: List candidates for a job
  @@index([email])             // Optimize: Check for duplicate applications
  @@index([jobId, score])      // Optimize: Get top candidates for a job
}
```

### 4. Table: `Question`

- **Relation:** `jobId` (Foreign Key to Job).
- **Sorting:** Questions are ordered by `position`.
- **Missing Indexes:**
  - **Action:** Add `@@index([jobId, position])` to quickly fetch questions in order.

**Optimized Schema Snippet:**
```prisma
model Question {
  // ... fields
  jobId    String
  position Int @default(0)
  
  job      Job @relation(fields: [jobId], references: [id])
  
  @@index([jobId, position])   // Optimize: Fetch questions in order
}
```
