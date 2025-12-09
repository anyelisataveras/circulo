import { eq, and, desc, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users, grantOpportunities, applications, documents, notifications, auditLogs, whatsappMessages, emailLogs, } from "../drizzle/schema";
let _db = null;
let _client = null;
export async function getDb() {
    if (!_db && process.env.DATABASE_URL) {
        try {
            _client = postgres(process.env.DATABASE_URL);
            _db = drizzle(_client);
        }
        catch (error) {
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
export async function upsertUser(user) {
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
        if (existingUser.length > 0) {
            // Update existing user
            const updateData = {
                lastSignedIn: user.lastSignedIn || new Date(),
            };
            if (user.name !== undefined)
                updateData.name = user.name;
            if (user.email !== undefined)
                updateData.email = user.email;
            if (user.loginMethod !== undefined)
                updateData.loginMethod = user.loginMethod;
            if (user.role !== undefined)
                updateData.role = user.role;
            if (user.preferredLanguage !== undefined)
                updateData.preferredLanguage = user.preferredLanguage;
            await db
                .update(users)
                .set(updateData)
                .where(eq(users.supabaseUserId, user.supabaseUserId));
        }
        else {
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
        }
    }
    catch (error) {
        console.error("[Database] Failed to upsert user:", error);
        throw error;
    }
}
/**
 * Get user by Supabase User ID
 */
export async function getUserBySupabaseId(supabaseUserId) {
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
export async function getUserByOpenId(openId) {
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
export async function getUserById(id) {
    const db = await getDb();
    if (!db)
        return undefined;
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result.length > 0 ? result[0] : undefined;
}
export async function updateUserLanguage(userId, language) {
    const db = await getDb();
    if (!db)
        return false;
    await db.update(users).set({ preferredLanguage: language }).where(eq(users.id, userId));
    return true;
}
export async function updateUserGoogleTokens(userId, googleId, accessToken, refreshToken, expiryDate) {
    const db = await getDb();
    if (!db)
        return false;
    await db.update(users).set({
        googleId,
        googleAccessToken: accessToken,
        googleRefreshToken: refreshToken,
        googleTokenExpiry: expiryDate,
    }).where(eq(users.id, userId));
    return true;
}
export async function clearUserGoogleTokens(userId) {
    const db = await getDb();
    if (!db)
        return false;
    await db.update(users).set({
        googleId: null,
        googleAccessToken: null,
        googleRefreshToken: null,
        googleTokenExpiry: null,
    }).where(eq(users.id, userId));
    return true;
}
// Grant Opportunities
export async function getGrantOpportunities(filters) {
    const db = await getDb();
    if (!db)
        return [];
    let query = db.select().from(grantOpportunities);
    const conditions = [];
    if (filters?.status) {
        conditions.push(eq(grantOpportunities.status, filters.status));
    }
    if (filters?.assignedToUserId) {
        conditions.push(eq(grantOpportunities.assignedToUserId, filters.assignedToUserId));
    }
    if (conditions.length > 0) {
        query = query.where(and(...conditions));
    }
    query = query.orderBy(desc(grantOpportunities.applicationDeadline));
    if (filters?.limit) {
        query = query.limit(filters.limit);
    }
    return await query;
}
export async function getUpcomingDeadlines(daysAhead = 30) {
    const db = await getDb();
    if (!db)
        return [];
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);
    return await db
        .select()
        .from(grantOpportunities)
        .where(and(gte(grantOpportunities.applicationDeadline, now), lte(grantOpportunities.applicationDeadline, futureDate)))
        .orderBy(grantOpportunities.applicationDeadline);
}
// Applications
export async function getApplications(filters) {
    const db = await getDb();
    if (!db)
        return [];
    let query = db.select().from(applications);
    const conditions = [];
    if (filters?.status) {
        conditions.push(eq(applications.status, filters.status));
    }
    if (filters?.assignedToUserId) {
        conditions.push(eq(applications.assignedToUserId, filters.assignedToUserId));
    }
    if (filters?.grantOpportunityId) {
        conditions.push(eq(applications.grantOpportunityId, filters.grantOpportunityId));
    }
    if (conditions.length > 0) {
        query = query.where(and(...conditions));
    }
    query = query.orderBy(desc(applications.createdAt));
    return await query;
}
export async function getApplicationById(id) {
    const db = await getDb();
    if (!db)
        return undefined;
    const result = await db.select().from(applications).where(eq(applications.id, id)).limit(1);
    return result.length > 0 ? result[0] : undefined;
}
// Documents
export async function getDocuments(filters) {
    const db = await getDb();
    if (!db)
        return [];
    let query = db.select().from(documents);
    const conditions = [];
    if (filters?.applicationId !== undefined) {
        if (filters.applicationId === null) {
            conditions.push(sql `${documents.applicationId} IS NULL`);
        }
        else {
            conditions.push(eq(documents.applicationId, filters.applicationId));
        }
    }
    if (filters?.documentType) {
        conditions.push(eq(documents.documentType, filters.documentType));
    }
    if (conditions.length > 0) {
        query = query.where(and(...conditions));
    }
    query = query.orderBy(desc(documents.createdAt));
    return await query;
}
export async function getExpiringDocuments(daysAhead = 30) {
    const db = await getDb();
    if (!db)
        return [];
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);
    return await db
        .select()
        .from(documents)
        .where(and(sql `${documents.expirationDate} IS NOT NULL`, gte(documents.expirationDate, now), lte(documents.expirationDate, futureDate)))
        .orderBy(documents.expirationDate);
}
// WhatsApp Messages
export async function getWhatsappMessages(filters) {
    const db = await getDb();
    if (!db)
        return [];
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
        query = query.where(and(...conditions));
    }
    query = query.orderBy(desc(whatsappMessages.receivedAt));
    if (filters?.limit) {
        query = query.limit(filters.limit);
    }
    return await query;
}
// Email Logs
export async function getEmailLogs(filters) {
    const db = await getDb();
    if (!db)
        return [];
    let query = db.select().from(emailLogs);
    const conditions = [];
    if (filters?.userId) {
        conditions.push(eq(emailLogs.userId, filters.userId));
    }
    if (filters?.status) {
        conditions.push(eq(emailLogs.status, filters.status));
    }
    if (conditions.length > 0) {
        query = query.where(and(...conditions));
    }
    query = query.orderBy(desc(emailLogs.createdAt));
    if (filters?.limit) {
        query = query.limit(filters.limit);
    }
    return await query;
}
// Audit Logs
export async function createAuditLog(log) {
    const db = await getDb();
    if (!db)
        return;
    await db.insert(auditLogs).values({
        ...log,
        metadata: log.metadata ? JSON.stringify(log.metadata) : null,
    });
}
// Notifications
export async function getUserNotifications(userId, limit = 50) {
    const db = await getDb();
    if (!db)
        return [];
    return await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt))
        .limit(limit);
}
export async function markNotificationAsRead(notificationId) {
    const db = await getDb();
    if (!db)
        return false;
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, notificationId));
    return true;
}
