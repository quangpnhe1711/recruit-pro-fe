import * as yup from "yup";

const currentYear = new Date().getFullYear();

function optionalTrimmedString(max: number, message: string) {
  return yup
    .string()
    .transform((value) => (typeof value === "string" ? value.trim() : value))
    .max(max, message);
}

function optionalYearString(label: string) {
  return yup
    .string()
    .test("valid-year", `${label} không hợp lệ.`, (value) => {
      if (!value?.trim()) return true;
      const parsed = Number(value);
      return Number.isInteger(parsed) && parsed >= 1900 && parsed <= currentYear + 10;
    });
}

function optionalHttpUrl(label: string) {
  return yup
    .string()
    .test("valid-url", `${label} phải là URL hợp lệ.`, (value) => {
      if (!value?.trim()) return true;
      try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
      } catch {
        return false;
      }
    });
}

export const candidateRegisterSchema = yup.object({
  userInfo: yup.object({
    username: yup
      .string()
      .trim()
      .required("Bắt buộc")
      .min(4, "Tối thiểu 4 ký tự")
      .max(50, "Tối đa 50 ký tự")
      .matches(
        /^[a-zA-Z0-9._-]+$/,
        "Chỉ gồm chữ, số, dấu chấm, gạch dưới hoặc gạch ngang",
      ),
    fullName: yup.string().trim().required("Bắt buộc").max(100, "Tối đa 100 ký tự"),
    email: yup.string().trim().email("Email không hợp lệ").required("Bắt buộc"),
    password: yup.string().trim().required("Bắt buộc").min(6, "Tối thiểu 6 ký tự").max(100, "Tối đa 100 ký tự"),
    phone: yup
      .string()
      .test(
        "valid-phone",
        "Số điện thoại phải có 10 số và bắt đầu bằng 0.",
        (value) => !value?.trim() || /^0\d{9}$/.test(value.trim()),
      ),
  }),
});

export const jobCreateStep1Schema = yup.object({
  title: yup.string().trim().required("Vui lòng nhập tiêu đề tuyển dụng.").max(255, "Tiêu đề tối đa 255 ký tự."),
  department: yup.string().trim().required("Vui lòng chọn phòng ban.").max(100, "Phòng ban tối đa 100 ký tự."),
  location: yup.string().trim().required("Vui lòng nhập địa điểm làm việc.").max(255, "Địa điểm tối đa 255 ký tự."),
  employmentType: yup.string().required("Vui lòng chọn loại hình làm việc."),
  workMode: yup.string().required("Vui lòng chọn hình thức làm việc."),
  shortPitch: yup.string().trim().max(255, "Mô tả ngắn tối đa 255 ký tự."),
  // Optional; when set it must fall AFTER the posting date (today) — mirrors the backend
  // JOB_DEADLINE_INVALID rule so HR sees the problem before submitting.
  deadline: yup
    .string()
    .test("deadline-after-posting", "Hạn nộp hồ sơ phải sau ngày đăng tuyển.", (value) => {
      if (!value) return true;
      const picked = new Date(`${value}T00:00:00`);
      if (Number.isNaN(picked.getTime())) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return picked.getTime() > today.getTime();
    }),
});

export const jobCreateStep2Schema = yup.object({
  description: yup.string().trim().required("Vui lòng nhập mô tả công việc."),
  requirements: yup.array().of(yup.string().trim().required()).min(1, "Hãy thêm ít nhất một yêu cầu."),
});

