"use client";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const hocVien = [
  { ma: "HV001", ten: "Nguyễn Văn An", khoaHoc: "Lập trình web", trangThai: "Đang học" },
  { ma: "HV002", ten: "Trần Thị Bình", khoaHoc: "Thiết kế UI/UX", trangThai: "Hoàn thành" },
  { ma: "HV003", ten: "Lê Minh Châu", khoaHoc: "Quản trị dữ liệu", trangThai: "Tạm dừng" },
];

export default function TableDemo() {
  return (
    <Table>
      <TableCaption>Danh sách học viên đang theo dõi trong hệ thống.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Mã học viên</TableHead>
          <TableHead>Họ tên</TableHead>
          <TableHead>Khoá học</TableHead>
          <TableHead>Trạng thái</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {hocVien.map((hv) => (
          <TableRow key={hv.ma}>
            <TableCell className="font-medium">{hv.ma}</TableCell>
            <TableCell>{hv.ten}</TableCell>
            <TableCell>{hv.khoaHoc}</TableCell>
            <TableCell>{hv.trangThai}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>Tổng số học viên</TableCell>
          <TableCell>{hocVien.length}</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}
