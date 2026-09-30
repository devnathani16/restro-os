<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MenuItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id',
        'name',
        'slug',
        'description',
        'price',
        'discounted_price',
        'image',
        'preparation_time',
        'vegetarian',
        'ingredients',
        'allergens',
        'spice_level',
        'available',
        'featured',
        'popular',
        'display_order',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'float',
            'discounted_price' => 'float',
            'preparation_time' => 'integer',
            'vegetarian' => 'boolean',
            'spice_level' => 'integer',
            'available' => 'boolean',
            'featured' => 'boolean',
            'popular' => 'boolean',
            'display_order' => 'integer',
        ];
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function customizationGroups()
    {
        return $this->belongsToMany(CustomizationGroup::class, 'menu_item_customization_group')
                    ->withTimestamps();
    }

    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function getEffectivePriceAttribute(): float
    {
        return $this->discounted_price && $this->discounted_price > 0 && $this->discounted_price < $this->price
            ? (float) $this->discounted_price
            : (float) $this->price;
    }
}
