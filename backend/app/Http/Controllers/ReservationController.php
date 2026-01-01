<?php

namespace App\Http\Controllers;

use App\Models\Equipment;
use App\Models\EquipmentReservation;
use App\Models\Payment;
use App\Models\Notification;
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
        $reservations = EquipmentReservation::with('equipment')
            ->where('user_id', $user->id)
            ->orderBy('start_date', 'desc')
            ->get();
        return response()->json(['data' => $reservations]);
    }

    // POST /api/reservations/{id}/pay
    public function pay(Request $request, $id)
    {
        $reservation = EquipmentReservation::findOrFail($id);
        $user = $request->user();
        $method = $request->input('method');
        $amount = $request->input('amount', 0);
        $transaction_id = $request->input('transaction_id', null);
        $status = 'pending';
        $response = [];

        if ($method === 'cash') {
            $status = 'paid';
            $reservation->status = 'paid';
            $reservation->save();
            $response['message'] = 'Reservation paid by cash.';
            // Optionally: notify equipment owner and user here
        } elseif ($method === 'paypal') {
            // Here you would initiate PayPal payment and return a URL or handle the flow
            $status = 'pending';
            $response['paypal_url'] = 'https://paypal.com/payment-link'; // Replace with real URL
            $response['message'] = 'Initiated PayPal payment.';
            // Reservation status can be updated after successful payment notification
        } else {
            return response()->json(['error' => 'Invalid payment method.'], 422);
        }

        $payment = Payment::create([
            'reservation_id' => $reservation->id,
            'user_id'        => $user->id,
            'amount'         => $amount,
            'currency'       => 'MAD',
            'status'         => $status,
            'method'         => $method,
            'transaction_id' => $transaction_id,
            'paid_at'        => $method === 'cash' ? now() : null,
        ]);

        $response['payment'] = $payment;
        return response()->json($response);
    }

    // POST /api/reservations (Create Reservation)
    public function store(Request $request)
    {
        $user = $request->user();
        $validated = $request->validate([
            'equipment_id' => 'required|exists:equipment,id',
            'start_date' => 'required|date|after_or_equal:today',
            'end_date' => 'required|date|after:start_date',
        ]);
        $reservation = EquipmentReservation::create([
            'user_id' => $user->id,
            'equipment_id' => $validated['equipment_id'],
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'status' => 'pending', // or 'requested'
        ]);
        // Update equipment status to 'reserved' or 'pending approval'
        $equipment = Equipment::find($validated['equipment_id']);
        $equipment->status = 'reserved'; // or 'pending approval' as needed
        $equipment->save();

        // Create notification for the equipment owner
        $owner = $equipment->user;
        if ($owner) {
            $message = sprintf(
                'Your equipment "%s" has been reserved by %s from %s to %s.',
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
                    'equipment_id' => $equipment->id,
                    'equipment_name' => $equipment->name,
                    'reserved_by' => $user->name,
                    'start_date' => $reservation->start_date,
                    'end_date' => $reservation->end_date,
                ]),
                'status' => 'unread',
            ]);
            // Optionally: send email to owner here
        }

        return response()->json(['message' => 'Reservation created', 'reservation' => $reservation]);
    }

    // GET /api/admin/reservations - List all reservations (admin only)
    public function allReservations()
    {
        $reservations = EquipmentReservation::with(['equipment', 'user'])
            ->orderBy('created_at', 'desc')
            ->get();
        return response()->json(['data' => $reservations]);
    }

    // PATCH /api/admin/reservations/{id}/status - Update reservation status (admin only)
    public function updateStatus(Request $request, $id)
    {
        $reservation = EquipmentReservation::findOrFail($id);
        $validated = $request->validate([
            'status' => 'required|string|in:pending,approved,rejected,active,completed,cancelled,paid',
        ]);
        $reservation->status = $validated['status'];
        $reservation->save();

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
}
