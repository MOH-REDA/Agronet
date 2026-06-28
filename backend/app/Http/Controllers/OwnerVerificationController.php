<?php

namespace App\Http\Controllers;

use App\Models\OwnerVerification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use App\Models\User;

class OwnerVerificationController extends Controller
{
    public function status(Request $request)
    {
        $verification = $request->user()->ownerVerification;
        return response()->json(['data' => $verification ? $this->publicData($verification) : null]);
    }

    public function submit(Request $request)
    {
        $user = $request->user();
        $existing = $user->ownerVerification;

        if ($existing?->status === 'approved') {
            return response()->json(['message' => 'This owner is already verified.'], 422);
        }

        $validated = $request->validate([
            'identity_document' => 'required|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'ownership_document' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
        ]);

        if ($existing) {
            Storage::disk('local')->delete(array_filter([
                $existing->identity_document_path,
                $existing->ownership_document_path,
            ]));
        }

        $identityPath = $request->file('identity_document')->store("verifications/{$user->id}", 'local');
        $ownershipPath = $request->file('ownership_document')
            ? $request->file('ownership_document')->store("verifications/{$user->id}", 'local')
            : null;

        $verification = OwnerVerification::updateOrCreate(
            ['user_id' => $user->id],
            [
                'status' => 'pending',
                'identity_document_path' => $identityPath,
                'ownership_document_path' => $ownershipPath,
                'rejection_reason' => null,
                'submitted_at' => now(),
                'reviewed_by' => null,
                'reviewed_at' => null,
            ]
        );
        $user->update(['owner_verified_at' => null]);

        return response()->json([
            'message' => 'Verification submitted for admin review.',
            'data' => $this->publicData($verification),
        ]);
    }

    public function index()
    {
        $verifications = OwnerVerification::with([
            'user:id,name,prenom,email,avatar_path,owner_verified_at',
            'reviewer:id,name,prenom',
        ])->orderByRaw("FIELD(status, 'pending', 'rejected', 'approved')")
          ->orderByDesc('submitted_at')
          ->get()
          ->map(fn ($verification) => array_merge($this->publicData($verification), [
              'user' => $verification->user,
              'reviewer' => $verification->reviewer,
              'documents' => [
                  'identity' => route('admin.owner-verifications.document', [$verification->id, 'identity']),
                  'ownership' => $verification->ownership_document_path
                      ? route('admin.owner-verifications.document', [$verification->id, 'ownership'])
                      : null,
              ],
          ]));

        return response()->json(['data' => $verifications]);
    }

    public function review(Request $request, OwnerVerification $verification)
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['approved', 'rejected', 'revoked'])],
            'rejection_reason' => 'nullable|required_unless:status,approved|string|max:1000',
        ]);

        DB::transaction(function () use ($request, $verification, $validated) {
            $verification->update([
                'status' => $validated['status'],
                'rejection_reason' => $validated['status'] !== 'approved' ? $validated['rejection_reason'] : null,
                'reviewed_by' => $request->user()->id,
                'reviewed_at' => now(),
            ]);
            $verification->user()->update([
                'owner_verified_at' => $validated['status'] === 'approved' ? now() : null,
            ]);
        });

        return response()->json([
            'message' => match ($validated['status']) {
                'approved' => 'Owner verified.',
                'revoked' => 'Owner verification revoked.',
                default => 'Verification rejected.',
            },
            'data' => $this->publicData($verification->fresh()),
        ]);
    }

    public function document(OwnerVerification $verification, string $type)
    {
        abort_unless(in_array($type, ['identity', 'ownership'], true), 404);
        $path = $type === 'identity'
            ? $verification->identity_document_path
            : $verification->ownership_document_path;
        abort_unless($path && Storage::disk('local')->exists($path), 404);

        return Storage::disk('local')->download($path);
    }

    public function revokeUser(Request $request, User $user)
    {
        $validated = $request->validate(['reason' => 'required|string|max:1000']);
        DB::transaction(function () use ($request, $user, $validated) {
            $user->update(['owner_verified_at' => null]);
            $user->ownerVerification?->update([
                'status' => 'revoked',
                'rejection_reason' => $validated['reason'],
                'reviewed_by' => $request->user()->id,
                'reviewed_at' => now(),
            ]);
        });
        return response()->json(['message' => 'Owner verification revoked.', 'user' => $user->fresh()]);
    }

    private function publicData(OwnerVerification $verification): array
    {
        return [
            'id' => $verification->id,
            'status' => $verification->status,
            'rejection_reason' => $verification->rejection_reason,
            'submitted_at' => $verification->submitted_at,
            'reviewed_at' => $verification->reviewed_at,
            'has_identity_document' => (bool) $verification->identity_document_path,
            'has_ownership_document' => (bool) $verification->ownership_document_path,
        ];
    }
}
