<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\EquipmentController;
use App\Http\Controllers\AdminEquipmentController;
use App\Http\Controllers\ReservationController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\AdminPayoutController;
use App\Http\Controllers\OwnerVerificationController;
use App\Http\Controllers\EquipmentAdvisorController;
use App\Http\Controllers\SocialAuthController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login'])->name('login');
Route::get('/auth/providers', [SocialAuthController::class, 'providers']);
Route::get('/auth/{provider}/redirect', [SocialAuthController::class, 'redirect']);
Route::get('/auth/{provider}/callback', [SocialAuthController::class, 'callback']);
Route::post('/auth/social/exchange', [SocialAuthController::class, 'exchange'])->middleware('throttle:10,1');

Route::middleware(['auth:sanctum', 'isAdmin'])->group(function () {
    Route::get('/admin/users', [App\Http\Controllers\AdminController::class, 'listUsers']);
    Route::post('/admin/promote/{userId}', [App\Http\Controllers\AdminController::class, 'promoteToAdmin']);
    Route::post('/admin/demote/{userId}', [App\Http\Controllers\AdminController::class, 'demoteAdmin']);
    Route::delete('/admin/users/{userId}', [App\Http\Controllers\AdminController::class, 'deleteUser']);
    Route::post('/admin/create', [AuthController::class, 'createAdmin']);
    // Admin equipment management
    Route::get('/admin/equipment', [\App\Http\Controllers\AdminEquipmentController::class, 'index']);
    Route::delete('/admin/equipment/{id}', [\App\Http\Controllers\AdminEquipmentController::class, 'destroy']);
    // Admin: Get all reservations
    Route::get('/admin/reservations', [ReservationController::class, 'allReservations']);
    // Admin: Update reservation status
    Route::patch('/admin/reservations/{id}/status', [ReservationController::class, 'updateStatus']);
    Route::patch('/admin/reservations/{id}/payment/verify', [ReservationController::class, 'verifyPayment']);
    Route::get('/admin/payouts', [AdminPayoutController::class, 'index']);
    Route::patch('/admin/payouts/{id}/paid', [AdminPayoutController::class, 'markPaid']);
    Route::get('/admin/owner-verifications', [OwnerVerificationController::class, 'index']);
    Route::patch('/admin/owner-verifications/{verification}', [OwnerVerificationController::class, 'review']);
    Route::patch('/admin/users/{user}/owner-verification/revoke', [OwnerVerificationController::class, 'revokeUser']);
    Route::get('/admin/owner-verifications/{verification}/documents/{type}', [OwnerVerificationController::class, 'document'])
        ->name('admin.owner-verifications.document');
    // Example admin dashboard route
    Route::get('/admin/dashboard', function () {
        $recentUsers = \App\Models\User::orderBy('created_at', 'desc')->take(5)->get(['id', 'name', 'email', 'created_at', 'is_admin']);
        return response()->json([
            'stats' => [
                'totalUsers' => \App\Models\User::count(),
                'totalEquipment' => \App\Models\Equipment::count(),
                'activeRentals' => \App\Models\EquipmentReservation::where('status', 'active')->count(),
                'totalRevenue' => 0, // Placeholder, implement revenue logic if needed
            ],
            'recentUsers' => $recentUsers,
        ]);
    });
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::put('/user/update', [AuthController::class, 'updateProfile']);
    Route::put('/user/password', [AuthController::class, 'updatePassword']);
    Route::post('/user/avatar', [AuthController::class, 'updateAvatar']);
    Route::get('/owner-verification', [OwnerVerificationController::class, 'status']);
    Route::post('/owner-verification', [OwnerVerificationController::class, 'submit']);
    Route::post('/equipment', [\App\Http\Controllers\EquipmentController::class, 'store']);
    Route::get('/favorites', [EquipmentController::class, 'favorites']);
    Route::post('/favorites/{equipment}', [EquipmentController::class, 'addFavorite']);
    Route::delete('/favorites/{equipment}', [EquipmentController::class, 'removeFavorite']);
    Route::get('/equipment/my-listings', [\App\Http\Controllers\EquipmentController::class, 'myListings']);
    Route::put('/equipment/{id}', [\App\Http\Controllers\EquipmentController::class, 'update']);
    Route::delete('/equipment/{id}', [\App\Http\Controllers\EquipmentController::class, 'destroy']);
    Route::get('/my-equipment', [\App\Http\Controllers\EquipmentController::class, 'myEquipment']);
    Route::get('/user/reservations', [ReservationController::class, 'userReservations']);
    Route::get('/user/equipment', [\App\Http\Controllers\EquipmentController::class, 'userEquipment']);
    Route::post('/reservations/{id}/pay', [ReservationController::class, 'pay'])->middleware('auth:sanctum');
    Route::post('/reservations/{id}/review', [ReservationController::class, 'review']);
    Route::post('/reservations', [ReservationController::class, 'store'])->middleware('auth:sanctum');
    Route::patch('/reservations/{id}/owner-decision', [ReservationController::class, 'ownerDecision']);
    Route::patch('/reservations/{id}/owner-complete', [ReservationController::class, 'ownerComplete']);
    Route::patch('/reservations/{id}/confirm-completion', [ReservationController::class, 'confirmCompletion']);
    Route::patch('/reservations/{id}/dispute', [ReservationController::class, 'dispute']);
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
});
Route::get('/equipment', [\App\Http\Controllers\EquipmentController::class, 'index']);
Route::get('/equipment/types', [\App\Http\Controllers\EquipmentController::class, 'types']);
Route::get('/equipment/marketplace-stats', [EquipmentController::class, 'marketplaceStats']);
Route::post('/equipment/advisor', [EquipmentAdvisorController::class, 'advise'])->middleware('throttle:10,1');
Route::post('/equipment/{id}/reserve', [\App\Http\Controllers\EquipmentController::class, 'reserve'])->middleware('auth:sanctum');
Route::get('/equipment/{id}', [\App\Http\Controllers\EquipmentController::class, 'show']);
Route::get('/reservations/{id}', [ReservationController::class, 'show'])->middleware('auth:sanctum');
Route::get('/equipment/{id}/availability', [EquipmentController::class, 'availability']);
