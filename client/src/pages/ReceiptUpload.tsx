import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";
import { Upload, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function ReceiptUpload() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeReceipt = trpc.receiptAnalysis.analyzeFromUrl.useMutation({
    onSuccess: () => {
      toast.success("レシートを分析しました！");
      setFile(null);
      setPreview(null);
      setTimeout(() => setLocation("/dashboard"), 1500);
    },
    onError: (error: any) => {
      toast.error(`分析に失敗しました: ${error.message}`);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith("image/")) {
        toast.error("画像ファイルを選択してください");
        return;
      }

      setFile(selectedFile);

      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreview(event.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUploadAndAnalyze = async () => {
    if (!file) {
      toast.error("ファイルを選択してください");
      return;
    }

    setIsAnalyzing(true);
    try {
      // Upload file to S3
      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("ファイルのアップロードに失敗しました");
      }

      const { imageUrl, imageKey } = await uploadResponse.json();

      // Analyze receipt
      await analyzeReceipt.mutateAsync({
        imageUrl,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "エラーが発生しました");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">レシートをアップロード</h1>
          <p className="text-muted-foreground mt-2">
            レシート画像をアップロードして、購買傾向を分析します
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>レシート画像</CardTitle>
            <CardDescription>
              JPG、PNG形式の画像ファイルをアップロードしてください
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Upload Area */}
            <div className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-accent transition-colors cursor-pointer">
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="receipt-upload"
              />
              <Label htmlFor="receipt-upload" className="cursor-pointer">
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="font-semibold">ファイルをドラッグ＆ドロップ</p>
                    <p className="text-sm text-muted-foreground">または、クリックして選択</p>
                  </div>
                </div>
              </Label>
            </div>

            {/* Preview */}
            {preview && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">プレビュー</h3>
                  <img
                    src={preview}
                    alt="Receipt preview"
                    className="max-w-full h-auto rounded-lg border"
                  />
                </div>

                {file && (
                  <div className="text-sm text-muted-foreground">
                    <p>ファイル名: {file.name}</p>
                    <p>サイズ: {(file.size / 1024).toFixed(2)} KB</p>
                  </div>
                )}
              </div>
            )}

            {/* Info Alert */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                レシート全体が写るように撮影してください。商品名、価格、購入日時が明確に見える画像が最適です。
              </AlertDescription>
            </Alert>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                onClick={handleUploadAndAnalyze}
                disabled={!file || isAnalyzing}
                size="lg"
                className="flex-1"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    分析中...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    分析開始
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                }}
                disabled={isAnalyzing}
              >
                キャンセル
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">撮影のコツ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>✓ レシート全体が写るように撮影してください</p>
            <p>✓ 照明が十分にある場所で撮影してください</p>
            <p>✓ レシートが傾かないようにまっすぐ撮影してください</p>
            <p>✓ 文字がはっきり読める程度の距離で撮影してください</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
