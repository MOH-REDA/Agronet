<?php

namespace App\Console\Commands;

use App\Services\PublicMediaStorage;
use Illuminate\Console\Command;
use Illuminate\Http\UploadedFile;
use Throwable;

class CheckCloudinary extends Command
{
    protected $signature = 'cloudinary:check';

    protected $description = 'Upload and remove a tiny image to verify the Cloudinary connection';

    public function handle(PublicMediaStorage $media): int
    {
        if (!str_starts_with((string) config('services.cloudinary.url'), 'cloudinary://')) {
            $this->error('Cloudinary is not configured.');
            return self::FAILURE;
        }

        $path = tempnam(sys_get_temp_dir(), 'agronet-cloudinary-');
        $reference = null;

        try {
            file_put_contents($path, base64_decode(
                'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z3WQAAAAASUVORK5CYII='
            ));
            $file = new UploadedFile($path, 'agronet-connection-check.png', 'image/png', null, true);
            $reference = $media->upload($file, 'connection-checks');

            if (!str_contains($reference, 'cloudinary.com')) {
                throw new \RuntimeException('The upload did not return a Cloudinary URL.');
            }

            $this->info('Cloudinary upload and delivery are working.');
            return self::SUCCESS;
        } catch (Throwable $exception) {
            report($exception);
            $this->error('Cloudinary check failed: ' . $exception->getMessage());
            return self::FAILURE;
        } finally {
            if ($reference) $media->delete($reference);
            @unlink($path);
        }
    }
}
