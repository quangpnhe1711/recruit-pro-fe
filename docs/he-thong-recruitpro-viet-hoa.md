# Tài Liệu Hệ Thống RecruitPro Internal

## 1. Mục tiêu tài liệu

Tài liệu này dùng để:

- Việt hóa cách hiểu hệ thống RecruitPro Internal.
- Mô tả từng màn hình theo từng role.
- Giải thích màn hình đó làm gì.
- Chỉ ra màn hình đó gọi API nào và API đó phục vụ mục đích gì.
- Mô tả liên kết giữa các màn hình.
- Giải thích vì sao các thống kê và API đang có là hợp lý với một hệ thống tuyển dụng.
- Giải thích các trạng thái theo từng ngữ cảnh.

Lưu ý:

- Mình giữ nguyên tên `status` bằng tiếng Anh như bạn yêu cầu.
- Một số màn hiện là `UI placeholder`, hoặc có nút nhưng chưa nối backend đầy đủ. Mình sẽ ghi rõ để bạn không nhầm giữa "nghiệp vụ mong muốn" và "đã implement xong".

---

## 2. Tổng quan kiến trúc theo role

Hệ thống chia thành 4 nhóm lớn:

### Public

- Dùng để xem landing page, danh sách job, chi tiết job.
- Candidate chưa đăng nhập vẫn xem được job.
- Từ đây có thể đi đến login/register hoặc apply.

### Candidate

- Dùng cho ứng viên.
- Tập trung vào:
  - xem job,
  - apply job,
  - theo dõi application,
  - theo dõi interview,
  - quản lý profile/CV.

### HR

- Dùng cho bộ phận tuyển dụng.
- Tập trung vào:
  - tạo job,
  - quản lý candidate,
  - quản lý application,
  - xem CV,
  - schedule interview,
  - gửi offer,
  - dùng AI Copilot để xếp hạng ứng viên.

### Manager

- Dùng cho người duyệt cuối hoặc người quản lý tuyển dụng.
- Tập trung vào:
  - duyệt job do HR tạo,
  - review candidate ở giai đoạn cuối,
  - xem analytics tuyển dụng.

### System Admin

- Hiện mới là placeholder.
- Chưa có nghiệp vụ backend thực tế trong UI hiện tại.

---

## 3. Điều hướng chính theo role

## Public routes

- `/home`: trang landing.
- `/jobs`: route chung, render khác nhau tùy role.
- `/jobs/:jobId`: chi tiết job.
- `/login`: candidate login.
- `/register`: candidate register.
- `/internal/login`: internal login cho HR/Manager/System Admin.

## Candidate routes

- `/candidate/dashboard`
- `/jobs/:jobId/apply`
- `/candidate/my-applications`
- `/candidate/interviews`
- `/candidate/profile`

## HR routes

- `/hr/dashboard`
- `/hr/jobs/create`
- `/hr/candidates`
- `/hr/candidates/import`
- `/hr/applications`
- `/hr/applications/:applicationId`
- `/hr/applications/:applicationId/send-offer`
- `/hr/interviews`
- `/hr/interviews/schedule`
- `/hr/ai-copilot`

## Manager routes

- `/manager/dashboard`
- `/manager/applications`
- `/manager/applications/:applicationId`
- `/manager/reports`
- `/manager/jobs/:jobId/approval`

## Route dùng chung nhưng render theo role

- `/jobs`
  - Candidate: `JobListingCandidateScreen`
  - HR: `JobManagementScreen`
  - Manager: `ManagerJobApprovalListScreen`

Đây là một thiết kế hợp lý vì người dùng đều đang thao tác trên "job", nhưng góc nhìn khác nhau:

- Candidate xem job để apply.
- HR quản lý job đang tuyển.
- Manager duyệt job trước khi publish hoặc sau khi HR submit.

---

## 4. Bức tranh nghiệp vụ tổng thể

Luồng tuyển dụng của hệ thống hiện tại có thể hiểu như sau:

1. HR tạo job.
1. Job đi vào trạng thái chờ manager duyệt.
1. Manager duyệt job.
1. Candidate xem job và apply.
1. HR xem application, CV, hồ sơ ứng viên.
1. HR/Manager review application qua nhiều vòng.
1. HR schedule interview.
1. Sau khi đủ vòng và đủ tín hiệu, application đi đến `MANAGER_REVIEW`.
1. HR tạo và gửi offer nếu ứng viên đạt.
1. Candidate theo dõi application, interview, và có thể accept offer.

AI Copilot là luồng phụ để hỗ trợ HR xếp hạng candidate theo prompt nghiệp vụ.

---

## 5. Màn hình theo Public

### 5.1 `LandingPageScreen`

### Mục đích

- Là trang giới thiệu hệ thống.
- Dẫn người dùng đến job listing hoặc internal login.
- Hiển thị một ít job nổi bật.

### API gọi

- `GET /jobs` qua `jobsService.listPublicJobs({ page: 1, pageSize: 3, sortBy: "newest" })`

### API này làm gì

- Lấy danh sách job public mới nhất.
- FE cắt 3 job đầu để hiển thị dạng `featuredJobs`.

### Liên kết màn hình

- Đi đến `/jobs`
- Đi đến `/internal/login`

### Vì sao hợp lý

- Landing page không cần dữ liệu sâu.
- Chỉ cần một ít job mới nhất để kéo người dùng vào funnel tuyển dụng.
- Đây là cách tốt để public side không phụ thuộc quá nhiều vào dữ liệu nội bộ.

### Ghi chú triển khai

