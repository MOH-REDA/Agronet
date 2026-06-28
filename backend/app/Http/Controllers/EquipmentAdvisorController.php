<?php

namespace App\Http\Controllers;

use App\Models\Equipment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class EquipmentAdvisorController extends Controller
{
    private const BLOCKING_STATUSES = [
        'pending', 'requested', 'owner_accepted', 'awaiting_payment', 'payment_submitted',
        'scheduled', 'in_progress', 'paid', 'active', 'owner_completed',
    ];

    public function advise(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'request' => ['required', 'string', 'min:10', 'max:1000'],
            'city' => ['nullable', 'string', 'max:120'],
            'start_date' => ['nullable', 'date', 'after_or_equal:today'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
        ]);

        $query = Equipment::query()
            ->with(['user' => fn ($owner) => $owner
                ->select(['id', 'name', 'prenom', 'avatar_path', 'owner_verified_at'])
                ->withAvg('reviewsReceived', 'rating')
                ->withCount('reviewsReceived')])
            ->where(function ($status) {
                $status->whereNull('status')->orWhereNotIn('status', ['inactive', 'deleted']);
            });

        if (!empty($validated['city'])) {
            $query->where('city', 'like', '%' . $validated['city'] . '%');
        }

        if (!empty($validated['start_date']) && !empty($validated['end_date'])) {
            $start = $validated['start_date'];
            $end = $validated['end_date'];
            $query->whereDoesntHave('reservations', fn ($reservation) => $reservation
                ->whereIn('status', self::BLOCKING_STATUSES)
                ->whereDate('start_date', '<=', $end)
                ->whereDate('end_date', '>=', $start));
        }

        $candidates = $query->latest()->limit(30)->get();
        if ($candidates->isEmpty()) {
            return response()->json([
                'source' => 'database',
                'summary' => 'No available equipment matches the current location or date constraints.',
                'inferred_task' => $validated['request'],
                'recommendations' => [],
            ]);
        }

        $rankedCandidates = $this->rankCandidates($candidates, $validated['request'])->take(15)->values();
        $advice = $this->requestAiAdvice($validated['request'], $rankedCandidates);

        if (!$advice) {
            $advice = $this->fallbackAdvice($validated['request'], $rankedCandidates);
        }

        $byId = $candidates->keyBy('id');
        $recommendations = collect($advice['recommendations'] ?? [])
            ->filter(fn ($item) => isset($item['equipment_id']) && $byId->has((int) $item['equipment_id']))
            ->unique('equipment_id')
            ->take(4)
            ->map(function ($item) use ($byId) {
                $equipment = $byId->get((int) $item['equipment_id']);
                $days = max((int) ($equipment->minRentalDays ?: 1), min(30, (int) ($item['estimated_days'] ?? 1)));
                $dailyRate = (float) ($equipment->minPrice ?? $equipment->price ?? $equipment->daily_rate ?? 0);

                return [
                    'equipment' => $this->publicEquipment($equipment),
                    'reason' => trim((string) ($item['reason'] ?? 'Relevant to the requested farm task.')),
                    'estimated_days' => $days,
                    'estimated_rental_cost' => round($dailyRate * $days, 2),
                ];
            })->values();

        return response()->json([
            'source' => $advice['source'] ?? 'rules',
            'model' => $advice['model'] ?? null,
            'summary' => $advice['summary'] ?? 'Here are the closest available matches from AgroNet.',
            'inferred_task' => $advice['inferred_task'] ?? $validated['request'],
            'recommendations' => $recommendations,
            'disclaimer' => 'Duration and cost are estimates. Confirm field conditions, attachments, transport, and pesticide requirements with the owner or a qualified agronomist.',
        ]);
    }

    private function requestAiAdvice(string $farmRequest, $candidates): ?array
    {
        $apiKey = config('services.openrouter.key');
        if (!$apiKey) return null;

        $inventory = $candidates->map(fn ($equipment) => [
            'id' => $equipment->id,
            'name' => $equipment->name,
            'type' => $equipment->type,
            'brand' => $equipment->brand,
            'horsepower' => $equipment->hp,
            'working_width_m' => $equipment->working_width,
            'fuel' => $equipment->fuel_type,
            'transmission' => $equipment->transmission,
            'condition' => $equipment->machine_condition,
            'crop_types' => $equipment->crop_types,
            'city' => $equipment->city,
            'delivery_available' => (bool) $equipment->delivery_available,
            'instant_booking' => (bool) $equipment->instant_booking,
            'daily_rate_mad' => (float) ($equipment->minPrice ?? $equipment->price ?? $equipment->daily_rate ?? 0),
            'minimum_days' => (int) ($equipment->minRentalDays ?: 1),
            'verified_owner' => (bool) $equipment->user?->is_verified_owner,
            'owner_rating' => $equipment->user?->reviews_received_avg_rating,
        ])->values()->all();

        try {
            $response = Http::withToken($apiKey)
                ->acceptJson()
                ->withHeaders([
                    'HTTP-Referer' => config('app.url'),
                    'X-Title' => 'AgroNet Smart Equipment Advisor',
                ])
                ->timeout(35)
                ->retry(1, 500)
                ->post(config('services.openrouter.url'), [
                    'model' => config('services.openrouter.model', 'openrouter/free'),
                    'temperature' => 0.2,
                    'max_tokens' => 900,
                    'messages' => [
                        [
                            'role' => 'system',
                            'content' => 'You are AgroNet Smart Equipment Advisor for Moroccan farmers. Recommend only equipment IDs present in the supplied inventory. Rank practical suitability for the described work. Never invent listings, prices, capabilities, availability, or safety claims. Keep reasons concise. Estimated days must be between 1 and 30 and should be conservative. If inventory is imperfect, say so. Return JSON only.',
                        ],
                        [
                            'role' => 'user',
                            'content' => "Farmer request:\n{$farmRequest}\n\nAvailable AgroNet inventory (MAD pricing):\n" . json_encode($inventory, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                        ],
                    ],
                    'response_format' => [
                        'type' => 'json_schema',
                        'json_schema' => [
                            'name' => 'equipment_advice',
                            'strict' => true,
                            'schema' => [
                                'type' => 'object',
                                'properties' => [
                                    'summary' => ['type' => 'string'],
                                    'inferred_task' => ['type' => 'string'],
                                    'recommendations' => [
                                        'type' => 'array',
                                        'maxItems' => 4,
                                        'items' => [
                                            'type' => 'object',
                                            'properties' => [
                                                'equipment_id' => ['type' => 'integer'],
                                                'reason' => ['type' => 'string'],
                                                'estimated_days' => ['type' => 'integer', 'minimum' => 1, 'maximum' => 30],
                                            ],
                                            'required' => ['equipment_id', 'reason', 'estimated_days'],
                                            'additionalProperties' => false,
                                        ],
                                    ],
                                ],
                                'required' => ['summary', 'inferred_task', 'recommendations'],
                                'additionalProperties' => false,
                            ],
                        ],
                    ],
                ]);

            if (!$response->successful()) {
                Log::warning('OpenRouter advisor request failed', ['status' => $response->status()]);
                return null;
            }

            $content = $response->json('choices.0.message.content');
            $decoded = is_string($content) ? json_decode($content, true) : null;
            if (!is_array($decoded)) return null;

            $decoded['source'] = 'openrouter';
            $decoded['model'] = $response->json('model');
            return $decoded;
        } catch (\Throwable $error) {
            Log::warning('OpenRouter advisor unavailable', ['message' => $error->getMessage()]);
            return null;
        }
    }

    private function rankCandidates($candidates, string $request)
    {
        $needle = mb_strtolower($request);
        $taskTerms = [
            'spray' => ['spray', 'pesticide', 'herbicide', 'fungicide', 'treat crop'],
            'harvest' => ['harvest', 'reap', 'thresh', 'combine'],
            'tractor' => ['prepare', 'plow', 'plough', 'till', 'cultivate', 'soil', 'wheat planting'],
            'seed' => ['seed', 'sow', 'plant'],
            'irrigat' => ['irrigat', 'water', 'pump'],
        ];

        return $candidates->map(function ($equipment) use ($needle, $taskTerms) {
            $haystack = mb_strtolower(implode(' ', array_filter([
                $equipment->name, $equipment->type, $equipment->brand, $equipment->description,
                implode(' ', $equipment->crop_types ?? []),
            ])));
            $score = 0;
            foreach ($taskTerms as $equipmentTerm => $requestTerms) {
                $intentMatched = collect($requestTerms)->contains(fn ($term) => str_contains($needle, $term));
                if ($intentMatched && str_contains($haystack, $equipmentTerm)) $score += 12;
            }
            foreach (preg_split('/\s+/u', $needle) as $word) {
                if (mb_strlen($word) > 3 && str_contains($haystack, $word)) $score += 2;
            }
            if ($equipment->user?->is_verified_owner) $score += 1;
            if ($equipment->delivery_available) $score += 0.5;
            $equipment->advisor_score = $score;
            return $equipment;
        })->sortByDesc('advisor_score');
    }

    private function fallbackAdvice(string $request, $candidates): array
    {
        $matched = $candidates->filter(fn ($equipment) => $equipment->advisor_score >= 10);
        $best = ($matched->isNotEmpty() ? $matched : $candidates)->take($matched->isNotEmpty() ? 4 : 3);
        return [
            'source' => 'rules',
            'summary' => 'The AI service is not configured or temporarily unavailable, so AgroNet matched the closest available listings using task keywords and listing specifications.',
            'inferred_task' => $request,
            'recommendations' => $best->map(fn ($equipment) => [
                'equipment_id' => $equipment->id,
                'reason' => $equipment->advisor_score > 0
                    ? "Its {$equipment->type} classification and listing details align with the work you described."
                    : 'This is one of the closest currently available listings; confirm suitability and required attachments with the owner.',
                'estimated_days' => max(1, (int) ($equipment->minRentalDays ?: 1)),
            ])->values()->all(),
        ];
    }

    private function publicEquipment(Equipment $equipment): array
    {
        $images = collect($equipment->images ?? [])->map(function ($image) {
            $image = ltrim($image, '/');
            if (str_starts_with($image, 'storage/')) return $image;
            return str_starts_with($image, 'equipment/') ? 'storage/' . $image : 'storage/equipment/' . $image;
        })->values()->all();

        return [
            'id' => $equipment->id,
            'name' => $equipment->name,
            'type' => $equipment->type,
            'brand' => $equipment->brand,
            'city' => $equipment->city,
            'state' => $equipment->state,
            'hp' => $equipment->hp,
            'working_width' => $equipment->working_width,
            'machine_condition' => $equipment->machine_condition,
            'delivery_available' => (bool) $equipment->delivery_available,
            'instant_booking' => (bool) $equipment->instant_booking,
            'minPrice' => $equipment->minPrice ?? $equipment->price ?? $equipment->daily_rate,
            'minRentalDays' => $equipment->minRentalDays,
            'images' => $images,
            'user' => $equipment->user,
        ];
    }
}
