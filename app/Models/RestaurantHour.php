<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RestaurantHour extends Model
{
    use HasFactory;

    protected $fillable = [
        'day',
        'day_number',
        'opening_time',
        'closing_time',
        'is_closed',
    ];

    protected function casts(): array
    {
        return [
            'day_number' => 'integer',
            'is_closed' => 'boolean',
        ];
    }
}
