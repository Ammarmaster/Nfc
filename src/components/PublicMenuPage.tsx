import React, { useState, useEffect } from 'react';
import { Search, Flame, Radio, UtensilsCrossed, ArrowLeft } from 'lucide-react';
import type { Stand, Business, MenuCategory, MenuItem } from '../types';
import { api } from '../services/api';
import { sounds } from '../utils/audio';

interface PublicMenuPageProps {
  stand: Stand;
  business?: Business;
  isNfc?: boolean;
  onNavigateHome?: () => void;
}

export const PublicMenuPage: React.FC<PublicMenuPageProps> = ({ stand, business, isNfc, onNavigateHome }) => {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVegOnly, setFilterVegOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  const businessId = business?.id || stand.businessId || '';

  useEffect(() => {
    async function loadMenu() {
      if (businessId) {
        setLoading(true);
        const [cats, menuItems] = await Promise.all([
          api.getMenuCategories(businessId),
          api.getMenuItems(businessId),
        ]);
        setCategories(cats);
        setItems(menuItems);
        setLoading(false);
      }
    }
    loadMenu();
  }, [businessId]);

  const filteredItems = items.filter(item => {
    if (activeCategoryId !== 'all' && item.categoryId !== activeCategoryId) return false;
    if (filterVegOnly && !item.isVeg) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchDesc = item.description?.toLowerCase().includes(q);
      const matchTags = item.tags?.some(t => t.toLowerCase().includes(q));
      if (!matchName && !matchDesc && !matchTags) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 pb-20">
      {/* Top Mobile Sticky Header */}
      <div className="sticky top-0 z-30 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#E8E2D5] px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          {onNavigateHome && (
            <button 
              onClick={() => {
                sounds.playTap();
                onNavigateHome();
              }}
              className="p-1.5 rounded-xl bg-white border border-[#DCD4C5] text-stone-700 hover:text-stone-900 shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <h1 className="text-sm font-bold text-stone-900 truncate max-w-[200px]">
              {business?.name || 'Digital Menu'}
            </h1>
            <div className="flex items-center gap-1.5 text-[10px] text-stone-500">
              <Radio className={`w-3 h-3 ${isNfc ? 'text-emerald-600' : 'text-[#B3801A]'}`} />
              <span>Stand #{stand.slug} {stand.customLabel ? `• ${stand.customLabel}` : ''}</span>
            </div>
          </div>
        </div>

        {/* Veg Only Toggle */}
        <button
          onClick={() => {
            sounds.playTap();
            setFilterVegOnly(!filterVegOnly);
          }}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all ${
            filterVegOnly
              ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
              : 'bg-white border-[#DCD4C5] text-stone-600'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-sm border border-emerald-600 flex items-center justify-center p-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
          </span>
          <span>Veg</span>
        </button>
      </div>

      {/* Main Container */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        {/* Restaurant Hero Card */}
        <div className="milky-card border border-[#E8E2D5] bg-white rounded-3xl p-5 mb-5 shadow-sm flex items-center gap-4">
          {business?.logoUrl ? (
            <img 
              src={business.logoUrl} 
              alt={business.name} 
              className="w-16 h-16 rounded-2xl object-cover border border-[#E8E2D5] shrink-0" 
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#D4AF37] to-[#C59B27] flex items-center justify-center text-stone-950 text-xl font-bold shrink-0">
              <UtensilsCrossed className="w-8 h-8" />
            </div>
          )}
          <div className="min-w-0">
            <div className="text-[11px] font-bold text-[#B3801A] uppercase tracking-wider">
              {business?.category || 'Dining'} • Contactless Digital Menu
            </div>
            <h2 className="text-xl font-black text-stone-900 truncate">
              {business?.name || 'Restaurant Menu'}
            </h2>
            {business?.address && (
              <p className="text-xs text-stone-500 truncate mt-0.5">
                {business.address}
              </p>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dishes, drinks, biryanis..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#DCD4C5] rounded-2xl text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#C59B27] transition-all shadow-sm"
          />
        </div>

        {/* Category Pills Slider */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none mb-5">
          <button
            onClick={() => {
              sounds.playTap();
              setActiveCategoryId('all');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeCategoryId === 'all'
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#C59B27] text-stone-950 shadow-sm'
                : 'bg-white text-stone-600 border border-[#DCD4C5] hover:text-stone-900'
            }`}
          >
            All Items
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                sounds.playTap();
                setActiveCategoryId(cat.id);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeCategoryId === cat.id
                  ? 'bg-gradient-to-r from-[#D4AF37] to-[#C59B27] text-stone-950 shadow-sm'
                  : 'bg-white text-stone-600 border border-[#DCD4C5] hover:text-stone-900'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Items List */}
        {loading ? (
          <div className="py-12 text-center text-stone-400 text-sm">
            Loading fresh menu...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-12 text-center bg-white border border-[#E8E2D5] rounded-2xl p-6 shadow-sm">
            <UtensilsCrossed className="w-10 h-10 text-stone-400 mx-auto mb-2" />
            <p className="text-stone-800 font-bold text-sm">No menu items match your search.</p>
            <p className="text-stone-500 text-xs mt-1">Try resetting the veg filter or searching for another dish.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4">
            {filteredItems.map((item) => (
              <div 
                key={item.id} 
                className={`milky-card rounded-2xl p-4 flex gap-4 transition-all bg-white border border-[#E8E2D5] shadow-sm ${
                  item.isAvailable ? 'hover:border-[#D4AF37]' : 'opacity-60'
                }`}
              >
                {/* Item Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {/* Standard Indian Veg/Non-Veg symbol */}
                    <span 
                      className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center p-0.5 shrink-0 ${
                        item.isVeg ? 'border-emerald-600' : 'border-rose-600'
                      }`}
                      title={item.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                    </span>

                    {item.isSpicy && (
                      <span className="flex items-center gap-0.5 text-[10px] text-amber-500 font-bold">
                        <Flame className="w-3 h-3 fill-amber-500" />
                        <span>Spicy</span>
                      </span>
                    )}

                    {item.tags?.map((tag) => (
                      <span key={tag} className="text-[10px] px-2 py-0.5 rounded-md bg-amber-50 text-[#B3801A] border border-amber-200 font-bold">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-stone-900 leading-snug">
                    {item.name}
                  </h3>

                  {item.description && (
                    <p className="text-xs text-stone-500 line-clamp-2 mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  )}

                  <div className="mt-2.5 flex items-center gap-3">
                    <span className="text-sm sm:text-base font-black text-stone-900 font-mono">
                      ₹{item.price}
                    </span>
                    {!item.isAvailable && (
                      <span className="text-[10px] uppercase font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        Sold Out Today
                      </span>
                    )}
                  </div>
                </div>

                {/* Optional Item Image */}
                {item.imageUrl && (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shrink-0 border border-[#E8E2D5]">
                    <img 
                      src={item.imageUrl} 
                      alt={item.name} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