export const jobCreateStep3Schema = yup.object({
  skills: yup
    .array()
    .of(
      yup.object({
        skillName: yup.string().trim().required("Kỹ năng là bắt buộc."),
        minimumYearsOfExperience: yup.string().test(
          "valid-minimum-years",
          "Số năm kinh nghiệm phải là số lớn hơn hoặc bằng 0.",
          (value) => !value?.trim() || (!Number.isNaN(Number(value)) && Number(value) >= 0),
        ),
      }),
    )
    .min(1, "Hãy chọn ít nhất một kỹ năng bắt buộc."),
  salaryMin: yup
    .string()
    .test("valid-salary-min", "Lương tối thiểu phải là số lớn hơn hoặc bằng 0.", (value) => !value?.trim() || (!Number.isNaN(Number(value)) && Number(value) >= 0)),
  salaryMax: yup
    .string()
    .test("valid-salary-max", "Lương tối đa phải là số lớn hơn hoặc bằng 0.", (value) => !value?.trim() || (!Number.isNaN(Number(value)) && Number(value) >= 0))
    .test("salary-order", "Lương tối đa phải lớn hơn hoặc bằng lương tối thiểu.", function validate(value) {
      const salaryMin = this.parent.salaryMin;
      if (!value?.trim() || !salaryMin?.trim()) return true;
      return Number(value) >= Number(salaryMin);
    }),
});

export const jobEditSchema = yup.object({
  title: yup.string().trim().required("Vui lòng nhập tiêu đề công việc.").max(255, "Tiêu đề tối đa 255 ký tự."),
  departmentId: yup.string().trim().required("Vui lòng chọn phòng ban."),
  location: yup.string().trim().max(255, "Địa điểm tối đa 255 ký tự."),
  vacancyCount: yup
    .string()
    .required("Vui lòng nhập số lượng tuyển.")
    .test("positive-int", "Số lượng tuyển phải lớn hơn 0.", (value) => {
      const parsed = Number(value);
      return Number.isInteger(parsed) && parsed > 0;
    }),
  minExperienceYears: yup
    .string()
    .required("Vui lòng nhập kinh nghiệm tối thiểu.")
    .test("non-negative-int", "Kinh nghiệm tối thiểu phải lớn hơn hoặc bằng 0.", (value) => {
      const parsed = Number(value);
      return Number.isInteger(parsed) && parsed >= 0;
    }),
  salaryMin: yup.string().test("salary-min", "Lương tối thiểu phải lớn hơn hoặc bằng 0.", (value) => !value?.trim() || (!Number.isNaN(Number(value)) && Number(value) >= 0)),
  salaryMax: yup
    .string()
    .test("salary-max", "Lương tối đa phải lớn hơn hoặc bằng 0.", (value) => !value?.trim() || (!Number.isNaN(Number(value)) && Number(value) >= 0))
    .test("salary-order", "Lương tối đa phải lớn hơn hoặc bằng lương tối thiểu.", function validate(value) {
      const salaryMin = this.parent.salaryMin;
      if (!value?.trim() || !salaryMin?.trim()) return true;
      return Number(value) >= Number(salaryMin);
    }),
  description: yup.string().trim().required("Vui lòng nhập mô tả công việc."),
  requirements: yup.string().test("requirements", "Hãy nhập ít nhất một yêu cầu.", (value) => Boolean(value?.split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean).length)),
});

export const interviewScheduleSchema = yup.object({
  date: yup.string().required("Vui lòng chọn ngày phỏng vấn."),
  startMinutes: yup.number().required().min(0).max(1439),
  durationMinutes: yup.number().required().min(15).max(240),
  mode: yup.string().oneOf(["video", "inPerson"]).required(),
  locationOrLink: yup.string().trim().required("Vui lòng nhập link họp hoặc địa điểm.").max(500, "Thông tin địa điểm/link tối đa 500 ký tự."),
  interviewerId: yup.string().trim().required("Vui lòng chọn người phỏng vấn."),
});

export const applyJobSchema = yup.object({
  coverLetter: yup.string().max(2000, "Thư giới thiệu tối đa 2000 ký tự."),
});

