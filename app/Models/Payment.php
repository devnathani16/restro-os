<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'payment_provider',
        'transaction_id',
        'amount',
        'currency',
        'status',
        'raw_response',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'float',
            'raw_response' => 'array',
        ];
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}
