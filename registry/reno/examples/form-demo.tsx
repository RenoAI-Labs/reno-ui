"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  fullName: z.string().min(2, "Họ và tên phải có ít nhất 2 ký tự"),
  role: z.string().min(1, "Vui lòng chọn vai trò"),
  agreeTerms: z
    .boolean()
    .refine((value) => value === true, { message: "Bạn cần đồng ý điều khoản để tiếp tục" }),
});

type FormValues = z.infer<typeof formSchema>;

export default function FormDemo() {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      role: "",
      agreeTerms: false,
    },
  });

  async function onSubmit(values: FormValues) {
    // Giả lập một lệnh gọi API để minh hoạ trạng thái đang xử lý.
    await new Promise((resolve) => setTimeout(resolve, 800));
    console.log(values);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex w-full max-w-sm flex-col gap-[var(--density-gap)]"
      >
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Họ và tên</FormLabel>
              <FormControl>
                <Input placeholder="Nguyễn Văn A" {...field} />
              </FormControl>
              <FormDescription>Tên hiển thị trên hồ sơ của bạn.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vai trò</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn vai trò" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="admin">Quản trị viên</SelectItem>
                  <SelectItem value="editor">Biên tập viên</SelectItem>
                  <SelectItem value="viewer">Người xem</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="agreeTerms"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start gap-2">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div className="grid gap-1 leading-none">
                <FormLabel>Tôi đồng ý với điều khoản dịch vụ</FormLabel>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Đang gửi..." : "Gửi biểu mẫu"}
        </Button>
      </form>
    </Form>
  );
}
