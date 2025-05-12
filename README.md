# Text Form Chrome Extension

Chrome extension để tự động điền form với dữ liệu từ file text.

## Tính năng
- Tự động điền form từ dữ liệu trong file text
- Hỗ trợ nhiều loại form khác nhau
- Giao diện popup đơn giản, dễ sử dụng

## Cài đặt
1. Clone repository này về máy
2. Mở Chrome và truy cập `chrome://extensions/`
3. Bật chế độ Developer mode
4. Click "Load unpacked" và chọn thư mục chứa extension

## Sử dụng
1. Click vào icon extension trên thanh công cụ
2. Chọn file text chứa dữ liệu form
3. Extension sẽ tự động điền form với dữ liệu từ file

## Cấu trúc
- `manifest.json`: Cấu hình extension
- `popup.html/js`: Giao diện và logic popup
- `background.js`: Script chạy ngầm
- `content.js`: Script xử lý form
- `images/`: Thư mục chứa icon và hình ảnh
- `FORM.txt`: File mẫu chứa dữ liệu form 
