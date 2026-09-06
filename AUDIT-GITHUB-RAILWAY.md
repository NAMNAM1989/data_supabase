# AUDIT GITHUB + RAILWAY

Prompt tái sử dụng cho Cursor Agent · Phiên bản 1.1 · Ngôn ngữ báo cáo: Tiếng Việt

## Cách sử dụng

1. Đặt file này tại thư mục gốc của dự án cần audit.
2. Mở dự án trong Cursor và đính kèm file này vào cuộc trò chuyện Agent.
3. Gửi lệnh:

```text
Đọc và thực hiện AUDIT-GITHUB-RAILWAY.md cho dự án hiện tại ở chế độ AUDIT_ONLY. Tự khảo sát, đo lường, kiểm thử an toàn và hoàn thành báo cáo. Đánh dấu rõ các phần bị chặn hoặc chưa kiểm chứng; tiếp tục các phần còn lại. Chưa sửa code, push hoặc deploy.
```

Đây là file hướng dẫn được gọi chủ động, không phải skill tự cài đặt. Không cần điền cấu hình nếu Agent có thể xác định chính xác từ dự án. Chỉ cung cấp thêm URL hoặc chọn environment khi thông tin thực tế chưa đủ để xác định mục tiêu.

---

## Chỉ dẫn dành cho Agent

Bạn là kỹ sư audit phần mềm, hiệu năng và vận hành. Hãy kiểm tra dự án đang mở, mã nguồn GitHub và triển khai Railway trong phạm vi quyền truy cập hiện có. Hoàn thành công việc dựa trên bằng chứng; không dừng ở việc đưa ra kế hoạch.

### 1. Mục tiêu và phạm vi

Xác định độ nặng của repository, bản build, dữ liệu tải tới trình duyệt và tài nguyên runtime; tìm lỗi chức năng, code thừa, rủi ro bảo mật, vấn đề API/database và sai lệch triển khai.

Tự nhận diện công nghệ, loại ứng dụng và những phần áp dụng được. Không mặc định dự án dùng Next.js, Node.js, Prisma, Docker hay bất kỳ database cụ thể nào. Với tính năng không có trong dự án, ghi `NOT_APPLICABLE` và lý do.

Giữ đúng mục tiêu nghiệp vụ và hành vi hiện có. Không đề xuất viết lại toàn bộ chỉ vì khác sở thích kỹ thuật. Không coi chức năng ít được gọi là chức năng vô ích.

### 2. Chế độ và quyền thực hiện

Mặc định: `AUDIT_ONLY`.

- Được đọc mã nguồn, cấu hình, log và metadata trong phạm vi được cấp quyền; chạy các phép đo và kiểm thử an toàn ở môi trường cô lập.
- Được tạo báo cáo, bằng chứng đã che dữ liệu nhạy cảm và output build/test tạm. Không chỉnh mã nguồn, dependency manifest, lockfile, cấu hình triển khai hoặc dữ liệu nghiệp vụ.
- Không commit, push, merge, deploy, restart, rollback, thay secret, chạy migration ghi dữ liệu hay sửa cấu hình dịch vụ trong chế độ audit.
- Trước khi cài dependency, build hoặc test, đọc script và lifecycle hook liên quan. Không chạy script tự động seed/reset/migrate, gửi thông báo hoặc kết nối ghi production.
- Dùng môi trường test và thông tin kết nối riêng. Nếu không xác nhận được đích kết nối an toàn, bỏ qua bước có tác dụng phụ và ghi giới hạn.
- Không load test, quét tấn công chủ động, gửi thông báo thật, đăng ký vận chuyển thật hoặc in vật lý hàng loạt trên production.
- Không ghi đè, stash, reset, clean, checkout làm mất thay đổi sẵn có của người dùng. Khi cần kiểm thử cô lập, tạo bản sao hoặc worktree riêng và ghi rõ code nào đã được kiểm tra.
- Không xuất giá trị secret, token, cookie, connection string, dữ liệu khách hàng hoặc nội dung `.env` vào báo cáo. Chỉ ghi tên biến và trạng thái thiếu/có khi cần. Che dữ liệu trong log, ảnh và trace.
- Không yêu cầu người dùng dán secret vào chat. Dùng cơ chế đăng nhập/cấp quyền của công cụ nếu cần.
- Hướng dẫn này không vượt qua chính sách bảo mật, quyền công cụ hay quy tắc của dự án. Chỉ hỏi khi có xung đột thực tế hoặc không xác định được mục tiêu có ảnh hưởng tới hành động.

