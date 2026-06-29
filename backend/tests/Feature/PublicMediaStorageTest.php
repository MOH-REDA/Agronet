<?php

use App\Services\PublicMediaStorage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    config()->set('services.cloudinary.url', null);
    Storage::fake('public');
});

it('falls back to the public disk when cloudinary is not configured', function () {
    $media = app(PublicMediaStorage::class);
    $reference = $media->upload(
        UploadedFile::fake()->create('tractor.webp', 100, 'image/webp'),
        'equipment',
    );

    expect($reference)->toStartWith('/storage/equipment/');
    Storage::disk('public')->assertExists(str_replace('/storage/', '', $reference));

    $media->delete($reference);
    Storage::disk('public')->assertMissing(str_replace('/storage/', '', $reference));
});

it('preserves remote media urls and normalizes legacy local paths', function () {
    $media = app(PublicMediaStorage::class);
    $cloudinary = 'https://res.cloudinary.com/demo/image/upload/v1/agronet/equipment/tractor.jpg';

    expect($media->publicUrl($cloudinary, 'equipment'))->toBe($cloudinary)
        ->and($media->publicUrl('equipment/tractor.jpg', 'equipment'))->toBe('/storage/equipment/tractor.jpg')
        ->and($media->publicUrl('tractor.jpg', 'equipment'))->toBe('/storage/equipment/tractor.jpg');
});

it('refuses a media migration when cloudinary is not configured', function () {
    $this->artisan('media:migrate-cloudinary')->assertFailed();
});
