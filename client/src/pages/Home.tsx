import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { ShoppingCart, TrendingUp, Zap, BarChart3 } from "lucide-react";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-16">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              家計防衛エージェント
            </h1>
            <p className="text-xl text-gray-600">
              {user?.name}さん、おかえりなさい！
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-12">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation("/dashboard")}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  ダッシュボード
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  今週のおすすめ商品と購買傾向を確認
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation("/receipt/upload")}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  レシート追加
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  レシート画像をアップロードして分析
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation("/supermarket")}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  スーパー管理
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  よく利用するスーパーを登録・管理
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation("/dashboard")}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  分析結果
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  購買傾向と節約機会を分析
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Features */}
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">主な機能</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <ShoppingCart className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">レシート分析</h3>
                <p className="text-sm text-gray-600">
                  レシート画像から購買傾向を自動分析
                </p>
              </div>

              <div className="text-center">
                <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">チラシ連携</h3>
                <p className="text-sm text-gray-600">
                  トクバイ・Shufoo!の特売情報を取得
                </p>
              </div>

              <div className="text-center">
                <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-2">スマートマッチング</h3>
                <p className="text-sm text-gray-600">
                  あなたの買い物習慣とお得な商品を自動マッチング
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700">
      <div className="container mx-auto px-4 py-20">
        <div className="text-center text-white mb-12">
          <h1 className="text-5xl font-bold mb-4">家計防衛エージェント</h1>
          <p className="text-xl mb-8">
            レシートとチラシから、あなたにとってお得な買い物情報を提案します
          </p>
          <Button
            size="lg"
            className="bg-white text-blue-600 hover:bg-gray-100"
            onClick={() => window.location.href = getLoginUrl()}
          >
            ログイン
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-white rounded-lg p-6 text-center">
            <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold mb-2">レシート分析</h3>
            <p className="text-sm text-gray-600">
              レシート画像から購買傾向を自動分析
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 text-center">
            <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
              <Zap className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold mb-2">チラシ連携</h3>
            <p className="text-sm text-gray-600">
              トクバイ・Shufoo!の特売情報を取得
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 text-center">
            <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-semibold mb-2">スマートマッチング</h3>
            <p className="text-sm text-gray-600">
              あなたの買い物習慣とお得な商品を自動マッチング
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
