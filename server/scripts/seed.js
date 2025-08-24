const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import models
const User = require('../src/models/User');
const Category = require('../src/models/Category');
const Service = require('../src/models/Service');
const Business = require('../src/models/Business');

// Enhanced sample data with Hebrew support
const sampleCategories = [
  {
    name: 'מסעדות ובתי קפה',
    nameEn: 'Restaurants & Cafes',
    description: 'מסעדות, בתי קפה, ברים ומועדוני לילה',
    descriptionEn: 'Restaurants, cafes, bars and nightclubs',
    icon: '🍽️',
    active: true,
    sortOrder: 1
  },
  {
    name: 'בריאות ורפואה',
    nameEn: 'Health & Medicine',
    description: 'רופאים, מרפאות, בתי חולים ובתי מרקחת',
    descriptionEn: 'Doctors, clinics, hospitals and pharmacies',
    icon: '🏥',
    active: true,
    sortOrder: 2
  },
  {
    name: 'קניות וקניונים',
    nameEn: 'Shopping & Malls',
    description: 'חנויות, קניונים, שווקים ומרכזי קניות',
    descriptionEn: 'Shops, malls, markets and shopping centers',
    icon: '🛍️',
    active: true,
    sortOrder: 3
  },
  {
    name: 'רכב ותחבורה',
    nameEn: 'Automotive & Transport',
    description: 'מוסכים, חברות השכרת רכב ותחבורה ציבורית',
    descriptionEn: 'Garages, car rental companies and public transport',
    icon: '🚗',
    active: true,
    sortOrder: 4
  },
  {
    name: 'חינוך והכשרה',
    nameEn: 'Education & Training',
    description: 'בתי ספר, אוניברסיטאות, קורסים והכשרות מקצועיות',
    descriptionEn: 'Schools, universities, courses and professional training',
    icon: '🎓',
    active: true,
    sortOrder: 5
  },
  {
    name: 'בית וגן',
    nameEn: 'Home & Garden',
    description: 'ריהוט, עיצוב פנים, גינון ומוצרים בית',
    descriptionEn: 'Furniture, interior design, gardening and home products',
    icon: '🏠',
    active: true,
    sortOrder: 6
  },
  {
    name: 'טכנולוגיה ומידע',
    nameEn: 'Technology & IT',
    description: 'חברות הייטק, שירותי מחשב ותקשורת',
    descriptionEn: 'High-tech companies, computer services and communications',
    icon: '💻',
    active: true,
    sortOrder: 7
  },
  {
    name: 'ספורט וכושר',
    nameEn: 'Sports & Fitness',
    description: 'מכוני כושר, בריכות שחייה ופעילויות ספורט',
    descriptionEn: 'Gyms, swimming pools and sports activities',
    icon: '🏃‍♂️',
    active: true,
    sortOrder: 8
  },
  {
    name: 'יופי וטיפוח',
    nameEn: 'Beauty & Wellness',
    description: 'מכוני יופי, מספרות, ספא וטיפולים אסתטיים',
    descriptionEn: 'Beauty salons, hair salons, spas and aesthetic treatments',
    icon: '💄',
    active: true,
    sortOrder: 9
  },
  {
    name: 'משפטים ועסקים',
    nameEn: 'Legal & Business',
    description: 'עורכי דין, רואי חשבון, יועצים עסקיים',
    descriptionEn: 'Lawyers, accountants, business consultants',
    icon: '⚖️',
    active: true,
    sortOrder: 10
  }
];

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zezman');
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

