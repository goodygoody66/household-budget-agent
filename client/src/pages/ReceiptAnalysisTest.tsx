import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ReceiptItem {
  name: string;
  price: number;
  category: string;
  quantity?: number;
}

interface AnalysisResult {
  storeName: string;
  purchaseDate: string;
  items: ReceiptItem[];
  totalAmount: number;
}

const RECEIPT_URLS = [
  {
    name: "Valor レシート1",
    url: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663265083404/OwfCsHPvxflgmCEs.jpeg",
  },
  {
    name: "クスリのアオキ野田店 レシート1",
    url: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663265083404/ckShJxiLELSNnWTB.jpeg",
  },
  {
    name: "Valor レシート2",
    url: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663265083404/mKnwSLLbJXmmlGJb.jpeg",
  },
  {
    name: "クスリのアオキ野田店 レシート2",
    url: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663265083404/cKteagGiRcOJgYBe.jpeg",
  },
];

export function ReceiptAnalysisTest() {
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeReceiptMutation = trpc.receiptAnalysis.analyzeFromUrl.useMutation();

  const handleAnalyzeReceipt = async (receiptUrl: string) => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await analyzeReceiptMutation.mutateAsync({
        imageUrl: receiptUrl,
      });

      if (result.success && result.analysis) {
        setAnalysisResults(prev => [...prev, result.analysis]);
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

  const handleAnalyzeAll = async () => {
    setIsAnalyzing(true);
    setError(null);
    setAnalysisResults([]);

    for (const receipt of RECEIPT_URLS) {
      try {
        const result = await analyzeReceiptMutation.mutateAsync({
          imageUrl: receipt.url,
        });

        if (result.success && result.analysis) {
          setAnalysisResults(prev => [...prev, result.analysis]);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "不明なエラー";
        console.error(`Failed to analyze ${receipt.name}:`, errorMessage);
      }
    }

    setIsAnalyzing(false);
  };

  const totalItems = analysisResults.reduce((sum, result) => sum + result.items.length, 0);
  const totalAmount = analysisResults.reduce((sum, result) => sum + result.totalAmount, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>レシート分析テスト</CardTitle>
          <CardDescription>
            レシート画像からLLMで商品情報を自動抽出し、スマートマッチング用のデータを準備します
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">テスト用レシート</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {RECEIPT_URLS.map((receipt, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 border rounded hover:bg-gray-50"
            >
              <div>
                <p className="font-medium">{receipt.name}</p>
                <p className="text-xs text-gray-500 truncate">{receipt.url}</p>
              </div>
              <Button
                onClick={() => handleAnalyzeReceipt(receipt.url)}
                disabled={isAnalyzing}
                size="sm"
              >
                分析
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Button
        onClick={handleAnalyzeAll}
        disabled={isAnalyzing}
        size="lg"
        className="w-full"
      >
        {isAnalyzing ? "分析中..." : "すべてのレシートを分析"}
      </Button>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}

      {analysisResults.length > 0 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">分析結果サマリー</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded">
                  <div className="text-sm text-gray-600">分析済みレシート</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {analysisResults.length}
                  </div>
                </div>
                <div className="p-4 bg-green-50 rounded">
                  <div className="text-sm text-gray-600">抽出商品数</div>
                  <div className="text-2xl font-bold text-green-600">{totalItems}</div>
                </div>
                <div className="p-4 bg-purple-50 rounded">
                  <div className="text-sm text-gray-600">合計金額</div>
                  <div className="text-2xl font-bold text-purple-600">
                    ¥{totalAmount.toLocaleString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="0" className="w-full">
            <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${analysisResults.length}, 1fr)` }}>
              {analysisResults.map((_, index) => (
                <TabsTrigger key={index} value={index.toString()}>
                  レシート {index + 1}
                </TabsTrigger>
              ))}
            </TabsList>

            {analysisResults.map((result, index) => (
              <TabsContent key={index} value={index.toString()} className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{result.storeName}</CardTitle>
                    <CardDescription>
                      購入日：{result.purchaseDate} | 合計：¥{result.totalAmount.toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-gray-50">
                            <th className="text-left py-2 px-3">商品名</th>
                            <th className="text-center py-2 px-3">カテゴリ</th>
                            <th className="text-right py-2 px-3">価格</th>
                            <th className="text-center py-2 px-3">数量</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.items.map((item, itemIndex) => (
                            <tr key={itemIndex} className="border-b hover:bg-gray-50">
                              <td className="py-2 px-3 font-medium">{item.name}</td>
                              <td className="text-center py-2 px-3 text-gray-600">
                                {item.category}
                              </td>
                              <td className="text-right py-2 px-3">¥{item.price}</td>
                              <td className="text-center py-2 px-3">
                                {item.quantity || 1}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      )}
    </div>
  );
}
