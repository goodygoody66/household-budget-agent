import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// テスト用のサンプルデータ
const SAMPLE_RECEIPT_ITEMS = [
  { name: "トマト", price: 298, category: "野菜", quantity: 1 },
  { name: "牛肉", price: 1280, category: "肉", quantity: 1 },
  { name: "牛乳", price: 198, category: "乳製品", quantity: 1 },
];

const SAMPLE_FLYER_ITEMS = [
  {
    name: "トマト",
    regularPrice: 398,
    salePrice: 198,
    discountPercentage: 50,
    category: "野菜",
    storeName: "バロー",
    salePeriod: "2026/02/20-02/26",
  },
  {
    name: "牛肉",
    regularPrice: 1580,
    salePrice: 980,
    discountPercentage: 38,
    category: "肉",
    storeName: "バロー",
    salePeriod: "2026/02/20-02/26",
  },
  {
    name: "チーズ",
    regularPrice: 450,
    salePrice: 299,
    discountPercentage: 34,
    category: "乳製品",
    storeName: "バロー",
    salePeriod: "2026/02/20-02/26",
  },
];

export function ReceiptFlyerMatching() {
  const [matchingResult, setMatchingResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const matchMutation = trpc.receiptFlyerMatching.match.useMutation();

  const handleAnalyzeMatching = async () => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await matchMutation.mutateAsync({
        receiptItems: SAMPLE_RECEIPT_ITEMS,
        flyerItems: SAMPLE_FLYER_ITEMS,
        similarityThreshold: 0.6,
      });

      if (result.success) {
        setMatchingResult(result);
      } else {
        setError(result.error || "分析に失敗しました");
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
          <CardTitle>レシート・チラシマッチング分析</CardTitle>
          <CardDescription>
            購買実績とチラシ情報を比較して、お得な商品を自動抽出します
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">テストデータ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">レシート商品 ({SAMPLE_RECEIPT_ITEMS.length}件)</h3>
            <div className="grid grid-cols-1 gap-2">
              {SAMPLE_RECEIPT_ITEMS.map((item, idx) => (
                <div key={idx} className="p-2 bg-blue-50 rounded text-sm">
                  {item.name} - ¥{item.price} ({item.category})
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">チラシ商品 ({SAMPLE_FLYER_ITEMS.length}件)</h3>
            <div className="grid grid-cols-1 gap-2">
              {SAMPLE_FLYER_ITEMS.map((item, idx) => (
                <div key={idx} className="p-2 bg-green-50 rounded text-sm">
                  {item.name} - ¥{item.salePrice} (通常: ¥{item.regularPrice}) ({item.category})
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={handleAnalyzeMatching}
        disabled={isAnalyzing}
        size="lg"
        className="w-full"
      >
        {isAnalyzing ? "分析中..." : "マッチング分析を実行"}
      </Button>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}

      {matchingResult && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">分析結果</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded">
                  <div className="text-sm text-gray-600">マッチ商品数</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {matchingResult.result.totalItems}
                  </div>
                </div>
                <div className="p-4 bg-green-50 rounded">
                  <div className="text-sm text-gray-600">合計節約額</div>
                  <div className="text-2xl font-bold text-green-600">
                    ¥{matchingResult.result.totalSavings.toLocaleString()}
                  </div>
                </div>
                <div className="p-4 bg-purple-50 rounded">
                  <div className="text-sm text-gray-600">除外カテゴリー</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {matchingResult.result.excludedCategories.length}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="matched" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="matched">
                マッチ商品 ({matchingResult.result.matchedItems.length})
              </TabsTrigger>
              <TabsTrigger value="excluded">
                除外カテゴリー ({matchingResult.result.excludedCategories.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="matched" className="space-y-4">
              {matchingResult.result.matchedItems.length > 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-gray-50">
                            <th className="text-left py-2 px-3">商品名</th>
                            <th className="text-right py-2 px-3">購買価格</th>
                            <th className="text-right py-2 px-3">セール価格</th>
                            <th className="text-right py-2 px-3">節約額</th>
                            <th className="text-center py-2 px-3">節約率</th>
                          </tr>
                        </thead>
                        <tbody>
                          {matchingResult.result.matchedItems.map(
                            (match: any, idx: number) => (
                              <tr key={idx} className="border-b hover:bg-gray-50">
                                <td className="py-2 px-3 font-medium">
                                  {match.receiptItem.name}
                                </td>
                                <td className="text-right py-2 px-3">
                                  ¥{match.receiptItem.price}
                                </td>
                                <td className="text-right py-2 px-3">
                                  ¥{match.flyerItem.salePrice}
                                </td>
                                <td className="text-right py-2 px-3 font-semibold text-green-600">
                                  ¥{match.savingsAmount.toFixed(0)}
                                </td>
                                <td className="text-center py-2 px-3 text-green-600">
                                  {match.savingsPercentage.toFixed(1)}%
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="pt-6 text-center text-gray-600">
                    マッチした商品はありません
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="excluded" className="space-y-4">
              {matchingResult.result.excludedCategories.length > 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      {matchingResult.result.excludedCategories.map(
                        (category: string, idx: number) => (
                          <div
                            key={idx}
                            className="p-3 bg-yellow-50 border border-yellow-200 rounded"
                          >
                            <p className="font-medium text-yellow-900">{category}</p>
                            <p className="text-sm text-yellow-700">
                              このカテゴリーは購買実績がないため分析から除外しました
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="pt-6 text-center text-gray-600">
                    除外されたカテゴリーはありません
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          {matchingResult.report && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">分析レポート</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">サマリー</h3>
                  <p className="text-sm whitespace-pre-wrap text-gray-700">
                    {matchingResult.report.summary}
                  </p>
                </div>

                {matchingResult.report.recommendations.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">推奨事項</h3>
                    <ul className="space-y-2">
                      {matchingResult.report.recommendations.map(
                        (rec: string, idx: number) => (
                          <li key={idx} className="text-sm text-gray-700 flex items-start">
                            <span className="mr-2">•</span>
                            <span>{rec}</span>
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