// Seed database
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Service.deleteMany({}),
      Business.deleteMany({})
    ]);
    console.log('🗑️  Cleared existing data');
    
    // Create admin user
    const adminUser = new User({
      email: 'admin@zezman.com',
      password: 'Admin123!',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      is_verified: true,
      authProvider: 'local'
    });
    await adminUser.save();
    console.log('👤 Created admin user');
    
    // Create categories first
    const categories = await Category.insertMany(sampleCategories);
    console.log(`📂 Created ${categories.length} categories`);
    
    // Create services with proper categoryId assignments
    const sampleServices = [
      {
        name: 'שירותי דיור',
        nameEn: 'Dine-in Service',
        description: 'ארוחות במקום עם שירות מלא',
        descriptionEn: 'Full-service dining on premises',
        categoryId: categories[0]._id, // Restaurants & Cafes
        active: true,
        sortOrder: 1
      },
      {
        name: 'ארוחה להזמנה',
        nameEn: 'Takeaway',
        description: 'הכנת מזון לאיסוף עצמי',
        descriptionEn: 'Food preparation for self-pickup',
        categoryId: categories[0]._id, // Restaurants & Cafes
        active: true,
        sortOrder: 2
      },
      {
        name: 'משלוחים',
        nameEn: 'Delivery',
        description: 'שירות משלוחים עד הבית',
        descriptionEn: 'Home delivery service',
        categoryId: categories[0]._id, // Restaurants & Cafes
        active: true,
        sortOrder: 3
      },
      {
        name: 'ייעוץ אישי',
        nameEn: 'Personal Consultation',
        description: 'ייעוץ מקצועי אישי',
        descriptionEn: 'Personal professional consultation',
        categoryId: categories[6]._id, // Technology & IT
        active: true,
        sortOrder: 4
      },
      {
        name: 'שירותים מקוונים',
        nameEn: 'Online Services',
        description: 'שירותים דיגיטליים ומקוונים',
        descriptionEn: 'Digital and online services',
        categoryId: categories[6]._id, // Technology & IT
        active: true,
        sortOrder: 5
      }
    ];
    
    const services = await Service.insertMany(sampleServices);
    console.log(`🔧 Created ${services.length} services`);
    
    // Create businesses with proper references
    const sampleBusinesses = [
      {
        name: 'קפה מרכזי',
        nameEn: 'Café Central',
        address: 'רחוב הרצל 123, תל אביב',
        addressEn: '123 Herzl Street, Tel Aviv',
        location: {
          type: 'Point',
          coordinates: [34.7818, 32.0853] // Tel Aviv coordinates
        },
        prefix: '+972',
        phone: '3-123-4567',
        email: 'info@cafecentral.co.il',
        description: 'בית קפה נעים בלב תל אביב עם אוכל טעים וקפה איכותי',
        descriptionEn: 'A pleasant café in the heart of Tel Aviv with delicious food and quality coffee',
        city: 'תל אביב',
        cityEn: 'Tel Aviv',
        country: 'ישראל',
        countryEn: 'Israel',
        active: true,
        approved: true,
        featured: true,
        verified: true,
        rating: 4.5,
        totalRatings: 25,
        viewCount: 150,
        favoriteCount: 45,
        reviewCount: 25,
        tags: ['קפה', 'אוכל', 'ארוחת בוקר', 'ארוחת צהריים'],
        amenities: ['WiFi חינם', 'ישיבה בחוץ', 'כרטיסי אשראי', 'חניה']
      },
      {
        name: 'פתרונות טכנולוגיה בע"מ',
        nameEn: 'Tech Solutions Ltd',
        address: 'דרך החדשנות 456, חיפה',
        addressEn: '456 Innovation Drive, Haifa',
        location: {
          type: 'Point',
          coordinates: [34.9896, 32.7940] // Haifa coordinates
        },
        prefix: '+972',
        phone: '4-987-6543',
        email: 'contact@techsolutions.co.il',
        description: 'חברת ייעוץ טכנולוגי מובילה עם פתרונות מתקדמים לעסקים',
        descriptionEn: 'Leading technology consulting company with advanced business solutions',
        city: 'חיפה',
        cityEn: 'Haifa',
        country: 'ישראל',
        countryEn: 'Israel',
        active: true,
        approved: true,
        featured: true,
        verified: true,
        rating: 4.8,
        totalRatings: 18,
        viewCount: 89,
        favoriteCount: 32,
        reviewCount: 18,
        tags: ['טכנולוגיה', 'ייעוץ', 'תוכנה', 'הייטק'],
        amenities: ['ייעוץ חינם', 'תמיכה מקוונת', 'ניהול פרויקטים', 'שירות 24/7']
      },
      {
        name: 'שוק הגן הירוק',
        nameEn: 'Green Garden Market',
        address: 'שביל הטבע 789, ירושלים',
        addressEn: '789 Nature Way, Jerusalem',
        location: {
          type: 'Point',
          coordinates: [35.2137, 31.7683] // Jerusalem coordinates
        },
        prefix: '+972',
        phone: '2-456-7890',
        email: 'hello@greengarden.co.il',
        description: 'מוצרים אורגניים טריים ומוצרים טבעיים לבריאות המשפחה',
        descriptionEn: 'Fresh organic produce and natural products for family health',
        city: 'ירושלים',
        cityEn: 'Jerusalem',
        country: 'ישראל',
        countryEn: 'Israel',
        active: true,
        approved: true,
        featured: false,
        verified: true,
        rating: 4.2,
        totalRatings: 12,
        viewCount: 67,
        favoriteCount: 23,
        reviewCount: 12,
        tags: ['אורגני', 'טבעי', 'בריאות', 'ירקות טריים'],
        amenities: ['אישור אורגני', 'מוצרים מקומיים', 'משלוחים זמינים', 'חנות פיזית']
      },
      {
        name: 'מכון הכושר אנרגיה',
        nameEn: 'Energy Fitness Center',
        address: 'רחוב הספורט 321, רמת גן',
        addressEn: '321 Sport Street, Ramat Gan',
        location: {
          type: 'Point',
          coordinates: [34.8140, 32.0684] // Ramat Gan coordinates
        },
        prefix: '+972',
        phone: '3-555-1234',
        email: 'info@energyfitness.co.il',
        description: 'מכון כושר מתקדם עם ציוד חדיש ומאמנים מקצועיים',
        descriptionEn: 'Advanced fitness center with modern equipment and professional trainers',
        city: 'רמת גן',
        cityEn: 'Ramat Gan',
        country: 'ישראל',
        countryEn: 'Israel',
        active: true,
        approved: true,
        featured: true,
        verified: true,
        rating: 4.6,
        totalRatings: 42,
        viewCount: 234,
        favoriteCount: 78,
        reviewCount: 42,
        tags: ['כושר', 'אימונים', 'בריאות', 'ספורט'],
        amenities: ['ציוד מתקדם', 'מאמנים אישיים', 'שיעורי קבוצה', 'חניה חינם']
      },
      {
        name: 'מרפאת השיניים החיוך',
        nameEn: 'The Smile Dental Clinic',
        address: 'רחוב הבריאות 654, הרצליה',
        addressEn: '654 Health Street, Herzliya',
        location: {
          type: 'Point',
          coordinates: [34.8360, 32.1663] // Herzliya coordinates
        },
        prefix: '+972',
        phone: '9-777-8888',
        email: 'smile@dentalclinic.co.il',
        description: 'מרפאת שיניים מודרנית עם טכנולוגיה מתקדמת ושירות מקצועי',
        descriptionEn: 'Modern dental clinic with advanced technology and professional service',
        city: 'הרצליה',
        cityEn: 'Herzliya',
        country: 'ישראל',
        countryEn: 'Israel',
        active: true,
        approved: true,
        featured: false,
        verified: true,
        rating: 4.7,
        totalRatings: 31,
        viewCount: 156,
        favoriteCount: 52,
        reviewCount: 31,
        tags: ['רפואת שיניים', 'בריאות', 'טיפולים', 'ייעוץ'],
        amenities: ['טכנולוגיה מתקדמת', 'ייעוץ חינם', 'תשלומים נוחים', 'שעות גמישות']
      },
      {
        name: 'חנות הספרים הדעת',
        nameEn: 'Da\'at Bookstore',
        address: 'רחוב התרבות 987, באר שבע',
        addressEn: '987 Culture Street, Be\'er Sheva',
        location: {
          type: 'Point',
          coordinates: [34.7979, 31.2518] // Be'er Sheva coordinates
        },
        prefix: '+972',
        phone: '8-123-4567',
        email: 'books@daat.co.il',
        description: 'חנות ספרים מקיפה עם מבחר גדול של ספרים בעברית ובאנגלית',
        descriptionEn: 'Comprehensive bookstore with large selection of Hebrew and English books',
        city: 'באר שבע',
        cityEn: 'Be\'er Sheva',
        country: 'ישראל',
        countryEn: 'Israel',
        active: true,
        approved: true,
        featured: false,
        verified: true,
        rating: 4.3,
        totalRatings: 19,
        viewCount: 98,
        favoriteCount: 34,
        reviewCount: 19,
        tags: ['ספרים', 'תרבות', 'חינוך', 'קריאה'],
        amenities: ['מבחר גדול', 'הזמנות מיוחדות', 'אירועי תרבות', 'חניה נוחה']
      }
    ];
    
    const businesses = await Business.insertMany(
      sampleBusinesses.map((business, index) => ({
        ...business,
        categoryId: categories[index % categories.length]._id,
        userId: adminUser._id,
        services: [{
          serviceId: services[index % services.length]._id,
          name: services[index % services.length].name,
          description: services[index % services.length].description
        }]
      }))
    );
    console.log(`🏢 Created ${businesses.length} businesses`);
    
    // Update category business counts
    for (const category of categories) {
      const businessCount = await Business.countDocuments({ 
        categoryId: category._id, 
        active: true, 
        approved: true 
      });
      await Category.findByIdAndUpdate(category._id, { businessCount });
    }
    
    // Update service business counts
    for (const service of services) {
      const businessCount = await Business.countDocuments({ 
        'services.serviceId': service._id,
        active: true, 
        approved: true 
      });
      await Service.findByIdAndUpdate(service._id, { businessCount });
    }
    
    console.log('✅ Database seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Users: 1`);
    console.log(`   - Categories: ${categories.length}`);
    console.log(`   - Services: ${services.length}`);
    console.log(`   - Businesses: ${businesses.length}`);
    
    console.log('\n🎯 Sample Data Created:');
    console.log('   📂 Categories: Restaurants, Health, Shopping, Automotive, Education, Home, Tech, Sports, Beauty, Legal');
    console.log('   🏢 Businesses: Café Central, Tech Solutions, Green Garden Market, Energy Fitness, Dental Clinic, Bookstore');
    console.log('   🔧 Services: Dine-in, Takeaway, Delivery, Consultation, Online Services');
    
  } catch (error) {
    console.error('❌ Database seeding failed:', error.message);
    console.error(error.stack);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run seeding
if (require.main === module) {
  connectDB().then(seedDatabase);
}

module.exports = { connectDB, seedDatabase }; 