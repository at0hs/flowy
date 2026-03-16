import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { TicketTable } from "@/components/tickets/ticket-table"
import { TicketFilters } from "@/components/tickets/ticket-filters"
import { Suspense } from "react"
import { ticketsQuerySchema } from "@/lib/validations"

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function TicketsPage({ params, searchParams }: Props) {
  const { id } = await params
  const rawSearchParams = await searchParams

  // クエリパラメータをバリデーション
  const validationResult = ticketsQuerySchema.safeParse({
    status: rawSearchParams.status,
    priority: rawSearchParams.priority,
    order: rawSearchParams.order,
  })

  if (!validationResult.success) {
    // バリデーション失敗時は無効なパラメータを無視
    console.warn('Invalid search params:', validationResult.error.issues)
  }

  const { status, priority, order } = validationResult.success
    ? validationResult.data
    : {}

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single()

  if (!project) notFound()

  // チケット取得クエリを組み立てる
  let query = supabase
    .from("tickets")
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: order === "asc" })

  // ステータスフィルタ（指定がある場合のみ条件を追加）
  if (status) query = query.eq("status", status)

  // 優先度フィルタ（指定がある場合のみ条件を追加）
  if (priority) query = query.eq("priority", priority)

  const { data: tickets, error } = await query

  if (error) console.error(error)

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="flex justify-between items-center mb-2">
        <div>
          <Link
            href="/projects"
            className="text-sm text-muted-foreground hover:underline"
          >
            ← プロジェクト一覧
          </Link>
          <h1 className="text-2xl font-bold mt-1">{project.name}</h1>
        </div>
        <Button asChild>
          <Link href={`/projects/${id}/tickets/new`}>+ チケット作成</Link>
        </Button>
      </div>

      {project.description && (
        <p className="text-sm text-muted-foreground mb-4">{project.description}</p>
      )}

      <Separator className="mb-6" />

      {/* Suspenseが必要な理由は下記参照 */}
      <Suspense>
        <TicketFilters />
      </Suspense>

      {tickets && tickets.length > 0 ? (
        <TicketTable tickets={tickets} />
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <p className="mb-4">チケットがありません</p>
          <Button asChild variant="outline">
            <Link href={`/projects/${id}/tickets/new`}>
              最初のチケットを作成する
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