export const offerSchema = yup.object({
  offerTemplateId: yup.string(),
  baseSalary: yup
    .string()
    .required("Vui lòng nhập lương cơ bản.")
    .test("positive-number", "Lương cơ bản phải lớn hơn 0.", (value) => !Number.isNaN(Number(value)) && Number(value) > 0),
  currencyCode: yup.string().trim().required("Vui lòng chọn tiền tệ.").max(10, "Mã tiền tệ tối đa 10 ký tự."),
  bonusDescription: optionalTrimmedString(500, "Thưởng bổ sung tối đa 500 ký tự."),
  equityNotes: optionalTrimmedString(500, "Ghi chú cổ phần tối đa 500 ký tự."),
  employmentType: yup.string().trim().required("Vui lòng chọn loại hình làm việc.").max(100, "Loại hình làm việc tối đa 100 ký tự."),
  proposedStartDate: yup.string(),
  probationPeriod: optionalTrimmedString(100, "Thời gian thử việc tối đa 100 ký tự."),
  reportingManagerId: yup.string().trim(),
  personalMessage: optionalTrimmedString(2000, "Lời nhắn cá nhân tối đa 2000 ký tự."),
  benefitIds: yup.array().of(yup.string().trim().required()).required(),
});

export const applicationEmailSchema = yup.object({
  subject: yup.string().trim().required("Vui lòng nhập tiêu đề email.").max(255, "Tiêu đề email tối đa 255 ký tự."),
  body: yup.string().trim().required("Vui lòng nhập nội dung email."),
});

export const candidateProfileSchema = yup.object({
  name: yup.string().trim().required("Vui lòng nhập họ tên.").max(255, "Họ tên tối đa 255 ký tự."),
  headline: optionalTrimmedString(100, "Tiêu đề nghề nghiệp tối đa 100 ký tự."),
  email: yup.string().trim().required("Vui lòng nhập email.").email("Email không hợp lệ."),
  phone: yup.string().test("valid-phone", "Số điện thoại phải có 10 số và bắt đầu bằng 0.", (value) => !value?.trim() || /^0\d{9}$/.test(value.trim())),
  location: optionalTrimmedString(250, "Địa chỉ tối đa 250 ký tự."),
  bio: optionalTrimmedString(1000, "Giới thiệu tối đa 1000 ký tự."),
  github: optionalHttpUrl("Liên kết GitHub"),
  linkedin: optionalHttpUrl("Liên kết LinkedIn"),
});

export const experienceDraftSchema = yup.object({
  title: yup.string().trim().required("Vui lòng nhập chức danh.").max(255, "Chức danh tối đa 255 ký tự."),
  company: yup.string().trim().required("Vui lòng nhập công ty.").max(255, "Công ty tối đa 255 ký tự."),
  bullets: yup.string().test("bullets", "Hãy nhập ít nhất một gạch đầu dòng.", (value) => Boolean(value?.split("\n").map((line) => line.trim()).filter(Boolean).length)),
  startMonth: yup.number().min(1).max(12).required(),
  startYear: yup.number().min(1900).max(currentYear + 1).required(),
  endMonth: yup.number().min(1).max(12),
  endYear: yup.number().min(1900).max(currentYear + 1),
  isCurrent: yup.boolean().required(),
});

export const projectDraftSchema = yup.object({
  name: yup.string().trim().required("Vui lòng nhập tên dự án.").max(255, "Tên dự án tối đa 255 ký tự."),
  role: optionalTrimmedString(255, "Vai trò tối đa 255 ký tự."),
  description: optionalTrimmedString(2000, "Mô tả dự án tối đa 2000 ký tự."),
  technologies: yup.string().test("technologies", "Mỗi công nghệ tối đa 100 ký tự.", (value) => !value?.trim() || value.split(",").map((item) => item.trim()).filter(Boolean).every((item) => item.length <= 100)),
  startMonth: yup.number().min(1).max(12).required(),
  startYear: yup.number().min(1900).max(currentYear + 1).required(),
  endMonth: yup.number().min(1).max(12),
  endYear: yup.number().min(1900).max(currentYear + 1),
  isCurrent: yup.boolean().required(),
});

