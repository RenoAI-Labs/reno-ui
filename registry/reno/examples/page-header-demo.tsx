"use client";

import { PlusIcon } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";

export default function PageHeaderDemo() {
  return (
    <PageHeader
      breadcrumb={
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Nhân sự</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Nhân viên</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      }
      title="Nhân viên"
      subtitle="Tháng 10/2026 · GMT+7"
      actions={
        <Button size="sm">
          <PlusIcon />
          Thêm nhân viên
        </Button>
      }
    />
  );
}
