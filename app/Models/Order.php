<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_number',
        'customer_id',
        'customer_name',
        'customer_email',
        'customer_phone',
        'arrival_date',
        'arrival_time',
        'time_slot_id',
        'dining_option',
        'subtotal',
        'discount',
        'coupon_code',
        'tax',
        'service_charge',
        'packaging_charge',
        'final_total',
        'payment_status',
        'payment_method',
        'order_status',
        'customer_notes',
        'cancellation_reason',
        'preparation_started_at',
        'ready_at',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'arrival_date' => 'date',
            'subtotal' => 'float',
            'discount' => 'float',
            'tax' => 'float',
            'service_charge' => 'float',
            'packaging_charge' => 'float',
            'final_total' => 'float',
            'preparation_started_at' => 'datetime',
            'ready_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function customer()
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function timeSlot()
    {
        return $this->belongsTo(TimeSlot::class);
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }
}
