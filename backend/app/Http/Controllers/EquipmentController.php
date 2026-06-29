<?php

namespace App\Http\Controllers;

use App\Models\Equipment;
use App\Models\EquipmentReservation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Carbon\Carbon;
use App\Models\User;
use App\Services\PublicMediaStorage;

class EquipmentController extends Controller
{
    public function __construct(private readonly PublicMediaStorage $media) {}

    // GET /api/equipment
    public function index(Request $request)
    {
        $blockingStatuses = ['pending', 'requested', 'owner_accepted', 'awaiting_payment', 'payment_submitted', 'scheduled', 'in_progress', 'paid', 'active', 'owner_completed'];
        $query = Equipment::with([
                'user' => fn ($userQuery) => $userQuery
                    ->select(['id', 'name', 'prenom', 'avatar_path', 'owner_verified_at'])
                    ->withAvg('reviewsReceived', 'rating')
                    ->withCount('reviewsReceived'),
                'reservations' => fn ($reservationQuery) => $reservationQuery
                    ->whereIn('status', $blockingStatuses)
                    ->whereDate('end_date', '>=', today())
                    ->orderBy('start_date')
                    ->select(['id', 'equipment_id', 'start_date', 'end_date', 'status']),
            ])
            ->withCount([
                'reservations as completed_hires_count' => fn ($reservationQuery) =>
                    $reservationQuery->where('status', 'completed'),
                'favoritedBy as favorites_count',
            ]);
        // Filtering
        if ($types = $request->query('type')) {
            // Accepts type as array or comma-separated string
            if (is_array($types)) {
                $query->whereIn('type', $types);
            } else {
                // Split comma-separated string into array
                $typesArr = array_map('trim', explode(',', $types));
                $query->whereIn('type', $typesArr);
            }
        }
        if ($request->has('min_price')) {
            $query->where('daily_rate', '>=', $request->query('min_price'));
        }
        if ($request->has('max_price')) {
            $query->where('daily_rate', '<=', $request->query('max_price'));
        }
        if ($city = $request->query('city')) {
            $query->where('city', 'like', "%$city%");
        }
        // Date availability filter
        if ($request->has(['start_date', 'end_date'])) {
            $start = $request->query('start_date');
            $end = $request->query('end_date');
            $query->whereDoesntHave('reservations', function($q) use ($start, $end) {
                $q->whereIn('status', ['pending', 'reserved', 'paid', 'active'])
                  ->where(function($q2) use ($start, $end) {
                      $q2->whereBetween('start_date', [$start, $end])
                         ->orWhereBetween('end_date', [$start, $end])
                         ->orWhere(function($q3) use ($start, $end) {
                             $q3->where('start_date', '<=', $start)
                                ->where('end_date', '>=', $end);
                         });
                  });
            });
        }
        // Sorting
        if ($sortBy = $request->query('sortBy')) {
            if ($sortBy === 'price-low') {
                $query->orderByRaw('COALESCE(minPrice, price, daily_rate, 0) asc');
            } elseif ($sortBy === 'price-high') {
                $query->orderByRaw('COALESCE(minPrice, price, daily_rate, 0) desc');
            } elseif ($sortBy === 'newest') {
                $query->orderByDesc('created_at');
            } elseif ($sortBy === 'most-booked') {
                $query->orderByDesc('completed_hires_count');
            } elseif ($sortBy === 'recommended') {
                // Placeholder: implement recommended logic as needed
                $query->orderBy('id', 'desc');
            } elseif ($sortBy === 'distance') {
                // Placeholder: implement distance sorting if location/lat/lng is available
                // $query->orderBy('distance', 'asc');
            }
        } else {
            $query->orderBy('id', 'desc');
        }
        $perPage = min(100, max(1, (int) $request->query('per_page', 100)));
        $equipment = $query->paginate($perPage);
        $equipment->getCollection()->transform(function ($item) {
            // Normalize image paths
            $item->images = collect($item->images ?? [])
                ->map(fn ($img) => $this->media->publicUrl($img, 'equipment'))
                ->filter()->values()->toArray();
            $item->distance = null;
            $today = Carbon::today();
            $currentReservation = $item->reservations->first(fn ($reservation) =>
                Carbon::parse($reservation->start_date)->startOfDay()->lte($today)
                && Carbon::parse($reservation->end_date)->endOfDay()->gte($today)
            );
            $item->availability = $currentReservation
                ? [
                    'status' => Carbon::parse($currentReservation->end_date)->isToday() ? 'available_tomorrow' : 'booked_until',
                    'date' => Carbon::parse($currentReservation->end_date)->toDateString(),
                ]
                : ['status' => 'available_today', 'date' => null];
            $item->availability_ranges = $item->reservations->map(fn ($reservation) => [
                'start' => Carbon::parse($reservation->start_date)->toDateString(),
                'end' => Carbon::parse($reservation->end_date)->toDateString(),
            ])->values();
            unset($item->reservations);
            return $item;
        });
        return response()->json([
            'data' => $equipment->items(),
            'total' => $equipment->total(),
            'current_page' => $equipment->currentPage(),
            'last_page' => $equipment->lastPage(),
        ]);
    }

