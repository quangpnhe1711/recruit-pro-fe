using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace RecruitPro.Dto.Jobs
{
    public sealed class JobDto
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [JsonPropertyName("department")]
        public string Department { get; set; } = string.Empty;

        [JsonPropertyName("employment_type")]
        public string EmploymentType { get; set; } = string.Empty;

        [JsonPropertyName("work_mode")]
        public string WorkMode { get; set; } = string.Empty;

        [JsonPropertyName("short_pitch")]
        public string? ShortPitch { get; set; }

        [JsonPropertyName("description")]
        public string? Description { get; set; }

        [JsonPropertyName("responsibilities")]
        public List<string> Responsibilities { get; set; } = [];

        [JsonPropertyName("requirements")]
        public List<string> Requirements { get; set; } = [];

        [JsonPropertyName("required_skills")]
        public List<string> RequiredSkills { get; set; } = [];

        [JsonPropertyName("nice_to_have_skills")]
        public List<string> NiceToHaveSkills { get; set; } = [];

        [JsonPropertyName("salary_min")]
        public decimal SalaryMin { get; set; }

        [JsonPropertyName("salary_max")]
        public decimal SalaryMax { get; set; }

        [JsonPropertyName("currency")]
        public string Currency { get; set; } = string.Empty;

        [JsonPropertyName("location")]
        public string? Location { get; set; }

        [JsonPropertyName("created_date")]
        public DateOnly? CreatedDate { get; set; }

        [JsonPropertyName("created_at")]
        public long? CreatedAt { get; set; }

        [JsonPropertyName("created_by")]
        public string? CreatedBy { get; set; }

        [JsonPropertyName("approval_status")]
        public string ApprovalStatus { get; set; } = string.Empty;

        [JsonPropertyName("applications_count")]
        public int ApplicationsCount { get; set; }

        [JsonPropertyName("posted_at")]
        public DateTimeOffset? PostedAt { get; set; }

        [JsonPropertyName("deadline")]
        public DateOnly? Deadline { get; set; }

        [JsonPropertyName("tags")]
        public List<string> Tags { get; set; } = [];
    }

    public sealed class CreateJobRequestDto
    {
        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [JsonPropertyName("department")]
        public string Department { get; set; } = string.Empty;

        [JsonPropertyName("employment_type")]
        public string EmploymentType { get; set; } = string.Empty;

        [JsonPropertyName("work_mode")]
        public string WorkMode { get; set; } = string.Empty;

        [JsonPropertyName("short_pitch")]
        public string? ShortPitch { get; set; }

        [JsonPropertyName("description")]
        public string? Description { get; set; }

        [JsonPropertyName("responsibilities")]
        public List<string> Responsibilities { get; set; } = [];

        [JsonPropertyName("requirements")]
        public List<string> Requirements { get; set; } = [];

        [JsonPropertyName("required_skills")]
        public List<string> RequiredSkills { get; set; } = [];

        [JsonPropertyName("nice_to_have_skills")]
        public List<string> NiceToHaveSkills { get; set; } = [];

        [JsonPropertyName("salary_min")]
        public decimal SalaryMin { get; set; }

        [JsonPropertyName("salary_max")]
        public decimal SalaryMax { get; set; }

        [JsonPropertyName("currency")]
        public string Currency { get; set; } = string.Empty;

        [JsonPropertyName("location")]
        public string? Location { get; set; }

        [JsonPropertyName("deadline")]
        public DateOnly? Deadline { get; set; }
    }

    public sealed class UpdateJobStatusRequestDto
    {
        [JsonPropertyName("approval_status")]
        public string ApprovalStatus { get; set; } = string.Empty;
    }

    public sealed class JobListItemDto
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [JsonPropertyName("department")]
        public string Department { get; set; } = string.Empty;

        [JsonPropertyName("employment_type")]
        public string EmploymentType { get; set; } = string.Empty;

        [JsonPropertyName("work_mode")]
        public string WorkMode { get; set; } = string.Empty;

        [JsonPropertyName("short_pitch")]
        public string? ShortPitch { get; set; }

        [JsonPropertyName("salary_min")]
        public decimal SalaryMin { get; set; }

        [JsonPropertyName("salary_max")]
        public decimal SalaryMax { get; set; }

        [JsonPropertyName("currency")]
        public string Currency { get; set; } = string.Empty;

        [JsonPropertyName("location")]
        public string? Location { get; set; }

        [JsonPropertyName("posted_at")]
        public DateTimeOffset? PostedAt { get; set; }

        [JsonPropertyName("required_skills")]
        public List<string> RequiredSkills { get; set; } = [];

        [JsonPropertyName("tags")]
        public List<string> Tags { get; set; } = [];
    }

    public sealed class ApiResponseDto<T>
    {
        [JsonPropertyName("success")]
        public bool Success { get; set; }

        [JsonPropertyName("statusCode")]
        public int StatusCode { get; set; }

        [JsonPropertyName("message")]
        public string Message { get; set; } = string.Empty;

        [JsonPropertyName("data")]
        public T? Data { get; set; }
    }

    public sealed class JobListResponseDto
    {
        [JsonPropertyName("jobs")]
        public List<JobListItemDto> Jobs { get; set; } = [];

        [JsonPropertyName("total")]
        public int Total { get; set; }

        [JsonPropertyName("page")]
        public int Page { get; set; }

        [JsonPropertyName("limit")]
        public int Limit { get; set; }
    }
}
