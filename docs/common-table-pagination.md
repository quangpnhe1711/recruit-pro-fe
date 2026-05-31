# CommonTable + CommonPagination

Tài liệu này mô tả cách dùng `CommonTable` và `CommonPagination`, cơ chế phân trang hiện tại, và ý nghĩa các tham số quan trọng.

## 1. Mục đích

- `CommonTable` dùng để render bảng dữ liệu dùng lại ở nhiều màn hình.
- `CommonPagination` dùng để render thanh phân trang phía dưới bảng.
- `CommonTable` có thể tự gắn `CommonPagination` khi bật `showPagination`.

## 2. CommonTable hoạt động như thế nào

`CommonTable` nhận:

- danh sách cột qua `columns`
- dữ liệu qua `data`
- hàm tạo key cho mỗi dòng qua `keyExtractor`
- tuỳ chọn trạng thái loading, empty, click dòng, style, và phân trang

### Cơ chế render ô dữ liệu

Mỗi cột là một `TableColumn<T>`:

- `key`: tên cột
- `header`: tiêu đề cột
- `renderCell`: render custom cho từng ô
- nếu không có `renderCell`, table sẽ lấy giá trị từ `item[key]`

> Lưu ý: nếu dùng `renderCell`, giá trị `key` chủ yếu để định danh cột; nội dung hiển thị lấy từ hàm render.

### Cơ chế hiển thị loading / empty

- `loading = true` → hiện một dòng loading
- `data.length === 0` → hiện `emptyMessage`

### Cơ chế click dòng

Nếu truyền `onRowClick`, mỗi row sẽ:

- có `cursor-pointer`
- gọi `onRowClick(item, index)` khi click

## 3. Cơ chế phân trang

`CommonTable` không tự cắt dữ liệu. Component cha phải:

1. tính `currentPage`, `totalPages`, `totalItems`
2. cắt mảng dữ liệu theo page hiện tại
3. truyền slice đó vào `data`
4. truyền metadata phân trang vào `pagination`

### Điều kiện để hiện pagination

Pagination chỉ hiện khi:

- `showPagination = true`
- `pagination.enabled = true`

### Luồng chuyển trang

- người dùng bấm Previous / số trang / Next
- `CommonPagination` gọi `onPageChange(page)`
- component cha cập nhật state `page`
- component cha tính lại slice dữ liệu và range

### Cách tính range phổ biến

```ts
const pageSize = 5;
const totalItems = filtered.length;
const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
const currentPage = Math.min(page, totalPages);

const rangeStart = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
const rangeEnd = Math.min(currentPage * pageSize, totalItems);
```

### Cách cắt dữ liệu

```ts
const start = (currentPage - 1) * pageSize;
const pageSlice = filtered.slice(start, start + pageSize);
```

## 4. CommonPagination hoạt động như thế nào

`CommonPagination` nhận metadata trang hiện tại và chỉ hiển thị điều hướng UI.

### Logic nút trang

- Prev: `currentPage - 1`
- Next: `currentPage + 1`
- số trang được clamp trong khoảng `1..totalPages`
- nếu `disabled = true`, mọi thao tác đổi trang bị chặn

### Logic số trang hiển thị

Component chỉ hiển thị tối đa **3 số trang**:

- luôn dùng `totalPages` để giới hạn
- số trang được tính từ `currentPage`
- nếu đang ở đầu hoặc cuối danh sách, dãy số sẽ dịch để vẫn giữ tối đa 3 nút

Ví dụ:

- `totalPages = 2` → hiển thị `1 2`
- `totalPages = 5`, `currentPage = 1` → hiển thị `1 2 3`
- `totalPages = 5`, `currentPage = 4` → hiển thị `3 4 5`

## 5. Tham số của CommonTable

| Prop | Kiểu | Bắt buộc | Ý nghĩa |
|---|---|---:|---|
| `columns` | `TableColumn<T>[]` | Có | Danh sách cột |
| `data` | `T[]` | Có | Dữ liệu đã được cắt theo page |
| `keyExtractor` | `(item, index) => string` | Có | Tạo key cho từng row |
| `loading` | `boolean` | Không | Hiện trạng thái loading |
| `emptyMessage` | `string` | Không | Text khi không có dữ liệu |
| `headerClassName` | `string` | Không | Class cho header row |
| `zebra` | `boolean` | Không | Xen kẽ màu nền row |
| `hover` | `boolean` | Không | Bật hiệu ứng hover row |
| `onRowClick` | `(item, index) => void` | Không | Click vào row |
| `pagination` | object | Không | Metadata phân trang |
| `showPagination` | `boolean` | Không | Bật hiển thị pagination |
| `tableHeaderBg` | `string` | Không | Class nền header table |
| `tableWrapperClassName` | `string` | Không | Class wrapper ngoài |

### Cấu trúc `TableColumn<T>`

| Prop | Kiểu | Ý nghĩa |
|---|---|---|
| `key` | `string` | Tên cột / key dữ liệu |
| `header` | `string` | Tiêu đề hiển thị |
| `headerClassName` | `string` | Class riêng cho `<th>` |
| `cellClassName` | `string` | Class riêng cho `<td>` |
| `renderCell` | `(item, index) => ReactNode` | Render custom |
| `alignRight` | `boolean` | Căn phải nội dung |

### Cấu trúc `pagination`

| Prop | Kiểu | Ý nghĩa |
|---|---|---|
| `enabled` | `boolean` | Bật/tắt phân trang |
| `currentPage` | `number` | Trang hiện tại |
| `totalPages` | `number` | Tổng số trang |
| `totalItems` | `number` | Tổng số bản ghi |
| `rangeStart` | `number` | Vị trí bản ghi đầu của page |
| `rangeEnd` | `number` | Vị trí bản ghi cuối của page |
| `onPageChange` | `(page) => void` | Callback đổi trang |

## 6. Tham số của CommonPagination

| Prop | Kiểu | Ý nghĩa |
|---|---|---|
| `currentPage` | `number` | Trang hiện tại |
| `totalPages` | `number` | Tổng số trang |
| `totalItems` | `number` | Tổng số bản ghi |
| `rangeStart` | `number` | Chỉ số bắt đầu hiển thị |
| `rangeEnd` | `number` | Chỉ số kết thúc hiển thị |
| `onPageChange` | `(page) => void` | Callback khi đổi trang |
| `disabled` | `boolean` | Vô hiệu hóa thao tác |

## 7. Ví dụ sử dụng

```tsx
const pageSize = 5;
const totalItems = items.length;
const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
const currentPage = Math.min(page, totalPages);
const start = (currentPage - 1) * pageSize;
const pageData = items.slice(start, start + pageSize);
const rangeStart = totalItems === 0 ? 0 : start + 1;
const rangeEnd = Math.min(start + pageSize, totalItems);

<CommonTable
  columns={columns}
  data={pageData}
  keyExtractor={(item) => item.id}
  loading={loading}
  showPagination
  pagination={{
    enabled: true,
    currentPage,
    totalPages,
    totalItems,
    rangeStart,
    rangeEnd,
    onPageChange: setPage,
  }}
/>
```

## 8. Ghi nhớ khi dùng

- Luôn cắt dữ liệu ở component cha, không đưa toàn bộ list vào `CommonTable` rồi mong table tự phân trang.
- Nếu `loading = true`, pagination vẫn render nhưng bị `disabled`.
- Nếu cần custom hiển thị ô, ưu tiên `renderCell`.
- Nên clamp `page` về `1..totalPages` để tránh page vượt giới hạn khi filter làm thay đổi tổng bản ghi.
