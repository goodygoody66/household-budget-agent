import { getSessionCookieOptions } from "./_core/cookies";
import { COOKIE_NAME } from "../shared/const";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import { notifyOwner } from "./_core/notification";
import * as db from "./db";
import { analyzeSmartMatching } from "./smartMatching";
import { matchReceiptWithFlyer, generateMatchingReport } from "./receiptFlyerMatching";
import { generateMatchingNotificationData, generateNotificationText } from "./notificationGenerator";
import { generateRealMatchingReport } from "./realDataMatching";
import { lineRouter } from "./lineRouter";

export const appRouter = router({
  system: systemRouter,
  line: lineRouter,
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
        return db.updateSupermarket(input.id, input);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        return db.deleteSupermarket(input.id);
      }),
  }),

  flyerTest: router({
    analyzeFromUrl: publicProcedure
      .input(z.object({
        imageUrl: z.string().url("有効なURLを入力してください"),
      }))
      .mutation(async ({ input }) => {
        try {
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: "You are an expert at analyzing flyer images and extracting product information. Extract all products from the flyer image with their prices and discount information.",
              },
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: "Please analyze this flyer image and extract all products with their prices, discounts, and categories. Return the data in JSON format.",
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
                name: "flyer_analysis",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    products: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
                          category: { type: "string" },
                          regularPrice: { type: "number" },
                          salePrice: { type: "number" },
                          discountPercent: { type: "number" },
                        },
                        required: ["name", "category", "salePrice"],
                      },
                    },
                  },
                  required: ["products"],
                },
              },
            },
          });

          const content = response.choices[0]?.message?.content;
          if (typeof content === "string") {
            const parsed = JSON.parse(content);
            return {
              success: true,
              data: parsed.products,
            };
          }

          return {
            success: false,
            error: "Failed to parse response",
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

  receiptAnalysis: router({
    analyzeFromUrl: publicProcedure
      .input(z.object({
        imageUrl: z.string().url("有効なURLを入力してください"),
      }))
      .mutation(async ({ input }) => {
        try {
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: "You are an expert at analyzing receipt images and extracting purchase information. Extract all items from the receipt with their prices and quantities.",
              },
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: "Please analyze this receipt image and extract all purchased items with their prices, quantities, and categories. Return the data in JSON format.",
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
                name: "receipt_analysis",
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
                          category: { type: "string" },
                          price: { type: "number" },
                          quantity: { type: "number" },
                        },
                        required: ["name", "category", "price"],
                      },
                    },
                    total: { type: "number" },
                    storeName: { type: "string" },
                  },
                  required: ["items", "total"],
                },
              },
            },
          });

          const content = response.choices[0]?.message?.content;
          if (typeof content === "string") {
            const parsed = JSON.parse(content);
            return {
              success: true,
              data: parsed,
            };
          }

          return {
            success: false,
            error: "Failed to parse response",
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

  smartMatching: router({
    analyze: protectedProcedure
      .input(z.object({
        purchaseItems: z.array(z.object({
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
        })),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const analysis = analyzeSmartMatching(
            input.flyerItems,
            input.purchaseItems.map(item => ({
              itemName: item.name,
              category: item.category,
              averagePrice: item.price,
              purchaseCount: item.quantity || 1,
            })),
            []
          );

          await db.createAnalysisHistory({
            userId: ctx.user.id,
            analysisType: "matching",
            result: analysis,
          });

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

    getReport: protectedProcedure.query(async ({ ctx }) => {
      try {
        const history = await db.getSmartMatchingAnalysis(ctx.user.id);
        return {
          success: true,
          data: history,
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

  realDataMatching: router({
    generateReport: publicProcedure.query(async () => {
      try {
        const report = generateRealMatchingReport();
        return {
          success: true,
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

    sendRealNotification: protectedProcedure.mutation(async ({ ctx }) => {
      try {
        const report = generateRealMatchingReport();
        const notificationData = generateMatchingNotificationData();
        const textContent = generateNotificationText(notificationData);

        await notifyOwner({
          title: `【リアル分析】購買データとチラシのマッチング結果 - 総節約額¥${report.totalSavings}`,
          content: textContent,
        });

        return {
          success: true,
          report,
          notificationData,
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
