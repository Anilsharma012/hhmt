import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';

export function Footer() {
  const { data: ver } = useQuery({ queryKey: ['/api/pages/version'] });
  const { data: footerPages } = useQuery({ queryKey: ['/api/pages', { footer: true, v: (ver as any)?.version || 0 }], enabled: !!ver });
  const pathForSlug = (slug: string) => {
    const map: Record<string, string> = {
      'about': '/about',
      'privacy-policy': '/privacy-policy',
      'terms': '/terms',
      'contact-us': '/contact-us',
    };
    return map[slug] || `/p/${slug}`;
  };

  return (
    <footer className="bg-[#1a365d] text-white mt-12">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Company Info */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center space-x-2 mb-6">
              <span className="text-white text-2xl font-bold" data-testid="text-footer-logo">POSTTRR</span>
            </div>
            <p className="text-white/90 text-sm mb-6 leading-relaxed" data-testid="text-footer-description">
              Your trusted marketplace for buying and selling everything from cars to electronics. Connect with millions of buyers and sellers.
            </p>

            {/* Social Media */}
            <div className="flex space-x-3">
              <a href="#" className="w-9 h-9 bg-[#4285f4] hover:bg-[#3367d6] rounded-lg flex items-center justify-center transition-colors">
                <span className="text-white text-sm font-bold">f</span>
              </a>
              <a href="#" className="w-9 h-9 bg-[#1da1f2] hover:bg-[#0d8bd9] rounded-lg flex items-center justify-center transition-colors">
                <span className="text-white text-sm font-bold">t</span>
              </a>
              <a href="#" className="w-9 h-9 bg-[#ff0000] hover:bg-[#e60000] rounded-lg flex items-center justify-center transition-colors">
                <span className="text-white text-sm font-bold">yt</span>
              </a>
              <a href="#" className="w-9 h-9 bg-[#e4405f] hover:bg-[#d62d4a] rounded-lg flex items-center justify-center transition-colors">
                <span className="text-white text-sm font-bold">ig</span>
              </a>
            </div>
          </div>

          {/* Browse Categories */}
          <div>
            <h3 className="text-white font-semibold mb-4" data-testid="text-footer-categories-title">Browse Categories</h3>
            <ul className="space-y-3 text-sm text-white/80">
              <li><Link to="/category/cars" className="hover:text-white transition-colors" data-testid="link-category-cars">Cars</Link></li>
              <li><Link to="/category/properties" className="hover:text-white transition-colors" data-testid="link-category-properties">Properties</Link></li>
              <li><Link to="/category/mobiles" className="hover:text-white transition-colors" data-testid="link-category-mobiles">Mobiles</Link></li>
              <li><Link to="/category/jobs" className="hover:text-white transition-colors" data-testid="link-category-jobs">Jobs</Link></li>
              <li><Link to="/category/fashion" className="hover:text-white transition-colors" data-testid="link-category-fashion">Fashion</Link></li>
              <li><Link to="/category/bikes" className="hover:text-white transition-colors" data-testid="link-category-bikes">Bikes</Link></li>
              <li><Link to="/category/electronics" className="hover:text-white transition-colors" data-testid="link-category-electronics">Electronics</Link></li>
            </ul>
          </div>

          {/* Trending Searches */}
          <div>
            <h3 className="text-white font-semibold mb-4" data-testid="text-footer-trending-title">Trending Searches</h3>
            <ul className="space-y-3 text-sm text-white/80">
              <li><a href="#" className="hover:text-white transition-colors">iPhone</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Honda City</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Dell Laptop</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Royal Enfield</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Flat for Sale</a></li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4" data-testid="text-footer-quicklinks-title">Quick Links</h3>
            <ul className="space-y-3 text-sm text-white/80">
              <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-white transition-colors">How to sell fast</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Advertise with us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Business Solutions</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Promote your ad</a></li>
            </ul>
          </div>

          {/* About & Legal */}
          <div>
            <h3 className="text-white font-semibold mb-4" data-testid="text-footer-support-title">About & Legal</h3>
            <ul className="space-y-3 text-sm text-white/80">
              {(() => {
                const [faqsFooter, setFaqsFooter] = [null, null] as any; // placeholder for hook-less static
                return null;
              })()}
              {(footerPages || []).map((p: any) => (
                <li key={p.slug}>
                  <Link to={pathForSlug(p.slug)} className="hover:text-white transition-colors">
                    {p.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/20 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between">
          <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-8">
            <p className="text-white/80 text-sm" data-testid="text-footer-copyright">
              © 2024 Posttrr Technology Pvt Ltd. All rights reserved.
            </p>
            <div className="flex items-center space-x-4 text-sm">
              <span className="text-white/60">Follow us:</span>
              <div className="flex space-x-2">
                <a href="#" className="text-white/80 hover:text-white transition-colors">Facebook</a>
                <span className="text-white/40">•</span>
                <a href="#" className="text-white/80 hover:text-white transition-colors">Twitter</a>
                <span className="text-white/40">•</span>
                <a href="#" className="text-white/80 hover:text-white transition-colors">LinkedIn</a>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <span className="text-white/80 text-sm">Download App:</span>
            <a href="#" className="bg-[#4285f4] hover:bg-[#3367d6] px-4 py-2 rounded-lg transition-colors flex items-center space-x-2">
              <span className="text-white text-xs font-medium">📱 Play Store</span>
            </a>
            <a href="#" className="bg-[#4285f4] hover:bg-[#3367d6] px-4 py-2 rounded-lg transition-colors flex items-center space-x-2">
              <span className="text-white text-xs font-medium">🍎 App Store</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
