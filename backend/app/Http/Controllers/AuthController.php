<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'prenom' => 'nullable|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6',
            'address' => 'nullable|string|max:255',
            'phone_number' => 'nullable|string|max:32',
            'avatar' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:3072',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'prenom' => $validated['prenom'] ?? null,
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'is_admin' => false,
            'address' => $validated['address'] ?? null,
            'phone_number' => $validated['phone_number'] ?? null,
        ]);

        if ($request->hasFile('avatar')) {
            $user->update([
                'avatar_path' => $request->file('avatar')->store("avatars/{$user->id}", 'public'),
            ]);
        }

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'prenom' => $user->prenom,
                'email' => $user->email,
                'is_admin' => $user->is_admin,
                'address' => $user->address,
                'phone_number' => $user->phone_number,
                'payout_account_holder' => $user->payout_account_holder,
                'payout_bank_name' => $user->payout_bank_name,
                'payout_rib' => $user->payout_rib,
                'payout_iban' => $user->payout_iban,
                'payout_verified_at' => $user->payout_verified_at,
                'avatar_url' => $user->avatar_url,
            ],
        ], 201);
    }

    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $token = $user->createToken('api_token')->plainTextToken;

        return response()->json([
            'user' => $user->only([
                'id', 'name', 'prenom', 'email', 'is_admin', 'avatar_url',
                'is_verified_owner', 'owner_verified_at',
            ]),
            'token' => $token,
        ]);
    }

    public function user(Request $request)
    {
        $user = $request->user();
        return response()->json($user->only([
            'id', 'name', 'prenom', 'email', 'is_admin', 'address', 'phone_number',
            'payout_account_holder', 'payout_bank_name', 'payout_rib', 'payout_iban',
            'payout_verified_at', 'avatar_url', 'is_verified_owner', 'owner_verified_at',
        ]));
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'prenom' => 'nullable|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'address' => 'nullable|string|max:255',
            'phone_number' => 'nullable|string|max:32',
            'payout_account_holder' => 'nullable|string|max:255',
            'payout_bank_name' => 'nullable|string|max:255',
            'payout_rib' => 'nullable|string|max:32',
            'payout_iban' => 'nullable|string|max:64',
        ]);

        $user->update($validated);

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => [
                'id' => $user->id,
                'prenom' => $user->prenom,
                'name' => $user->name,
                'email' => $user->email,
                'address' => $user->address,
                'phone_number' => $user->phone_number,
                'payout_account_holder' => $user->payout_account_holder,
                'payout_bank_name' => $user->payout_bank_name,
                'payout_rib' => $user->payout_rib,
                'payout_iban' => $user->payout_iban,
                'payout_verified_at' => $user->payout_verified_at,
                'avatar_url' => $user->avatar_url,
                'is_verified_owner' => $user->is_verified_owner,
                'owner_verified_at' => $user->owner_verified_at,
            ]
        ]);
    }

    public function updatePassword(Request $request)
    {
        $user = $request->user();
        $validated = $request->validate([
            'currentPassword' => 'required|string',
            'newPassword' => 'required|string|min:6',
            'confirmPassword' => 'required|string|same:newPassword',
        ]);

        if (!\Hash::check($validated['currentPassword'], $user->password)) {
            return response()->json([
                'message' => 'Current password is incorrect'
            ], 401);
        }

        $user->password = \Hash::make($validated['newPassword']);
        $user->save();

        // Optionally: $request->user()->tokens()->delete(); // Invalidate all tokens

        return response()->json([
            'message' => 'Password updated successfully'
        ]);
    }

    public function updateAvatar(Request $request)
    {
        $validated = $request->validate([
            'avatar' => 'required|image|mimes:jpg,jpeg,png,webp|max:3072',
        ]);
        $user = $request->user();

        if ($user->avatar_path) {
            Storage::disk('public')->delete($user->avatar_path);
        }

        $user->update([
            'avatar_path' => $request->file('avatar')->store("avatars/{$user->id}", 'public'),
        ]);

        return response()->json([
            'message' => 'Profile picture updated.',
            'user' => $user->fresh(),
        ]);
    }
}
