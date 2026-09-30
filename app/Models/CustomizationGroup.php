<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CustomizationGroup extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'required',
        'min_selection',
        'max_selection',
    ];

    protected function casts(): array
    {
        return [
            'required' => 'boolean',
            'min_selection' => 'integer',
            'max_selection' => 'integer',
        ];
    }

    public function options()
    {
        return $this->hasMany(CustomizationOption::class, 'group_id')->orderBy('display_order');
    }

    public function menuItems()
    {
        return $this->belongsToMany(MenuItem::class, 'menu_item_customization_group');
    }
}
