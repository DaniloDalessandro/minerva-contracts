"use client"

import { Suspense } from "react"
import { Wallet, Landmark, FileText, Share2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { SharesTable } from "@/features/convites"

function ConvitesPageContent() {
  return (
    <Card className="overflow-hidden pb-0.5">
      {/* Header no padrão das outras páginas */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border/60 bg-muted/20">
        <div className="text-primary">
          <Share2 className="h-8 w-8" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground tracking-tight">Convites</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gerencie os recursos compartilhados com você e os que você compartilhou com outros usuários
          </p>
        </div>
      </div>

      <CardContent className="pt-4">
        <Tabs defaultValue="budgets" className="space-y-4">
          <TabsList>
            <TabsTrigger value="budgets" className="gap-2">
              <Wallet className="h-4 w-4" />
              Orçamentos
            </TabsTrigger>
            <TabsTrigger value="budget-lines" className="gap-2">
              <Landmark className="h-4 w-4" />
              Linhas Orçamentárias
            </TabsTrigger>
            <TabsTrigger value="contracts" className="gap-2">
              <FileText className="h-4 w-4" />
              Contratos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="budgets" className="mt-0">
            <SharesTable resourceType="BUDGET" resourceLabel="Orçamento" />
          </TabsContent>

          <TabsContent value="budget-lines" className="mt-0">
            <SharesTable resourceType="BUDGET_LINE" resourceLabel="Linha Orçamentária" />
          </TabsContent>

          <TabsContent value="contracts" className="mt-0">
            <SharesTable resourceType="CONTRACT" resourceLabel="Contrato" />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default function ConvitesPage() {
  return (
    <Suspense>
      <ConvitesPageContent />
    </Suspense>
  )
}
