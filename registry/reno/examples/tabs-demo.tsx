import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TabsDemo() {
  return (
    <Tabs defaultValue="account" className="w-full max-w-sm">
      <TabsList className="w-full">
        <TabsTrigger value="account">Tài khoản</TabsTrigger>
        <TabsTrigger value="password">Mật khẩu</TabsTrigger>
      </TabsList>
      <TabsContent value="account" className="text-muted-foreground text-sm">
        Cập nhật thông tin tài khoản của bạn tại đây.
      </TabsContent>
      <TabsContent value="password" className="text-muted-foreground text-sm">
        Đổi mật khẩu đăng nhập tại đây.
      </TabsContent>
    </Tabs>
  );
}