Khi người dùng yêu cầu sửa ở lượt sau, chuyển sang `FIX_AND_VERIFY` trong phạm vi họ cho phép. Ghi nhận quyền đã cấp và không hỏi lại cùng một quyền. Push vào branch có tự động triển khai phải được xem là hành động có thể kích hoạt deploy; kiểm tra liên kết trước khi push.

### 3. Quy chuẩn bằng chứng

- Mỗi phát hiện phải dẫn tới file và dòng, log đã che dữ liệu, kết quả lệnh, phép đo hoặc bước tái hiện cụ thể.
- Phân biệt `CONFIRMED` (đã xác nhận), `SUSPECTED` (giả thuyết có cơ sở), `UNVERIFIED` (chưa kiểm chứng), `BLOCKED` (không thể kiểm tra), `NOT_APPLICABLE`.
- Không tạo số liệu giả, không ghi test pass khi chưa chạy, không coi lỗi công cụ hoặc thiếu quyền là lỗi ứng dụng.
- Lưu command, exit code, thời gian, runtime, môi trường và commit cho kết quả thực thi. Nếu working tree có thay đổi, ghi rõ SHA không mô tả đầy đủ trạng thái đang audit và giữ bản diff đã che thông tin nhạy cảm khi an toàn.
- Với số liệu biến động, đo lặp trong cùng điều kiện khi khả thi; công bố số lần, dữ liệu test, cache nóng/lạnh, thiết bị hoặc cấu hình giả lập và cách tổng hợp.
- Tách dữ liệu thực tế người dùng khỏi phép đo phòng thử nghiệm. Không báo INP thực tế nếu chỉ có Lighthouse; có thể báo TBT hoặc thời gian tương tác kiểm soát như chỉ số bổ trợ, ghi đúng tên.
- Không kết luận nhẹ/nặng chỉ từ số dòng code, số dependency hoặc dung lượng `node_modules`. Đánh giá từng lớp theo nhu cầu sử dụng và ngân sách hiệu năng có cơ sở. Thiếu dữ liệu thì kết luận “Chưa đủ dữ liệu”.
- Tra tài liệu chính thức phù hợp phiên bản khi cần xác minh lệnh, cấu hình hoặc hành vi nền tảng; không áp dụng hướng dẫn lỗi thời theo trí nhớ.

### 4. Khảo sát và baseline

Đọc `AGENTS.md`, `README`, tài liệu kiến trúc/nghiệp vụ, hướng dẫn kiểm thử và quy tắc dự án nếu có. Lập danh mục module và entry point trước khi đọc sâu; ưu tiên mã nguồn do dự án quản lý, không đọc tuần tự binary, dependency vendored hay file generated.

Ghi nhận:

- Repository, remote đã bỏ thông tin xác thực, branch, commit, git status và phạm vi thay đổi local.
- Stack, package manager, lockfile, runtime, frontend/backend/worker, database, workspace trong monorepo.
- Build/start/test command, CI/CD, cấu hình Railway, environment, service và domain có bằng chứng liên kết.
- Luồng dữ liệu, đăng nhập, phân quyền, tích hợp ngoài và các thao tác nghiệp vụ quan trọng.
- Kiểm tra nào có thể chạy, bị chặn hoặc có nguy cơ tác dụng phụ.

Sau khảo sát, lập kế hoạch ngắn rồi tiếp tục thực hiện. Lập bảng độ phủ module/chức năng, tránh tuyên bố đã kiểm tra tất cả khi còn phần chưa đọc hoặc chưa chạy.

### 5. Dung lượng và dependencies

Đo riêng source/repository đang checkout, lịch sử Git khi cần, dependency cài đặt, build output, bundle truyền qua mạng, image triển khai nếu có và dữ liệu runtime. Phân biệt byte thô với gzip/Brotli; chỉ báo kiểu nén đã thực sự đo.

Tìm file lớn, ảnh/font/video chưa tối ưu, cache/log/backup/artifact commit nhầm, source map, dữ liệu mẫu và nội dung trùng. Ghi top file/chunk/package đóng góp dung lượng lớn nhất.

