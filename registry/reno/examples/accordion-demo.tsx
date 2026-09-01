import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function AccordionDemo() {
  return (
    <Accordion type="single" collapsible className="w-full max-w-md">
      <AccordionItem value="item-1">
        <AccordionTrigger>reno-ui là gì?</AccordionTrigger>
        <AccordionContent>
          Một registry shadcn tự lưu trữ, dùng để dựng giao diện cho nhiều lĩnh vực sản phẩm.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Có cần cài thêm gì không?</AccordionTrigger>
        <AccordionContent>
          Thành phần được cài dưới dạng mã nguồn, không phụ thuộc runtime vào registry.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
