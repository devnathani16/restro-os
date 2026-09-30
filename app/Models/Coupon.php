<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Coupon extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'discount_type',
        'discount_value',
        'minimum_order',
        'maximum_discount',
        'start_date',
        'expiry_date',
        'usage_limit',
        'times_used',
        'active',
    ];

    protected function casts(): array
    {
        return [
            'discount_value' => 'float',
            'minimum_order' => 'float',
            'maximum_discount' => 'float',
            'start_date' => 'date',
            'expiry_date' => 'date',
            'usage_limit' => 'integer',
            'times_used' => 'integer',
            'active' => 'boolean',
        ];
    }

    public function isValidForAmount(float $subtotal): array
    {
        $today = now()->format('Y-m-d');

        if (!$this->active) {
            return ['valid' => false, 'message' => 'Coupon is inactive.'];
        }

        if ($this->start_date && $today < $this->start_date->format('Y-m-d')) {
            return ['valid' => false, 'message' => 'Coupon is not yet active.'];
        }

        if ($this->expiry_date && $today > $this->expiry_date->format('Y-m-d')) {
            return ['valid' => false, 'message' => 'Coupon has expired.'];
        }

        if ($this->usage_limit !== null && $this->times_used >= $this->usage_limit) {
            return ['valid' => false, 'message' => 'Coupon usage limit reached.'];
        }

        if ($subtotal < $this->minimum_order) {
            return ['valid' => false, 'message' => "Minimum order of ₹{$this->minimum_order} required for this coupon."];
        }

        return ['valid' => true, 'message' => 'Coupon is valid!'];
    }

    public function calculateDiscount(float $subtotal): float
    {
        if ($this->discount_type === 'percentage') {
            $discount = ($subtotal * $this->discount_value) / 100.0;
            if ($this->maximum_discount && $discount > $this->maximum_discount) {
                $discount = $this->maximum_discount;
            }
            return round($discount, 2);
        }

        return min($this->discount_value, $subtotal);
    }
}
