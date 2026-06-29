<?php

namespace App\Console\Commands;

use App\Models\Equipment;
use App\Models\User;
use App\Services\PublicMediaStorage;
use Illuminate\Console\Command;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Throwable;

class MigratePublicMediaToCloudinary extends Command
{
    protected $signature = 'media:migrate-cloudinary {--dry-run : Count local assets without uploading them}';

    protected $description = 'Move existing public equipment and avatar files to Cloudinary';

    public function handle(PublicMediaStorage $media): int
    {
        if (!str_starts_with((string) config('services.cloudinary.url'), 'cloudinary://')) {
            $this->error('Cloudinary is not configured.');
            return self::FAILURE;
        }

        $migrated = 0;
        $missing = 0;
        $failed = 0;

        Equipment::query()->orderBy('id')->each(function (Equipment $equipment) use ($media, &$migrated, &$missing, &$failed) {
            $changed = false;
            $images = collect($equipment->images ?? [])->map(function ($reference) use ($equipment, $media, &$changed, &$migrated, &$missing, &$failed) {
                if (!$reference || filter_var($reference, FILTER_VALIDATE_URL)) return $reference;

                $path = $this->localPath($reference, 'equipment');
                if (!Storage::disk('public')->exists($path)) {
                    $this->warn("Missing equipment file: {$path}");
                    $missing++;
                    return $reference;
                }

                if ($this->option('dry-run')) {
                    $migrated++;
                    return $reference;
                }

                try {
                    $uploaded = $media->upload($this->uploadedFile($path), 'equipment');
                    $migrated++;
                    $changed = true;
                    return $uploaded;
                } catch (Throwable $exception) {
                    report($exception);
                    $this->error("Could not migrate equipment #{$equipment->id}: {$exception->getMessage()}");
                    $failed++;
                    return $reference;
                }
            })->values()->all();

            if ($changed) $equipment->update(['images' => $images]);
        });

        User::query()->whereNotNull('avatar_path')->orderBy('id')->each(function (User $user) use ($media, &$migrated, &$missing, &$failed) {
            if (filter_var($user->avatar_path, FILTER_VALIDATE_URL)) return;

            $path = $this->localPath($user->avatar_path, 'avatars');
            if (!Storage::disk('public')->exists($path)) {
                $this->warn("Missing avatar file for user #{$user->id}: {$path}");
                $missing++;
                return;
            }

            if ($this->option('dry-run')) {
                $migrated++;
                return;
            }

            try {
                $user->update(['avatar_path' => $media->upload($this->uploadedFile($path), "avatars/{$user->id}")]);
                $migrated++;
            } catch (Throwable $exception) {
                report($exception);
                $this->error("Could not migrate avatar for user #{$user->id}: {$exception->getMessage()}");
                $failed++;
            }
        });

        $action = $this->option('dry-run') ? 'found' : 'migrated';
        $this->info("Public media {$action}: {$migrated}; missing: {$missing}; failed: {$failed}.");

        return $failed > 0 ? self::FAILURE : self::SUCCESS;
    }

    private function localPath(string $reference, string $folder): string
    {
        $path = ltrim(str_replace('\\', '/', $reference), '/');
        $path = preg_replace('#^storage/#', '', $path);
        if ($folder === 'equipment' && !str_starts_with($path, 'equipment/')) {
            $path = 'equipment/' . $path;
        }

        return $path;
    }

    private function uploadedFile(string $path): UploadedFile
    {
        $absolute = Storage::disk('public')->path($path);
        $mime = Storage::disk('public')->mimeType($path) ?: 'application/octet-stream';

        return new UploadedFile($absolute, basename($path), $mime, null, true);
    }
}
