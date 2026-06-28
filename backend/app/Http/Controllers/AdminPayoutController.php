<?php

namespace App\Http\Controllers;

use App\Models\OwnerPayout;
use Illuminate\Http\Request;

class AdminPayoutController extends Controller
{
    public function index()
    {
        $payouts = OwnerPayout::with(['owner', 'reservation.equipment', 'payment'])
            ->orderByRaw("FIELD(status, 'pending', 'paid', 'blocked')")
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['data' => $payouts]);
    }

    public function markPaid(Request $request, $id)
    {
        $validated = $request->validate([
            'transfer_reference' => 'required|string|max:120',
            'notes' => 'nullable|string|max:1000',
        ]);

        $payout = OwnerPayout::with('payment')->findOrFail($id);
        $payout->update([
            'status' => 'paid',
            'transfer_reference' => $validated['transfer_reference'],
            'notes' => $validated['notes'] ?? $payout->notes,
            'paid_at' => now(),
        ]);

        if ($payout->payment) {
            $payout->payment->update([
                'status' => 'released',
                'released_at' => now(),
            ]);
        }

        return response()->json([
            'message' => 'Owner payout marked as paid.',
            'payout' => $payout->fresh(['owner', 'reservation.equipment', 'payment']),
        ]);
    }
}
