"use client";

import { FileText, Search } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RECENT_DOCUMENTS } from "./mock-data";

/** Initials for the avatar fallback: "Nguyễn Thu Hà" -> "TH". */
function initials(name: string) {
  return name.split(" ").slice(-2).map((part) => part[0]).join("");
}

export function RecentDocuments({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Tài liệu gần đây</CardTitle>
        <CardDescription>Cập nhật trong 30 ngày</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-[var(--density-gap)]">
        <div className="relative">
          <Search
            className="pointer-events-none absolute inset-y-0 start-2 my-auto size-4 text-muted-foreground"
            aria-hidden
          />
          <Input placeholder="Lọc tài liệu…" className="ps-8" aria-label="Lọc tài liệu" />
        </div>

        <ScrollArea className="h-64 pe-3">
          <ul className="flex flex-col gap-1">
            {RECENT_DOCUMENTS.map((doc) => (
              <li key={doc.id}>
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                        <FileText className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{doc.title}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {doc.owner} · {doc.updatedAt}
                        </span>
                      </span>
                      <Badge variant="outline" className="shrink-0 max-sm:hidden">
                        {doc.kind}
                      </Badge>
                    </button>
                  </HoverCardTrigger>

                  <HoverCardContent align="start" className="w-72">
                    <div className="flex gap-3">
                      <Avatar>
                        <AvatarFallback>{initials(doc.owner)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col gap-1">
                        <p className="text-sm font-medium">{doc.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {doc.kind} · {doc.size} · sửa {doc.updatedAt.toLowerCase()}
                        </p>
                        <p className="text-xs text-muted-foreground">Chủ sở hữu: {doc.owner}</p>
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
