import React, { useState, useEffect } from 'react';
import { Search, Flame, Radio, UtensilsCrossed, ArrowLeft } from 'lucide-react';
import type { Stand, Business, MenuCategory, MenuItem } from '../types';
import { api } from '../services/api';

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
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Top Mobile Sticky Header */}
      <div className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {onNavigateHome && (
            <button 
              onClick={onNavigateHome}
              className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <h1 className="text-sm font-bold text-white truncate max-w-[200px]">
              {business?.name || 'Digital Menu'}
            </h1>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <Radio className={`w-3 h-3 ${isNfc ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span>Stand #{stand.slug} {stand.customLabel ? `• ${stand.customLabel}` : ''}</span>
            </div>
          </div>
        </div>

        {/* Veg Only Toggle */}
        <button
          onClick={() => setFilterVegOnly(!filterVegOnly)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
            filterVegOnly
              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
              : 'bg-slate-900 border-slate-700 text-slate-400'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-sm border border-emerald-500 flex items-center justify-center p-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </span>
          <span>Veg</span>
        </button>
      </div>

      {/* Main Container */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        {/* Restaurant Hero Card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-900/60 border border-slate-800 rounded-3xl p-5 mb-5 shadow-lg flex items-center gap-4">
          {business?.logoUrl ? (
            <img 
              src={business.logoUrl} 
              alt={business.name} 
              className="w-16 h-16 rounded-2xl object-cover border border-slate-700 shrink-0" 
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center text-white text-xl font-bold shrink-0">
              <UtensilsCrossed className="w-8 h-8" />
            </div>
          )}
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
              {business?.category || 'Dining'} • Contactless Digital Menu
            </div>
            <h2 className="text-xl font-extrabold text-white truncate">
              {business?.name || 'Restaurant Menu'}
            </h2>
            {business?.address && (
              <p className="text-xs text-slate-400 truncate mt-0.5">
                {business.address}
              </p>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dishes, drinks, biryanis..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-2xl text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Category Pills Slider */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none mb-5">
          <button
            onClick={() => setActiveCategoryId('all')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeCategoryId === 'all'
                ? 'bg-emerald-600 text-white shadow-glow'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            All Items
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategoryId(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeCategoryId === cat.id
                  ? 'bg-emerald-600 text-white shadow-glow'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Items List */}
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            Loading fresh menu...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-12 text-center bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6">
            <UtensilsCrossed className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-300 font-medium text-sm">No menu items match your search.</p>
            <p className="text-slate-500 text-xs mt-1">Try resetting the veg filter or searching for another dish.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4">
            {filteredItems.map((item) => (
              <div 
                key={item.id} 
                className={`bg-slate-900/70 border rounded-2xl p-4 flex gap-4 transition-all ${
                  item.isAvailable ? 'border-slate-800 hover:border-slate-700' : 'border-slate-800/40 opacity-60'
                }`}
              >
                {/* Item Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {/* Standard Indian Veg/Non-Veg symbol */}
                    <span 
                      className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center p-0.5 shrink-0 ${
                        item.isVeg ? 'border-emerald-500' : 'border-rose-500'
                      }`}
                      title={item.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    </span>

                    {item.isSpicy && (
                      <span className="flex items-center gap-0.5 text-[10px] text-amber-400">
                        <Flame className="w-3 h-3 fill-amber-400" />
                        <span>Spicy</span>
                      </span>
                    )}

                    {item.tags?.map((tag) => (
                      <span key={tag} className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-white leading-snug">
                    {item.name}
                  </h3>

                  {item.description && (
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  )}

                  <div className="mt-2.5 flex items-center gap-3">
                    <span className="text-sm sm:text-base font-extrabold text-emerald-400">
                      ₹{item.price}
                    </span>
                    {!item.isAvailable && (
                      <span className="text-[10px] uppercase font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded">
                        Sold Out Today
                      </span>
                    )}
                  </div>
                </div>

                {/* Optional Item Image */}
                {item.imageUrl && (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shrink-0 border border-slate-800">
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
