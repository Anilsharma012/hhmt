import { Category, Subcategory } from '../models/Category';
import { User } from '../models/User';
import { Package } from '../models/Package';
import { Page } from '../models/Page';
import { Banner } from '../models/Banner';
import { Blog } from '../models/Blog';

export async function seedDatabase() {
  try {
    // Seed categories
    const categoriesData = [
      { name: 'Cars', slug: 'cars', icon: 'fas fa-car' },
      { name: 'Properties', slug: 'properties', icon: 'fas fa-building' },
      { name: 'Mobiles', slug: 'mobiles', icon: 'fas fa-mobile-alt' },
      { name: 'Jobs', slug: 'jobs', icon: 'fas fa-briefcase' },
      { name: 'Fashion', slug: 'fashion', icon: 'fas fa-tshirt' },
      { name: 'Books, Sports & Hobbies', slug: 'books-sports', icon: 'fas fa-book' },
      { name: 'Bikes', slug: 'bikes', icon: 'fas fa-motorcycle' },
      { name: 'Electronics & Appliances', slug: 'electronics', icon: 'fas fa-tv' },
      { name: 'Commercial Vehicles & Spares', slug: 'commercial', icon: 'fas fa-truck' }
    ];

    const categoryDocs: Record<string, any> = {};
    for (const categoryData of categoriesData) {
      const doc = await Category.findOneAndUpdate(
        { slug: categoryData.slug },
        categoryData,
        { upsert: true, new: true }
      );
      categoryDocs[categoryData.slug] = doc;
    }

    // Seed subcategories
    const subcategoriesData = [
      // Cars subcategories
      { categorySlug: 'cars', name: 'Sedan', slug: 'sedan' },
      { categorySlug: 'cars', name: 'SUV', slug: 'suv' },
      { categorySlug: 'cars', name: 'Hatchback', slug: 'hatchback' },
      { categorySlug: 'cars', name: 'Luxury Cars', slug: 'luxury-cars' },

      // Properties subcategories
      { categorySlug: 'properties', name: 'Apartments', slug: 'apartments' },
      { categorySlug: 'properties', name: 'Houses', slug: 'houses' },
      { categorySlug: 'properties', name: 'Commercial Space', slug: 'commercial-space' },
      { categorySlug: 'properties', name: 'Land', slug: 'land' },

      // Mobiles subcategories
      { categorySlug: 'mobiles', name: 'Android', slug: 'android' },
      { categorySlug: 'mobiles', name: 'iPhone', slug: 'iphone' },
      { categorySlug: 'mobiles', name: 'Feature Phones', slug: 'feature-phones' },
      { categorySlug: 'mobiles', name: 'Tablets', slug: 'tablets' },

      // Electronics subcategories
      { categorySlug: 'electronics', name: 'Laptops', slug: 'laptops' },
      { categorySlug: 'electronics', name: 'TVs', slug: 'tvs' },
      { categorySlug: 'electronics', name: 'Refrigerators', slug: 'refrigerators' },
      { categorySlug: 'electronics', name: 'Washing Machines', slug: 'washing-machines' },
    ];

    for (const subcategoryData of subcategoriesData) {
      const category = categoryDocs[subcategoryData.categorySlug];
      if (category) {
        await Subcategory.findOneAndUpdate(
          { slug: subcategoryData.slug, categoryId: category._id },
          {
            name: subcategoryData.name,
            slug: subcategoryData.slug,
            categoryId: category._id,
            isActive: true
          },
          { upsert: true }
        );
      }
    }

    // Seed admin user
    let adminExists = await User.findOne({ email: 'admin@posttrr.com' });
    if (!adminExists) {
      adminExists = new User({
        name: 'Admin User',
        email: 'admin@posttrr.com',
        password: 'Admin@123',
        role: 'admin'
      });
      await adminExists.save();
      console.log('Admin user created: admin@posttrr.com / Admin@123');
    } else {
      adminExists.password = 'Admin@123';
      await adminExists.save();
      console.log('Admin user password reset to Admin@123');
    }

    // Seed packages
    const packagesData = [
      {
        name: 'Free',
        features: {
          featured: false,
          urgent: false,
          boostDays: 0,
          maxListings: 1
        },
        basePrice: 0
      },
      {
        name: 'Premium',
        features: {
          featured: true,
          urgent: false,
          boostDays: 3,
          maxListings: 5
        },
        basePrice: 99
      },
      {
        name: 'Featured',
        features: {
          featured: true,
          urgent: true,
          boostDays: 7,
          maxListings: 10
        },
        basePrice: 199
      }
    ];

    for (const packageData of packagesData) {
      await Package.findOneAndUpdate(
        { name: packageData.name },
        packageData,
        { upsert: true }
      );
    }

    // Seed CMS pages (About, Privacy Policy, Terms & Conditions, Contact Us)
    const pagesData = [
      {
        title: 'About Us',
        slug: 'about',
        contentHtml: '<h1>About Posttrr</h1><p>Posttrr is a community marketplace connecting buyers and sellers.</p>',
        status: 'published',
        showInFooter: true,
        footerOrder: 1,
        seoTitle: 'About Posttrr',
        seoDescription: 'Learn about Posttrr – a Facebook-like marketplace for local classifieds.'
      },
      {
        title: 'Privacy Policy',
        slug: 'privacy-policy',
        contentHtml: '<h1>Privacy Policy</h1><p>Your privacy matters to us at Posttrr.</p>',
        status: 'published',
        showInFooter: true,
        footerOrder: 2,
        seoTitle: 'Privacy Policy',
        seoDescription: 'Read Posttrr\'s privacy policy.'
      },
      {
        title: 'Terms & Conditions',
        slug: 'terms',
        contentHtml: '<h1>Terms & Conditions</h1><p>By using Posttrr, you agree to the following terms.</p>',
        status: 'published',
        showInFooter: true,
        footerOrder: 3,
        seoTitle: 'Terms & Conditions',
        seoDescription: 'Posttrr\'s terms and conditions.'
      },
      {
        title: 'Contact Us',
        slug: 'contact-us',
        contentHtml: '<h1>Contact Us</h1><p>Email: support@posttrr.com</p>',
        status: 'published',
        showInFooter: true,
        footerOrder: 4,
        seoTitle: 'Contact Posttrr',
        seoDescription: 'Get in touch with the Posttrr team.'
      }
    ];

    for (const pageData of pagesData) {
      await Page.findOneAndUpdate(
        { slug: pageData.slug },
        { ...pageData, publishedAt: new Date() },
        { upsert: true }
      );
    }

    // Seed locations
    const cities = [
      { name: 'Kolkata', slug: 'kolkata', state: 'West Bengal' },
      { name: 'Mumbai', slug: 'mumbai', state: 'Maharashtra' },
      { name: 'Chennai', slug: 'chennai', state: 'Tamil Nadu' },
      { name: 'Pune', slug: 'pune', state: 'Maharashtra' },
      { name: 'Delhi', slug: 'delhi', state: 'Delhi' }
    ];

    const cityDocs: Record<string, any> = {};
    for (const c of cities) {
      const doc = await (await import('../models/Location')).LocationCity.findOneAndUpdate({ slug: c.slug }, c, { upsert: true, new: true });
      cityDocs[c.slug] = doc;
    }

    const kolkata = cityDocs['kolkata']?._id;
    const mumbai = cityDocs['mumbai']?._id;

    const areas = [
      { cityId: kolkata, name: 'Salt Lake', slug: 'salt-lake' },
      { cityId: kolkata, name: 'New Town', slug: 'new-town' },
      { cityId: kolkata, name: 'Howrah', slug: 'howrah' },
      { cityId: mumbai, name: 'Andheri', slug: 'andheri' },
      { cityId: mumbai, name: 'Bandra', slug: 'bandra' },
    ];

    for (const a of areas) {
      if (!a.cityId) continue;
      await (await import('../models/Location')).LocationArea.findOneAndUpdate({ slug: a.slug, cityId: a.cityId }, a, { upsert: true });
    }

    // Seed some price rules
    const premium = await (await import('../models/Package')).Package.findOne({ name: 'Premium' });
    const featured = await (await import('../models/Package')).Package.findOne({ name: 'Featured' });
    if (premium && kolkata) {
      await (await import('../models/Package')).PriceRule.findOneAndUpdate(
        { scope: 'city', refId: kolkata, packageId: premium._id },
        { scope: 'city', refId: kolkata, packageId: premium._id, price: premium.basePrice + 20 },
        { upsert: true }
      );
    }
    if (featured && mumbai) {
      await (await import('../models/Package')).PriceRule.findOneAndUpdate(
        { scope: 'city', refId: mumbai, packageId: featured._id },
        { scope: 'city', refId: mumbai, packageId: featured._id, price: featured.basePrice + 50 },
        { upsert: true }
      );
    }

    // Seed a seller and demo listings
    let seller = await User.findOne({ email: 'seller@posttrr.com' });
    if (!seller) {
      seller = new User({ name: 'Seller One', email: 'seller@posttrr.com', password: 'Seller@123', role: 'seller' });
      await seller.save();
      console.log('Seller user created: seller@posttrr.com / Seller@123');
    } else {
      seller.password = 'Seller@123';
      await seller.save();
      console.log('Seller user password reset to Seller@123');
    }
    const firstCat = await Category.findOne();
    if (seller && firstCat) {
      const { Listing } = await import('../models/Listing');
      const existingCount = await Listing.countDocuments({ userId: seller._id });
      if (existingCount === 0) {
        const demos = [
          { title: 'Used Car - Good Condition', price: 250000, description: 'Well maintained car', images: [], location: { city: 'Kolkata', state: 'West Bengal' } },
          { title: 'Apartment for Rent', price: 15000, description: '2BHK near metro', images: [], location: { city: 'Mumbai', state: 'Maharashtra' } },
          { title: 'iPhone 13', price: 45000, description: 'Like new', images: [], location: { city: 'Delhi', state: 'Delhi' } }
        ];
        let index = 0;
        for (const d of demos) {
          const isFeatured = index === 0;
          await Listing.create({ userId: seller._id, title: d.title, slug: d.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'), description: d.description, price: d.price, categoryId: firstCat._id, images: d.images, location: d.location, status: 'active', isFeatured });
          index++;
        }
      }
    }

    // Seed default FAQs
    try {
      const { Faq } = await import('../models/Faq');
      const existing = await Faq.countDocuments();
      if (existing === 0) {
        const faqs = [
          { question: 'How do I post an ad?', answer: '<p>Go to Post Ad and fill the form.</p>', status: 'active', sortOrder: 1 },
          { question: 'How do I contact a seller?', answer: '<p>Use the chat feature on listing page.</p>', status: 'active', sortOrder: 2 },
          { question: 'Is there a listing fee?', answer: '<p>Basic listings are free; premium options available.</p>', status: 'active', sortOrder: 3 },
          { question: 'How to report a suspicious ad?', answer: '<p>Click Report on the listing and choose a reason.</p>', status: 'active', sortOrder: 4 },
        ];
        for (const f of faqs) await Faq.create(f);
      }
    } catch {}

    // Seed default Blog post
    try {
      const blogCount = await Blog.countDocuments();
      if (blogCount === 0) {
        await Blog.create({
          title: 'Posttrr.com',
          slug: 'posttrrcom',
          imageUrl: 'https://picsum.photos/600/400',
          tags: ['Welcome'],
          descriptionHtml: '<h1>Welcome to Posttrr</h1><p>Posttrr.com is your marketplace for classifieds. Buy, sell, and connect with your community.</p><p><a href="/listings">Browse listings</a> or <strong>post your ad</strong> now.</p>',
          status: 'published',
          publishedAt: new Date(),
        });
      }
    } catch {}

    // Seed a homepage banner
    await Banner.findOneAndUpdate(
      { position: 'homepage', title: 'Homepage Hero' },
      { title: 'Homepage Hero', imageUrl: 'https://picsum.photos/1200/300', linkUrl: '/listings', position: 'homepage', isActive: true },
      { upsert: true }
    );

    // Seed a buyer user and a chat thread
    let buyer = await User.findOne({ email: 'buyer@posttrr.com' });
    if (!buyer) {
      buyer = new User({ name: 'Buyer User', email: 'buyer@posttrr.com', password: 'buyer123', role: 'user' });
      await buyer.save();
    }
    try {
      const { ChatThread, ChatMessage } = await import('../models/Chat');
      const { Listing } = await import('../models/Listing');
      const anyListing = await Listing.findOne({});
      if (anyListing && buyer) {
        let thread = await ChatThread.findOne({ listingId: anyListing._id, buyerId: buyer._id, sellerId: anyListing.userId });
        if (!thread) {
          thread = new ChatThread({ listingId: anyListing._id, buyerId: buyer._id, sellerId: anyListing.userId });
          await thread.save();
          await ChatMessage.create({ threadId: thread._id, senderId: buyer._id, text: 'Is this still available?' });
          await ChatMessage.create({ threadId: thread._id, senderId: anyListing.userId, text: 'Yes, it is available.' });
          await ChatMessage.create({ threadId: thread._id, senderId: buyer._id, text: 'Can you share more photos?' });
          await ChatMessage.create({ threadId: thread._id, senderId: anyListing.userId, text: 'Sure, uploading now.' });
          await ChatThread.findByIdAndUpdate(thread._id, { lastMessageAt: new Date(), lastMessage: 'Sure, uploading now.', sellerUnread: 0, buyerUnread: 2 });
        }
      }
    } catch {}

    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Seed error:', error);
  }
}
