import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function NotificationTest() {
  const { data: user, isLoading: authLoading } = trpc.auth.me.useQuery();
  const [testNotificationResult, setTestNotificationResult] = useState<any>(null);
  const [matchingNotificationResult, setMatchingNotificationResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendTestNotification = trpc.notification.sendTestNotification.useMutation({
    onSuccess: (data) => {
      setTestNotificationResult(data);
      setError(null);
    },
    onError: (err) => {
      setError(err.message || "テスト通知の送信に失敗しました");
    },
  });

  const sendMatchingNotification = trpc.notification.sendMatchingNotification.useMutation({
    onSuccess: (data) => {
      setMatchingNotificationResult(data);
      setError(null);
    },
    onError: (err) => {
      setError(err.message || "スマートマッチング通知の送信に失敗しました");
    },
  });

  const handleSendTestNotification = async () => {
    setIsLoading(true);
    try {
      await sendTestNotification.mutateAsync();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMatchingNotification = async () => {
    setIsLoading(true);
    try {
      await sendMatchingNotification.mutateAsync();
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  if (!user && !authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>認証が必要です</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              このページにアクセスするにはログインが必要です。
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle>通知テスト</CardTitle>
          <CardDescription>
            異なるタイプの通知を送信してテストします
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button
          onClick={handleSendTestNotification}
          disabled={isLoading || sendTestNotification.isPending}
          variant="outline"
          size="lg"
          className="w-full"
        >
          {sendTestNotification.isPending ? "送信中..." : "テスト通知を送信"}
        </Button>

        <Button
          onClick={handleSendMatchingNotification}
          disabled={isLoading || sendMatchingNotification.isPending}
          size="lg"
          className="w-full bg-green-600 hover:bg-green-700"
        >
          {sendMatchingNotification.isPending ? "送信中..." : "スマートマッチング通知を送信"}
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
          <p className="font-semibold">エラー</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {testNotificationResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">テスト通知の送信結果</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded">
                <p className="text-sm font-semibold text-blue-900">ステータス</p>
                <p className="text-lg font-bold text-blue-600">
                  {testNotificationResult.success ? "✓ 送信成功" : "✗ 送信失敗"}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold mb-2">メッセージ</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                  {testNotificationResult.message}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {matchingNotificationResult && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">スマートマッチング通知の送信結果</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded">
                  <p className="text-sm font-semibold text-green-900">ステータス</p>
                  <p className="text-lg font-bold text-green-600">
                    {matchingNotificationResult.success ? "✓ 送信成功" : "✗ 送信失敗"}
                  </p>
                </div>

                {matchingNotificationResult.data && (
                  <Tabs defaultValue="summary" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="summary">サマリー</TabsTrigger>
                      <TabsTrigger value="text">テキスト</TabsTrigger>
                      <TabsTrigger value="html">HTML</TabsTrigger>
                    </TabsList>

                    <TabsContent value="summary" className="space-y-4 mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-blue-50 rounded">
                          <div className="text-sm text-gray-600">合計節約額</div>
                          <div className="text-2xl font-bold text-blue-600">
                            ¥{matchingNotificationResult.data.notificationData.totalSavings.toLocaleString()}
                          </div>
                        </div>
                        <div className="p-4 bg-green-50 rounded">
                          <div className="text-sm text-gray-600">マッチ商品数</div>
                          <div className="text-2xl font-bold text-green-600">
                            {matchingNotificationResult.data.notificationData.totalMatches}
                          </div>
                        </div>
                        <div className="p-4 bg-purple-50 rounded">
                          <div className="text-sm text-gray-600">除外カテゴリー</div>
                          <div className="text-2xl font-bold text-purple-600">
                            {matchingNotificationResult.data.notificationData.excludedCategories.length}
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-semibold mb-2">マッチ商品</h3>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {matchingNotificationResult.data.notificationData.matchedItems.map(
                            (item: any, idx: number) => (
                              <div key={idx} className="p-3 bg-gray-50 rounded text-sm border border-gray-200">
                                <p className="font-medium text-gray-900">{item.receiptItemName}</p>
                                <p className="text-gray-600 text-xs mt-1">
                                  ¥{item.receiptPrice} → ¥{item.flyerPrice} (節約: ¥{item.savingsAmount})
                                </p>
                                <p className="text-xs text-gray-500 mt-1">{item.storeName}</p>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="text" className="space-y-4 mt-4">
                      <div className="p-4 bg-gray-50 rounded border border-gray-200 max-h-96 overflow-y-auto">
                        <pre className="text-xs whitespace-pre-wrap text-gray-700 font-mono break-words">
                          {matchingNotificationResult.data.textContent}
                        </pre>
                      </div>
                    </TabsContent>

                    <TabsContent value="html" className="space-y-4 mt-4">
                      <div className="p-4 bg-gray-50 rounded border border-gray-200 max-h-96 overflow-y-auto">
                        <iframe
                          srcDoc={matchingNotificationResult.data.htmlContent}
                          className="w-full h-96 border-0 rounded"
                          title="HTML Preview"
                          sandbox="allow-same-origin"
                        />
                      </div>
                      <div className="text-xs text-gray-500">
                        <p>HTMLコンテンツはiframeで表示されています</p>
                      </div>
                    </TabsContent>
                  </Tabs>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