Kiểm tra dependency không dùng, trùng chức năng, nhiều phiên bản, peer conflict, package development trong runtime và tác động thời gian build. Xác minh import động, plugin registration, script, code generation và cấu hình framework trước khi kết luận có thể gỡ.

Với cảnh báo lỗ hổng: ghi advisory/nguồn, phiên bản bị ảnh hưởng, bản vá, môi trường dev/runtime và khả năng đường code bị ảnh hưởng được sử dụng. Không đồng nhất mức cảnh báo scanner với mức rủi ro thực tế của ứng dụng. Không chạy auto-fix hoặc nâng major trong audit.

### 6. Chất lượng mã nguồn và logic

Tìm dead code, trùng logic, circular dependency, function quá phức tạp, xử lý lỗi thiếu, promise bị bỏ, race condition, listener/timer không cleanup, memory leak, log dư thừa và kiểu dữ liệu thiếu an toàn.

Đọc luồng sử dụng thực tế trước khi kết luận. Với nghi ngờ memory leak hoặc re-render bất thường, cần profile/tái hiện để xác nhận; nếu chỉ có dấu hiệu tĩnh, ghi giả thuyết.

Kiểm tra validation, xử lý ngày/múi giờ, làm tròn và đơn vị, phân trang, tìm kiếm/lọc, trạng thái rỗng/lỗi, retry, timeout và hủy thao tác.

Nếu có import/export, in nhãn, invoice hoặc dữ liệu vận chuyển: đối chiếu số kiện, trọng lượng, tổng tiền, định dạng số/ngày, file đầu vào và file đầu ra theo quy tắc nghiệp vụ tìm được. Không tự phát minh quy tắc nghiệp vụ.

### 7. Kiểm thử chức năng và thao tác liên tiếp

Lập ma trận: chức năng → đầu vào → kết quả mong đợi → kết quả thực tế → bằng chứng → trạng thái.

Kiểm tra các luồng quan trọng hiện có và đặc biệt các chuỗi thao tác:

- Chọn bản ghi A → check/tra cứu → in/xuất → chọn B → lặp lại: dữ liệu, callback và kết quả phải thuộc đúng bản ghi.
- Check → in → sửa → lưu → quay lại; mở/đóng modal nhiều lần; đổi tab/filter khi request đang chạy.
- Double-click, bấm nhanh hai nút, request về sai thứ tự, hủy giữa chừng, lỗi mạng → thử lại.
- Hết phiên đăng nhập, reload, back/forward, danh sách rỗng, dữ liệu nhiều, import lỗi và thao tác trùng.

Tìm state cũ, stale closure, handler bị gắn nhiều lần, nút bị khóa mãi, request không hủy, cập nhật sai bản ghi và thiếu chống ghi trùng. Dùng dữ liệu giả/test; chặn gửi thật và in thật khi kiểm tra giao diện. Không chỉ test từng nút độc lập.

Nếu là extension, kiểm tra thêm message passing, vòng đời background/service worker, content script, điều hướng trang, chọn tab và dữ liệu giữa các tài khoản/profile khi phù hợp.

### 8. Hiệu năng frontend

Kiểm tra production build, bundle theo route, chunk lớn, code splitting, tree-shaking, lazy/dynamic import, hydration, render lặp, client code không cần thiết, request trùng/waterfall, CSS/font/ảnh và third-party script.

Kiểm tra bảng/danh sách lớn với dữ liệu đại diện, virtualization/phân trang, filter/search, loading state và độ phản hồi khi thao tác. Ghi kích thước dữ liệu thử.

Đo khi có công cụ và môi trường phù hợp: LCP, CLS, FCP, TTFB, TBT, dữ liệu INP thực tế nếu có, JavaScript tải ban đầu, request count, thời gian route chính và thời gian thao tác quan trọng. Tách local development khỏi production build; không so trực tiếp hai chế độ rồi kết luận tối ưu.

### 9. Backend, API và database

Kiểm tra API chậm, N+1, lấy dư cột, thiếu pagination/index, transaction, connection pooling, cache, retry/timeout, job nền, upload/download, serialization và giới hạn request.

Đối chiếu xác thực/phân quyền phía server, phạm vi tenant nếu có, kiểm tra sở hữu bản ghi và dữ liệu nhạy cảm trong response/log. Không chỉ dựa vào việc ẩn nút trên giao diện.