- Một phần `hero/stats` đang fallback bằng dữ liệu cứng nếu backend không trả về.
- Có nút `Browse Openings` đang trỏ `/candidate/jobs`, nhưng route thực tế đang dùng là `/jobs`. Đây là điểm bạn nên lưu ý sau này.

---

### 5.2 `JobListingCandidateScreen`

### Mục đích

- Là màn danh sách job cho candidate/public.
- Hỗ trợ search, filter, sort, phân trang.

### API gọi

- `GET /skills` qua `jobsService.listSkills()`
- `GET /jobs` qua `jobsService.listPublicJobs(...)`

### API này làm gì

- `/skills`: lấy danh sách skill để filter job theo kỹ năng.
- `/jobs`: lấy danh sách job public, có hỗ trợ:
  - `page`
  - `pageSize`
  - `keyword`
  - `employmentTypes`
  - `skills`
  - `sortBy`

### Liên kết màn hình

- Đi đến `/jobs/:jobId`

### Vì sao hợp lý

- Job listing là entry point chính của candidate.
- Filter theo skill, employment type, keyword là hoàn toàn đúng nghiệp vụ tuyển dụng.
- FE đang tự xử lý thêm một phần filter theo salary range và một phần search client-side để tránh backend phải gánh quá nhiều logic UI.

### Ghi chú triển khai

- Link `Open Candidate Profile` hiện trỏ `/internal/candidate-profile`, route này chưa tồn tại trong route hiện tại.

---

### 5.3 `JobDetailScreen`

### Mục đích

- Hiển thị chi tiết một job.
- Tùy role mà thấy thêm thông tin nội bộ như:
  - recent applications
  - hiring funnel
  - actions nội bộ

### API gọi

- `GET /jobs/:jobId` qua `jobsService.getJobDetail(jobId)`

### API này làm gì

- Trả về chi tiết job:
  - thông tin core của job,
  - description,
  - requirements,
  - benefits,
  - skills,
  - `applicationCount`,
  - `recentApplications`,
  - `hiringFunnel`,
  - `availableActions`

### Liên kết màn hình

- Candidate/public bấm `Apply Now`:
  - nếu chưa login -> `/login`
  - nếu đã login -> `/jobs/:jobId/apply`
- Quay về `/jobs`

### Vì sao hợp lý

- Một job detail tốt phải có đủ thông tin để candidate quyết định apply.
- Với internal user, việc nhìn thêm `recentApplications` và `hiringFunnel` giúp đánh giá chất lượng posting và tiến độ tuyển.
- Gộp các data này vào một API là hợp lý vì đây là "job detail context", giảm số request từ FE.

### Ghi chú triển khai

- Nút `Edit Job`, `View Applications`, `Close Posting` hiện thiên về UI/permission, chưa nối đầy đủ hành vi điều hướng hoặc mutation tương ứng.

---

### 5.4 `CandidateLoginScreen`

### Mục đích

- Đăng nhập candidate.
- Hỗ trợ remember email.
- Hỗ trợ forgot password.

### API gọi

- `POST /auth/candidate/login`
- `POST /auth/candidate/forgot-password`

### API này làm gì

- Login trả về thông tin auth + user + role để FE lưu vào store.
- Forgot password gửi yêu cầu cấp mật khẩu tạm hoặc reset flow.

### Liên kết màn hình

- Sau login:
  - nếu có `redirect from` -> quay về màn trước đó, ví dụ `/jobs/:jobId/apply`
  - nếu không -> `/candidate/dashboard`
- Đi đến `/register`
- Đi đến `/home`

### Vì sao hợp lý

- Candidate thường vào hệ thống từ job detail rồi mới login.
- Giữ `redirectTarget` là hợp lý vì không làm candidate mất ngữ cảnh apply.

---

### 5.5 `CandidateRegisterScreen`

### Mục đích

- Tạo tài khoản candidate theo flow nhiều bước.
- Thu thập:
  - thông tin tài khoản,
  - hồ sơ nghề nghiệp,
  - resume.

### API gọi

- `POST /candidates/register` qua `candidateService.register(...)`

### API này làm gì

- Gửi multipart form-data gồm:
  - `userInfo`
  - `profile`
  - `resume`

### Liên kết màn hình

- Sau đăng ký hiện tại chỉ báo thành công, chưa tự điều hướng mạnh sang login/dashboard.
- Có link quay về `/login`.

### Vì sao hợp lý

- Đăng ký ứng viên thường cần nhiều hơn email/password.
- Có resume và profile ngay từ đầu giúp hệ thống giảm friction ở bước apply.

---

### 5.6 `InternalLoginScreen`

### Mục đích

- Đăng nhập cho HR, Manager, System Admin.

### API gọi

- `POST /auth/internal/login`
- `POST /auth/internal/forgot-password`

### Liên kết màn hình

- Điều hướng theo role:
  - HR -> `/hr/dashboard`
  - Manager -> `/manager/dashboard`
  - System Admin -> `/system-admin/dashboard`

### Vì sao hợp lý

- Internal user cần login riêng với candidate vì permission model khác hoàn toàn.
- Phân cổng đăng nhập giúp rõ boundary giữa ứng viên và người vận hành hệ thống.

---

## 6. Màn hình theo Candidate

### 6.1 `DashboardCandidateScreen`

### Mục đích

- Trang tổng quan cho candidate.
- Hiển thị:
  - số job đã apply,
  - số interview,
  - số notification chưa đọc,
  - interview gần nhất,
  - job được gợi ý.

### API gọi

