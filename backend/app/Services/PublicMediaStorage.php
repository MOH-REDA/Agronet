<?php

namespace App\Services;

use Cloudinary\Cloudinary;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class PublicMediaStorage
{
    private ?Cloudinary $cloudinary = null;

    public function upload(UploadedFile $file, string $folder): string
    {
        if ($this->cloudinaryUrl()) {
            $result = $this->cloudinary()->uploadApi()->upload($file->getRealPath(), [
                'folder' => 'agronet/' . trim($folder, '/'),
                'resource_type' => 'image',
                'use_filename' => true,
                'unique_filename' => true,
            ]);

            return (string) $result['secure_url'];
        }

        $path = $file->store(trim($folder, '/'), 'public');

        return '/storage/' . ltrim($path, '/');
    }

    public function delete(?string $reference): void
    {
        if (!$reference) return;

        if ($this->isCloudinaryUrl($reference)) {
            $publicId = $this->cloudinaryPublicId($reference);
            if ($publicId && $this->cloudinaryUrl()) {
                $this->cloudinary()->uploadApi()->destroy($publicId, [
                    'resource_type' => 'image',
                    'invalidate' => true,
                ]);
            }
            return;
        }

        $path = parse_url($reference, PHP_URL_PATH) ?: $reference;
        $path = preg_replace('#^/?storage/#', '', $path);
        Storage::disk('public')->delete(ltrim($path, '/'));
    }

    public function publicUrl(?string $reference, string $defaultFolder = ''): ?string
    {
        if (!$reference) return null;
        if (filter_var($reference, FILTER_VALIDATE_URL)) return $reference;

        $path = ltrim(str_replace('\\', '/', $reference), '/');
        if (str_starts_with($path, 'storage/')) return '/' . $path;
        if ($defaultFolder && !str_starts_with($path, trim($defaultFolder, '/') . '/')) {
            $path = trim($defaultFolder, '/') . '/' . $path;
        }

        return '/storage/' . $path;
    }

    private function cloudinary(): Cloudinary
    {
        return $this->cloudinary ??= new Cloudinary($this->cloudinaryUrl());
    }

    private function cloudinaryUrl(): ?string
    {
        $url = trim((string) config('services.cloudinary.url'));
        return str_starts_with($url, 'cloudinary://') ? $url : null;
    }

    private function isCloudinaryUrl(string $reference): bool
    {
        $host = strtolower((string) parse_url($reference, PHP_URL_HOST));
        return $host === 'res.cloudinary.com' || str_ends_with($host, '.cloudinary.com');
    }

    private function cloudinaryPublicId(string $url): ?string
    {
        $path = urldecode((string) parse_url($url, PHP_URL_PATH));
        $marker = '/upload/';
        $position = strpos($path, $marker);
        if ($position === false) return null;

        $asset = substr($path, $position + strlen($marker));
        $asset = preg_replace('#^v\d+/#', '', $asset);

        return preg_replace('/\.[^.\/]+$/', '', $asset);
    }
}
