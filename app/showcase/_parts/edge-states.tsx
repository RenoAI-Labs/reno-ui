"use client";

import * as React from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataGrid } from "@/components/ui/data-grid";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { createGridColumns, emptyGridState } from "@/lib/grid-state";

/**
 * The states a happy-path showcase never reaches.
 *
 * A page that only ever renders valid forms and full tables proves nothing about
 * error styling, and error styling is exactly where a token mistake shows up:
 * `--destructive` and `--warning` appear nowhere else on the dashboard.
 */

type Row = { id: string; name: string };

const columns = createGridColumns<Row>((col) => [
  col.accessor("name", { header: "Tên", size: 200 }),
]);

const GRID_STATE = emptyGridState(10);

export function EdgeStates() {
  const [invalid, setInvalid] = React.useState(true);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-[var(--density-gap)]">
        <Badge variant="destructive">Quá hạn</Badge>
        <Badge variant="warning">Sắp hết hạn</Badge>
        <Badge variant="success">Hoàn tất</Badge>
        <Badge variant="info">Đang xử lý</Badge>
        <Button disabled>Nút vô hiệu hoá</Button>
        <Button variant="destructive">Xoá vĩnh viễn</Button>
        <Spinner />
        <Switch disabled aria-label="Công tắc vô hiệu hoá" />
      </div>

      <Alert variant="destructive">
        <AlertTitle>Không lưu được thay đổi</AlertTitle>
        <AlertDescription>
          Máy chủ trả về lỗi 500. Thử lại sau ít phút hoặc liên hệ quản trị viên.
        </AlertDescription>
      </Alert>

      <div className="grid gap-[var(--density-gap)] sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="edge-email">Email công ty</Label>
          <Input
            id="edge-email"
            aria-invalid={invalid}
            defaultValue="khong-phai-email"
            aria-describedby="edge-email-error"
            onChange={(event) => setInvalid(!event.target.value.includes("@"))}
          />
          <p id="edge-email-error" className="text-sm text-destructive">
            {invalid ? "Email không hợp lệ." : "Đã hợp lệ."}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Label>Đang tải</Label>
          <Skeleton className="h-[var(--density-control-height)] w-full" />
          <Progress value={38} />
        </div>
      </div>

      <div className="grid gap-[var(--density-gap)] xl:grid-cols-3">
        <DataGrid
          columns={columns}
          data={[]}
          state={GRID_STATE}
          onStateChange={() => undefined}
          getRowId={(row) => row.id}
          mode="client"
          height={220}
          emptyAction={<Button size="sm">Thêm bản ghi đầu tiên</Button>}
        />
        <DataGrid
          columns={columns}
          data={[]}
          state={GRID_STATE}
          onStateChange={() => undefined}
          getRowId={(row) => row.id}
          mode="client"
          isLoading
          height={220}
        />
        <DataGrid
          columns={columns}
          data={[]}
          state={GRID_STATE}
          onStateChange={() => undefined}
          getRowId={(row) => row.id}
          mode="client"
          error={new Error("network")}
          onRetry={() => undefined}
          height={220}
        />
      </div>
    </div>
  );
}