- `GET /candidate/dashboard`

### API này làm gì

- Trả về:
  - `stats`
  - `upcomingInterview`
  - `recommendedJobs`

### Liên kết màn hình

- Về mặt UI có gợi ý đi tới job listing và meeting link.
- Nhưng một số nút hiện chưa navigate thật.

### Vì sao hợp lý

- Candidate cần biết ngay:
  - mình đang có bao nhiêu application,
  - có interview nào sắp diễn ra,
  - có job nào phù hợp tiếp theo.
- `upcomingInterview` là dữ liệu có giá trị nhất vì ảnh hưởng trực tiếp tới hành động ngắn hạn.

### Vì sao thống kê hợp lý

- `appliedJobs`: đo mức độ tham gia của ứng viên trong pipeline.
- `interviews`: cho thấy mức độ tiến triển.
- `unreadNotifications`: giữ candidate quay lại hệ thống.

---

### 6.2 `ApplyJobScreen`

### Mục đích

- Cho candidate nộp đơn vào một job cụ thể.
- Kiểm tra đủ điều kiện apply trước khi submit.

### API gọi

- `GET /jobs/:jobId/apply-context`
- `POST /jobs/:jobId/apply`

### API này làm gì

- `apply-context` trả về:
  - job summary,
  - candidate profile hiện tại,
  - resume hiện tại,
  - `eligibility`
- `apply` tạo application mới.

### Liên kết màn hình

- Từ `/jobs/:jobId` vào.
- Sau khi apply thành công:
  - đi `/candidate/my-applications`
  - hoặc quay `/jobs`
- Nếu blocked:
  - đi `/candidate/profile`
  - hoặc `/candidate/my-applications` nếu đã apply rồi.

### Vì sao hợp lý

- Đây là thiết kế rất hợp lý cho nghiệp vụ tuyển dụng:
  - trước khi apply phải biết candidate có đủ hồ sơ không,
  - đã apply chưa,
  - có blocker nào không.
- Tách `apply-context` khỏi `apply` giúp FE render chính xác trạng thái form trước khi submit.

### Vì sao thống kê/logic hợp lý

- `alreadyApplied` tránh duplicate application.
- `blockers` giúp candidate hiểu vì sao không apply được.
- `guidanceMessage` giúp giảm support thủ công từ HR.

### Ghi chú triển khai

- Cover letter đang có UI nhưng comment nói DB chưa persist phần này hoàn chỉnh.

---

### 6.3 `MyApplicationScreen`

### Mục đích

- Cho candidate theo dõi các application của mình.

### API gọi

- `GET /candidate/applications`

### API có nhưng màn hiện chưa gọi mutation

- `POST /candidate/applications/:applicationId/withdraw`
- `POST /candidate/applications/:applicationId/accept-offer`

### API này làm gì

- API danh sách trả về:
  - các application item,
  - summary `total/active/closed`
  - `availableActions`

### Liên kết màn hình

- Về mặt UI có:
  - `View Detail`
  - `Withdraw`
  - `Accept Offer`
- Nhưng hiện màn này chưa nối các action trên vào API thật.

### Vì sao hợp lý

- Candidate cần theo dõi application theo "journey".
- `availableActions` là cách thiết kế tốt vì backend quyết định action nào hợp lệ theo trạng thái.

### Vì sao thống kê hợp lý

- `total`: tổng mức độ tham gia.
- `active`: số hồ sơ còn đang chạy trong pipeline.
- `closed`: hồ sơ đã kết thúc, giúp candidate phân biệt hồ sơ còn sống và hồ sơ đã xong.

---

### 6.4 `CandidateInterviewScreen`

### Mục đích

- Cho candidate xem lịch sử và lịch sắp tới của interview.

### API gọi

- `GET /candidate/interviews`

### API này làm gì

- Trả về danh sách interview của candidate.

### Liên kết màn hình

- Chủ yếu là màn theo dõi, chưa có điều hướng sâu.

### Vì sao hợp lý

- Candidate cần một màn tập trung cho interview vì đây là phần có deadline thực.

### Vì sao thống kê hợp lý

- `scheduled`: số lịch cần chuẩn bị.
- `completed`: số vòng đã xong.
- `nextInterview`: giúp candidate biết sự kiện quan trọng kế tiếp.

---

### 6.5 `CandidateProfileAndCVManagementScreen`

### Mục đích

- Candidate quản lý hồ sơ cá nhân, skills, experience và resume.

### API gọi

- `GET /candidate/profile`
- `GET /skills`
- `PUT /candidate/profile`
- `PUT /candidate/profile/skills`
- `POST /candidate/profile/experience`
- `POST /candidate/profile/resume`

### API có trong service nhưng màn này chưa dùng hết

- `PUT /candidate/profile/experience/:experienceId`
- `DELETE /candidate/profile/experience/:experienceId`

### API này làm gì

- Lấy profile tổng thể.
- Lấy master skill list.
- Cập nhật profile text.
- Cập nhật selected skills.
- Thêm kinh nghiệm.
- Upload resume.

### Liên kết màn hình

- Từ dashboard hoặc apply screen đi vào.
- Apply screen còn dùng `editProfilePath` để đẩy candidate sang đây nếu thiếu hồ sơ.

### Vì sao hợp lý

- Đây là "nguồn sự thật" của candidate profile.
- Hệ thống tuyển dụng rất cần tách:
  - thông tin cá nhân,
  - skill taxonomy,
  - experience,
  - resume file.

### Vì sao hợp lý về API

