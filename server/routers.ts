import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import { storagePut, storageGet } from "./storage";
import * as db from "./db";
import { AnalysisHistory } from "../drizzle/schema";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Supermarket management
  supermarket: router({
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1, "スーパー名は必須です"),
        region: z.string().optional(),
        tokubaiUrl: z.string().url().optional(),
        shufooUrl: z.string().url().optional(),
        otherChirashiUrl: z.string().url().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return db.createSupermarket({
          userId: ctx.user.id,
          ...input,
        });
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserSupermarkets(ctx.user.id);
    }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        region: z.string().optional(),
        tokubaiUrl: z.string().url().optional(),
        shufooUrl: z.string().url().optional(),
        otherChirashiUrl: z.string().url().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...data } = input;
        await db.updateSupermarket(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteSupermarket(input.id);
        return { success: true };
      }),
  }),

  // Receipt analysis
  receipt: router({
    analyze: protectedProcedure
      .input(z.object({
        imageUrl: z.string().url(),
        imageKey: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        let historyId: number = 0;
        try {
          // Create analysis history record
          const historyRecord = await db.createAnalysisHistory({
            userId: ctx.user.id,
            analysisType: "receipt",
            status: "processing",
          });
          historyId = historyRecord.id;

          // Call LLM to analyze receipt
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `You are a receipt analyzer. Extract the following information from the receipt image:
1. Purchase date
2. Store name
3. Total amount
4. List of items with: name, price, category (produce, meat, fish, dairy, beverages, snacks, etc.)

Return the result as JSON with this structure:
{
  "purchaseDate": "YYYY-MM-DD",
  "storeName": "store name",
  "totalAmount": number,
  "items": [
    { "name": "item name", "price": number, "category": "category", "quantity": number }
  ]
}`,
              },
              {
                role: "user",
                content: `Analyze this receipt image and extract the information. Image URL: ${input.imageUrl}`,
              },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "receipt_analysis",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    purchaseDate: { type: "string" },
                    storeName: { type: "string" },
                    totalAmount: { type: "number" },
                    items: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
                          price: { type: "number" },
                          category: { type: "string" },
                          quantity: { type: "number" },
                        },
                        required: ["name", "price", "category"],
                      },
                    },
                  },
                  required: ["purchaseDate", "storeName", "totalAmount", "items"],
                },
              },
            },
          });

          const analysisResult = JSON.parse(typeof response.choices[0].message.content === 'string' ? response.choices[0].message.content : "{}");

          // Save receipt to database
          const receipt = await db.createReceipt({
            userId: ctx.user.id,
            imageUrl: input.imageUrl,
            imageKey: input.imageKey,
            purchaseDate: analysisResult.purchaseDate ? new Date(analysisResult.purchaseDate) : new Date(),
            totalAmount: analysisResult.totalAmount?.toString(),
            storeName: analysisResult.storeName,
            items: analysisResult.items,
            rawText: JSON.stringify(analysisResult),
          });

          // Update purchase trends based on receipt items
          for (const item of analysisResult.items || []) {
            await db.upsertPurchaseTrend({
              userId: ctx.user.id,
              itemName: item.name,
              category: item.category,
              purchaseCount: 1,
              averagePrice: item.price?.toString(),
              lastPurchaseDate: new Date(),
            });
          }

          // Update analysis history
          await db.updateAnalysisHistory(historyId, {
            status: "completed",
            targetId: receipt.id,
            result: analysisResult,
            completedAt: new Date(),
          });

          return {
            success: true,
            receipt,
            analysis: analysisResult,
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          await db.updateAnalysisHistory(historyId, {
            status: "failed",
            errorMessage,
          });
          throw error;
        }
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserReceipts(ctx.user.id);
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getReceiptById(input.id);
      }),
  }),

  // Purchase trends
  purchaseTrend: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserPurchaseTrends(ctx.user.id);
    }),
  }),

  // Flyer analysis
  flyer: router({
    analyze: protectedProcedure
      .input(z.object({
        supermarketId: z.number(),
        flyerUrl: z.string().url(),
        source: z.enum(["tokubai", "shufoo", "other"]),
      }))
      .mutation(async ({ input, ctx }) => {
        let historyId: number = 0;
        try {
          const historyRecord = await db.createAnalysisHistory({
            userId: ctx.user.id,
            analysisType: "flyer",
            status: "processing",
          });
          historyId = historyRecord.id;

          // Call LLM to analyze flyer
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `You are a supermarket flyer analyzer. Extract sale items from the flyer image:
1. Product name
2. Regular price (if shown)
3. Sale price
4. Discount percentage
5. Category (produce, meat, fish, dairy, beverages, snacks, etc.)

Return as JSON:
{
  "items": [
    { "name": "product", "regularPrice": number, "salePrice": number, "discount": number, "category": "category" }
  ]
}`,
              },
              {
                role: "user",
                content: `Analyze this supermarket flyer image and extract sale items. Image URL: ${input.flyerUrl}`,
              },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "flyer_analysis",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    items: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
                          regularPrice: { type: "number" },
                          salePrice: { type: "number" },
                          discount: { type: "number" },
                          category: { type: "string" },
                        },
                        required: ["name", "salePrice", "category"],
                      },
                    },
                  },
                  required: ["items"],
                },
              },
            },
          });

          const analysisResult = JSON.parse(typeof response.choices[0].message.content === 'string' ? response.choices[0].message.content : "{}");

          // Save flyer to database
          const flyer = await db.createFlyer({
            supermarketId: input.supermarketId,
            source: input.source,
            items: analysisResult.items,
            rawText: JSON.stringify(analysisResult),
          });

          // Perform matching
          const trends = await db.getUserPurchaseTrends(ctx.user.id);
          const matchingResults = [];

          for (const item of analysisResult.items || []) {
            // Find matching purchase trends
            const matchingTrend = trends.find(t =>
              t.itemName.toLowerCase().includes(item.name.toLowerCase()) ||
              item.name.toLowerCase().includes(t.itemName.toLowerCase())
            );

            if (matchingTrend) {
              const savingsAmount = (item.regularPrice || item.salePrice) - item.salePrice;
              const discountPercentage = item.regularPrice
                ? ((savingsAmount / item.regularPrice) * 100)
                : item.discount || 0;

              // Calculate match score based on purchase frequency
              const matchScore = Math.min(100, (matchingTrend.purchaseCount || 0) * 20 + discountPercentage);

              const result = await db.createMatchingResult({
                userId: ctx.user.id,
                flyerId: flyer.id,
                purchaseTrendId: matchingTrend.id,
                itemName: item.name,
                category: item.category,
                regularPrice: item.regularPrice?.toString(),
                salePrice: item.salePrice?.toString(),
                savingsAmount: savingsAmount.toString(),
                discountPercentage: discountPercentage.toString(),
                userPurchaseFrequency: matchingTrend.purchaseCount,
                matchScore: matchScore.toString(),
                isRecommended: matchScore >= 30 ? 1 : 0,
              });

              matchingResults.push(result);
            }
          }

          await db.updateAnalysisHistory(historyId, {
            status: "completed",
            targetId: flyer.id,
            result: { matchingCount: matchingResults.length },
            completedAt: new Date(),
          });

          return {
            success: true,
            flyer,
            matchingResults,
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          await db.updateAnalysisHistory(historyId, {
            status: "failed",
            errorMessage,
          });
          throw error;
        }
      }),

    list: protectedProcedure
      .input(z.object({ supermarketId: z.number() }))
      .query(async ({ input }) => {
        return db.getSupermarketFlyers(input.supermarketId);
      }),
  }),

  // Matching results
  matching: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserMatchingResults(ctx.user.id);
    }),

    getRecommended: protectedProcedure.query(async ({ ctx }) => {
      const results = await db.getUserMatchingResults(ctx.user.id, 200);
      return results.filter(r => r.isRecommended === 1);
    }),
  }),

  // File upload helper
  upload: router({
    getUploadUrl: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        fileType: z.enum(["receipt", "flyer"]),
      }))
      .query(async ({ input, ctx }) => {
        // Generate a unique key for the file
        const timestamp = Date.now();
        const fileKey = `${ctx.user.id}/${input.fileType}/${timestamp}-${input.fileName}`;
        
        return {
          fileKey,
          uploadUrl: `https://storage.example.com/upload?key=${fileKey}`,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
