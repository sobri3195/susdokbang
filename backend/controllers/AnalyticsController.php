<?php
declare(strict_types=1);

final class AnalyticsController
{
    public function survival(): void
    {
        Response::json([
            'data' => [
                'engine' => 'mock-python-service',
                'model' => 'cox-proportional-hazards',
                'generated_at' => gmdate('c'),
                'cox_results' => [
                    ['faktor' => 'Usia > 40 tahun', 'hazard_ratio' => 1.82, 'ci_low' => 1.26, 'ci_high' => 2.64, 'p_value' => 0.002],
                    ['faktor' => 'BMI >= 27', 'hazard_ratio' => 1.51, 'ci_low' => 1.08, 'ci_high' => 2.11, 'p_value' => 0.016],
                    ['faktor' => 'Stress index tinggi', 'hazard_ratio' => 1.94, 'ci_low' => 1.31, 'ci_high' => 2.88, 'p_value' => 0.001],
                ],
            ],
        ]);
    }
}