- `/skills` là master data dùng lại nhiều nơi.
- Tách skills riêng khỏi profile text giúp backend dễ query/match.
- Resume upload tách riêng là chuẩn vì file thường cần xử lý khác JSON.

---

## 7. Màn hình theo HR

### 7.1 `HrDashboardScreen`

### Mục đích

- Trang tổng quan vận hành tuyển dụng cho HR.

### API gọi

- `GET /hr/dashboard`

### API này làm gì

- Trả về:
  - `stats`
  - `recentApplications`
  - `pendingApprovals`
  - `hiringVelocity`
  - `diversityReport`

### Liên kết màn hình

- Về mặt UI có các CTA như:
  - review draft
  - view all approvals
  - view all recent applications
- Nhưng hiện chưa nối điều hướng mạnh cho mọi nút.

### Vì sao hợp lý

- HR là role vận hành, nên dashboard phải ưu tiên:
  - posting đang mở,
  - lượng applicant,
  - lịch interview hôm nay,
  - job chờ duyệt.

### Vì sao thống kê hợp lý

- `activePostings`: cho HR biết khối lượng job đang sống.
- `totalApplicants`: phản ánh workload screening.
- `interviewsToday`: phản ánh khối lượng execution trong ngày.
- `pendingApprovals`: cho biết điểm nghẽn giữa HR và Manager.
- `hiringVelocity`: đo hiệu suất tuyển dụng.
- `diversityReport`: phản ánh góc nhìn vận hành nhân sự ở mức chiến lược.

---

### 7.2 `JobManagementScreen`

### Mục đích

- Quản lý danh sách job của HR.
- Filter theo department, creator, status.
- Sửa nhanh, xóa, mở chi tiết job.

### API gọi

- `GET /hr/jobs`
- `PATCH /hr/jobs/:jobId`
- `DELETE /hr/jobs/:jobId`

### API này làm gì

- Lấy danh sách job nội bộ + `stats` cho management view.
- Update job cơ bản và status.
- Xóa job.

### Liên kết màn hình

- `Post New Job` -> `/hr/jobs/create`
- `View Applications` trong bảng -> `/jobs/:jobId`

### Vì sao hợp lý

- HR cần một màn quản lý hàng loạt, không chỉ tạo mới.
- Màn này hợp với use case day-to-day operations hơn màn tạo job chi tiết.

### Vì sao thống kê hợp lý

- `activeJobs`: số job đang tuyển.
- `pendingApproval`: số job bị chặn ở bước manager review.
- `totalApplications`: đo demand và workload.
- `timeToHireDays`: đo hiệu quả chung của team tuyển dụng.

### Ghi chú triển khai

- Có local storage helper cũ nhưng dữ liệu chính đang lấy từ backend.

---

### 7.3 `JobCreatingScreen`

### Mục đích

- Tạo mới job theo flow nhiều bước.

### API gọi

- `GET /skills`
- `POST /hr/jobs`

### API này làm gì

- Lấy danh sách skill để gắn cho job.
- Tạo job mới với đầy đủ metadata.

### Liên kết màn hình

- Sau submit thành công -> `/jobs`

### Vì sao hợp lý

- Tạo job là nghiệp vụ nhiều trường dữ liệu, nên chia step là đúng:
  - Basic Info
  - Description
  - Skills & Pay
  - Review

### Vì sao API hợp lý

- Job creation cần đầy đủ:
  - title,
  - department,
  - work mode,
  - description,
  - requirements,
  - skills,
  - salary,
  - vacancy.
- Đây là dữ liệu nền của toàn pipeline sau này.

### Ghi chú triển khai

- Màn có `save draft` local trên browser.
- Nút `Publish Job` đang bị ràng buộc cả `JOB_CREATE` lẫn `JOB_APPROVE`, tức là FE đang giả định người publish cuối cần quyền approve. Về nghiệp vụ có thể bạn sẽ muốn xem lại, vì thường HR tạo và Manager duyệt là hai bước riêng.

---

### 7.4 `CandidateListScreen`

### Mục đích

- Quản lý danh sách candidate tổng quát.

### API gọi

- `GET /hr/candidates`

### Liên kết màn hình

- `Import Candidates` -> `/hr/candidates/import`
- `View Profile` và `Edit` hiện mới toast, chưa có màn chi tiết candidate độc lập.

### Vì sao hợp lý

- HR cần xem candidate pool tổng quát, không chỉ candidate đã vào application cụ thể.

### Vì sao thống kê hợp lý

- `totalCandidates`: kích thước talent pool.
- `recentlyAdded`: tốc độ vào pool gần đây.
- `pendingReviews`: phần backlog cần xử lý.

### Ghi chú triển khai

- Đây là màn pool-level, khác với application-level.
- Hiện chưa có route candidate detail riêng cho HR.

---

### 7.5 `CandidateImportScreen`

### Mục đích

- Import candidate hàng loạt từ file Excel.

### API gọi

- `GET /candidates/import/template`
- `POST /candidates/import/preview`
- `POST /candidates/import`

### API này làm gì

- Download file mẫu để user điền đúng format.
- Preview để backend validate từng dòng trước khi import thật.
- Confirm import chỉ những dòng hợp lệ được chọn.

### Liên kết màn hình

- Import xong -> `/hr/candidates`

### Vì sao hợp lý

- Bulk import luôn nên tách thành 3 bước:
  - template,
  - preview/validate,
  - confirm import.
- Đây là pattern rất chuẩn, giúp tránh nhập bẩn dữ liệu.

### Vì sao thống kê hợp lý

