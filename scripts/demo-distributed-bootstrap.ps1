param(
  [string]$ApiBase = "http://127.0.0.1:8080/backend/api",
  [int]$Bootstraps = 1000,
  [int]$ChunkSize = 100
)

$body = @{
  type = "bootstrap_validation"
  bootstraps = $Bootstraps
  chunk_size = $ChunkSize
} | ConvertTo-Json

$submit = Invoke-RestMethod -Method Post -Uri "$ApiBase/jobs" -ContentType "application/json" -Body $body
$jobId = $submit.data.job_id
Write-Host "Submitted distributed bootstrap job: $jobId"

for ($i = 0; $i -lt 24; $i++) {
  Start-Sleep -Seconds 3
  $status = Invoke-RestMethod -Method Get -Uri "$ApiBase/jobs/$jobId"
  $job = $status.data.job
  Write-Host ("{0}% {1}/{2} status={3}" -f $job.progress, $job.completed_subtasks, $job.total_subtasks, $job.status)

  $result = Invoke-RestMethod -Method Get -Uri "$ApiBase/jobs/$jobId/result" -ErrorAction SilentlyContinue
  if ($result.success -and $result.data.result.status -eq "completed") {
    $result.data.result | ConvertTo-Json -Depth 8
    break
  }
}