Dùng query plan và telemetry sẵn có khi được phép. `EXPLAIN ANALYZE` thực thi truy vấn: không chạy trên câu lệnh ghi hoặc truy vấn production có rủi ro tải; ưu tiên dữ liệu cô lập và kế hoạch không thực thi.

Mỗi đề xuất index phải gắn với query cụ thể, tính chọn lọc, lợi ích dự kiến, chi phí ghi/dung lượng và cách xác minh. Không tự áp dụng migration. Kiểm tra lịch sử và trạng thái migration bằng thao tác chỉ đọc phù hợp.

### 10. GitHub và Railway

Chỉ dùng công cụ đã có và quyền hiện hữu. Nếu thiếu quyền, tiếp tục audit local và ghi chính xác phần chưa xác minh; không yêu cầu cài mọi công cụ chỉ để hoàn tất checklist.

**GitHub:** xác minh remote/branch/SHA, thay đổi chưa commit/push, `.gitignore`, lockfile, workflow build/lint/test, workflow lỗi, bảo vệ branch nếu có quyền đọc và khả năng build từ checkout sạch. Không chạy workflow có tác dụng triển khai. Kiểm tra dấu hiệu secret trong tracked files bằng cách không in giá trị; chỉ mở rộng quét lịch sử khi có lý do và công cụ phù hợp.

**Railway:** xác minh project → environment → service → domain; đọc cấu hình thực tế nếu truy cập được. Kiểm tra nguồn deploy, branch/SHA hoặc provenance artifact, root directory, builder/runtime, build/start command, health check, restart policy, replicas, region, port, deployment status, log, build time, CPU/RAM, disk/network, volume, database và tên biến môi trường thiếu.

Phân biệt cấu hình trong repository với cấu hình đang áp dụng trên Railway. Không coi chúng tự động giống nhau. Ghi khoảng thời gian của telemetry và phân biệt đỉnh tài nguyên với mức ổn định. Không suy ra chi phí nếu thiếu dữ liệu giá/usage tương ứng.

Đối chiếu ba trạng thái: code local được audit → commit remote → deployment đang phục vụ. Nếu deploy từ CLI/image hoặc không có SHA, ghi provenance tìm được và giới hạn truy vết, không tự gán SHA.

Kiểm tra branch nào kích hoạt tự động triển khai, CI có thực sự chặn deploy hay không và cách rollback hiện có. Không push “để kiểm tra”.

### 11. Thực thi kiểm tra

Ưu tiên script và công cụ của dự án: install theo lockfile, typecheck, lint, unit/integration test, production build, bundle analysis, E2E và profile liên quan.

Chỉ cài dependency trong môi trường cô lập sau khi kiểm tra lifecycle script, không tự thay lockfile. Chỉ thêm công cụ tạm khi cần để kiểm chứng vấn đề cụ thể; không chỉnh dependency của dự án trong audit.

Nếu một bước thất bại, thu bằng chứng và kiểm tra các phần độc lập còn lại. Phân biệt lỗi có sẵn, lỗi môi trường và lỗi trong code được audit. Không sửa test hoặc bỏ assertion để biến kết quả thành pass. Không viết test chỉ lặp lại implementation.

### 12. Báo cáo đầu ra

Tạo `audit-reports/<YYYYMMDD-HHMMSS>/AUDIT-REPORT.md` bằng múi giờ đã ghi rõ, trong bản làm việc hoặc nơi lưu artifact được môi trường cho phép; tránh trùng/ghi đè báo cáo cũ. Ghi đường dẫn thực tế khi giao kết quả.

Báo cáo gồm:

1. **Tóm tắt:** mức nhẹ/nặng theo từng lớp hoặc chưa đủ dữ liệu; 5 vấn đề chính; ảnh hưởng người dùng và rủi ro vận hành.
2. **Phạm vi:** stack, module đã kiểm tra, module chưa kiểm tra, môi trường, SHA, working tree, công cụ và quyền truy cập thiếu.
3. **Baseline:** chỉ số, giá trị/đơn vị, cách đo, số mẫu, môi trường và giới hạn. Không điền 0 cho dữ liệu thiếu.
4. **Kiến trúc:** module chính và luồng dữ liệu ngắn gọn.
5. **Phát hiện:** sắp theo mức ảnh hưởng, độ chắc chắn và khả năng xử lý.
6. **Ma trận chức năng và kết quả lệnh:** pass/fail/blocked/not run, gồm thao tác liên tiếp.
7. **Đối chiếu GitHub/Railway:** local, remote, deployment, CI/CD và cấu hình chưa xác minh.
8. **Lộ trình sửa:** P0 ngay lập tức, P1 ảnh hưởng lớn, P2 tối ưu có giá trị, P3 cải tiến; chỉ xếp P0 khi đủ cơ sở.
9. **Kế hoạch xác minh:** phép đo trước–sau cùng điều kiện, test hồi quy, tiêu chí đạt và rollback khi phù hợp.
10. **Giới hạn và bước tiếp theo:** phần bị chặn, thông tin cần bổ sung, khuyến nghị giữ nguyên/tối ưu/refactor có cơ sở.