- `totalRows`, `validRows`, `invalidRows` cho HR nhìn ngay chất lượng file import.

---

### 7.6 `CandidateApplicationScreen`

### Mục đích

- HR/Manager xem toàn bộ application.
- Search/filter theo candidate, department, status, date range.

### API gọi

- `GET /hr/applications`
- `GET /hr/applications/:applicationId/cv`
- `POST /hr/applications/:applicationId/send-email`

### API này làm gì

- Lấy danh sách application.
- Lấy CV của một application cụ thể.
- Gửi email theo template hoặc subject.

### Liên kết màn hình

- `Review`
  - HR -> `/hr/applications/:applicationId`
  - Manager -> `/manager/applications/:applicationId`
- `View CV`: mở file CV.

### Vì sao hợp lý

- Đây là inbox chính của team tuyển dụng.
- HR cần nhìn application theo job/department/status để xử lý backlog.

### Vì sao API hợp lý

- `send-email` gắn vào application là đúng vì mail thường gắn với trạng thái hồ sơ, không phải chỉ gắn với candidate.
- `application CV` đi theo application cũng hợp lý vì một candidate có thể có resume hoặc ngữ cảnh khác nhau theo từng lần nộp.

---

### 7.7 `CandidateReviewDetailScreen`

### Mục đích

- Xem chi tiết một application để ra quyết định.

### API gọi

- `GET /hr/applications/:applicationId`
- `GET /hr/applications/:applicationId/cv`
- `PATCH /hr/applications/:applicationId/decision`

### API này làm gì

- Trả về toàn bộ review context:
  - candidate profile,
  - job summary,
  - skill match,
  - interview timeline,
  - review info,
  - offer state.
- Update decision:
  - `hire`
  - `hold`
  - `reject`

### Liên kết màn hình

- Quay về list applications.
- Nếu HR và status đã tới `managerreview` thì có thể vào:
  - `/hr/applications/:applicationId/send-offer`

### Vì sao hợp lý

- Đây là màn quyết định nghiệp vụ nên cần gom đủ context một chỗ.
- Tách khỏi list giúp giảm tải màn danh sách.

### Vì sao thống kê hợp lý

- `skillsMatchPercent`: hỗ trợ quyết định nhanh.
- `submittedInterviewNotes/totalInterviews`: đo độ đầy đủ feedback.
- `offerStatus`: giúp biết hồ sơ đã bước sang giai đoạn offer chưa.

---

### 7.8 `SendOfferScreen`

### Mục đích

- HR soạn offer, lưu nháp, gửi offer qua email.

### API gọi

- `GET /hr/applications/:applicationId/offer`
- `PUT /hr/applications/:applicationId/offer`
- `POST /hr/applications/:applicationId/offer/send`

### API này làm gì

- Lấy editor context cho offer:
  - candidate/job,
  - offer draft hiện tại,
  - master data template/benefit/currency/reporting managers
- Lưu draft offer.
- Gửi offer chính thức.

### Liên kết màn hình

- Quay về `/hr/applications/:applicationId`

### Vì sao hợp lý

- Offer là một artifact riêng, có vòng đời riêng.
- Tách `save draft` và `send` là hoàn toàn đúng.

### Vì sao API hợp lý

- Offer thường cần master data đi kèm như currency, benefits, template, manager.
- Gom hết vào API editor giúp FE render được form hoàn chỉnh chỉ với một lần load.

---

### 7.9 `JobInterviewListScreen`

### Mục đích

- Quản lý toàn bộ lịch interview.

### API gọi

- `GET /hr/interviews`
- `PATCH /hr/interviews/:interviewId/status`
- `DELETE /hr/interviews/:interviewId`

### Liên kết màn hình

- `Schedule Interview` -> `/hr/interviews/schedule`
- `Reschedule` -> `/hr/interviews/schedule` kèm state

### Vì sao hợp lý

- Interview là execution layer của tuyển dụng nên cần màn riêng để:
  - xem lịch,
  - xác nhận hoàn thành,
  - hủy,
  - export.

### Vì sao thống kê hợp lý

- `total`
- `actionNeeded`
- `completionRate`

Ba số này cho HR biết:

- có bao nhiêu lịch trong giai đoạn đang xem,
- bao nhiêu cái còn pending xử lý,
- chất lượng hoàn thành execution ra sao.

### Ghi chú triển khai

- FE map `canceled/cancelled` thành `Rescheduled`, nên bạn nên phân biệt đây là lựa chọn UI hiện tại chứ chưa chắc là đúng domain cuối cùng.

---

### 7.10 `InterviewScheduleScreen`

### Mục đích

- Chọn ngày, slot, interviewer, mode và location/link để tạo interview.

### API gọi

- `GET /hr/interviews/schedule-data`
- `POST /hr/interviews`

### API này làm gì

- `schedule-data` trả về:
  - candidate context,
  - interviewer list,
  - `busySlotsByDate`,
  - `slotMinutes`
- `createInterview` tạo interview mới.

### Liên kết màn hình

- Thành công -> `/hr/interviews`
- Có thể vào từ candidate review context qua `applicationId`.

### Vì sao hợp lý

- Schedule interview cần dữ liệu availability theo interviewer và theo ngày.
- Đây là loại dữ liệu riêng, không nên trộn vào list interview chung.

### Vì sao API hợp lý

- `busySlotsByDate` là cách tốt để FE render calendar + slot availability.
- `slotMinutes` cho phép backend toàn quyền quyết định chuẩn slot của hệ thống.

### Ghi chú triển khai

