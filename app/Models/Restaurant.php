<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Restaurant extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'tagline',
        'logo',
        'cover_image',
        'description',
        'address',
        'phone',
        'email',
        'google_maps_url',
        'google_maps_embed',
        'min_advance_minutes',
        'max_advance_days',
        'tax_percentage',
        'service_charge_percentage',
        'packaging_charge',
        'online_payment_enabled',
        'pay_at_restaurant_enabled',
        'is_closed_override',
        'closed_reason',
        'cancellation_policy',
        'refund_policy',
        'privacy_policy',
        'terms_policy',
        'social_links',
    ];

    protected function casts(): array
    {
        return [
            'social_links' => 'array',
            'online_payment_enabled' => 'boolean',
            'pay_at_restaurant_enabled' => 'boolean',
            'is_closed_override' => 'boolean',
            'tax_percentage' => 'float',
            'service_charge_percentage' => 'float',
            'packaging_charge' => 'float',
            'min_advance_minutes' => 'integer',
            'max_advance_days' => 'integer',
        ];
    }
}