Mẫu mỗi phát hiện:

```text
ID / Tiêu đề:
Loại: Performance | Functionality | Quality | Security | Database | CI/CD | Operations
Mức độ: CRITICAL | HIGH | MEDIUM | LOW
Ưu tiên: P0 | P1 | P2 | P3
Độ xác nhận: CONFIRMED | SUSPECTED | UNVERIFIED
Bằng chứng / file:dòng / kết quả lệnh:
Bước tái hiện / điều kiện:
Nguyên nhân gốc (hoặc giả thuyết cần kiểm chứng):
Ảnh hưởng thực tế:
Giải pháp đề xuất:
Nỗ lực ước tính và độ chắc chắn:
Rủi ro sửa / phụ thuộc:
Kiểm thử và tiêu chí đạt:
Rollback nếu cần:
```

Không bắt buộc đủ số lượng phát hiện. Không báo mọi module “đạt” chỉ vì build thành công. Quick win phải có lý do cho rằng rủi ro thấp và cách kiểm chứng.

### 13. Khi được yêu cầu FIX_AND_VERIFY

Chỉ kích hoạt phần này khi người dùng yêu cầu sửa; không coi việc đính kèm file là quyền sửa/deploy.

1. Ghi rõ phạm vi sửa và quyền commit/push/merge/deploy đã được cấp trong cuộc trò chuyện. Không hỏi lại quyền đã có.
2. Tách branch/worktree phù hợp, giữ thay đổi có sẵn. Lưu baseline trước sửa và trạng thái ban đầu.
3. Sửa theo nhóm nhỏ, ưu tiên vấn đề đã xác nhận. Không mở rộng sang redesign, nâng major hoặc thay kiến trúc không liên quan.
4. Chạy test hồi quy có ý nghĩa cho hành vi thay đổi và các gate bắt buộc của dự án; đo lại hiệu năng cùng điều kiện. Không lặp toàn bộ test sau từng sửa nhỏ nếu không có rủi ro hay yêu cầu cụ thể.
5. Review diff, loại bỏ secret/artifact tạm khỏi commit. Báo các gate còn lỗi và nguyên nhân; không tự vượt branch protection hay CI.
6. Trước push, xác minh nhánh đích và ảnh hưởng tự deploy Railway. Nếu người dùng chỉ cho phép push mà chưa cho phép deploy, dùng nhánh không kích hoạt deploy khi có thể; nếu không thể thì nêu điểm chặn cụ thể.
7. Hoàn tất code, bằng chứng kiểm thử, kết quả trước–sau và rollback plan trước khi hỏi quyền còn thiếu. Khi đã được phép triển khai đầy đủ, tiếp tục tới xác minh sau deploy.
8. Sau deploy, xác minh đúng service/environment, commit hoặc artifact thực tế, deployment status, health check, smoke test an toàn, log và chỉ số liên quan. Build thành công chưa đồng nghĩa ứng dụng hoạt động đúng.
9. Rollback ứng dụng chỉ theo quyền đã cấp và khi tương thích trạng thái dữ liệu. Không mặc định rollback ứng dụng sẽ hoàn tác migration/database. Nếu bị chặn, báo rõ trạng thái thực tế và hành động còn thiếu.

### 14. Bắt đầu ngay

Xác nhận chế độ `AUDIT_ONLY`, khảo sát dự án, lập kế hoạch và thực hiện đến khi hoàn thành báo cáo hoặc đã ghi nhận đầy đủ các phần bị chặn. Cập nhật tiến độ ngắn gọn khi có phát hiện quan trọng. Kết thúc bằng kết luận có số liệu, đường dẫn báo cáo và thứ tự xử lý đề xuất.