- FE có local draft cho lịch interview.
- `createInterview` đang gửi `status: "confirmed"`.
- Route yêu cầu đồng thời `INTERVIEW_VIEW_SCHEDULE_DATA` và `INTERVIEW_CREATE`.

---

### 7.11 `AiCopilotScreen`

### Mục đích

- Hỗ trợ HR dùng AI để xếp hạng candidate theo prompt.

### API gọi

- `GET /copilot/jobs`
- `POST /copilot/conversations`
- `GET /copilot/jobs/:jobId/candidates`
- `POST /copilot/conversations/:conversationId/rankings`

### API này làm gì

- Lấy danh sách job có thể dùng copilot.
- Tạo conversation context cho một job.
- Lấy candidate pool của job đó.
- Tạo ranking session từ prompt.

### Liên kết màn hình

- Đây là màn làm việc độc lập, chưa đẩy trực tiếp sang review detail.

### Vì sao hợp lý

- AI ranking nên luôn gắn với một `job context`.
- Tách `conversation` và `ranking` là hợp lý vì:
  - có thể hỏi nhiều prompt trên cùng một job,
  - có thể dùng context của phiên trước.

### Vì sao thống kê hợp lý

- `Retained / Rejected / Rules` cho HR biết ngay impact của prompt.
- `totalScore`, sub-score, `autoRejectRules` là cực hữu ích để AI không thành "hộp đen".

---

## 8. Màn hình theo Manager

### 8.1 `ManagerDashboardScreen`

### Mục đích

- Dashboard điều phối quyết định cho manager.

### API gọi

- `GET /manager/dashboard`

### API này làm gì

- Trả về:
  - `summary`
  - `pendingApprovals`
  - `finalDecisions`
  - `departmentHiringSpeed`
  - `recruitmentFunnel`

### Liên kết màn hình

- `Open Review Queue` -> `/manager/applications`
- `Review Jobs` -> `/jobs`
- `Reports` -> `/manager/reports`

### Vì sao hợp lý

- Manager không cần quá nhiều dữ liệu thao tác nhỏ.
- Manager cần:
  - cái gì đang chờ phê duyệt,
  - candidate nào tới bước quyết định cuối,
  - tốc độ tuyển của từng phòng ban.

### Vì sao thống kê hợp lý

- `pendingApprovals`: backlog cần manager xử lý.
- `activeApplications`: mức độ nóng của pipeline.
- `averageReviewCycleDays`: đo độ chậm/nhanh của quy trình.
- `acceptanceRate`: đo chất lượng tuyển dụng cuối chuỗi.

---

### 8.2 `ManagerJobApprovalListScreen`

### Mục đích

- Hàng chờ manager duyệt job do HR submit.

### API gọi

- `GET /manager/jobs/approval-queue`

### API này làm gì

- Trả về:
  - queue items,
  - pagination,
  - summary:
    - pending approvals
    - submitted today
    - overdue reviews
    - departments waiting

### Liên kết màn hình

- Chọn một row -> `/manager/jobs/:jobId/approval`

### Vì sao hợp lý

- Approval queue là khái niệm riêng với job management.
- Manager cần nhìn hàng chờ quyết định, không cần tất cả job như HR.

### Vì sao thống kê hợp lý

- `submittedToday`: nhịp vào queue.
- `overdueReviews`: phát hiện bottleneck.
- `departmentsWaiting`: đo phạm vi ảnh hưởng business.

---

### 8.3 `ManagerJobApprovalDetailScreen`

### Mục đích

- Xem đầy đủ một job draft để approve, return draft hoặc reject.

### API gọi

- `GET /manager/jobs/:jobId/approval-detail`
- `PATCH /hr/jobs/:jobId/status`

### API này làm gì

- Lấy toàn bộ context duyệt job:
  - core specs,
  - skills,
  - interview flow,
  - role overview,
  - approval snapshot,
  - insights
- Cập nhật trạng thái job sang:
  - `APPROVED`
  - `DRAFT`
  - `REJECTED`

### Liên kết màn hình

- Xong action -> quay `/jobs`

### Vì sao hợp lý

- Manager duyệt job cần đủ dữ liệu để đánh giá:
  - job có rõ scope không,
  - skills có hợp lý không,
  - lương có hợp lý không,
  - số opening có đúng nhu cầu không.

### Vì sao thống kê hợp lý

- `applicationsCount`, `activePipelineCount` cho thấy job này có đang sống trong hệ thống không.
- `requiredSkillsCount`, `minExperienceYears` giúp manager đánh giá độ chặt của JD.

---

### 8.4 `ManagerCandidateReviewListScreen`

### Mục đích

- Hàng chờ final review cho candidate sau khi đã qua các vòng trước.

### API gọi

- `GET /manager/applications/review-queue`

### API này làm gì

- Trả về:
  - candidate queue,
  - summary:
    - pending final approvals
    - recommended count
    - flagged count
    - average score

### Liên kết màn hình

- Chọn item -> `/manager/applications/:applicationId`

### Vì sao hợp lý

- Manager không nên xem toàn bộ application từ đầu.
- Manager chỉ nên thấy những hồ sơ đã đủ context cho final decision.

### Vì sao thống kê hợp lý

- `recommendedCount`: số hồ sơ đang nghiêng về pass.
- `flaggedCount`: số hồ sơ có rủi ro.
- `averageScore`: mức chất lượng trung bình của queue hiện tại.

---

### 8.5 `CandidateReviewDetailScreen` khi role là Manager

### Mục đích

- Dùng cùng màn với HR nhưng góc nhìn manager là quyết định cuối.

