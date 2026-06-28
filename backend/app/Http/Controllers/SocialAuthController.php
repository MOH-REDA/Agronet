<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class SocialAuthController extends Controller
{
    private const PROVIDERS = ['google', 'facebook'];

    public function providers(): JsonResponse
    {
        return response()->json([
            'google' => $this->configured('google'),
            'facebook' => $this->configured('facebook'),
        ]);
    }

    public function redirect(string $provider): RedirectResponse
    {
        $this->guardProvider($provider);
        if (!$this->configured($provider)) {
            return redirect($this->frontendUrl('/login?oauth_error=' . urlencode(ucfirst($provider) . ' login is not configured yet.')));
        }

        return Socialite::driver($provider)->stateless()->redirect();
    }

    public function callback(string $provider): RedirectResponse
    {
        $this->guardProvider($provider);
        try {
            $socialUser = Socialite::driver($provider)->stateless()->user();
            $email = $socialUser->getEmail();
            if (!$email) throw new \RuntimeException('The provider did not share an email address.');

            $providerColumn = $provider . '_id';
            $user = User::where($providerColumn, $socialUser->getId())->orWhere('email', $email)->first();
            $parts = preg_split('/\s+/u', trim((string) $socialUser->getName()), 2);

            if (!$user) {
                $user = User::create([
                    'prenom' => $parts[0] ?: null,
                    'name' => $parts[1] ?? $parts[0] ?? 'AgroNet user',
                    'email' => $email,
                    'email_verified_at' => now(),
                    'password' => null,
                    'is_admin' => false,
                    $providerColumn => $socialUser->getId(),
                    'social_avatar_url' => $socialUser->getAvatar(),
                ]);
            } else {
                $user->update(array_filter([
                    $providerColumn => $socialUser->getId(),
                    'social_avatar_url' => $user->avatar_path ? null : $socialUser->getAvatar(),
                    'email_verified_at' => $user->email_verified_at ?: now(),
                ], fn ($value) => $value !== null));
            }

            $code = Str::random(64);
            Cache::put("social-login:{$code}", $user->id, now()->addMinutes(2));
            return redirect($this->frontendUrl('/auth/social/callback?code=' . urlencode($code)));
        } catch (\Throwable $error) {
            report($error);
            return redirect($this->frontendUrl('/login?oauth_error=' . urlencode('Social login could not be completed. Please try again.')));
        }
    }

    public function exchange(Request $request): JsonResponse
    {
        $validated = $request->validate(['code' => ['required', 'string', 'size:64']]);
        $userId = Cache::pull('social-login:' . $validated['code']);
        abort_unless($userId, 422, 'This social login link has expired or was already used.');

        $user = User::findOrFail($userId);
        return response()->json([
            'token' => $user->createToken('social_login')->plainTextToken,
            'user' => $user->only(['id', 'name', 'prenom', 'email', 'is_admin', 'avatar_url', 'is_verified_owner', 'owner_verified_at']),
        ]);
    }

    private function guardProvider(string $provider): void
    {
        abort_unless(in_array($provider, self::PROVIDERS, true), 404);
    }

    private function configured(string $provider): bool
    {
        return filled(config("services.{$provider}.client_id")) && filled(config("services.{$provider}.client_secret"));
    }

    private function frontendUrl(string $path): string
    {
        return rtrim(config('app.url'), '/') . $path;
    }
}
