import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MatchedItem {
  itemName: string;
  category: string;
  regularPrice?: number | null;
  salePrice: number;
  discount?: number | null;
  userAveragePrice?: number | null;
  savingsAmount: number;
  savingsPercentage: number;
  purchaseFrequency: number;
  matchScore: number;
}

interface AnalysisResult {
  matchedItems: MatchedItem[];
  excludedCategories: string[];
  totalSavings: number;
  matchedCount: number;
}

export function SmartMatchingReport() {
  const [flyerItems, setFlyerItems] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeMutation = trpc.smartMatching.analyze.useMutation();
  const reportQuery = trpc.smartMatching.getReport.useQuery();

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const analysisResult = await analyzeMutation.mutateAsync({
        purchaseItems: [],
        flyerItems: flyerItems,
      });

      if (analysisResult.success && analysisResult.analysis) {
        setResult(analysisResult.analysis as AnalysisResult);
      } else {
        setError(analysisResult.error || "分析に失敗しました");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "不明なエラー";
      setError(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>スマートマッチング分析</CardTitle>
          <CardDescription>
            レシートの購買情報とチラシデータを比較し、購買実績がある商品でセール価格が低いもののみをピックアップします
          </CardDescription>
        </CardHeader>
      </Card>

      {result && (
        <Tabs defaultValue="matched" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="matched">
              マッチ商品 ({result.matchedCount})
            </TabsTrigger>
            <TabsTrigger value="excluded">
              除外カテゴリー ({result.excludedCategories.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="matched" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">マッチした商品</CardTitle>
                <CardDescription>
                  購買実績があり、セール価格が低い商品
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded p-4">
                    <div className="text-sm text-green-700">
                      <span className="font-semibold">総節約額: </span>
                      <span className="text-2xl font-bold">¥{result.totalSavings.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="text-left py-3 px-3">商品名</th>
                          <th className="text-center py-3 px-3">カテゴリ</th>
                          <th className="text-right py-3 px-3">ユーザー平均</th>
                          <th className="text-right py-3 px-3">セール価格</th>
                          <th className="text-right py-3 px-3">節約額</th>
                          <th className="text-center py-3 px-3">購買頻度</th>
                          <th className="text-center py-3 px-3">スコア</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.matchedItems.map((item, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-3 font-medium">{item.itemName}</td>
                            <td className="text-center py-3 px-3 text-gray-600">
                              {item.category}
                            </td>
                            <td className="text-right py-3 px-3">
                              {item.userAveragePrice ? `¥${item.userAveragePrice}` : "-"}
                            </td>
                            <td className="text-right py-3 px-3 font-semibold text-red-600">
                              ¥{item.salePrice}
                            </td>
                            <td className="text-right py-3 px-3 font-semibold text-green-600">
                              ¥{item.savingsAmount.toFixed(0)}
                              <div className="text-xs text-gray-500">
                                ({item.savingsPercentage.toFixed(1)}%)
                              </div>
                            </td>
                            <td className="text-center py-3 px-3">
                              {item.purchaseFrequency}回
                            </td>
                            <td className="text-center py-3 px-3">
                              <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold">
                                {item.matchScore}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="excluded" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">除外されたカテゴリー</CardTitle>
                <CardDescription>
                  チラシに掲載されていますが、購買実績がないため分析から除外されたカテゴリー
                </CardDescription>
              </CardHeader>
              <CardContent>
                {result.excludedCategories.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    除外されたカテゴリーはありません
                  </div>
                ) : (
                  <div className="space-y-2">
                    {result.excludedCategories.map((category, index) => (
                      <div
                        key={index}
                        className="p-3 bg-gray-50 border border-gray-200 rounded flex items-center justify-between"
                      >
                        <span className="font-medium">{category}</span>
                        <span className="text-xs text-gray-500">購買実績なし</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}

      {!result && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <p className="text-gray-600">
                分析を実行してスマートマッチング結果を表示します
              </p>
              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                size="lg"
              >
                {isAnalyzing ? "分析中..." : "分析を実行"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