### API gọi

- Giống HR:
  - `GET /hr/applications/:applicationId`
  - `GET /hr/applications/:applicationId/cv`
  - `PATCH /hr/applications/:applicationId/decision`

### Vì sao hợp lý

- HR và Manager cùng review một thực thể `application`.
- Khác nhau chủ yếu ở quyền và điểm vào, không cần tách hai màn khác hẳn nếu context gần giống nhau.

---

### 8.6 `ManagerRecruitmentAnalyticsScreen`

### Mục đích

- Cho manager nhìn bức tranh phân tích tuyển dụng ở mức chiến lược và vận hành.

### API gọi

- `GET /manager/reports/recruitment-analytics`

### API này làm gì

- Trả về:
  - `overview`
  - `trend`
  - `funnel`
  - `distribution`
  - `departmentPerformance`
  - `departmentBreakdown`

### Liên kết màn hình

- Quay về `/manager/dashboard`

### Vì sao hợp lý

- Report không nên chỉ là list.
- Manager cần nhìn:
  - trend theo thời gian,
  - conversion funnel,
  - phân bố trạng thái pipeline,
  - hiệu quả từng phòng ban.

### Vì sao thống kê hợp lý

- `averageReviewCycle`: chất lượng execution.
- `activeCandidates`: khối lượng pipeline.
- `pendingInterviews`: tải ngắn hạn.
- `offerAcceptanceRate`: hiệu quả cuối phễu.
- `departmentPerformance`: so sánh business unit.
- `distribution`: biết pipeline đang nghẽn ở đâu.

---

## 9. Màn hình System Admin

Các route:

- `/system-admin/dashboard`
- `/system-admin/users`
- `/system-admin/roles`
- `/system-admin/permissions`
- `/system-admin/audit-logs`

Hiện tất cả đều là `FeaturePlaceholderScreen`.

### Ý nghĩa

- Hệ thống đã chừa sẵn permission và route cho quản trị nền tảng.
- Nhưng UI nghiệp vụ thật chưa được build.

### Vì sao hợp lý

- Đây là dấu hiệu kiến trúc đã nghĩ đến mở rộng quản trị hệ thống.
- Tách role `system-admin` ra riêng giúp không trộn quyền vận hành tuyển dụng với quyền quản trị nền tảng.

---

## 10. Bảng trạng thái theo từng context

## 10.1 Job status

- `DRAFT`
  - Job mới tạo hoặc bị trả về để sửa.
  - Chưa sẵn sàng publish.

- `PENDING_APPROVAL`
  - HR đã submit job.
  - Đang chờ manager duyệt.

- `APPROVED`
  - Job đã được duyệt.
  - Có thể được xem như sẵn sàng publish/chạy tuyển.

- `CLOSED`
  - Job đã đóng tuyển.
  - Không nên nhận application mới.

- `REJECTED`
  - Job bị từ chối trong approval flow.
  - Không đi tiếp nếu không tạo lại hoặc sửa flow.

### Context dùng

- Job management
- Job approval detail
- Job detail

---

## 10.2 Application status ở mức domain

- `PENDING`
  - Candidate vừa apply.
  - HR chưa review sâu.

- `REVIEWING`
  - Hồ sơ đang được HR hoặc hệ thống xem xét.

- `INTERVIEWING`
  - Hồ sơ đã bước vào vòng phỏng vấn.

- `MANAGER_REVIEW`
  - Hồ sơ đã đủ context để manager quyết định cuối.

- `ACCEPTED`
  - Hồ sơ thành công ở mức kết luận.
  - Thực tế có thể đã nhận offer hoặc pass quyết định cuối.

- `REJECTED`
  - Hồ sơ bị loại.

### Context dùng

- application list
- review detail
- manager review queue

---

## 10.3 Application status ở mức UI mapping

Một số màn không hiện raw status mà map sang label thân thiện hơn:

- `New`
  - Thường map từ hồ sơ mới vào queue, gần với `PENDING`.

- `Under Review`
  - Thường map từ `REVIEWING` hoặc đôi lúc `MANAGER_REVIEW` ở vài màn pool/list.

- `Interviewing`
  - Map từ `INTERVIEWING`.

- `Rejected`
  - Map từ `REJECTED`.

- `Offered`
  - Ở candidate side, đây là nhãn UI phản ánh application đang có action `acceptOffer`.

### Lưu ý

- Các label UI này không hoàn toàn đồng nhất 1-1 với domain status.
- Khi đọc code, nên phân biệt:
  - `status thật từ backend`
  - `status FE map để hiển thị`

---

## 10.4 Application review decision

- `hire`
  - Đề xuất/ra quyết định nhận ứng viên.

- `hold`
  - Tạm giữ hồ sơ, chưa loại cũng chưa nhận.

- `reject`
  - Loại hồ sơ.

### Context dùng

- `CandidateReviewDetailScreen`

### Vì sao tách `decision` khỏi `status`

- `decision` là hành động nghiệp vụ.
- `status` là trạng thái hệ thống sau khi hành động được xử lý.

---

## 10.5 Offer status

Trong code hiện tại `offer.status` là string backend trả về, nhưng UI đang hiểu tối thiểu:

- `draft`
  - Offer đang soạn hoặc lưu nháp.

- `sent`
  - Offer đã được gửi.

### Context dùng

- `SendOfferScreen`
- `CandidateReviewDetailScreen`

### Vì sao hợp lý

- Offer luôn có vòng đời riêng.
- Tối thiểu cần phân biệt:
  - chưa gửi,
  - đã gửi.

