<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CustomizationOption extends Model
{
    use HasFactory;

    protected $fillable = [
        'group_id',
        'name',
        'additional_price',
        'available',
        'display_order',
    ];

    protected function casts(): array
    {
        return [
            'additional_price' => 'float',
            'available' => 'boolean',
            'display_order' => 'integer',
        ];
    }

    public function group()
    {
        return $this->belongsTo(CustomizationGroup::class, 'group_id');
    }
}
