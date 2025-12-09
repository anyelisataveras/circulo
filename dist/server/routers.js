import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import * as db from "./db";
import { grantOpportunities, applications, projects, documents, activities, impactReports, impactStories, organizationProfile, whatsappMessages, aiAssistanceSessions, googleDriveFiles, users, notifications, } from "../drizzle/schema";
import { eq, desc, and, or, isNull, gte, lte, sql } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";
import { sendEmail } from "./emailService";
import { GoogleDriveService } from "./services/googleDrive";
export const appRouter = router({
    system: systemRouter,
    auth: router({
        me: publicProcedure.query(opts => opts.ctx.user),
        logout: publicProcedure.mutation(({ ctx }) => {
            const cookieOptions = getSessionCookieOptions(ctx.req);
            ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
            return { success: true };
        }),
        updateLanguage: protectedProcedure
            .input(z.object({ language: z.enum(["en", "es", "ca", "eu"]) }))
            .mutation(async ({ ctx, input }) => {
            await db.updateUserLanguage(ctx.user.id, input.language);
            return { success: true };
        }),
    }),
    // Admin Storage Centre
    storageCenter: router({
        // List all users for admin
        listUsers: adminProcedure.query(async () => {
            const database = await getDb();
            if (!database)
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
            const allUsers = await database.select({
                id: users.id,
                name: users.name,
                email: users.email,
                role: users.role,
            }).from(users).orderBy(users.name);
            return allUsers;
        }),
        // Get all documents for a specific user (or all documents if userId is null)
        getUserDocuments: adminProcedure
            .input(z.object({
            userId: z.number().optional(),
            documentType: z.string().optional(),
            startDate: z.string().optional(),
            endDate: z.string().optional(),
        }))
            .query(async ({ input }) => {
            const database = await getDb();
            if (!database)
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
            // Build query conditions
            const conditions = [];
            // If userId provided, filter by user (or show documents with NULL user_id)
            if (input.userId) {
                conditions.push(or(eq(documents.uploadedByUserId, input.userId), isNull(documents.uploadedByUserId)));
            }
            // Filter by document type (case-insensitive)
            if (input.documentType && input.documentType !== "all") {
                conditions.push(eq(documents.documentType, input.documentType.toLowerCase()));
            }
            // Filter by date range
            if (input.startDate) {
                conditions.push(gte(documents.createdAt, new Date(input.startDate)));
            }
            if (input.endDate) {
                const endDateTime = new Date(input.endDate);
                endDateTime.setHours(23, 59, 59, 999);
                conditions.push(lte(documents.createdAt, endDateTime));
            }
            const query = database
                .select()
                .from(documents)
                .orderBy(desc(documents.createdAt));
            if (conditions.length > 0) {
                query.where(and(...conditions));
            }
            const userDocs = await query;
            return userDocs;
        }),
        // Download all documents for a user as ZIP
        downloadUserDocuments: adminProcedure
            .input(z.object({ userId: z.number() }))
            .mutation(async ({ input, ctx }) => {
            const database = await getDb();
            if (!database)
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
            // Get user info
            const user = await database.select().from(users).where(eq(users.id, input.userId)).limit(1);
            if (!user.length)
                throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
            // Get all documents
            const userDocs = await database
                .select()
                .from(documents)
                .where(eq(documents.uploadedByUserId, input.userId));
            if (userDocs.length === 0) {
                throw new TRPCError({ code: "NOT_FOUND", message: "No documents found for this user" });
            }
            // Return document URLs for client-side ZIP creation
            return {
                userName: user[0].name || user[0].email || `User_${user[0].id}`,
                documents: userDocs.map(doc => ({
                    name: doc.documentName,
                    url: doc.fileUrl,
                })),
            };
        }),
    }),
    // Grant Opportunities Management
    grantOpportunities: router({
        list: protectedProcedure
            .input(z.object({
            status: z.string().optional(),
            limit: z.number().optional(),
        }))
            .query(async ({ ctx, input }) => {
            return await db.getGrantOpportunities({
                status: input.status,
                limit: input.limit,
            });
        }),
        create: adminProcedure
            .input(z.object({
            fundingSource: z.string().min(1, "Organization is required"),
            programTitle: z.string().min(1, "Title is required"),
            applicationStartDate: z.date().optional(),
            applicationDeadline: z.date(),
            minAmount: z.number().optional(),
            maxAmount: z.number().optional(),
            coFinancingPercentage: z.number().optional(),
            eligibilityCriteria: z.string().optional(),
            thematicArea: z.string().optional(),
            geographicScope: z.string().optional(),
            callDocumentationUrl: z.string().optional(),
            notes: z.string().optional(),
        }))
            .mutation(async ({ ctx, input }) => {
            const database = await getDb();
            if (!database)
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
            // Validate date range
            if (input.applicationStartDate && input.applicationStartDate > input.applicationDeadline) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Start date must be before end date"
                });
            }
            const [result] = await database.insert(grantOpportunities).values({
                ...input,
                assignedToUserId: ctx.user.id,
                status: "monitoring",
            }).returning({ id: grantOpportunities.id });
            return { id: result.id, success: true };
        }),
        updateFull: adminProcedure
            .input(z.object({
            id: z.number(),
            fundingSource: z.string().min(1, "Organization is required"),
            programTitle: z.string().min(1, "Title is required"),
            applicationStartDate: z.date().optional(),
            applicationDeadline: z.date(),
            minAmount: z.number().optional(),
            maxAmount: z.number().optional(),
            coFinancingPercentage: z.number().optional(),
            eligibilityCriteria: z.string().optional(),
            thematicArea: z.string().optional(),
            geographicScope: z.string().optional(),
            callDocumentationUrl: z.string().optional(),
            notes: z.string().optional(),
            status: z.enum(["monitoring", "preparing", "submitted", "awarded", "rejected", "archived"]).optional(),
        }))
            .mutation(async ({ ctx, input }) => {
            const database = await getDb();
            if (!database)
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
            // Validate date range
            if (input.applicationStartDate && input.applicationStartDate > input.applicationDeadline) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Start date must be before end date"
                });
            }
            const { id, ...updates } = input;
            await database.update(grantOpportunities).set(updates).where(eq(grantOpportunities.id, id));
            return { success: true };
        }),
        delete: adminProcedure
            .input(z.object({ id: z.number() }))
            .mutation(async ({ input }) => {
            const database = await getDb();
            if (!database)
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
            await database.delete(grantOpportunities).where(eq(grantOpportunities.id, input.id));
            return { success: true };
        }),
        update: protectedProcedure
            .input(z.object({
            id: z.number(),
            status: z.enum(["monitoring", "preparing", "submitted", "awarded", "rejected", "archived"]).optional(),
            strategicFitScore: z.number().min(1).max(5).optional(),
            priorityScore: z.number().optional(),
            notes: z.string().optional(),
        }))
            .mutation(async ({ ctx, input }) => {
            const database = await getDb();
            if (!database)
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
            const { id, ...updates } = input;
            await database.update(grantOpportunities).set(updates).where(eq(grantOpportunities.id, id));
            return { success: true };
        }),
        bulkImport: adminProcedure
            .input(z.object({
            grants: z.array(z.object({
                fundingSource: z.string().min(1),
                programTitle: z.string().min(1),
                applicationStartDate: z.string().optional(),
                applicationDeadline: z.string(),
                minAmount: z.number().optional(),
                maxAmount: z.number().optional(),
                callDocumentationUrl: z.string().optional(),
                thematicArea: z.string().optional(),
                geographicScope: z.string().optional(),
                eligibilityCriteria: z.string().optional(),
                notes: z.string().optional(),
            }))
        }))
            .mutation(async ({ ctx, input }) => {
            const database = await getDb();
            if (!database)
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
            const results = {
                total: input.grants.length,
                success: 0,
                failed: 0,
                errors: [],
            };
            for (let i = 0; i < input.grants.length; i++) {
                const grant = input.grants[i];
                try {
                    // Parse dates
                    const startDate = grant.applicationStartDate ? new Date(grant.applicationStartDate) : undefined;
                    const endDate = new Date(grant.applicationDeadline);
                    // Validate dates
                    if (isNaN(endDate.getTime())) {
                        throw new Error("Invalid end date format");
                    }
                    if (startDate && isNaN(startDate.getTime())) {
                        throw new Error("Invalid start date format");
                    }
                    if (startDate && startDate > endDate) {
                        throw new Error("Start date must be before end date");
                    }
                    // Insert grant
                    await database.insert(grantOpportunities).values({
                        fundingSource: grant.fundingSource,
                        programTitle: grant.programTitle,
                        applicationStartDate: startDate,
                        applicationDeadline: endDate,
                        minAmount: grant.minAmount,
                        maxAmount: grant.maxAmount,
                        callDocumentationUrl: grant.callDocumentationUrl,
                        thematicArea: grant.thematicArea,
                        geographicScope: grant.geographicScope,
                        eligibilityCriteria: grant.eligibilityCriteria,
                        notes: grant.notes,
                        assignedToUserId: ctx.user.id,
                        status: "monitoring",
                    });
                    results.success++;
                }
                catch (error) {
                    results.failed++;
                    results.errors.push({
                        row: i + 1,
                        error: error instanceof Error ? error.message : "Unknown error",
                    });
                }
            }
            return results;
        }),
        upcomingDeadlines: protectedProcedure
            .input(z.object({ daysAhead: z.number().default(30) }))
            .query(async ({ input }) => {
            return await db.getUpcomingDeadlines(input.daysAhead);
        }),
    }),
    // Applications Management
    applications: router({
        list: protectedProcedure
            .input(z.object({
            status: z.string().optional(),
            grantOpportunityId: z.number().optional(),
        }))
            .query(async ({ ctx, input }) => {
            return await db.getApplications({
                status: input.status,
                grantOpportunityId: input.grantOpportunityId,
            });
        }),
        getById: protectedProcedure
            .input(z.object({ id: z.number() }))
            .query(async ({ input }) => {
            return await db.getApplicationById(input.id);
        }),
        create: protectedProcedure
            .input(z.object({
            grantOpportunityId: z.number(),
            projectTitle: z.string(),
            requestedAmount: z.number().optional(),
            coFinancingAmount: z.number().optional(),
            projectStartDate: z.date().optional(),
            projectEndDate: z.date().optional(),
            targetBeneficiaries: z.string().optional(),
        }))
            .mutation(async ({ ctx, input }) => {
            const database = await getDb();
            if (!database)
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
            const [result] = await database.insert(applications).values({
                ...input,
                assignedToUserId: ctx.user.id,
                status: "draft",
            }).returning({ id: applications.id });
            return { id: result.id, success: true };
        }),
        updateStatus: protectedProcedure
            .input(z.object({
            id: z.number(),
            status: z.enum(["draft", "in_review", "submitted", "awarded", "rejected", "withdrawn"]),
        }))
            .mutation(async ({ ctx, input }) => {
            const database = await getDb();
            if (!database)
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
            await database.update(applications).set({ status: input.status }).where(eq(applications.id, input.id));
            return { success: true };
        }),
    }),
    // Documents Management
    documents: router({
        list: protectedProcedure
            .input(z.object({
            applicationId: z.number().optional().nullable(),
            documentType: z.string().optional(),
            category: z.string().optional(), // Support category filter
            search: z.string().optional(), // Support search
        }))
            .query(async ({ ctx, input }) => {
            const database = await getDb();
            if (!database)
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
            let query = database.select().from(documents).where(eq(documents.uploadedByUserId, ctx.user.id));
            if (input.applicationId !== undefined && input.applicationId !== null) {
                query = query.where(eq(documents.applicationId, input.applicationId));
            }
            if (input.documentType) {
                query = query.where(eq(documents.documentType, input.documentType));
            }
            if (input.category) {
                query = query.where(eq(documents.documentType, input.category));
            }
            const results = await query.orderBy(desc(documents.createdAt));
            // Map to expected format for Documents page
            return results.map(doc => ({
                ...doc,
                fileName: doc.documentName,
                url: doc.fileUrl,
                size: doc.fileSize,
                category: doc.documentType,
                uploadedAt: doc.createdAt,
                userId: doc.uploadedByUserId,
            }));
        }),
        upload: protectedProcedure
            .input(z.object({
            applicationId: z.number().optional().nullable(),
            documentType: z.string().optional(),
            documentName: z.string().optional(),
            fileName: z.string().optional(), // Support new field name
            category: z.string().optional(), // Support new field name
            description: z.string().optional(),
            fileData: z.string(), // base64
            mimeType: z.string(),
            size: z.number().optional(),
            expirationDate: z.date().optional(),
        }))
            .mutation(async ({ ctx, input }) => {
            const database = await getDb();
            if (!database)
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
            // Support both old and new field names
            const fileName = input.fileName || input.documentName || 'document';
            const documentType = input.category || input.documentType || 'other';
            // Convert base64 to buffer (handle both formats)
            const base64Data = input.fileData.includes(',') ? input.fileData.split(',')[1] : input.fileData;
            const fileBuffer = Buffer.from(base64Data, 'base64');
            const fileKey = `documents/${ctx.user.id}/${Date.now()}-${fileName}`;
            const { url } = await storagePut(fileKey, fileBuffer, input.mimeType);
            // Save to database
            const [result] = await database.insert(documents).values({
                applicationId: input.applicationId || null,
                documentType: documentType,
                documentName: fileName,
                fileUrl: url,
                fileKey: fileKey,
                mimeType: input.mimeType,
                fileSize: input.size || fileBuffer.length,
                expirationDate: input.expirationDate,
                uploadedByUserId: ctx.user.id,
                notes: input.description,
            }).returning({ id: documents.id });
            return { id: result.id, url, success: true };
        }),
        delete: protectedProcedure
            .input(z.object({ id: z.number() }))
            .mutation(async ({ ctx, input }) => {
            const database = await getDb();
            if (!database)
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
            await database.delete(documents).where(and(eq(documents.id, input.id), eq(documents.uploadedByUserId, ctx.user.id)));
            return { success: true };
        }),
        expiringDocuments: protectedProcedure
            .input(z.object({ daysAhead: z.number().default(30) }))
            .query(async ({ input }) => {
            return await db.getExpiringDocuments(input.daysAhead);
        }),
    }),
    // Impact Reports
    impactReports: router({
        // List reports
        list: protectedProcedure
            .query(async ({ ctx }) => {
            const database = await getDb();
            if (!database)
                return [];
            const results = await database.select()
                .from(impactReports)
                .where(eq(impactReports.createdByUserId, ctx.user.id))
                .orderBy(desc(impactReports.createdAt));
            return results.map(r => ({
                id: r.id,
                title: r.reportTitle,
                period: `${r.reportingPeriodStart?.toLocaleDateString() || ''} - ${r.reportingPeriodEnd?.toLocaleDateString() || ''}`,
                content: r.content,
                generatedAt: r.createdAt,
            }));
        }),
        // Generate report with AI
        generate: protectedProcedure
            .input(z.object({
            title: z.string(),
            period: z.string(),
            focus: z.string().optional(),
            documentIds: z.array(z.number()),
        }))
            .mutation(async ({ ctx, input }) => {
            const database = await getDb();
            if (!database)
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
            // Get organization profile for context
            const profile = await database.select()
                .from(organizationProfile)
                .limit(1);
            const orgInfo = profile[0];
            // Fetch selected documents
            const selectedDocs = await database.select()
                .from(documents)
                .where(sql `${documents.id} IN (${sql.join(input.documentIds.map(id => sql `${id}`), sql `, `)})`)
                .limit(50);
            // Build message content with document files
            const userMessageContent = [];
            const { extractTextFromDocument } = await import('./documentProcessor');
            // Add document files for AI to read
            for (const doc of selectedDocs) {
                const mimeType = doc.mimeType || '';
                const filename = doc.documentName || '';
                // Handle PDFs directly via file_url
                if (mimeType === 'application/pdf') {
                    userMessageContent.push({
                        type: 'file_url',
                        file_url: {
                            url: doc.fileUrl,
                            mime_type: 'application/pdf'
                        }
                    });
                }
                // Handle images directly via image_url
                else if (mimeType.startsWith('image/')) {
                    userMessageContent.push({
                        type: 'image_url',
                        image_url: {
                            url: doc.fileUrl,
                            detail: 'high'
                        }
                    });
                }
                // For other formats (DOCX, XLSX, CSV, TXT), extract text first
                else {
                    try {
                        // Download the file
                        const response = await fetch(doc.fileUrl);
                        if (!response.ok) {
                            console.error(`Failed to download ${filename}: ${response.statusText}`);
                            continue;
                        }
                        const arrayBuffer = await response.arrayBuffer();
                        const buffer = Buffer.from(arrayBuffer);
                        // Extract text content
                        const extracted = await extractTextFromDocument(buffer, mimeType, filename);
                        if (extracted.text) {
                            // Add extracted text as a text content block
                            userMessageContent.push({
                                type: 'text',
                                text: `\n\n=== Document: ${filename} ===\n${extracted.text}\n`
                            });
                        }
                        else if (extracted.error) {
                            console.error(`Error extracting ${filename}: ${extracted.error}`);
                        }
                    }
                    catch (error) {
                        console.error(`Error processing ${filename}:`, error);
                    }
                }
            }
            // Build document reference list for citations
            const docReferences = selectedDocs.map((doc, idx) => `[${idx + 1}] ${doc.documentName}`).join('\n');
            // Add the main prompt
            const prompt = `Generate a comprehensive impact report for an NGO with the following details:

Organization: ${orgInfo?.organizationName || 'NGO'}
Mission: ${orgInfo?.missionStatement || 'Not specified'}
Report Title: ${input.title}
Reporting Period: ${input.period}
Focus Areas: ${input.focus || 'General impact'}

Document References:
${docReferences}

**CRITICAL REQUIREMENTS:**
1. **NO SYNTHETIC DATA**: You are STRICTLY FORBIDDEN from generating, inventing, or creating any synthetic information, numbers, names, stories, or data. Every single piece of information MUST come directly from the provided documents.
2. **CITATIONS REQUIRED**: Every fact, number, achievement, story, or data point MUST include a footnote citation showing which document it came from (e.g., "[1]" for first document).
3. **EXTRACT ONLY**: If information is not found in the documents, write "Not available in provided documents" instead of making up data.
4. **PROFESSIONAL TEMPLATE**: Follow this standardized structure:

# ${input.title}
**Reporting Period:** ${input.period}
**Organization:** ${orgInfo?.organizationName || 'NGO'}

---

## Executive Summary
[Extract key highlights, total beneficiaries served, major achievements - cite sources]

## 1. Introduction
### 1.1 Organization Overview
[Mission, vision, areas of work - from documents]

### 1.2 Reporting Period Context
[Context for this period - from documents]

## 2. Programs and Activities
### 2.1 Program Overview
[List and describe programs implemented - from documents with citations]

### 2.2 Activities Conducted
[Specific activities, workshops, events - from documents with citations]

## 3. Beneficiaries and Reach
### 3.1 Direct Beneficiaries
[Numbers, demographics, locations - from documents with citations]

### 3.2 Indirect Beneficiaries
[Secondary impact - from documents with citations]

### 3.3 Beneficiary Stories
[Real stories and testimonials extracted from documents - with citations]

## 4. Key Achievements and Impact
### 4.1 Quantitative Impact
[Present data in tables with metrics and sources]

### 4.2 Qualitative Impact
[Describe changes, improvements - from documents with citations]

### 4.3 Case Studies
[Detailed examples from documents - with citations]

## 5. Financial Overview
### 5.1 Budget Summary
[Income and expenses - from documents with citations]

### 5.2 Resource Utilization
[How funds were used - from documents with citations]

## 6. Challenges and Lessons Learned
### 6.1 Challenges Faced
[Obstacles encountered - from documents with citations]

### 6.2 Lessons Learned
[Key learnings - from documents with citations]

### 6.3 Adaptations Made
[How challenges were addressed - from documents with citations]

## 7. Partnerships and Collaborations
[Partner organizations, collaborations - from documents with citations]

## 8. Future Outlook
### 8.1 Planned Activities
[Future plans - from documents with citations]

### 8.2 Sustainability
[Long-term sustainability plans - from documents with citations]

## 9. Conclusion
[Summary of impact and future direction - from documents]

---

## References
${docReferences}

**REMEMBER:**
- Use tables for presenting quantitative data
- Include footnote citations after every fact: [1], [2], etc.
- If data is missing, state "Not available in provided documents"
- NEVER invent or generate synthetic information
- Extract exact numbers, names, and details from documents

Format the entire report in markdown.`;
            userMessageContent.push({
                type: 'text',
                text: prompt
            });
            // Detect language from title and focus areas
            const inputText = `${input.title} ${input.focus || ''}`;
            const languageInstruction = inputText.match(/[\u0080-\uFFFF]/)
                ? "Respond in the same language as the user's input (title and focus areas). Maintain professional terminology in that language."
                : "Respond in English unless the user's input is clearly in another language.";
            const response = await invokeLLM({
                messages: [
                    { role: "system", content: `You are an expert NGO impact report writer. Your role is to EXTRACT and ORGANIZE information from provided documents into a professional impact report. CRITICAL RULES: (1) You are STRICTLY FORBIDDEN from generating, inventing, or creating ANY synthetic data, numbers, names, stories, or information. (2) EVERY piece of information MUST come directly from the provided documents. (3) You MUST cite the source document for every fact using footnote format [1], [2], etc. (4) If information is not in the documents, write 'Not available in provided documents' instead of making up data. (5) Use the standardized professional template structure provided. (6) Present data in clear tables with citations. Your credibility depends on accuracy and proper citation of sources. (7) LANGUAGE: ${languageInstruction}` },
                    { role: "user", content: userMessageContent }
                ],
            });
            const content = response.choices[0]?.message?.content || "";
            return { content, success: true };
        }),
        // Save report
        save: protectedProcedure
            .input(z.object({
            title: z.string(),
            content: z.string(),
            period: z.string(),
        }))
            .mutation(async ({ ctx, input }) => {
            const database = await getDb();
            if (!database)
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
            // Parse period to get start/end dates
            const now = new Date();
            const [result] = await database.insert(impactReports).values({
                reportTitle: input.title,
                reportType: "custom",
                reportingPeriodStart: now,
                reportingPeriodEnd: now,
                content: input.content,
                status: "draft",
                generatedByAi: true,
                createdByUserId: ctx.user.id,
                language: "en",
            }).returning({ id: impactReports.id });
            return { id: result.id, success: true };
        }),
        // List Impact Stories
        listStories: protectedProcedure
            .query(async ({ ctx }) => {
            const database = await getDb();
            if (!database)
                return [];
            const results = await database.select()
                .from(impactStories)
                .where(eq(impactStories.createdByUserId, ctx.user.id))
                .orderBy(desc(impactStories.createdAt));
            return results;
        }),
        // Save Impact Story
        saveStory: protectedProcedure
            .input(z.object({
            title: z.string(),
            description: z.string(),
            beneficiaryType: z.string().optional(),
            location: z.string().optional(),
            impact: z.string().optional(),
            metrics: z.string().optional(),
        }))
            .mutation(async ({ ctx, input }) => {
            const database = await getDb();
            if (!database)
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
            const [result] = await database.insert(impactStories).values({
                ...input,
                createdByUserId: ctx.user.id,
                language: "en",
            }).returning({ id: impactStories.id });
            return { id: result.id, success: true };
        }),
    }),
    // WhatsApp Integration
    whatsapp: router({
        receiveMessage: publicProcedure
            .input(z.object({
            phoneNumber: z.string(),
            senderName: z.string().optional(),
            messageType: z.enum(["text", "voice", "image", "document", "video"]),
            messageContent: z.string().optional(),
            audioUrl: z.string().optional(),
            mediaUrl: z.string().optional(),
            metadata: z.any().optional(),
        }))
            .mutation(async ({ input }) => {
            const database = await getDb();
            if (!database)
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
            await database.insert(whatsappMessages).values({
                phoneNumber: input.phoneNumber,
                senderName: input.senderName || null,
                messageType: input.messageType,
                messageContent: input.messageContent || null,
                originalAudioUrl: input.audioUrl || null,
                mediaUrl: input.mediaUrl || null,
                transcriptionStatus: input.messageType === "voice" ? "pending" : null,
                metadata: input.metadata ? JSON.stringify(input.metadata) : null,
                isProcessed: false,
            });
            return { success: true };
        }),
        listMessages: protectedProcedure
            .input(z.object({
            isProcessed: z.boolean().optional(),
            limit: z.number().default(50),
        }))
            .query(async ({ input }) => {
            return await db.getWhatsappMessages({
                isProcessed: input.isProcessed,
                limit: input.limit,
            });
        }),
    }),
    // AI Assistant
    aiAssistant: router({
        reviewDocument: protectedProcedure
            .input(z.object({
            text: z.string(),
            documentType: z.string(),
            language: z.enum(["en", "es", "ca", "eu"]).default("en"),
        }))
            .mutation(async ({ ctx, input }) => {
            const database = await getDb();
            if (!database)
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
            const response = await invokeLLM({
                messages: [
                    {
                        role: "system",
                        content: `You are an expert grant writing assistant. Review the following ${input.documentType} and provide constructive feedback, corrections, and suggestions for improvement. Focus on clarity, persuasiveness, and compliance with grant requirements.`
                    },
                    { role: "user", content: input.text }
                ],
            });
            const suggestions = response.choices[0]?.message?.content || "";
            // Log session
            await database.insert(aiAssistanceSessions).values({
                userId: ctx.user.id,
                sessionType: "review",
                inputText: input.text,
                outputText: suggestions,
                sourceLanguage: input.language,
                status: "completed",
            });
            return { suggestions, success: true };
        }),
        translate: protectedProcedure
            .input(z.object({
            text: z.string(),
            sourceLanguage: z.enum(["en", "es", "ca", "eu"]),
            targetLanguage: z.enum(["en", "es", "ca", "eu"]),
        }))
            .mutation(async ({ ctx, input }) => {
            const database = await getDb();
            if (!database)
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
            const languageNames = { en: "English", es: "Spanish", ca: "Catalan", eu: "Basque" };
            const response = await invokeLLM({
                messages: [
                    {
                        role: "system",
                        content: `You are a professional translator. Translate the following text from ${languageNames[input.sourceLanguage]} to ${languageNames[input.targetLanguage]}. Maintain the tone, style, and technical accuracy.`
                    },
                    { role: "user", content: input.text }
                ],
            });
            const translation = response.choices[0]?.message?.content || "";
            // Log session
            await database.insert(aiAssistanceSessions).values({
                userId: ctx.user.id,
                sessionType: "translation",
                inputText: input.text,
                outputText: translation,
                sourceLanguage: input.sourceLanguage,
                targetLanguage: input.targetLanguage,
                status: "completed",
            });
            return { translation, success: true };
        }),
    }),
    // Organization Profile Management
    organization: router({
        getProfile: protectedProcedure
            .query(async ({ ctx }) => {
            const database = await getDb();
            if (!database)
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
            const results = await database.select()
                .from(organizationProfile)
                .where(eq(organizationProfile.userId, ctx.user.id))
                .limit(1);
            return results[0] || null;
        }),
        updateProfile: protectedProcedure
            .input(z.object({
            name: z.string(),
            mission: z.string().optional(),
            vision: z.string().optional(),
            description: z.string().optional(),
            website: z.string().optional(),
            email: z.string().optional(),
            phone: z.string().optional(),
            address: z.string().optional(),
        }))
            .mutation(async ({ ctx, input }) => {
            const database = await getDb();
            if (!database)
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
            // Check if profile exists
            const existing = await database.select()
                .from(organizationProfile)
                .where(eq(organizationProfile.userId, ctx.user.id))
                .limit(1);
            if (existing.length > 0) {
                // Update
                await database.update(organizationProfile)
                    .set(input)
                    .where(eq(organizationProfile.userId, ctx.user.id));
            }
            else {
                // Insert
                await database.insert(organizationProfile).values({
                    ...input,
                    userId: ctx.user.id,
                });
            }
            return { success: true };
        }),
    }),
    // Logical Framework (LFA) Management
    lfa: router({
        save: protectedProcedure
            .input(z.object({
            applicationId: z.number(),
            goal: z.object({
                narrative: z.string(),
                indicators: z.string(),
                meansOfVerification: z.string(),
                assumptions: z.string(),
            }),
            purpose: z.object({
                narrative: z.string(),
                indicators: z.string(),
                meansOfVerification: z.string(),
                assumptions: z.string(),
            }),
            outputs: z.array(z.object({
                id: z.string(),
                narrative: z.string(),
                indicators: z.string(),
                meansOfVerification: z.string(),
                assumptions: z.string(),
            })),
            activities: z.array(z.object({
                id: z.string(),
                narrative: z.string(),
                indicators: z.string(),
                meansOfVerification: z.string(),
                assumptions: z.string(),
            })),
        }))
            .mutation(async ({ ctx, input }) => {
            const database = await getDb();
            if (!database)
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
            // Store LFA data as JSON in projects table
            await database.update(projects).set({
                logicalFramework: JSON.stringify(input),
            }).where(eq(projects.applicationId, input.applicationId));
            return { success: true };
        }),
    }),
    // Screening & Eligibility Automation
    screening: router({
        runChecklist: protectedProcedure
            .input(z.object({
            grantOpportunityId: z.number(),
            organizationData: z.record(z.string(), z.any()),
        }))
            .mutation(async ({ ctx, input }) => {
            const database = await getDb();
            if (!database)
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
            // Get grant opportunity criteria
            const opportunity = await database.select()
                .from(grantOpportunities)
                .where(eq(grantOpportunities.id, input.grantOpportunityId))
                .limit(1);
            if (!opportunity[0]) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Grant opportunity not found" });
            }
            // Use AI to assess eligibility
            const prompt = `Assess eligibility for this grant opportunity:

Grant Criteria: ${opportunity[0].eligibilityCriteria || 'Not specified'}
Thematic Area: ${opportunity[0].thematicArea || 'Any'}
Geographic Scope: ${opportunity[0].geographicScope || 'Any'}
Funding Range: ${opportunity[0].minAmount || 0} - ${opportunity[0].maxAmount || 'unlimited'}

Organization Data: ${JSON.stringify(input.organizationData, null, 2)}

Provide a structured assessment with:
1. Eligibility Score (0-100)
2. Matching Criteria (list what matches)
3. Missing Requirements (list what's missing)
4. Recommendations (how to improve eligibility)

Format as JSON.`;
            const response = await invokeLLM({
                messages: [
                    { role: "system", content: "You are an expert in grant eligibility assessment. Provide objective, structured evaluations." },
                    { role: "user", content: prompt }
                ],
                response_format: {
                    type: "json_schema",
                    json_schema: {
                        name: "eligibility_assessment",
                        strict: true,
                        schema: {
                            type: "object",
                            properties: {
                                score: { type: "number" },
                                matchingCriteria: { type: "array", items: { type: "string" } },
                                missingRequirements: { type: "array", items: { type: "string" } },
                                recommendations: { type: "array", items: { type: "string" } }
                            },
                            required: ["score", "matchingCriteria", "missingRequirements", "recommendations"],
                            additionalProperties: false,
                        },
                    },
                },
            });
            const content = response.choices[0]?.message?.content;
            const contentString = typeof content === "string"
                ? content
                : Array.isArray(content)
                    ? content.filter(c => c.type === "text").map(c => c.text).join("")
                    : "{}";
            const assessment = JSON.parse(contentString);
            return { assessment, success: true };
        }),
    }),
    // Budget Templates & Validation
    budget: router({
        getTemplate: protectedProcedure
            .input(z.object({ type: z.enum(["basic", "detailed", "eu_standard"]) }))
            .query(async ({ input }) => {
            const templates = {
                basic: [
                    { category: "Personnel", subcategories: ["Salaries", "Benefits"] },
                    { category: "Operations", subcategories: ["Rent", "Utilities", "Supplies"] },
                    { category: "Program Costs", subcategories: ["Activities", "Materials"] },
                    { category: "Other", subcategories: ["Contingency"] },
                ],
                detailed: [
                    { category: "Human Resources", subcategories: ["Project Manager", "Staff", "Consultants", "Benefits"] },
                    { category: "Equipment", subcategories: ["Purchase", "Rental", "Maintenance"] },
                    { category: "Travel", subcategories: ["Domestic", "International", "Per Diem"] },
                    { category: "Operations", subcategories: ["Office", "Communications", "Insurance"] },
                    { category: "Program Activities", subcategories: ["Training", "Events", "Materials"] },
                    { category: "Indirect Costs", subcategories: ["Administration", "Overhead"] },
                ],
                eu_standard: [
                    { category: "1. Human Resources", subcategories: ["Salaries", "Social Charges"] },
                    { category: "2. Travel and Subsistence", subcategories: ["Travel", "Accommodation", "Per Diem"] },
                    { category: "3. Equipment and Supplies", subcategories: ["Equipment", "Supplies"] },
                    { category: "4. Local Office", subcategories: ["Rent", "Utilities", "Communications"] },
                    { category: "5. Other Costs", subcategories: ["Publications", "Visibility"] },
                    { category: "6. Other", subcategories: ["Audit", "Evaluation"] },
                ],
            };
            return templates[input.type];
        }),
        validate: protectedProcedure
            .input(z.object({
            budgetItems: z.array(z.object({
                category: z.string(),
                amount: z.number(),
            })),
            totalBudget: z.number(),
            coFinancingRequired: z.number().optional(),
        }))
            .mutation(async ({ input }) => {
            const issues = [];
            const warnings = [];
            // Calculate total
            const calculatedTotal = input.budgetItems.reduce((sum, item) => sum + item.amount, 0);
            if (Math.abs(calculatedTotal - input.totalBudget) > 0.01) {
                issues.push(`Budget total mismatch: ${calculatedTotal} vs ${input.totalBudget}`);
            }
            // Check for reasonable distribution
            const personnelTotal = input.budgetItems
                .filter(item => item.category.toLowerCase().includes('personnel') || item.category.toLowerCase().includes('human'))
                .reduce((sum, item) => sum + item.amount, 0);
            const personnelPercentage = (personnelTotal / input.totalBudget) * 100;
            if (personnelPercentage > 70) {
                warnings.push(`Personnel costs are ${personnelPercentage.toFixed(1)}% of total budget - consider if this is appropriate`);
            }
            if (personnelPercentage < 20) {
                warnings.push(`Personnel costs are only ${personnelPercentage.toFixed(1)}% - ensure adequate staffing`);
            }
            // Check co-financing
            if (input.coFinancingRequired) {
                const coFinancingPercentage = (input.coFinancingRequired / input.totalBudget) * 100;
                if (coFinancingPercentage < 10) {
                    warnings.push(`Co-financing is ${coFinancingPercentage.toFixed(1)}% - some donors require minimum 10-20%`);
                }
            }
            return {
                valid: issues.length === 0,
                issues,
                warnings,
                calculatedTotal,
                success: true,
            };
        }),
    }),
    // Milestone & Indicator Tracking
    milestones: router({
        list: protectedProcedure
            .input(z.object({ projectId: z.number() }))
            .query(async ({ input }) => {
            const database = await getDb();
            if (!database)
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
            const results = await database.select()
                .from(activities)
                .where(eq(activities.projectId, input.projectId))
                .orderBy(activities.plannedStartDate);
            return results;
        }),
        updateProgress: protectedProcedure
            .input(z.object({
            activityId: z.number(),
            progressPercentage: z.number().min(0).max(100),
            notes: z.string().optional(),
        }))
            .mutation(async ({ ctx, input }) => {
            const database = await getDb();
            if (!database)
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
            await database.update(activities).set({
                progressPercentage: input.progressPercentage,
                status: input.progressPercentage === 100 ? 'completed' : 'in_progress',
            }).where(eq(activities.id, input.activityId));
            // Send notification if milestone completed
            if (input.progressPercentage === 100) {
                // Trigger notification (implement notification system)
                await sendEmail({
                    to: ctx.user.email || '',
                    subject: 'Milestone Completed',
                    html: `<p>A project milestone has been completed.</p>`,
                });
            }
            return { success: true };
        }),
    }),
    // Google Drive Integration
    googleDrive: router({
        getAuthUrl: protectedProcedure
            .query(async ({ ctx }) => {
            const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
            const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
            const redirectUri = process.env.GOOGLE_DRIVE_REDIRECT_URI || `${process.env.VITE_APP_URL || 'http://localhost:3000'}/api/google-drive/callback`;
            if (!clientId || !clientSecret) {
                throw new TRPCError({
                    code: "PRECONDITION_FAILED",
                    message: "Google Drive credentials not configured"
                });
            }
            const driveService = new GoogleDriveService({ clientId, clientSecret, redirectUri });
            const authUrl = driveService.getAuthUrl();
            return { authUrl };
        }),
        handleCallback: protectedProcedure
            .input(z.object({ code: z.string() }))
            .mutation(async ({ ctx, input }) => {
            const database = await getDb();
            if (!database)
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
            const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
            const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
            const redirectUri = process.env.GOOGLE_DRIVE_REDIRECT_URI || `${process.env.VITE_APP_URL || 'http://localhost:3000'}/api/google-drive/callback`;
            const driveService = new GoogleDriveService({ clientId, clientSecret, redirectUri });
            const tokens = await driveService.getTokensFromCode(input.code);
            // Store tokens in database
            await database.update(users).set({
                googleAccessToken: tokens.access_token,
                googleRefreshToken: tokens.refresh_token,
                googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
            }).where(eq(users.id, ctx.user.id));
            return { success: true };
        }),
        isConnected: protectedProcedure
            .query(async ({ ctx }) => {
            const database = await getDb();
            if (!database)
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
            const [user] = await database.select()
                .from(users)
                .where(eq(users.id, ctx.user.id))
                .limit(1);
            return {
                connected: !!(user?.googleAccessToken && user?.googleRefreshToken),
                expiresAt: user?.googleTokenExpiry,
            };
        }),
        disconnect: protectedProcedure
            .mutation(async ({ ctx }) => {
            const database = await getDb();
            if (!database)
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
            await database.update(users).set({
                googleAccessToken: null,
                googleRefreshToken: null,
                googleTokenExpiry: null,
            }).where(eq(users.id, ctx.user.id));
            return { success: true };
        }),
        listFiles: protectedProcedure
            .input(z.object({
            pageToken: z.string().optional(),
            query: z.string().optional(),
        }))
            .query(async ({ ctx, input }) => {
            const database = await getDb();
            if (!database)
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
            const [user] = await database.select()
                .from(users)
                .where(eq(users.id, ctx.user.id))
                .limit(1);
            if (!user?.googleAccessToken || !user?.googleRefreshToken) {
                throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Google Drive not connected" });
            }
            const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
            const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
            const redirectUri = process.env.GOOGLE_DRIVE_REDIRECT_URI || `${process.env.VITE_APP_URL || 'http://localhost:3000'}/api/google-drive/callback`;
            const driveService = new GoogleDriveService({ clientId, clientSecret, redirectUri });
            driveService.setCredentials(user.googleAccessToken, user.googleRefreshToken, user.googleTokenExpiry ? user.googleTokenExpiry.getTime() : undefined);
            const result = await driveService.listFiles({
                pageToken: input.pageToken,
                query: input.query,
            });
            return result;
        }),
        importFile: protectedProcedure
            .input(z.object({
            fileId: z.string(),
            category: z.string(),
            description: z.string().optional(),
        }))
            .mutation(async ({ ctx, input }) => {
            const database = await getDb();
            if (!database)
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
            const [user] = await database.select()
                .from(users)
                .where(eq(users.id, ctx.user.id))
                .limit(1);
            if (!user?.googleAccessToken || !user?.googleRefreshToken) {
                throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Google Drive not connected" });
            }
            const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
            const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
            const redirectUri = process.env.GOOGLE_DRIVE_REDIRECT_URI || `${process.env.VITE_APP_URL || 'http://localhost:3000'}/api/google-drive/callback`;
            const driveService = new GoogleDriveService({ clientId, clientSecret, redirectUri });
            driveService.setCredentials(user.googleAccessToken, user.googleRefreshToken, user.googleTokenExpiry ? user.googleTokenExpiry.getTime() : undefined);
            // Get file metadata
            const metadata = await driveService.getFileMetadata(input.fileId);
            // Download or export file
            let fileBuffer;
            let mimeType;
            let fileName = metadata.name || 'document';
            if (driveService.isGoogleWorkspaceFile(metadata.mimeType)) {
                // Export Google Workspace file
                const exportMimeType = driveService.getExportMimeType(metadata.mimeType);
                fileBuffer = await driveService.exportFile(input.fileId, exportMimeType);
                mimeType = exportMimeType;
                // Add appropriate extension
                if (exportMimeType.includes('pdf'))
                    fileName += '.pdf';
                else if (exportMimeType.includes('spreadsheet'))
                    fileName += '.xlsx';
                else if (exportMimeType.includes('presentation'))
                    fileName += '.pptx';
            }
            else {
                // Download regular file
                fileBuffer = await driveService.downloadFile(input.fileId);
                mimeType = metadata.mimeType || 'application/octet-stream';
            }
            // Upload to S3
            const fileKey = `documents/${ctx.user.id}/${Date.now()}-${fileName}`;
            const { url } = await storagePut(fileKey, fileBuffer, mimeType);
            // Save to documents table
            const [docResult] = await database.insert(documents).values({
                documentType: input.category,
                documentName: fileName,
                fileUrl: url,
                fileKey: fileKey,
                mimeType: mimeType,
                fileSize: fileBuffer.length,
                uploadedByUserId: ctx.user.id,
                notes: input.description,
            }).returning({ id: documents.id });
            // Track Google Drive file reference
            await database.insert(googleDriveFiles).values({
                documentId: docResult.id,
                googleFileId: input.fileId,
                googleFileName: metadata.name,
                googleMimeType: metadata.mimeType,
                googleWebViewLink: metadata.webViewLink,
                syncEnabled: false,
                lastSyncedAt: new Date(),
            });
            return { success: true, documentId: docResult.id, url };
        }),
    }),
    // Automated Notifications
    notifications: router({
        list: protectedProcedure
            .query(async ({ ctx }) => {
            const database = await getDb();
            if (!database)
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
            const results = await database.select()
                .from(notifications)
                .where(eq(notifications.userId, ctx.user.id))
                .orderBy(desc(notifications.createdAt))
                .limit(50);
            return results;
        }),
        markAsRead: protectedProcedure
            .input(z.object({ id: z.number() }))
            .mutation(async ({ ctx, input }) => {
            const database = await getDb();
            if (!database)
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
            await database.update(notifications).set({
                isRead: true,
            }).where(and(eq(notifications.id, input.id), eq(notifications.userId, ctx.user.id)));
            return { success: true };
        }),
    }),
});
