param(
  [string]$ApiBase = "http://127.0.0.1:8080/backend/api"
)

$body = @{
  type = "federated_aggregation"
  nodes = @("node-skadron-3", "node-skadron-31", "node-skadron-8", "node-wing-1")
} | ConvertTo-Json

$submit = Invoke-RestMethod -Method Post -Uri "$ApiBase/jobs" -ContentType "application/json" -Body $body
$jobId = $submit.data.job_id
Write-Host "Submitted federated aggregation job: $jobId"

for ($i = 0; $i -lt 20; $i++) {
  Start-Sleep -Seconds 2
  $result = Invoke-RestMethod -Method Get -Uri "$ApiBase/jobs/$jobId/result" -ErrorAction SilentlyContinue
  if ($result.success -and $result.data.result.completed_subtasks -gt 0) {
    $result.data.result | ConvertTo-Json -Depth 10
    if ($result.data.result.status -eq "completed") {
      break
    }
  }
}
