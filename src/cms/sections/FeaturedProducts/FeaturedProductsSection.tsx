import React, { useState, useEffect } from 'react';
import { EditableText } from '../../components/EditableText';
import { useEditor } from '../../components/EditorContext';
import { ShoppingCart, ListPlus } from 'lucide-react';
import type { FeaturedProductsProps, DBProduct } from '../../types';

interface FeaturedProductsSectionProps extends FeaturedProductsProps {
  id: string;
  products?: DBProduct[];
}

export const FeaturedProductsSection: React.FC<FeaturedProductsSectionProps> = ({
  id,
  title,
  subtitle = '',
  productIds,
  products: initialProducts,
}) => {
  const { isAdmin, openProductPicker, onUpdateProps } = useEditor();
  const [allProducts, setAllProducts] = useState<DBProduct[]>(initialProducts || []);
  const [loading, setLoading] = useState(initialProducts ? false : true);

  // Self-heal: Fetch products client-side if they weren't provided (e.g. inside the Admin Editor)
  useEffect(() => {
    if (initialProducts) {
      setAllProducts(initialProducts);
      setLoading(false);
      return;
    }

    let active = true;
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products');
        if (!res.ok) throw new Error('Failed to fetch products');
        const data = await res.json() as DBProduct[];
        if (active) {
          setAllProducts(data);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error loading products for catalog section:', err);
        if (active) setLoading(false);
      }
    };

    fetchProducts();
    return () => {
      active = false;
    };
  }, [initialProducts]);

  const handleManageSelection = (e: React.MouseEvent) => {
    if (!isAdmin) return;
    e.stopPropagation();
    if (openProductPicker && onUpdateProps) {
      openProductPicker(productIds, (selectedIds) => {
        onUpdateProps(id, { productIds: selectedIds });
      });
    }
  };

  // Filter products based on selected productIds
  const displayedProducts = allProducts.filter((p) => productIds.includes(p.id));

  // Sorting to match the productIds order
  const sortedProducts = [...displayedProducts].sort((a, b) => {
    return productIds.indexOf(a.id) - productIds.indexOf(b.id);
  });

  return (
    <section className="py-20 px-6 bg-slate-950 text-white relative">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="max-w-2xl">
            <EditableText
              sectionId={id}
              propKey="title"
              value={title}
              tagName="h2"
              className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-2"
            />
            <EditableText
              sectionId={id}
              propKey="subtitle"
              value={subtitle || ''}
              tagName="p"
              className="text-slate-400 text-base md:text-lg"
              placeholder="Click to edit subtitle..."
            />
          </div>

          {isAdmin && (
            <button
              onClick={handleManageSelection}
              className="flex items-center gap-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-semibold px-4 py-2 rounded-xl transition-all self-start md:self-end"
            >
              <ListPlus className="w-4 h-4 text-indigo-400" />
              Manage Product Selection
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse bg-slate-900 border border-slate-800 rounded-2xl h-[380px]" />
            ))}
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="text-center py-16 bg-slate-900 border border-dashed border-slate-800 rounded-3xl">
            <p className="text-slate-500 text-sm mb-4">No products selected in catalog.</p>
            {isAdmin && (
              <button
                onClick={handleManageSelection}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all"
              >
                Select Games
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {sortedProducts.map((product) => (
              <div 
                key={product.id}
                className="group relative bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(99,102,241,0.15)] flex flex-col"
              >
                {/* Category Badge */}
                <span className="absolute top-3 left-3 z-10 bg-slate-950/80 backdrop-blur-md text-indigo-400 border border-indigo-500/20 text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md">
                  {product.category}
                </span>

                {/* Product Image */}
                <div className="aspect-[4/3] bg-slate-950 overflow-hidden relative">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80" />
                </div>

                {/* Info */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-white group-hover:text-indigo-400 transition-colors line-clamp-1 mb-2">
                      {product.name}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
                      {product.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-800/60">
                    <span className="text-xl font-black text-white">
                      ${product.price.toFixed(2)}
                    </span>
                    <button
                      onClick={() => alert(`Added ${product.name} to cart (Demo Only)!`)}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white p-2.5 rounded-xl transition-all shadow-md active:scale-95"
                    >
                      <ShoppingCart className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
