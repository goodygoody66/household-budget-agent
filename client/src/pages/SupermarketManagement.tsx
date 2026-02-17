import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Plus, Trash2, Edit2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const supermarketSchema = z.object({
  name: z.string().min(1, "スーパー名は必須です"),
  region: z.string().optional(),
  tokubaiUrl: z.string().url().optional().or(z.literal("")),
  shufooUrl: z.string().url().optional().or(z.literal("")),
  otherChirashiUrl: z.string().url().optional().or(z.literal("")),
});

type SupermarketFormData = z.infer<typeof supermarketSchema>;

export default function SupermarketManagement() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data: supermarkets, isLoading } = trpc.supermarket.list.useQuery();
  const createMutation = trpc.supermarket.create.useMutation({
    onSuccess: () => {
      toast.success("スーパー情報を追加しました");
      setIsOpen(false);
      reset();
    },
    onError: (error) => {
      toast.error(`エラー: ${error.message}`);
    },
  });

  const updateMutation = trpc.supermarket.update.useMutation({
    onSuccess: () => {
      toast.success("スーパー情報を更新しました");
      setIsOpen(false);
      setEditingId(null);
      reset();
    },
    onError: (error) => {
      toast.error(`エラー: ${error.message}`);
    },
  });

  const deleteMutation = trpc.supermarket.delete.useMutation({
    onSuccess: () => {
      toast.success("スーパー情報を削除しました");
    },
    onError: (error) => {
      toast.error(`エラー: ${error.message}`);
    },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<SupermarketFormData>({
    resolver: zodResolver(supermarketSchema),
  });

  const onSubmit = async (data: SupermarketFormData) => {
    if (editingId) {
      await updateMutation.mutateAsync({
        id: editingId,
        ...data,
      });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const handleEdit = (supermarket: any) => {
    setEditingId(supermarket.id);
    reset(supermarket);
    setIsOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("このスーパー情報を削除してもよろしいですか？")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleOpenDialog = () => {
    setEditingId(null);
    reset({
      name: "",
      region: "",
      tokubaiUrl: "",
      shufooUrl: "",
      otherChirashiUrl: "",
    });
    setIsOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">スーパー管理</h1>
            <p className="text-muted-foreground mt-2">
              よく利用するスーパーの情報を登録・管理します
            </p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenDialog} size="lg">
                <Plus className="mr-2 h-4 w-4" />
                スーパー追加
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {editingId ? "スーパー情報を編集" : "スーパー情報を追加"}
                </DialogTitle>
                <DialogDescription>
                  チラシ情報を追跡するスーパーの情報を入力してください
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="name">スーパー名 *</Label>
                  <Input
                    id="name"
                    placeholder="例: バロー千音寺店"
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="region">地域</Label>
                  <Input
                    id="region"
                    placeholder="例: 名古屋市中区"
                    {...register("region")}
                  />
                </div>

                <div>
                  <Label htmlFor="tokubaiUrl">トクバイURL</Label>
                  <Input
                    id="tokubaiUrl"
                    type="url"
                    placeholder="https://tokubai.com/..."
                    {...register("tokubaiUrl")}
                  />
                  {errors.tokubaiUrl && (
                    <p className="text-sm text-red-500 mt-1">{errors.tokubaiUrl.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="shufooUrl">Shufoo!URL</Label>
                  <Input
                    id="shufooUrl"
                    type="url"
                    placeholder="https://www.shufoo.net/..."
                    {...register("shufooUrl")}
                  />
                  {errors.shufooUrl && (
                    <p className="text-sm text-red-500 mt-1">{errors.shufooUrl.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="otherChirashiUrl">その他チラシサイトURL</Label>
                  <Input
                    id="otherChirashiUrl"
                    type="url"
                    placeholder="https://..."
                    {...register("otherChirashiUrl")}
                  />
                  {errors.otherChirashiUrl && (
                    <p className="text-sm text-red-500 mt-1">{errors.otherChirashiUrl.message}</p>
                  )}
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsOpen(false)}
                  >
                    キャンセル
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {createMutation.isPending || updateMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        保存中...
                      </>
                    ) : (
                      "保存"
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Supermarket List */}
        <div className="grid gap-4 md:grid-cols-2">
          {isLoading ? (
            <div className="col-span-full text-center py-8">読み込み中...</div>
          ) : supermarkets && supermarkets.length > 0 ? (
            supermarkets.map((supermarket) => (
              <Card key={supermarket.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{supermarket.name}</CardTitle>
                      {supermarket.region && (
                        <CardDescription>{supermarket.region}</CardDescription>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(supermarket)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(supermarket.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {supermarket.tokubaiUrl && (
                    <div>
                      <p className="text-sm font-medium">トクバイ</p>
                      <a
                        href={supermarket.tokubaiUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline truncate"
                      >
                        {supermarket.tokubaiUrl}
                      </a>
                    </div>
                  )}
                  {supermarket.shufooUrl && (
                    <div>
                      <p className="text-sm font-medium">Shufoo!</p>
                      <a
                        href={supermarket.shufooUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline truncate"
                      >
                        {supermarket.shufooUrl}
                      </a>
                    </div>
                  )}
                  {supermarket.otherChirashiUrl && (
                    <div>
                      <p className="text-sm font-medium">その他</p>
                      <a
                        href={supermarket.otherChirashiUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline truncate"
                      >
                        {supermarket.otherChirashiUrl}
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              <p>スーパー情報がまだ登録されていません</p>
              <p className="text-sm">「スーパー追加」ボタンから登録してください</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
