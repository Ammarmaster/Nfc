import React, { useState, useEffect } from 'react';
import { 
  UtensilsCrossed, 
  Plus, 
  Edit3, 
  Trash2, 
  Flame, 
  Smartphone,
  Layers,
  X
} from 'lucide-react';
import type { Business, MenuCategory, MenuItem } from '../types';
import { api } from '../services/api';
import { sounds } from '../utils/audio';

interface MenuManagerProps {
  businesses: Business[];
  onOpenCustomerMenu: (businessId: string) => void;
}

export const MenuManager: React.FC<MenuManagerProps> = ({
  businesses,
  onOpenCustomerMenu,
}) => {
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>(businesses[0]?.id || '');
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Category Modal
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [catName, setCatName] = useState('');
  const [editingCat, setEditingCat] = useState<MenuCategory | null>(null);

  // Item Modal
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemCategoryId, setItemCategoryId] = useState('');
  const [itemPrice, setItemPrice] = useState<number>(250);
  const [itemDesc, setItemDesc] = useState('');
  const [itemIsVeg, setItemIsVeg] = useState(true);
  const [itemIsSpicy, setItemIsSpicy] = useState(false);
  const [itemIsAvailable, setItemIsAvailable] = useState(true);
  const [itemImageUrl, setItemImageUrl] = useState('');
  const [itemTags, setItemTags] = useState('');

  const loadMenu = async (bizId: string) => {
    if (!bizId) return;
    setLoading(true);
    const [cats, menuItems] = await Promise.all([
      api.getMenuCategories(bizId),
      api.getMenuItems(bizId),
    ]);
    setCategories(cats);
    setItems(menuItems);
    setLoading(false);
  };

  useEffect(() => {
    if (selectedBusinessId) {
      loadMenu(selectedBusinessId);
    }
  }, [selectedBusinessId]);

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim() || !selectedBusinessId) return;
    sounds.playTap();

    const payload: MenuCategory = {
      id: editingCat ? editingCat.id : `cat_${Date.now()}`,
      businessId: selectedBusinessId,
      name: catName.trim(),
      displayOrder: editingCat ? editingCat.displayOrder : categories.length + 1,
      isActive: true,
      createdAt: editingCat ? editingCat.createdAt : new Date().toISOString(),
    };

    await api.saveMenuCategory(payload);
    setIsCatModalOpen(false);
    loadMenu(selectedBusinessId);
  };

  const handleDeleteCategory = async (cat: MenuCategory) => {
    sounds.playTap();
    const confirm = window.confirm(`Delete category "${cat.name}" and all its items?`);
    if (!confirm) return;
    await api.deleteMenuCategory(cat.id);
    loadMenu(selectedBusinessId);
  };

  const openAddItemModal = (catId?: string) => {
    sounds.playTap();
    setEditingItem(null);
    setItemName('');
    setItemCategoryId(catId || categories[0]?.id || '');
    setItemPrice(250);
    setItemDesc('');
    setItemIsVeg(true);
    setItemIsSpicy(false);
    setItemIsAvailable(true);
    setItemImageUrl('');
    setItemTags('');
    setIsItemModalOpen(true);
  };

  const openEditItemModal = (item: MenuItem) => {
    sounds.playTap();
    setEditingItem(item);
    setItemName(item.name);
    setItemCategoryId(item.categoryId);
    setItemPrice(item.price);
    setItemDesc(item.description || '');
    setItemIsVeg(item.isVeg);
    setItemIsSpicy(item.isSpicy || false);
    setItemIsAvailable(item.isAvailable);
    setItemImageUrl(item.imageUrl || '');
    setItemTags(item.tags?.join(', ') || '');
    setIsItemModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim() || !itemCategoryId || !selectedBusinessId) return;
    sounds.playTap();

    const tagsArray = itemTags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const payload: MenuItem = {
      id: editingItem ? editingItem.id : `itm_${Date.now()}`,
      categoryId: itemCategoryId,
      businessId: selectedBusinessId,
      name: itemName.trim(),
      description: itemDesc.trim() || undefined,
      price: itemPrice,
      isVeg: itemIsVeg,
      isSpicy: itemIsSpicy,
      isAvailable: itemIsAvailable,
      imageUrl: itemImageUrl.trim() || undefined,
      tags: tagsArray.length > 0 ? tagsArray : undefined,
      displayOrder: editingItem ? editingItem.displayOrder : items.length + 1,
      createdAt: editingItem ? editingItem.createdAt : new Date().toISOString(),
    };

    await api.saveMenuItem(payload);
    setIsItemModalOpen(false);
    loadMenu(selectedBusinessId);
  };

  const handleDeleteItem = async (item: MenuItem) => {
    sounds.playTap();
    if (!window.confirm(`Delete "${item.name}"?`)) return;
    await api.deleteMenuItem(item.id);
    loadMenu(selectedBusinessId);
  };

  const handleToggleItemAvailability = async (item: MenuItem) => {
    sounds.playTap();
    await api.saveMenuItem({
      ...item,
      isAvailable: !item.isAvailable,
    });
    loadMenu(selectedBusinessId);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Business Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 milky-glass border border-[#E8E2D5] rounded-3xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-100 text-[#B3801A] border border-amber-300">
              <UtensilsCrossed className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
              Hosted Digital Menu Builder
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-xl">
            Create lightweight, mobile-optimized contactless menus in INR (₹) with Veg / Non-Veg food indicators. Instant updates without changing printed QR codes.
          </p>
        </div>

        {/* Business Selector & Preview */}
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedBusinessId}
            onChange={(e) => setSelectedBusinessId(e.target.value)}
            className="px-3.5 py-2.5 bg-white border border-[#DCD4C5] rounded-xl text-xs font-bold text-stone-900 focus:outline-none focus:border-[#C59B27] shadow-sm"
          >
            {businesses.map(b => (
              <option key={b.id} value={b.id}>{b.name} ({b.category})</option>
            ))}
          </select>

          <button
            onClick={() => onOpenCustomerMenu(selectedBusinessId)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-stone-50 text-stone-800 text-xs font-bold border border-[#DCD4C5] transition-colors shadow-sm"
          >
            <Smartphone className="w-4 h-4 text-[#B3801A]" />
            <span>Mobile Preview</span>
          </button>
        </div>
      </div>

      {businesses.length === 0 ? (
        <div className="milky-card rounded-3xl p-12 text-center border border-[#E8E2D5] bg-white shadow-sm">
          <UtensilsCrossed className="w-12 h-12 text-stone-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-stone-900 mb-1">No Businesses Available</h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            Please register your first business under the <strong>Businesses</strong> tab before creating hosted digital menus.
          </p>
        </div>
      ) : (
        /* Main Menu Layout: Categories and Items */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Categories Sidebar (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="milky-card rounded-3xl p-5 border border-[#E8E2D5] bg-white shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#B3801A]" />
                  <span>Menu Categories ({categories.length})</span>
                </h2>
                <button
                  onClick={() => {
                    setEditingCat(null);
                    setCatName('');
                    setIsCatModalOpen(true);
                  }}
                  className="p-1.5 rounded-lg bg-amber-100 text-[#B3801A] hover:bg-amber-200 border border-amber-300"
                  title="Add Category"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                {categories.map((cat) => {
                  const count = items.filter(i => i.categoryId === cat.id).length;
                  return (
                    <div
                      key={cat.id}
                      className="p-3 bg-[#FAF8F5] border border-[#E8E2D5] rounded-2xl flex items-center justify-between group hover:border-[#D4AF37] transition-all"
                    >
                      <div>
                        <h3 className="text-xs font-bold text-stone-900">{cat.name}</h3>
                        <span className="text-[10px] text-stone-500">{count} items</span>
                      </div>

                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                        <button
                          onClick={() => openAddItemModal(cat.id)}
                          className="p-1 rounded-md text-[#B3801A] hover:bg-white"
                          title="Add dish to category"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingCat(cat);
                            setCatName(cat.name);
                            setIsCatModalOpen(true);
                          }}
                          className="p-1 rounded-md text-stone-500 hover:text-stone-900 hover:bg-white"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat)}
                          className="p-1 rounded-md text-rose-500 hover:bg-white"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Menu Items Table & Grid (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="milky-card rounded-3xl p-6 border border-[#E8E2D5] bg-white shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-stone-900">Dishes & Menu Items</h2>
                  <p className="text-xs text-stone-500">Manage pricing, descriptions, and real-time stock availability.</p>
                </div>

                <button
                  onClick={() => openAddItemModal()}
                  disabled={categories.length === 0}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#C59B27] text-stone-950 text-xs font-extrabold shadow-md hover:brightness-105 active:scale-95 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Item</span>
                </button>
              </div>

              {items.length === 0 ? (
                <div className="py-12 text-center text-stone-500 text-xs">
                  No items in this menu yet. Click "Add Item" or create a category first!
                </div>
              ) : (
                <div className="grid gap-3">
                  {items.map((item) => {
                    const cat = categories.find(c => c.id === item.categoryId);
                    return (
                      <div
                        key={item.id}
                        className={`p-4 bg-[#FAF8F5] border rounded-2xl flex items-center justify-between gap-4 transition-all ${
                          item.isAvailable ? 'border-[#E8E2D5]' : 'border-[#E8E2D5]/50 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Veg / Non-Veg Icon */}
                          <span 
                            className={`w-4 h-4 rounded-sm border flex items-center justify-center p-0.5 shrink-0 ${
                              item.isVeg ? 'border-emerald-600' : 'border-rose-600'
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${item.isVeg ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                          </span>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold text-stone-900 truncate">{item.name}</h3>
                              {item.isSpicy && (
                                <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0 fill-amber-500" />
                              )}
                              <span className="text-[10px] text-stone-600 px-2 py-0.5 rounded bg-white border border-[#DCD4C5]">
                                {cat?.name || 'Item'}
                              </span>
                            </div>

                            {item.description && (
                              <p className="text-xs text-stone-500 truncate mt-0.5 max-w-md">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Price & Actions */}
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-sm font-black text-stone-900 font-mono">
                            ₹{item.price}
                          </span>

                          {/* Availability Toggle */}
                          <button
                            onClick={() => handleToggleItemAvailability(item)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                              item.isAvailable 
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                                : 'bg-rose-100 text-rose-800 border border-rose-300'
                            }`}
                          >
                            {item.isAvailable ? 'In Stock' : 'Sold Out'}
                          </button>

                          <button
                            onClick={() => openEditItemModal(item)}
                            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-white"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteItem(item)}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-white"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#FAF8F5] border border-[#E8E2D5] rounded-t-[2.2rem] sm:rounded-3xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-stone-900 mb-4">
              {editingCat ? 'Edit Category' : 'Create Menu Category'}
            </h3>
            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="e.g. Claypot Dum Biryanis"
                  className="w-full px-3 py-2 bg-white border border-[#DCD4C5] rounded-xl text-xs text-stone-900 focus:outline-none focus:border-[#C59B27]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-white border border-[#DCD4C5] text-xs text-stone-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#C59B27] text-stone-950 text-xs font-extrabold shadow-sm"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Item Modal */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
          <div className="bg-[#FAF8F5] border border-[#E8E2D5] rounded-t-[2.2rem] sm:rounded-3xl max-w-lg w-full p-6 shadow-2xl my-0 sm:my-8">
            <h3 className="text-base font-bold text-stone-900 mb-4">
              {editingItem ? 'Edit Dish Details' : 'Add New Menu Item'}
            </h3>
            <form onSubmit={handleSaveItem} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Item / Dish Name *</label>
                  <input
                    type="text"
                    required
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="e.g. Murgh Tikka Angara"
                    className="w-full px-3 py-2 bg-white border border-[#DCD4C5] rounded-xl text-stone-900 focus:outline-none focus:border-[#C59B27]"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Category *</label>
                  <select
                    value={itemCategoryId}
                    onChange={(e) => setItemCategoryId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#DCD4C5] rounded-xl text-stone-900 focus:outline-none focus:border-[#C59B27]"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Price (₹ INR) *</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={itemPrice}
                    onChange={(e) => setItemPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white border border-[#DCD4C5] rounded-xl text-stone-900 font-bold focus:outline-none focus:border-[#C59B27]"
                  />
                </div>
                <div className="flex items-center gap-4 pt-6">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-stone-800">
                    <input
                      type="checkbox"
                      checked={itemIsVeg}
                      onChange={(e) => setItemIsVeg(e.target.checked)}
                      className="w-4 h-4 accent-emerald-600 rounded"
                    />
                    <span>Vegetarian (Green Dot)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-stone-800">
                    <input
                      type="checkbox"
                      checked={itemIsSpicy}
                      onChange={(e) => setItemIsSpicy(e.target.checked)}
                      className="w-4 h-4 accent-amber-500 rounded"
                    />
                    <span>Spicy</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">Dish Description</label>
                <textarea
                  rows={2}
                  value={itemDesc}
                  onChange={(e) => setItemDesc(e.target.value)}
                  placeholder="e.g. Tender boneless chicken chunks marinated in spicy Kashmiri chili yogurt paste..."
                  className="w-full px-3 py-2 bg-white border border-[#DCD4C5] rounded-xl text-stone-900 focus:outline-none focus:border-[#C59B27]"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">Dish Photo URL (Optional)</label>
                <input
                  type="url"
                  value={itemImageUrl}
                  onChange={(e) => setItemImageUrl(e.target.value)}
                  placeholder="https://.../dish.jpg"
                  className="w-full px-3 py-2 bg-white border border-[#DCD4C5] rounded-xl text-stone-900 focus:outline-none focus:border-[#C59B27]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#EFEAE1]">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white border border-[#DCD4C5] text-stone-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#C59B27] text-stone-950 font-extrabold shadow-md hover:brightness-105 active:scale-95"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
