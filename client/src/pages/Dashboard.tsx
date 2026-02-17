import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { ShoppingCart, TrendingUp, AlertCircle, Plus } from "lucide-react";
import { useLocation } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Fetch data
  const { data: matchingResults, isLoading: matchingLoading } = trpc.matching.getRecommended.useQuery();
  const { data: purchaseTrends, isLoading: trendsLoading } = trpc.purchaseTrend.list.useQuery();
  const { data: supermarkets } = trpc.supermarket.list.useQuery();
  const { data: receipts } = trpc.receipt.list.useQuery();

  // Prepare chart data
  const categoryData = purchaseTrends?.reduce((acc, trend) => {
    const existing = acc.find(item => item.category === trend.category);
    if (existing) {
      existing.count += trend.purchaseCount || 0;
    } else {
      acc.push({ category: trend.category, count: trend.purchaseCount || 0 });
    }
    return acc;
  }, [] as Array<{ category: string; count: number }>) || [];

  const topItems = purchaseTrends
    ?.sort((a, b) => (b.purchaseCount || 0) - (a.purchaseCount || 0))
    .slice(0, 10) || [];

  const savingsData = matchingResults
    ?.slice(0, 10)
    .map(result => ({
      name: result.itemName,
      savings: parseFloat(result.savingsAmount || "0"),
    })) || [];

  const totalSavings = matchingResults?.reduce((sum, result) => sum + parseFloat(result.savingsAmount || "0"), 0) || 0;

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">家計防衛ダッシュボード</h1>
            <p className="text-muted-foreground mt-2">
              {user?.name}さんの購買傾向と特売情報を分析しています
            </p>
          </div>
          <Button onClick={() => setLocation("/receipt/upload")} size="lg">
            <Plus className="mr-2 h-4 w-4" />
            レシート追加
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">今週の推奨商品</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{matchingResults?.length || 0}</div>
              <p className="text-xs text-muted-foreground">お得な商品が見つかりました</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">推定節約額</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">¥{totalSavings.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">このマッチングで節約可能</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">登録スーパー</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{supermarkets?.length || 0}</div>
              <p className="text-xs text-muted-foreground">チラシ追跡中</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">分析済みレシート</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{receipts?.length || 0}</div>
              <p className="text-xs text-muted-foreground">購買履歴を学習中</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="recommendations" className="space-y-4">
          <TabsList>
            <TabsTrigger value="recommendations">今週のおすすめ</TabsTrigger>
            <TabsTrigger value="trends">購買傾向</TabsTrigger>
            <TabsTrigger value="savings">節約分析</TabsTrigger>
          </TabsList>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>今週のおすすめ商品</CardTitle>
                <CardDescription>
                  あなたの購買傾向と特売情報をマッチングした結果です
                </CardDescription>
              </CardHeader>
              <CardContent>
                {matchingLoading ? (
                  <div className="text-center py-8">読み込み中...</div>
                ) : matchingResults && matchingResults.length > 0 ? (
                  <div className="space-y-4">
                    {matchingResults.slice(0, 20).map((result) => (
                      <div
                        key={result.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                      >
                        <div className="flex-1">
                          <h3 className="font-semibold">{result.itemName}</h3>
                          <p className="text-sm text-muted-foreground">
                            {result.category} • マッチスコア: {result.matchScore}%
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">
                            ¥{parseFloat(result.salePrice || "0").toLocaleString()}
                          </div>
                          <div className="text-sm text-green-600">
                            {result.discountPercentage}% OFF
                          </div>
                          <div className="text-xs text-muted-foreground">
                            節約: ¥{parseFloat(result.savingsAmount || "0").toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>まだおすすめ商品がありません</p>
                    <p className="text-sm">レシートをアップロードしてチラシと照合してください</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>カテゴリー別購買数</CardTitle>
                </CardHeader>
                <CardContent>
                  {trendsLoading ? (
                    <div className="text-center py-8">読み込み中...</div>
                  ) : categoryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ category, count }) => `${category}: ${count}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {categoryData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      データがありません
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>よく買う商品トップ10</CardTitle>
                </CardHeader>
                <CardContent>
                  {trendsLoading ? (
                    <div className="text-center py-8">読み込み中...</div>
                  ) : topItems.length > 0 ? (
                    <div className="space-y-2">
                      {topItems.map((item, index) => (
                        <div key={item.id} className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{item.itemName}</p>
                            <p className="text-xs text-muted-foreground">{item.category}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold">{item.purchaseCount}回</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      データがありません
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Savings Tab */}
          <TabsContent value="savings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>節約額ランキング</CardTitle>
                <CardDescription>
                  マッチングで得られる節約額の大きい商品
                </CardDescription>
              </CardHeader>
              <CardContent>
                {matchingLoading ? (
                  <div className="text-center py-8">読み込み中...</div>
                ) : savingsData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={savingsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip formatter={(value) => `¥${value.toLocaleString()}`} />
                      <Bar dataKey="savings" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    データがありません
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