export const educationDraftSchema = yup.object({
  school: yup.string().trim().required("Vui lòng nhập trường học.").max(255, "Trường học tối đa 255 ký tự."),
  degree: yup.string().trim().required("Vui lòng nhập bằng cấp.").max(255, "Bằng cấp tối đa 255 ký tự."),
  fieldOfStudy: optionalTrimmedString(255, "Chuyên ngành tối đa 255 ký tự."),
  startYear: optionalYearString("Năm bắt đầu"),
  endYear: optionalYearString("Năm kết thúc"),
  description: optionalTrimmedString(1000, "Mô tả thêm tối đa 1000 ký tự."),
});

export const certificationDraftSchema = yup.object({
  name: yup.string().trim().required("Vui lòng nhập tên chứng chỉ.").max(255, "Tên chứng chỉ tối đa 255 ký tự."),
  issuer: optionalTrimmedString(255, "Đơn vị cấp tối đa 255 ký tự."),
  issuedOn: yup.string(),
  expiresOn: yup
    .string()
    .test("date-order", "Ngày hết hạn phải sau hoặc bằng ngày cấp.", function validate(value) {
      const issuedOn = this.parent.issuedOn;
      if (!value || !issuedOn) return true;
      return new Date(value).getTime() >= new Date(issuedOn).getTime();
    }),
  credentialId: optionalTrimmedString(255, "Mã chứng chỉ tối đa 255 ký tự."),
  credentialUrl: optionalHttpUrl("Liên kết chứng chỉ"),
});

export const languageDraftSchema = yup.object({
  name: yup.string().trim().required("Vui lòng nhập ngôn ngữ.").max(100, "Ngôn ngữ tối đa 100 ký tự."),
  proficiency: yup.string().trim().required("Vui lòng nhập trình độ.").max(100, "Trình độ tối đa 100 ký tự."),
});

export const customSectionDraftSchema = yup.object({
  title: yup.string().trim().required("Vui lòng nhập tên đầu mục lớn.").max(255, "Tên đầu mục tối đa 255 ký tự."),
  sectionType: yup.string().trim().required("Vui lòng nhập loại đầu mục.").max(100, "Loại đầu mục tối đa 100 ký tự."),
});

export const customSectionItemDraftSchema = yup.object({
  title: yup.string().trim().required("Vui lòng nhập tiêu đề cho mục con.").max(255, "Tiêu đề tối đa 255 ký tự."),
  subtitle: optionalTrimmedString(255, "Phụ đề tối đa 255 ký tự."),
  organization: optionalTrimmedString(255, "Tổ chức tối đa 255 ký tự."),
  location: optionalTrimmedString(255, "Địa điểm tối đa 255 ký tự."),
  description: optionalTrimmedString(2000, "Mô tả tối đa 2000 ký tự."),
  dateLabel: optionalTrimmedString(100, "Mốc thời gian tối đa 100 ký tự."),
  tags: yup.string().test("tag-length", "Mỗi tag tối đa 100 ký tự.", (value) => !value?.trim() || value.split(",").map((item) => item.trim()).filter(Boolean).every((item) => item.length <= 100)),
});

export type ValidationErrors = Record<string, string>;

export function collectYupErrors(error: unknown): ValidationErrors {
  if (!(error instanceof yup.ValidationError)) {
    return {};
  }

  const nextErrors: ValidationErrors = {};
  for (const item of error.inner) {
    if (item.path && !nextErrors[item.path]) {
      nextErrors[item.path] = item.message;
    }
  }

  if (error.path && !nextErrors[error.path]) {
    nextErrors[error.path] = error.message;
  }

  return nextErrors;
}

export function validateWithSchema<T>(schema: yup.ObjectSchema<T>, value: T): ValidationErrors {
  try {
    schema.validateSync(value, { abortEarly: false });
    return {};
  } catch (error) {
    return collectYupErrors(error);
  }
}
