import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const FEATURES = [
  {
    icon: "📋",
    title: "チケット管理",
    description:
      "タイトル・ステータス・優先度・担当者・期限をひとつのチケットで管理。親子関係でサブタスクも整理できます。",
  },
  {
    icon: "📊",
    title: "カンバン & ガントチャート",
    description:
      "ドラッグ&ドロップでステータスを更新するカンバンビューと、スケジュールを可視化するガントチャートビューを搭載。",
  },
  {
    icon: "🔔",
    title: "チーム協業 & 通知",
    description:
      "コメント・返信・リアクション機能でチームのコミュニケーションを促進。ウォッチ中のチケットの変更をリアルタイムで通知します。",
  },
  {
    icon: "🤖",
    title: "AIアシスト",
    description:
      "チケットの説明・コメントをもとにAIが要約を生成。サブタスクの提案機能で作業の抜け漏れを防ぎます。",
  },
] as const;

export function FeaturesSection() {
  return (
    <section className="bg-white py-14 md:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-10 text-center md:mb-12">
          <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            主な機能
          </h2>
          <p className="mt-3 text-muted-foreground">
            プロジェクト管理に必要なものが、すべて揃っています。
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {FEATURES.map((feature) => (
            <Card key={feature.title}>
              <CardHeader>
                <div className="mb-1 text-3xl">{feature.icon}</div>
                <CardTitle className="text-base font-semibold">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