---

## 10.6 Interview status

Ở candidate side:

- `Scheduled`
  - Đã có lịch.

- `Completed`
  - Đã diễn ra xong.

- `Cancelled`
  - Bị hủy.

Ở HR side UI:

- `Confirmed`
  - Lịch đang hợp lệ và chờ diễn ra.

- `Completed`
  - Đã hoàn tất.

- `Rescheduled`
  - FE đang dùng nhãn này cho trường hợp thay đổi lịch hoặc map từ canceled.

Khi tạo interview:

- `draft`
  - Nháp.

- `confirmed`
  - Lịch chính thức.

### Context dùng

- Candidate interviews
- HR interview list
- Interview scheduling

### Lưu ý

- Phần status interview hiện có dấu hiệu chưa normalize tuyệt đối giữa các màn.
- Đây là chỗ bạn nên chuẩn hóa sau nếu muốn backend và frontend thống nhất hơn.

---

## 10.7 Copilot ranking status

Không có enum status cứng kiểu workflow, nhưng có các tín hiệu:

- `recommendation`
  - Ví dụ: `Strong Hire`, `Hire`, `Hold`, hoặc nhãn backend sinh ra.

- `isAutoRejected`
  - Candidate bị loại tự động theo rule.

- `rejectReason`
  - Lý do auto reject.

### Context dùng

- `AiCopilotScreen`

### Vì sao hợp lý

- AI ranking không nên chỉ trả điểm.
- Cần trả:
  - kết luận,
  - lý do,
  - luật đã chuẩn hóa,
  - phần mạnh/yếu.

---

## 11. Liên kết màn hình theo luồng nghiệp vụ

## 11.1 Luồng job approval

1. HR vào `/hr/jobs/create`
1. Tạo job qua `POST /hr/jobs`
1. Job xuất hiện ở `/jobs` với góc nhìn HR
1. Manager vào `/jobs`
1. Mở `/manager/jobs/:jobId/approval`
1. Duyệt bằng `PATCH /hr/jobs/:jobId/status`

---

## 11.2 Luồng candidate apply

1. Candidate/public vào `/jobs`
1. Mở `/jobs/:jobId`
1. Bấm apply
1. Nếu chưa login -> `/login`
1. Nếu đã login -> `/jobs/:jobId/apply`
1. FE gọi `GET /jobs/:jobId/apply-context`
1. Submit qua `POST /jobs/:jobId/apply`
1. Xem lại ở `/candidate/my-applications`

---

## 11.3 Luồng review application

1. HR vào `/hr/applications`
1. Mở `/hr/applications/:applicationId`
1. Xem CV và review context
1. Ra quyết định qua `PATCH /hr/applications/:applicationId/decision`
1. Nếu hồ sơ sang giai đoạn phù hợp, HR vào `/hr/applications/:applicationId/send-offer`

Manager:

1. Vào `/manager/applications`
1. Mở `/manager/applications/:applicationId`
1. Review final context
1. Ra quyết định cuối

---

## 11.4 Luồng interview

1. HR vào `/hr/interviews`
1. Chọn schedule hoặc reschedule
1. Vào `/hr/interviews/schedule`
1. FE gọi `GET /hr/interviews/schedule-data`
1. Xác nhận qua `POST /hr/interviews`
1. Quay lại `/hr/interviews`
1. Candidate xem ở `/candidate/interviews`

---

## 11.5 Luồng offer

1. HR review application detail
1. Nếu status phù hợp, vào `/hr/applications/:applicationId/send-offer`
1. FE gọi `GET /hr/applications/:applicationId/offer`
1. Save draft qua `PUT /hr/applications/:applicationId/offer`
1. Send qua `POST /hr/applications/:applicationId/offer/send`
1. Candidate có thể thấy action `acceptOffer` ở `My Applications`

---

## 12. Nhận xét nhanh về thiết kế hiện tại

## Điểm tốt

- Chia role khá rõ.
- Service layer tách tốt theo `candidate/hr/manager/jobs/auth/copilot`.
- Permission model khá rõ ràng.
- Nhiều API được thiết kế theo đúng `screen context`, rất tiện cho FE.

## Điểm cần lưu ý

- Một số màn đang có nút UI nhưng chưa nối hết hành vi thật.
- Một số status đang được FE map chưa hoàn toàn đồng nhất giữa các màn.
- Có vài link/route placeholder hoặc chưa tồn tại thật.
- Candidate side có mutation `withdraw/accept-offer` trong service nhưng màn chưa gọi.

---

## 13. Kết luận ngắn

Nếu hiểu hệ thống theo cách đơn giản nhất thì:

- `Public/Candidate` là phía tạo demand ứng tuyển.
- `HR` là phía vận hành pipeline tuyển dụng.
- `Manager` là phía phê duyệt và quyết định cuối.
- `System Admin` là phía quản trị nền tảng, hiện chưa build thật.

Nhìn theo dữ liệu:

- `Job` là điểm bắt đầu.
- `Application` là trục trung tâm của quy trình.
- `Interview` là bước thực thi đánh giá.
- `Offer` là bước kết thúc theo hướng nhận.
- `Copilot` là công cụ hỗ trợ decision.

Nếu bạn muốn, bước tiếp theo mình có thể làm tiếp một bản thứ hai theo kiểu:

- sơ đồ role -> màn -> API
- sơ đồ pipeline trạng thái từ đầu tới cuối
- hoặc bóc riêng từng API backend thành "input/output/ai gọi ai trước ai sau"

