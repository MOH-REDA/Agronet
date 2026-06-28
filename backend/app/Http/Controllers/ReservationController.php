<?php

namespace App\Http\Controllers;

use App\Models\Equipment;
use App\Models\EquipmentReservation;
use App\Models\OwnerPayout;
use App\Models\Payment;
use App\Models\Notification;
use App\Models\EquipmentReview;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ReservationController extends Controller
{
    // GET /api/reservations/{id}
    public function show($id)
    {
        $reservation = EquipmentReservation::with(['equipment', 'user'])->findOrFail($id);
        $user = Auth::user();
        if ($user && ($user->id === $reservation->user_id || ($user->is_admin ?? false))) {
            return response()->json(['reservation' => $reservation]);
        }
        return response()->json(['message' => 'Forbidden'], 403);
    }

    // GET /api/user/reservations
    public function userReservations(Request $request)
    {
        $user = $request->user();
        $reservations = EquipmentReservation::with(['equipment.user', 'user', 'payment', 'review'])
            ->where(function ($query) use ($user) {
                $query->where('user_id', $user->id)
                    ->orWhereHas('equipment', fn ($equipmentQuery) => $equipmentQuery->where('user_id', $user->id));
            })
            ->orderBy('start_date', 'desc')
            ->get();
        return response()->json(['data' => $reservations]);
    }

    // POST /api/reservations/{id}/pay
    public function pay(Request $request, $id)
    {
        $reservation = EquipmentReservation::with('equipment')->findOrFail($id);
        $user = $request->user();

        if ($reservation->user_id !== $user->id && !($user->is_admin ?? false)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'method' => 'required|string|in:cash,bank_transfer',
            'amount' => 'nullable|numeric|min:0',
            'service_fee' => 'nullable|numeric|min:0',
            'deposit_amount' => 'nullable|numeric|min:0',
            'transfer_reference' => 'nullable|string|max:120',
        ]);

        $method = $validated['method'];
        $rentalAmount = $validated['amount'] ?? $this->calculateRentalAmount($reservation);
        $serviceFee = $validated['service_fee'] ?? 0;
        $depositAmount = $validated['deposit_amount'] ?? (float) ($reservation->equipment->deposit ?? 0);
        $transferReference = $validated['transfer_reference'] ?? $this->makeTransferReference($reservation);

        $paymentStatus = $method === 'bank_transfer' ? 'pending_verification' : 'pending';
        $instantBooking = (bool) $reservation->equipment->instant_booking;
        $reservationStatus = $method === 'bank_transfer'
            ? ($instantBooking ? 'owner_accepted' : 'payment_submitted')
            : ($instantBooking ? 'scheduled' : 'requested');
        $reservationPaymentStatus = $method === 'bank_transfer' ? 'pending_verification' : 'pay_on_pickup';

        $reservation->update([
            'status' => $reservationStatus,
            'payment_status' => $reservationPaymentStatus,
            'deposit_status' => $depositAmount > 0 ? 'pending' : 'not_required',
        ]);

        $payment = Payment::updateOrCreate([
            'reservation_id' => $reservation->id,
            'user_id' => $user->id,
        ], [
            'reservation_id' => $reservation->id,
            'user_id'        => $user->id,
            'amount'         => $rentalAmount,
            'service_fee'    => $serviceFee,
            'deposit_amount' => $depositAmount,
            'currency'       => 'MAD',
            'status'         => $paymentStatus,
            'method'         => $method,
            'transaction_id' => $transferReference,
            'transfer_reference' => $transferReference,
            'paid_at'        => null,
        ]);

        return response()->json([
            'message' => $method === 'bank_transfer'
                ? ($instantBooking ? 'Instant booking confirmed. Bank transfer is ready for admin verification.' : 'Bank transfer submitted. AgroNet will hold the payment until pickup/work confirmation.')
                : ($instantBooking ? 'Instant booking scheduled with cash on pickup.' : 'Cash-on-pickup selected. Payment will be handled after owner confirmation.'),
            'payment' => $payment,
            'reservation' => $reservation->fresh(['equipment', 'payment']),
            'bank_transfer' => $method === 'bank_transfer' ? [
                'account_holder' => 'AgroNet Marketplace SARL',
                'bank_name' => 'Platform bank account',
                'rib' => '000 000 0000000000000000 00',
                'reference' => $transferReference,
                'amount_due' => round($rentalAmount + $serviceFee + $depositAmount, 2),
                'currency' => 'MAD',
            ] : null,
        ]);
    }

    public function review(Request $request, $id)
    {
        $reservation = EquipmentReservation::with('equipment')->findOrFail($id);
        abort_unless((int) $reservation->user_id === (int) $request->user()->id, 403);
        if ($reservation->status !== 'completed') {
            return response()->json(['message' => 'Reviews are available after a completed booking.'], 422);
        }
        $validated = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);
        $review = EquipmentReview::updateOrCreate(['reservation_id' => $reservation->id], [
            'equipment_id' => $reservation->equipment_id,
            'reviewer_id' => $request->user()->id,
            'owner_id' => $reservation->equipment->user_id,
            ...$validated,
        ]);
        return response()->json(['message' => 'Review submitted.', 'data' => $review]);
    }

    // POST /api/reservations (Create Reservation)
    public function store(Request $request)
    {
        $user = $request->user();
        $validated = $request->validate([
            'equipment_id' => 'required|exists:equipment,id',
            'start_date' => 'required|date|after_or_equal:today',
            'end_date' => 'required|date|after:start_date',
            'service_mode' => 'nullable|string|in:equipment_only,owner_operator,owner_worker',
            'work_type' => 'nullable|string|max:120',
            'work_location' => 'nullable|string|max:255',
            'field_size' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
        ]);

        $equipment = Equipment::with('user')->findOrFail($validated['equipment_id']);
        if ((int) $equipment->user_id === (int) $user->id) {
            return response()->json([
                'message' => 'You cannot reserve your own equipment.',
            ], 422);
        }

        $reservation = EquipmentReservation::create([
            'user_id' => $user->id,
            'equipment_id' => $validated['equipment_id'],
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'status' => 'requested',
            'service_mode' => $validated['service_mode'] ?? 'equipment_only',
            'work_type' => $validated['work_type'] ?? null,
            'work_location' => $validated['work_location'] ?? null,
            'field_size' => $validated['field_size'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'payment_status' => 'unpaid',
            'deposit_status' => 'pending',
        ]);

        // Create notification for the equipment owner
        $owner = $equipment->user;
        if ($owner) {
            $message = sprintf(
                'New %s request for "%s" by %s from %s to %s.',
                str_replace('_', ' ', $reservation->service_mode),
                $equipment->name ?? $equipment->id,
                $user->name,
                $reservation->start_date,
                $reservation->end_date
            );
            Notification::create([
                'user_id' => $owner->id,
                'type' => 'reservation',
                'message' => $message,
                'data' => json_encode([
                    'reservation_id' => $reservation->id,
                    'equipment_id' => $equipment->id,
                    'equipment_name' => $equipment->name,
                    'reserved_by' => $user->name,
                    'start_date' => $reservation->start_date,
                    'end_date' => $reservation->end_date,
                    'service_mode' => $reservation->service_mode,
                    'work_type' => $reservation->work_type,
                ]),
                'status' => 'unread',
            ]);
            // Optionally: send email to owner here
        }

        return response()->json([
            'message' => 'Reservation request created',
            'reservation_id' => $reservation->id,
            'reservation' => $reservation->load(['equipment', 'payment']),
        ]);
    }

    // GET /api/admin/reservations - List all reservations (admin only)
    public function allReservations()
    {
        $reservations = EquipmentReservation::with(['equipment.user', 'user', 'payment'])
            ->orderBy('created_at', 'desc')
            ->get();
        return response()->json(['data' => $reservations]);
    }

    // PATCH /api/admin/reservations/{id}/status - Update reservation status (admin only)
    public function updateStatus(Request $request, $id)
    {
        $reservation = EquipmentReservation::findOrFail($id);
        $validated = $request->validate([
            'status' => 'required|string|in:pending,requested,owner_accepted,awaiting_payment,payment_submitted,scheduled,in_progress,owner_completed,paid,active,completed,cancelled,disputed,rejected',
        ]);
        $reservation->status = $validated['status'];
        $reservation->save();

        if ($reservation->status === 'completed') {
            $this->createOwnerPayoutIfReady($reservation->fresh(['equipment.user', 'payment']));
        }

        // Notify the user about the status update
        $user = $reservation->user;
        $equipment = $reservation->equipment;
        if ($user) {
            $message = sprintf(
                'Your reservation for equipment "%s" has been updated to status: %s.',
                $equipment ? ($equipment->name ?? $equipment->id) : $reservation->equipment_id,
                ucfirst($reservation->status)
            );
            Notification::create([
                'user_id' => $user->id,
                'type' => 'reservation_status',
                'message' => $message,
                'data' => json_encode([
                    'reservation_id' => $reservation->id,
                    'equipment_id' => $reservation->equipment_id,
                    'equipment_name' => $equipment ? $equipment->name : null,
                    'status' => $reservation->status,
                ]),
                'status' => 'unread',
            ]);
        }

        return response()->json(['message' => 'Reservation status updated', 'reservation' => $reservation]);
    }

    public function ownerDecision(Request $request, $id)
    {
        $validated = $request->validate([
            'decision' => 'required|string|in:accept,reject',
        ]);

        $reservation = EquipmentReservation::with(['equipment.user', 'user', 'payment'])->findOrFail($id);
        $user = $request->user();

        if ((int) $reservation->equipment?->user_id !== (int) $user->id) {
            return response()->json(['message' => 'Only the equipment owner can answer this request.'], 403);
        }

        if (!in_array($reservation->status, ['requested', 'payment_submitted'], true)) {
            return response()->json(['message' => 'This booking request has already been answered.'], 422);
        }

        if ($validated['decision'] === 'reject') {
            $reservation->update(['status' => 'rejected']);
            $message = sprintf('Your booking request for "%s" was declined by the owner.', $reservation->equipment?->name ?? 'equipment');
        } else {
            $isCash = $reservation->payment?->method === 'cash';
            $reservation->update(['status' => $isCash ? 'scheduled' : 'owner_accepted']);
            $message = $isCash
                ? sprintf('Your booking for "%s" was accepted and is now scheduled.', $reservation->equipment?->name ?? 'equipment')
                : sprintf('Your booking for "%s" was accepted. Bank payment verification is next.', $reservation->equipment?->name ?? 'equipment');
        }

        Notification::create([
            'user_id' => $reservation->user_id,
            'type' => 'reservation_status',
            'message' => $message,
            'data' => json_encode([
                'reservation_id' => $reservation->id,
                'equipment_id' => $reservation->equipment_id,
                'equipment_name' => $reservation->equipment?->name,
                'status' => $reservation->fresh()->status,
            ]),
            'status' => 'unread',
        ]);

        return response()->json([
            'message' => $message,
            'reservation' => $reservation->fresh(['equipment.user', 'user', 'payment']),
        ]);
    }

    public function ownerComplete(Request $request, $id)
    {
        $reservation = EquipmentReservation::with(['equipment.user', 'user', 'payment'])->findOrFail($id);
        $user = $request->user();

        if ($reservation->equipment?->user_id !== $user->id && !($user->is_admin ?? false)) {
            return response()->json(['message' => 'Only the equipment owner can mark this work completed.'], 403);
        }

        if (!in_array($reservation->status, ['scheduled', 'in_progress'], true)) {
            return response()->json(['message' => 'Only scheduled or in-progress bookings can be marked completed by owner.'], 422);
        }

        $reservation->update(['status' => 'owner_completed']);

        Notification::create([
            'user_id' => $reservation->user_id,
            'type' => 'completion_requested',
            'message' => sprintf('The owner marked "%s" as completed. Please confirm or report a problem.', $reservation->equipment?->name ?? 'your booking'),
            'data' => json_encode([
                'reservation_id' => $reservation->id,
                'equipment_id' => $reservation->equipment_id,
                'equipment_name' => $reservation->equipment?->name,
                'status' => 'owner_completed',
            ]),
            'status' => 'unread',
        ]);

        return response()->json([
            'message' => 'Work marked completed. Waiting for renter confirmation.',
            'reservation' => $reservation->fresh(['equipment.user', 'user', 'payment']),
        ]);
    }

    public function confirmCompletion(Request $request, $id)
    {
        $reservation = EquipmentReservation::with(['equipment.user', 'user', 'payment'])->findOrFail($id);
        $user = $request->user();

        if ($reservation->user_id !== $user->id && !($user->is_admin ?? false)) {
            return response()->json(['message' => 'Only the renter can confirm completion.'], 403);
        }

        if (!in_array($reservation->status, ['owner_completed', 'scheduled', 'in_progress'], true)) {
            return response()->json(['message' => 'This booking is not ready for completion confirmation.'], 422);
        }

        $reservation->update(['status' => 'completed']);
        $this->createOwnerPayoutIfReady($reservation->fresh(['equipment.user', 'payment']));

        return response()->json([
            'message' => 'Completion confirmed. Owner payout is now ready when applicable.',
            'reservation' => $reservation->fresh(['equipment.user', 'user', 'payment']),
        ]);
    }

    public function dispute(Request $request, $id)
    {
        $validated = $request->validate([
            'reason' => 'nullable|string|max:1000',
        ]);

        $reservation = EquipmentReservation::with(['equipment.user', 'user', 'payment'])->findOrFail($id);
        $user = $request->user();

        if ($reservation->user_id !== $user->id && $reservation->equipment?->user_id !== $user->id && !($user->is_admin ?? false)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $reservation->update([
            'status' => 'disputed',
            'notes' => trim(($reservation->notes ? $reservation->notes . "\n\n" : '') . 'Dispute: ' . ($validated['reason'] ?? 'No reason provided')),
        ]);

        return response()->json([
            'message' => 'Dispute opened. Admin review is required.',
            'reservation' => $reservation->fresh(['equipment.user', 'user', 'payment']),
        ]);
    }

    public function verifyPayment(Request $request, $id)
    {
        $validated = $request->validate([
            'verification_notes' => 'nullable|string|max:1000',
        ]);

        $reservation = EquipmentReservation::with(['equipment.user', 'payment'])->findOrFail($id);

        if (!$reservation->payment) {
            return response()->json(['message' => 'No payment found for this reservation.'], 404);
        }

        $reservation->payment->update([
            'status' => 'held',
            'verified_at' => now(),
            'verification_notes' => $validated['verification_notes'] ?? null,
        ]);

        $reservation->update([
            'status' => 'scheduled',
            'payment_status' => 'held',
        ]);

        return response()->json([
            'message' => 'Payment verified and held for owner payout after completion.',
            'reservation' => $reservation->fresh(['equipment.user', 'user', 'payment']),
        ]);
    }

    private function calculateRentalAmount(EquipmentReservation $reservation): float
    {
        $start = \Carbon\Carbon::parse($reservation->start_date)->startOfDay();
        $end = \Carbon\Carbon::parse($reservation->end_date)->startOfDay();
        $days = max(1, $start->diffInDays($end));
        $dailyRate = (float) ($reservation->equipment->minPrice ?? $reservation->equipment->price ?? 0);

        return round($days * $dailyRate, 2);
    }

    private function makeTransferReference(EquipmentReservation $reservation): string
    {
        return sprintf('AGR-RES-%06d', $reservation->id);
    }

    private function createOwnerPayoutIfReady(EquipmentReservation $reservation): ?OwnerPayout
    {
        $payment = $reservation->payment;
        $owner = $reservation->equipment?->user;

        if (!$payment || !$owner || !in_array($payment->status, ['held', 'completed', 'released'], true)) {
            return null;
        }

        return OwnerPayout::updateOrCreate([
            'reservation_id' => $reservation->id,
        ], [
            'payment_id' => $payment->id,
            'owner_id' => $owner->id,
            'amount' => $payment->amount,
            'currency' => $payment->currency,
            'status' => 'pending',
            'account_holder' => $owner->payout_account_holder,
            'bank_name' => $owner->payout_bank_name,
            'rib' => $owner->payout_rib,
            'iban' => $owner->payout_iban,
        ]);
    }
}
