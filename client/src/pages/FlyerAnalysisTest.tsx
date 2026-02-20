import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AnalysisResult {
  storeName?: string;
  salePeriod?: string;
  items: Array<{
    name: string;
    regularPrice?: number | null;
    salePrice: number;
    discount?: number | null;
    category: string;
  }>;
}

export function FlyerAnalysisTest() {
  const [imageUrl, setImageUrl] = useState("");
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const analyzeMutation = trpc.flyerTest.analyzeFromUrl.useMutation();

  const handleAnalyze = async () => {
    if (!imageUrl.trim()) {
      setError("画像URLを入力してください");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await analyzeMutation.mutateAsync({ imageUrl });
      if (result.success && result.analysis) {
        setAnalysisResult(result.analysis);
      } else {
        setError(result.error || "分析に失敗しました");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "不明なエラー";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>チラシ分析テスト</CardTitle>
          <CardDescription>
            チラシ画像のURLを入力して、商品情報を自動抽出します
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="imageUrl">チラシ画像URL</Label>
            <Input
              id="imageUrl"
              type="url"
              placeholder="https://example.com/flyer.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              disabled={isLoading}
            />
          </div>
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}
          <Button
            onClick={handleAnalyze}
            disabled={isLoading || !imageUrl.trim()}
            className="w-full"
          >
            {isLoading ? "分析中..." : "分析開始"}
          </Button>
        </CardContent>
      </Card>

      {analysisResult && (
        <Card>
          <CardHeader>
            <CardTitle>分析結果</CardTitle>
            {analysisResult.storeName && (
              <CardDescription>
                {analysisResult.storeName}
                {analysisResult.salePeriod && ` - ${analysisResult.salePeriod}`}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                抽出された商品数: <span className="font-semibold">{analysisResult.items?.length || 0}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2">商品名</th>
                      <th className="text-right py-2 px-2">通常価格</th>
                      <th className="text-right py-2 px-2">セール価格</th>
                      <th className="text-right py-2 px-2">割引率</th>
                      <th className="text-left py-2 px-2">カテゴリ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysisResult.items?.map((item, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-2">{item.name}</td>
                        <td className="text-right py-2 px-2">
                          {item.regularPrice ? `¥${item.regularPrice}` : "-"}
                        </td>
                        <td className="text-right py-2 px-2 font-semibold text-red-600">
                          ¥{item.salePrice}
                        </td>
                        <td className="text-right py-2 px-2">
                          {item.discount ? `${item.discount}%` : "-"}
                        </td>
                        <td className="py-2 px-2">{item.category}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
