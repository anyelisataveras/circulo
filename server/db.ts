import { eq, and, desc, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { 
  InsertUser, 
  users,
  grantOpportunities,
  applications,
  projects,
  budgetItems,
  partners,
  documents,
  activities,
  expenses,
  reports,
  auditRecords,
  notifications,
  apiCredentials,
  auditLogs,
  translations,
  googleDriveFiles,
  whatsappMessages,
  emailLogs,
  aiAssistanceSessions,
  n8nWebhooks,
  type GrantOpportunity,
  type Application,
  type Document,
  type WhatsappMessage,
  type EmailLog,
} from "../drizzle/schema.js";

let _db: ReturnType<typeof drizzle> | null = null;
let _client: ReturnType<typeof postgres> | null = null;

export async function getDb() {
  // #region agent log
  const fs = require('fs');
  const logPath = '/Users/a/circulo/.cursor/debug.log';
  const logEntry = JSON.stringify({location:'db.ts:36',message:'getDb called',data:{hasDb:!!_db,hasDatabaseUrl:!!process.env.DATABASE_URL,databaseUrlLength:process.env.DATABASE_URL?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})+'\n';
  fs.appendFileSync(logPath, logEntry);
  // #endregion
  if (!_db && process.env.DATABASE_URL) {
    try {
      _client = postgres(process.env.DATABASE_URL);
      _db = drizzle(_client);
      // #region agent log
      const logEntry2 = JSON.stringify({location:'db.ts:40',message:'Database connection successful',data:{hasDb:!!_db},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})+'\n';
      fs.appendFileSync(logPath, logEntry2);
      // #endregion
    } catch (error) {
      // #region agent log
      const logEntry3 = JSON.stringify({location:'db.ts:42',message:'Database connection failed',data:{errorMessage:error instanceof Error?error.message:String(error),errorName:error instanceof Error?error.name:'Unknown'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})+'\n';
      fs.appendFileSync(logPath, logEntry3);
      // #endregion
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

/**
 * Close database connection (useful for cleanup)
 */
export async function closeDb() {
  if (_client) {
    await _client.end();
    _client = null;
    _db = null;
  }
}

/**
 * Upsert user by Supabase User ID
 */
export async function upsertUser(user: InsertUser): Promise<void> {
  // #region agent log
  const fs = require('fs');
  const logPath = '/Users/a/circulo/.cursor/debug.log';
  const logEntry = JSON.stringify({location:'db.ts:63',message:'upsertUser entry',data:{supabaseUserId:user.supabaseUserId,email:user.email},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})+'\n';
  fs.appendFileSync(logPath, logEntry);
  // #endregion
  if (!user.supabaseUserId) {
    throw new Error("User supabaseUserId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.supabaseUserId, user.supabaseUserId))
      .limit(1);

    // #region agent log
    const logEntry2 = JSON.stringify({location:'db.ts:76',message:'User lookup result',data:{found:existingUser.length>0,userId:existingUser[0]?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})+'\n';
    fs.appendFileSync(logPath, logEntry2);
    // #endregion

    if (existingUser.length > 0) {
      // Update existing user
      const updateData: Partial<InsertUser> = {
        lastSignedIn: user.lastSignedIn || new Date(),
      };
      
      if (user.name !== undefined) updateData.name = user.name;
      if (user.email !== undefined) updateData.email = user.email;
      if (user.loginMethod !== undefined) updateData.loginMethod = user.loginMethod;
      if (user.role !== undefined) updateData.role = user.role;
      if (user.preferredLanguage !== undefined) updateData.preferredLanguage = user.preferredLanguage;

      await db
        .update(users)
        .set(updateData)
        .where(eq(users.supabaseUserId, user.supabaseUserId));
      
      // #region agent log
      const logEntry3 = JSON.stringify({location:'db.ts:94',message:'User updated',data:{supabaseUserId:user.supabaseUserId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})+'\n';
      fs.appendFileSync(logPath, logEntry3);
      // #endregion
    } else {
      // Insert new user
      await db.insert(users).values({
        supabaseUserId: user.supabaseUserId,
        name: user.name ?? null,
        email: user.email ?? null,
        loginMethod: user.loginMethod ?? null,
        role: user.role ?? 'user',
        preferredLanguage: user.preferredLanguage ?? 'en',
        lastSignedIn: user.lastSignedIn || new Date(),
      });
      
      // #region agent log
      const logEntry4 = JSON.stringify({location:'db.ts:108',message:'User inserted',data:{supabaseUserId:user.supabaseUserId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})+'\n';
      fs.appendFileSync(logPath, logEntry4);
      // #endregion
    }
  } catch (error) {
    // #region agent log
    const logEntry5 = JSON.stringify({location:'db.ts:110',message:'upsertUser error',data:{errorMessage:error instanceof Error?error.message:String(error),errorName:error instanceof Error?error.name:'Unknown'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})+'\n';
    fs.appendFileSync(logPath, logEntry5);
    // #endregion
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

/**
 * Get user by Supabase User ID
 */
export async function getUserBySupabaseId(supabaseUserId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.supabaseUserId, supabaseUserId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Legacy: Get user by OpenID (for migration purposes)
 */
export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserLanguage(userId: number, language: "en" | "es" | "ca" | "eu") {
  const db = await getDb();
  if (!db) return false;

  await db.update(users).set({ preferredLanguage: language }).where(eq(users.id, userId));
  return true;
}

export async function updateUserGoogleTokens(
  userId: number,
  googleId: string,
  accessToken: string,
  refreshToken: string | null,
  expiryDate: Date | null
) {
  const db = await getDb();
  if (!db) return false;

  await db.update(users).set({
    googleId,
    googleAccessToken: accessToken,
    googleRefreshToken: refreshToken,
    googleTokenExpiry: expiryDate,
  }).where(eq(users.id, userId));
  
  return true;
}

export async function clearUserGoogleTokens(userId: number) {
  const db = await getDb();
  if (!db) return false;

  await db.update(users).set({
    googleId: null,
    googleAccessToken: null,
    googleRefreshToken: null,
    googleTokenExpiry: null,
  }).where(eq(users.id, userId));
  
  return true;
}

// Grant Opportunities
export async function getGrantOpportunities(filters?: {
  status?: string;
  assignedToUserId?: number;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(grantOpportunities);
  
  const conditions = [];
  if (filters?.status) {
    conditions.push(eq(grantOpportunities.status, filters.status as any));
  }
  if (filters?.assignedToUserId) {
    conditions.push(eq(grantOpportunities.assignedToUserId, filters.assignedToUserId));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  query = query.orderBy(desc(grantOpportunities.applicationDeadline)) as any;

  if (filters?.limit) {
    query = query.limit(filters.limit) as any;
  }

  return await query;
}

export async function getUpcomingDeadlines(daysAhead: number = 30) {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  return await db
    .select()
    .from(grantOpportunities)
    .where(
      and(
        gte(grantOpportunities.applicationDeadline, now),
        lte(grantOpportunities.applicationDeadline, futureDate)
      )
    )
    .orderBy(grantOpportunities.applicationDeadline);
}

// Applications
export async function getApplications(filters?: {
  status?: string;
  assignedToUserId?: number;
  grantOpportunityId?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(applications);
  
  const conditions = [];
  if (filters?.status) {
    conditions.push(eq(applications.status, filters.status as any));
  }
  if (filters?.assignedToUserId) {
    conditions.push(eq(applications.assignedToUserId, filters.assignedToUserId));
  }
  if (filters?.grantOpportunityId) {
    conditions.push(eq(applications.grantOpportunityId, filters.grantOpportunityId));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  query = query.orderBy(desc(applications.createdAt)) as any;

  return await query;
}

export async function getApplicationById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(applications).where(eq(applications.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Documents
export async function getDocuments(filters?: {
  applicationId?: number | null;
  documentType?: string;
}) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(documents);
  
  const conditions = [];
  if (filters?.applicationId !== undefined) {
    if (filters.applicationId === null) {
      conditions.push(sql`${documents.applicationId} IS NULL`);
    } else {
      conditions.push(eq(documents.applicationId, filters.applicationId));
    }
  }
  if (filters?.documentType) {
    conditions.push(eq(documents.documentType, filters.documentType));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  query = query.orderBy(desc(documents.createdAt)) as any;

  return await query;
}

export async function getExpiringDocuments(daysAhead: number = 30) {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  return await db
    .select()
    .from(documents)
    .where(
      and(
        sql`${documents.expirationDate} IS NOT NULL`,
        gte(documents.expirationDate, now),
        lte(documents.expirationDate, futureDate)
      )
    )
    .orderBy(documents.expirationDate);
}

// WhatsApp Messages
export async function getWhatsappMessages(filters?: {
  userId?: number;
  applicationId?: number;
  isProcessed?: boolean;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(whatsappMessages);
  
  const conditions = [];
  if (filters?.userId) {
    conditions.push(eq(whatsappMessages.userId, filters.userId));
  }
  if (filters?.applicationId) {
    conditions.push(eq(whatsappMessages.applicationId, filters.applicationId));
  }
  if (filters?.isProcessed !== undefined) {
    conditions.push(eq(whatsappMessages.isProcessed, filters.isProcessed));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  query = query.orderBy(desc(whatsappMessages.receivedAt)) as any;

  if (filters?.limit) {
    query = query.limit(filters.limit) as any;
  }

  return await query;
}

// Email Logs
export async function getEmailLogs(filters?: {
  userId?: number;
  status?: string;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(emailLogs);
  
  const conditions = [];
  if (filters?.userId) {
    conditions.push(eq(emailLogs.userId, filters.userId));
  }
  if (filters?.status) {
    conditions.push(eq(emailLogs.status, filters.status as any));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  query = query.orderBy(desc(emailLogs.createdAt)) as any;

  if (filters?.limit) {
    query = query.limit(filters.limit) as any;
  }

  return await query;
}

// Audit Logs
export async function createAuditLog(log: {
  userId?: number;
  action: string;
  entityType?: string;
  entityId?: number;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
  status: "success" | "failure" | "error";
  errorMessage?: string;
}) {
  const db = await getDb();
  if (!db) return;

  await db.insert(auditLogs).values({
    ...log,
    metadata: log.metadata ? JSON.stringify(log.metadata) : null,
  });
}

// Notifications
export async function getUserNotifications(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function markNotificationAsRead(notificationId: number) {
  const db = await getDb();
  if (!db) return false;

  await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, notificationId));
  return true;
}