    // GET /api/equipment/types
    public function types()
    {
        $types = ["Tractors", "Harvesters", "Planters", "Irrigation", "Seeders", "Sprayers"];
        return response()->json(['data' => $types]);
    }

    public function marketplaceStats()
    {
        return response()->json(['data' => [
            'machines' => Equipment::where('status', 'active')->count(),
            'categories' => Equipment::where('status', 'active')->distinct('type')->count('type'),
            'verified_owners' => User::whereNotNull('owner_verified_at')->whereHas('equipment')->count(),
            'average_rating' => round((float) \App\Models\EquipmentReview::avg('rating'), 1),
        ]]);
    }

    public function favorites(Request $request)
    {
        return response()->json(['data' => $request->user()->favoriteEquipment()->pluck('equipment.id')]);
    }

    public function addFavorite(Request $request, Equipment $equipment)
    {
        $request->user()->favoriteEquipment()->syncWithoutDetaching([$equipment->id]);
        return response()->json(['message' => 'Added to favorites.']);
    }

    public function removeFavorite(Request $request, Equipment $equipment)
    {
        $request->user()->favoriteEquipment()->detach($equipment->id);
        return response()->json(['message' => 'Removed from favorites.']);
    }

    // POST /api/equipment/{id}/reserve
    public function reserve(Request $request, $id)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }
        $equipment = Equipment::find($id);
        if (!$equipment || $equipment->status !== 'active') {
            return response()->json(['message' => 'Equipment not available for reservation'], 400);
        }
        if ((int) $equipment->user_id === (int) $user->id) {
            return response()->json(['message' => 'You cannot reserve your own equipment.'], 422);
        }
        $validated = $request->validate([
            'start_date' => 'required|date|after_or_equal:today',
            'end_date' => 'required|date|after:start_date',
        ]);
        // Prevent overlapping reservations
        $overlap = \App\Models\EquipmentReservation::where('equipment_id', $equipment->id)
            ->where('status', 'active')
            ->where(function($q) use ($validated) {
                $q->whereBetween('start_date', [$validated['start_date'], $validated['end_date']])
                  ->orWhereBetween('end_date', [$validated['start_date'], $validated['end_date']])
                  ->orWhere(function($q2) use ($validated) {
                      $q2->where('start_date', '<=', $validated['start_date'])
                         ->where('end_date', '>=', $validated['end_date']);
                  });
            })->exists();
        if ($overlap) {
            return response()->json(['message' => 'Equipment is already reserved for the selected period.'], 422);
        }
        $reservation = EquipmentReservation::create([
            'user_id' => $user->id,
            'equipment_id' => $equipment->id,
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'status' => 'pending',
        ]);
        return response()->json([
            'message' => 'Reservation created successfully',
            'reservation' => $reservation
        ]);
    }

    // POST /api/equipment (Create Listing)
    public function store(Request $request)
    {
        $user = $request->user();
        // Dynamic validation for images: accept files (FormData) or URLs (JSON)
        $imagesRule = ['nullable', 'array', 'max:5'];
        $imagesItemRule = [
            'nullable',
            function ($attribute, $value, $fail) use ($request) {
                // Extract the numeric index from the attribute (e.g., images.0)
                if (preg_match('/images\\.(\\d+)/', $attribute, $matches)) {
                    $idx = $matches[1];
                    $file = $request->file("images.$idx");
                    \Log::info("[EquipmentController] images.{$idx} value:", ['value' => $value, 'file' => $file]);
                    if ($file) {
                        if (!$file->isValid() || !in_array($file->extension(), ['jpg', 'jpeg', 'png', 'gif'])) {
                            $fail('The ' . $attribute . ' must be a valid image file (jpg, jpeg, png, gif).');
                        }
                        if ($file->getSize() > 10240 * 1024) {
                            $fail('The ' . $attribute . ' may not be greater than 10MB.');
                        }
                        return;
                    }
                }
                // If not a file, check if it's a valid URL string
                if (is_string($value)) {
                    if (!filter_var($value, FILTER_VALIDATE_URL)) {
                        $fail('The ' . $attribute . ' must be a valid URL.');
                    }
                } elseif (!is_null($value)) {
                    $fail('The ' . $attribute . ' must be a file upload or a URL.');
                }
            }
        ];
        $validated = $request->validate(array_merge([
            'name' => 'required|string|max:255',
            'type' => 'required|string|max:255',
            'description' => 'nullable|string',
            'hp' => 'nullable|integer|min:1|max:2000',
            'gps_ready' => 'sometimes|boolean',
            'brand' => 'nullable|string|max:120',
            'fuel_type' => 'nullable|string|max:60',
            'transmission' => 'nullable|string|max:60',
            'working_width' => 'nullable|numeric|min:0|max:9999',
            'machine_condition' => 'nullable|string|max:60',
            'crop_types' => 'nullable|array',
            'crop_types.*' => 'string|max:80',
            'delivery_available' => 'sometimes|boolean',
            'instant_booking' => 'sometimes|boolean',
            'insurance_included' => 'sometimes|boolean',
            'recently_serviced_at' => 'nullable|date',
            'license' => 'nullable|string|max:255',
            'country' => 'nullable|string|max:255',
            'year' => 'nullable|integer',
            'isBusiness' => 'boolean',
            'contactName' => 'nullable|string|max:255',
            'contactPhone' => 'nullable|string|max:32',
            'address' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:255',
            'state' => 'nullable|string|max:255',
            'zip' => 'nullable|string|max:32',
            'lat' => 'nullable|numeric',
            'lng' => 'nullable|numeric',
            'termsAccepted' => 'required|boolean|in:1,true',
            'availableSeasons' => 'nullable|array',
            'availableSeasons.*' => 'string',
            'pricingType' => 'nullable|string|max:32',
            'minPrice' => 'nullable|numeric',
            'price_low' => 'nullable|numeric',
            'price_medium' => 'nullable|numeric',
            'price_high' => 'nullable|numeric',
            'price_very_high' => 'nullable|numeric',
            'price' => 'nullable|numeric',
            'minRentalDays' => 'nullable|integer',
            'deposit' => 'nullable|numeric',
            'status' => ['nullable', \Illuminate\Validation\Rule::in(['draft', 'published'])],
        ], [
            'images' => $imagesRule,
            'images.*' => $imagesItemRule,
        ]));
        $imageUrls = [];
        if (isset($validated['images']) && is_array($validated['images'])) {
            foreach ($validated['images'] as $idx => $img) {
                if ($request->hasFile("images.$idx")) {
                    $file = $request->file("images.$idx");
                    if ($file && $file->isValid()) {
                        $imageUrls[] = $this->media->upload($file, 'equipment');
                    }
                } elseif (is_string($img)) {
                    // If it's a URL, store as-is
                    $imageUrls[] = $img;
                }
            }
        }
        $equipment = Equipment::create(array_merge($validated, [
            'user_id' => $user->id,
            'images' => $imageUrls,
            // Always set status to 'active' (published) by default
            'status' => 'active',
        ]));
        return response()->json([
            'message' => 'Equipment created',
            'equipment' => $equipment
        ], 201);
    }

    // GET /api/equipment/{id} (Get Details)
    public function show(Request $request, $id)
    {
        $equipment = Equipment::with([
            'user' => fn ($query) => $query->withAvg('reviewsReceived', 'rating')->withCount('reviewsReceived'),
        ])->withAvg('reviews', 'rating')
          ->withCount(['reviews', 'reservations as completed_hires_count' => fn ($query) => $query->where('status', 'completed')])
          ->findOrFail($id);
        $user = $request->user();
        $isOwner = $user && ($user->id === $equipment->user_id || ($user->is_admin ?? false));
        // Only return reservation info if requested by owner or admin
        $reservations = [];
        if ($isOwner) {
            $reservations = $equipment->reservations()->orderBy('start_date', 'desc')->get();
        }
        // Reserved date ranges for this equipment
        $reserved_dates = $equipment->reservations()
            ->whereIn('status', ['pending', 'reserved', 'paid', 'active'])
            ->get(['start_date', 'end_date'])
            ->map(function($r) {
                return [
                    'start' => $r->start_date,
                    'end' => $r->end_date
                ];
            })->toArray();
        // Normalize image paths
        $images = collect($equipment->images ?? [])
            ->map(fn ($img) => $this->media->publicUrl($img, 'equipment'))
            ->filter()->values()->toArray();
        $equipmentArr = $equipment->toArray();
        $equipmentArr['images'] = $images;
        $equipmentArr['reserved_dates'] = $reserved_dates;
        // Compose summary fields for reservation/order
        $summary = [
            'id' => $equipment->id,
            'name' => $equipment->name,
            'subtitle' => $equipment->subtitle ?? $equipment->type,
            'type' => $equipment->type,
            'features' => [
                'hp' => $equipment->hp,
                'gps_ready' => $equipment->gps_ready,
            ],
            'city' => $equipment->city,
            'state' => $equipment->state,
            'minPrice' => $equipment->minPrice,
            'price' => $equipment->price,
            'image' => isset($images[0]) ? $images[0] : null,
            // Add service_fee if you have a fee calculation, e.g.:
            // 'service_fee' => $equipment->price ? round($equipment->price * 0.05, 2) : null,
        ];
        $equipmentArr['order_summary'] = $summary;
        return response()->json([
            'equipment' => $equipmentArr,
            'isOwner' => $isOwner,
            'reservations' => $reservations,
        ]);
    }

    // PUT /api/equipment/{id} (Update Listing)
    public function update(Request $request, $id)
    {
        $user = $request->user();
        $equipment = Equipment::findOrFail($id);

        if ($equipment->user_id !== $user->id && !($user->is_admin ?? false)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $imagesRule = ['nullable', 'array', 'max:5'];
        $imagesItemRule = [
            'nullable',
            function ($attribute, $value, $fail) use ($request) {
                if (preg_match('/images\\.(\\d+)/', $attribute, $matches)) {
                    $idx = $matches[1];
                    $file = $request->file("images.$idx");
                    if ($file) {
                        if (!$file->isValid() || !in_array($file->extension(), ['jpg', 'jpeg', 'png', 'gif'])) {
                            $fail('The ' . $attribute . ' must be a valid image file (jpg, jpeg, png, gif).');
                        }
                        if ($file->getSize() > 10240 * 1024) {
                            $fail('The ' . $attribute . ' may not be greater than 10MB.');
                        }
                        return;
                    }
                }

                if (is_string($value)) {
                    $path = ltrim($value, '/');
                    $isStoredImage = str_starts_with($path, 'storage/equipment/') || str_starts_with($path, 'equipment/');
                    if (!$isStoredImage && !filter_var($value, FILTER_VALIDATE_URL)) {
                        $fail('The ' . $attribute . ' must be a valid image path or URL.');
                    }
                } elseif (!is_null($value)) {
                    $fail('The ' . $attribute . ' must be a file upload or a URL.');
                }
            }
        ];

        $validated = $request->validate(array_merge([
            'name' => 'required|string|max:255',
            'type' => 'required|string|max:255',
            'description' => 'nullable|string',
            'hp' => 'nullable|integer|min:1|max:2000',
            'gps_ready' => 'sometimes|boolean',
            'brand' => 'nullable|string|max:120',
            'fuel_type' => 'nullable|string|max:60',
            'transmission' => 'nullable|string|max:60',
            'working_width' => 'nullable|numeric|min:0|max:9999',
            'machine_condition' => 'nullable|string|max:60',
            'crop_types' => 'nullable|array',
            'crop_types.*' => 'string|max:80',
            'delivery_available' => 'sometimes|boolean',
            'instant_booking' => 'sometimes|boolean',
            'insurance_included' => 'sometimes|boolean',
            'recently_serviced_at' => 'nullable|date',
            'license' => 'nullable|string|max:255',
            'country' => 'nullable|string|max:255',
            'year' => 'nullable|integer',
            'isBusiness' => 'boolean',
            'contactName' => 'nullable|string|max:255',
            'contactPhone' => 'nullable|string|max:32',
            'address' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:255',
            'state' => 'nullable|string|max:255',
            'zip' => 'nullable|string|max:32',
            'lat' => 'nullable|numeric',
            'lng' => 'nullable|numeric',
            'termsAccepted' => 'required|boolean|in:1,true',
            'availableSeasons' => 'nullable|array',
            'availableSeasons.*' => 'string',
            'pricingType' => 'nullable|string|max:32',
            'minPrice' => 'nullable|numeric',
            'price_low' => 'nullable|numeric',
            'price_medium' => 'nullable|numeric',
            'price_high' => 'nullable|numeric',
            'price_very_high' => 'nullable|numeric',
            'price' => 'nullable|numeric',
            'minRentalDays' => 'nullable|integer',
            'deposit' => 'nullable|numeric',
            'status' => ['nullable', Rule::in(['draft', 'published', 'active'])],
        ], [
            'images' => $imagesRule,
            'images.*' => $imagesItemRule,
        ]));

        $imageUrls = [];
        if (isset($validated['images']) && is_array($validated['images'])) {
            foreach ($validated['images'] as $idx => $img) {
                if ($request->hasFile("images.$idx")) {
                    $file = $request->file("images.$idx");
                    if ($file && $file->isValid()) {
                        $imageUrls[] = $this->media->upload($file, 'equipment');
                    }
                } elseif (is_string($img)) {
                    $imageUrls[] = $img;
                }
            }
        }

        $data = $validated;
        unset($data['images']);

        if (($data['status'] ?? null) === 'published') {
            $data['status'] = 'active';
        }

        if (!empty($imageUrls)) {
            if (is_array($equipment->images)) {
                foreach ($equipment->images as $imgUrl) {
                    $this->media->delete($imgUrl);
                }
            }
            $data['images'] = $imageUrls;
        }

        $equipment->update($data);

        return response()->json([
            'message' => 'Equipment updated',
            'equipment' => $equipment->fresh(),
        ]);
    }

    // DELETE /api/equipment/{id} (Delete Listing)
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $equipment = Equipment::findOrFail($id);
        if ($equipment->user_id !== $user->id && !($user->is_admin ?? false)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        // Delete images from storage
        if (is_array($equipment->images)) {
            foreach ($equipment->images as $imgUrl) {
                $this->media->delete($imgUrl);
            }
        }
        $equipment->delete();
        return response()->json(['message' => 'Equipment deleted']);
    }

    // GET /api/my-equipment (User's Listings)
    public function myEquipment(Request $request)
    {
        $user = $request->user();
        $listings = Equipment::where('user_id', $user->id)->get();
        return response()->json(['data' => $listings]);
    }

    // GET /api/user-equipment (User's Equipment)
    public function userEquipment(Request $request)
    {
        $user = $request->user();
        $equipment = Equipment::where('user_id', $user->id)->get();
        // Normalize image paths for each equipment
        $equipment = $equipment->map(function ($item) {
            $item->images = collect($item->images ?? [])
                ->map(fn ($img) => $this->media->publicUrl($img, 'equipment'))
                ->filter()->values()->toArray();
            return $item;
        });
        return response()->json(['data' => $equipment]);
    }

    // GET /api/equipment/{id}/availability?start=YYYY-MM-DD&end=YYYY-MM-DD
    public function availability(Request $request, $id)
    {
        $equipment = Equipment::findOrFail($id);
        $start = $request->query('start');
        $end = $request->query('end');
        if (!$start || !$end) {
            return response()->json(['error' => 'Start and end dates are required.'], 422);
        }
        $overlap = $equipment->reservations()
            ->whereIn('status', ['pending', 'reserved', 'paid', 'active'])
            ->where(function($q) use ($start, $end) {
                $q->whereBetween('start_date', [$start, $end])
                  ->orWhereBetween('end_date', [$start, $end])
                  ->orWhere(function($q2) use ($start, $end) {
                      $q2->where('start_date', '<=', $start)
                         ->where('end_date', '>=', $end);
                  });
            })->exists();
        return response()->json(['available' => !$overlap]);
    }
}
