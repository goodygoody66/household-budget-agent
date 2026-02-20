import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import { notifyOwner } from "./_core/notification";
import { storagePut, storageGet } from "./storage";
import * as db from "./db";
import { AnalysisHistory } from "../drizzle/schema";
import { analyzeSmartMatching } from "./smartMatching";
import { matchReceiptWithFlyer, generateMatchingReport } from "./receiptFlyerMatching";
import { generateMatchingNotificationData, generateNotificationHTML, generateNotificationText } from "./notificationGenerator";

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

  notification: router({
    sendTestNotification: protectedProcedure.mutation(async ({ ctx }) => {
      try {
        const result = await notifyOwner({
          title: "Test Notification from Budget Agent",
          content: `User: ${ctx.user.name || ctx.user.email}\n\nThis is a test notification from the household budget agent. If you see this message, the notification system is working correctly.\n\nYou will receive weekly deal recommendations every Friday at 8 PM.`,
        });
        
        return {
          success: result,
          message: result ? "Test notification sent successfully" : "Failed to send test notification",
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return {
          success: false,
          message: `Error: ${errorMessage}`,
        };
      }
    }),

    sendMatchingNotification: protectedProcedure
      .mutation(async ({ ctx }) => {
        try {
          const notificationData = generateMatchingNotificationData();
          const htmlContent = generateNotificationHTML(notificationData);
          const textContent = generateNotificationText(notificationData);
          
          const result = await notifyOwner({
            title: `Shopping Deal Alert - Save ¥${notificationData.totalSavings.toLocaleString()}!`,
            content: textContent,
          });

          return {
            success: result,
            data: {
              notificationData,
              htmlContent,
              textContent,
            },
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          return {
            success: false,
            error: errorMessage,
          };
        }
      }),
  }),

  // Smart Matching Analysis
  smartMatching: router({
    analyze: protectedProcedure
      .input(z.object({
        flyerId: z.number().optional(),
        flyerItems: z.array(z.object({
          name: z.string(),
          regularPrice: z.number().optional().nullable(),
          salePrice: z.number(),
          discount: z.number().optional().nullable(),
          category: z.string(),
        })).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const purchaseTrends = await db.getUserPurchaseTrends(ctx.user.id);
          const purchasedCategories = await db.getPurchasedCategoriesForUser(ctx.user.id);

          let flyerItems = input.flyerItems || [];

          if (input.flyerId && !flyerItems.length) {
            const flyers = await db.getSupermarketFlyers(input.flyerId);
            if (flyers.length > 0) {
              const flyerData = flyers[0];
              if (flyerData.items && typeof flyerData.items === 'object') {
                flyerItems = (flyerData.items as any[]).map(item => ({
                  name: item.name || '',
                  regularPrice: item.regularPrice || null,
                  salePrice: item.salePrice || 0,
                  discount: item.discount || null,
                  category: item.category || '',
                }));
              }
            }
          }

          const purchasedItems = purchaseTrends.map(trend => ({
            itemName: trend.itemName,
            category: trend.category,
            averagePrice: trend.averagePrice ? parseFloat(trend.averagePrice.toString()) : null,
            purchaseCount: trend.purchaseCount || 0,
          }));

          const result = analyzeSmartMatching(
            flyerItems,
            purchasedItems,
            purchasedCategories
          );

          await db.createSmartMatchingReport({
            userId: ctx.user.id,
            matchedItems: result.matchedItems,
            excludedCategories: result.excludedCategories,
            totalSavings: result.totalSavings,
          });

          return {
            success: true,
            analysis: result,
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          return {
            success: false,
            error: errorMessage,
          };
        }
      }),

    getReport: protectedProcedure.query(async ({ ctx }) => {
      try {
        const analysis = await db.getSmartMatchingAnalysis(ctx.user.id);
        return {
          success: true,
          analysis,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return {
          success: false,
          error: errorMessage,
        };
      }
    }),
  }),

  // Receipt Analysis
  receiptAnalysis: router({
    analyzeFromUrl: protectedProcedure
      .input(z.object({
        imageUrl: z.string().url(),
      }))
      .mutation(async ({ input }) => {
        try {
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `You are a receipt analyzer. Extract the following information from the receipt image:
1. Store name
2. Purchase date
3. All items purchased with:
   - Item name
   - Price (individual price)
   - Category (野菜, 肉, 魚, 乳製品, 調味料, etc.)
   - Quantity (if shown)
4. Total amount

Return the response in JSON format with this structure:
{
  "storeName": "store name",
  "purchaseDate": "YYYY-MM-DD",
  "items": [
    {
      "name": "item name",
      "price": price_number,
      "category": "category",
      "quantity": quantity_number
    }
  ],
  "totalAmount": total_number
}

Important:
- Extract ALL items from the receipt
- Use Japanese category names
- Price should be a number without currency symbol`,
              },
              {
                role: "user",
                content: [
                  {
                    type: "image_url",
                    image_url: {
                      url: input.imageUrl,
                    },
                  },
                ] as any,
              },
            ],
          });

          const content = response.choices[0]?.message.content;
          if (!content) {
            return {
              success: false,
              error: "No response from LLM",
            };
          }

          const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
          const jsonMatch = contentStr.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            return {
              success: false,
              error: "Could not parse JSON from response",
            };
          }

          const analysis = JSON.parse(jsonMatch[0]);
          return {
            success: true,
            analysis,
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          return {
            success: false,
            error: errorMessage,
          };
        }
      }),
  }),

  // Flyer analysis test
  flyerTest: router({
    analyzeFromUrl: protectedProcedure
      .input(z.object({
        imageUrl: z.string().url(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          // Call LLM to analyze flyer from URL
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
6. Store name (if visible)
7. Sale period (if shown)

Return as JSON:
{
  "storeName": "store name",
  "salePeriod": "period",
  "items": [
    { "name": "product", "regularPrice": number, "salePrice": number, "discount": number, "category": "category" }
  ]
}`,
              },
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: "Analyze this supermarket flyer image and extract all sale items with prices and information.",
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: input.imageUrl,
                      detail: "high",
                    },
                  },
                ],
              },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "flyer_analysis_test",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    storeName: { type: "string" },
                    salePeriod: { type: "string" },
                    items: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
                          regularPrice: { type: ["number", "null"] },
                          salePrice: { type: "number" },
                          discount: { type: ["number", "null"] },
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

          const analysisResult = JSON.parse(
            typeof response.choices[0].message.content === "string"
              ? response.choices[0].message.content
              : "{}"
          );

          return {
            success: true,
            analysis: analysisResult,
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          return {
            success: false,
            error: errorMessage,
          };
        }
      }),
  }),

  receiptFlyerMatching: router({
    match: protectedProcedure
      .input(z.object({
        receiptItems: z.array(z.object({
          name: z.string(),
          price: z.number(),
          category: z.string(),
          quantity: z.number().optional(),
        })),
        flyerItems: z.array(z.object({
          name: z.string(),
          regularPrice: z.number().optional(),
          salePrice: z.number(),
          discountPercentage: z.number().optional(),
          category: z.string(),
          storeName: z.string(),
          salePeriod: z.string().optional(),
        })),
        similarityThreshold: z.number().min(0).max(1).default(0.6),
      }))
      .mutation(async ({ input }) => {
        try {
          const result = matchReceiptWithFlyer(
            input.receiptItems,
            input.flyerItems,
            input.similarityThreshold
          );

          const report = generateMatchingReport(result);

          return {
            success: true,
            result,
            report,
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          return {
            success: false,
            error: errorMessage,
          };
        }
       }),
  }),
});
export type AppRouter = typeof appRouter;
