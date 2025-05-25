// Seed the database with initial data
const mongoose = require('mongoose');
const Blog = require('../models/Blog');
const Category = require('../models/Category');
const Tag = require('../models/Tag');
const User = require('../models/User');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

// Connect to DB
mongoose.connect(process.env.MONGO_URI);

// Create admin user if it doesn't exist
const createAdminUser = async () => {
  try {
    // Check if admin already exists
    const adminExists = await User.findOne({ email: 'admin@voyageo-tours.com' });
    
    if (!adminExists) {
      const admin = await User.create({
        name: 'Admin User',
        email: 'admin@voyageo-tours.com',
        password: 'password123', // Remember to change this in production
        role: 'admin'
      });
      
      console.log('Admin user created:', admin.email);
      return admin;
    } else {
      console.log('Admin user already exists');
      return adminExists;
    }
  } catch (err) {
    console.error('Error creating admin user:', err);
    process.exit(1);
  }
};

// Create categories
const createCategories = async () => {
  try {
    // Check if categories exist
    const categoryCount = await Category.countDocuments();
    
    if (categoryCount === 0) {
      const categories = await Category.insertMany([
        {
          name: 'Morocco Travel',
          description: 'General information about traveling in Morocco',
          is_active: true,
          order: 1,
          meta_title: 'Morocco Travel - Tips & Guides',
          meta_description: 'Everything you need to know about traveling in Morocco - tips, guides, and insights from local experts.'
        },
        {
          name: 'Destinations',
          description: 'Guides to the most beautiful destinations in Morocco',
          is_active: true,
          order: 2,
          meta_title: 'Morocco Destinations - City & Region Guides',
          meta_description: 'Discover the most beautiful and interesting places to visit in Morocco with our comprehensive destination guides.'
        },
        {
          name: 'Travel Tips',
          description: 'Practical advice for travelers in Morocco',
          is_active: true,
          order: 3,
          meta_title: 'Morocco Travel Tips - Essential Advice',
          meta_description: 'Essential tips for traveling in Morocco - local customs, transportation, safety, and practical advice.'
        },
        {
          name: 'Culture',
          description: 'Learn about Moroccan culture, traditions, and history',
          is_active: true,
          order: 4,
          meta_title: 'Moroccan Culture - Traditions & Customs',
          meta_description: 'Explore Morocco\'s rich cultural heritage, traditions, and history to better understand this fascinating country.'
        },
        {
          name: 'Food',
          description: 'Discover the delicious world of Moroccan cuisine',
          is_active: true,
          order: 5,
          meta_title: 'Moroccan Food - Cuisine & Culinary Experiences',
          meta_description: 'Dive into the flavors of Moroccan cuisine - from tagines to mint tea, explore the country\'s culinary traditions.'
        },
        {
          name: 'Adventure',
          description: 'Outdoor activities and adventures in Morocco',
          is_active: true,
          order: 6,
          meta_title: 'Morocco Adventures - Outdoor Activities',
          meta_description: 'Find the best outdoor adventures in Morocco - hiking, camel trekking, desert camping, and more exciting activities.'
        },
        {
          name: 'Photography',
          description: 'Photography tips and stunning images from Morocco',
          is_active: true,
          order: 7,
          meta_title: 'Morocco Photography - Tips & Best Spots',
          meta_description: 'Capture amazing photos in Morocco with our photography guides, best locations, and tips for travel photographers.'
        }
      ]);
      
      console.log(`${categories.length} categories created`);
      return categories;
    } else {
      console.log('Categories already exist');
      const categories = await Category.find();
      return categories;
    }
  } catch (err) {
    console.error('Error creating categories:', err);
    process.exit(1);
  }
};

// Create tags
const createTags = async () => {
  try {
    // Check if tags exist
    const tagCount = await Tag.countDocuments();
    
    if (tagCount === 0) {
      const tags = await Tag.insertMany([
        {
          name: 'Marrakech',
          description: 'The Red City and cultural heart of Morocco',
          is_popular: true,
          color: '#e74c3c'
        },
        {
          name: 'Sahara Desert',
          description: 'Morocco\'s magical desert landscapes',
          is_popular: true,
          color: '#f39c12'
        },
        {
          name: 'Fes',
          description: 'Morocco\'s oldest imperial city',
          is_popular: true,
          color: '#16a085'
        },
        {
          name: 'Chefchaouen',
          description: 'The famous blue city in the Rif Mountains',
          is_popular: true,
          color: '#3498db'
        },
        {
          name: 'Casablanca',
          description: 'Morocco\'s largest city and economic capital',
          is_popular: true,
          color: '#9b59b6'
        },
        {
          name: 'Atlas Mountains',
          description: 'Stunning mountain range crossing Morocco',
          is_popular: true,
          color: '#2ecc71'
        },
        {
          name: 'Moroccan Food',
          description: 'The delicious cuisines of Morocco',
          is_popular: true,
          color: '#e67e22'
        },
        {
          name: 'Essaouira',
          description: 'Charming coastal town on the Atlantic',
          is_popular: true,
          color: '#1abc9c'
        },
        {
          name: 'Medina',
          description: 'The historic old towns of Moroccan cities',
          is_popular: true,
          color: '#34495e'
        },
        {
          name: 'Travel Tips',
          description: 'Practical advice for travelers',
          is_popular: true,
          color: '#27ae60'
        }
      ]);
      
      console.log(`${tags.length} tags created`);
      return tags;
    } else {
      console.log('Tags already exist');
      const tags = await Tag.find();
      return tags;
    }
  } catch (err) {
    console.error('Error creating tags:', err);
    process.exit(1);
  }
};

// Create sample blogs
const createBlogs = async (admin, categories, tags) => {
  try {
    // Check if blogs exist
    const blogCount = await Blog.countDocuments();
    
    if (blogCount === 0) {
      // Sample blog posts
      const blogs = await Blog.insertMany([
        {
          title: 'Top 10 Places to Visit in Morocco',
          subtitle: 'Discover the most beautiful and interesting places in Morocco',
          content: `
            <p>Morocco is a land of incredible diversity, from bustling medieval medinas to the vast Sahara Desert and the rugged Atlas Mountains. Here are our top 10 places you shouldn't miss when visiting this fascinating North African country:</p>
            
            <h2>1. Marrakech</h2>
            <p>The "Red City" is a sensory overload in the best way possible. The heart of Marrakech is Jemaa el-Fnaa, a square that transforms throughout the day from a shopping area to a dining destination with food stalls at night. Don't miss the Bahia Palace, the Majorelle Garden, and getting lost in the labyrinthine medina.</p>
            
            <h2>2. Chefchaouen</h2>
            <p>Known as the "Blue Pearl of Morocco," this mountain town is famous for its striking blue-washed buildings. The laid-back atmosphere makes it perfect for wandering through narrow lanes and soaking in the unique ambiance.</p>
            
            <h2>3. Fes</h2>
            <p>Home to the oldest university in the world, Fes feels like stepping back in time. Its medieval medina is the world's largest car-free urban area, with 9,000 narrow lanes where donkeys and handcarts are still the main form of transportation.</p>
            
            <h2>4. Sahara Desert</h2>
            <p>No trip to Morocco is complete without experiencing the magical Sahara Desert. Whether you opt for a camel trek or a 4x4 adventure, spending a night under the stars in a desert camp is unforgettable.</p>
            
            <h2>5. Essaouira</h2>
            <p>This charming coastal town offers a perfect balance of beach, culture, and history. The fortified medina is a UNESCO World Heritage site, and the constant Atlantic breeze makes it a popular spot for windsurfing and kitesurfing.</p>
            
            <h2>6. Atlas Mountains</h2>
            <p>Perfect for hiking and exploring traditional Berber villages, the Atlas range offers spectacular scenery and a glimpse into rural Moroccan life. Mount Toubkal, North Africa's highest peak, is a challenge for serious hikers.</p>
            
            <h2>7. Casablanca</h2>
            <p>Morocco's largest city is a modern economic hub, but it still has plenty to offer visitors. The Hassan II Mosque, one of the world's largest mosques, is an architectural masterpiece that shouldn't be missed.</p>
            
            <h2>8. Rabat</h2>
            <p>The capital city offers a more relaxed atmosphere than other Moroccan cities. Highlights include the Kasbah of the Udayas, Hassan Tower, and the Chellah necropolis.</p>
            
            <h2>9. Meknes</h2>
            <p>Often overlooked in favor of its more famous neighbors, Meknes is one of Morocco's four imperial cities and offers magnificent gates, beautiful gardens, and fewer tourists.</p>
            
            <h2>10. Tangier</h2>
            <p>This port city where the Mediterranean meets the Atlantic has a fascinating international history and has been recently revitalized with new development projects.</p>
            
            <p>Each of these destinations offers its own unique slice of Moroccan culture and landscape. Whether you're looking for adventure, relaxation, culture, or culinary experiences, Morocco truly has something for every traveler.</p>
          `,
          featured_image: {
            url: '/images/blog/morocco-top-places.jpg',
            alt: 'Colorful view of Chefchaouen, the Blue City of Morocco',
            caption: 'The stunning blue streets of Chefchaouen'
          },
          category: 'Destinations',
          tags: ['Marrakech', 'Chefchaouen', 'Fes', 'Sahara Desert', 'Travel Tips'],
          status: 'published',
          author: admin._id,
          meta_description: 'Discover the most beautiful destinations in Morocco, from the bustling medinas of Marrakech to the tranquil blue streets of Chefchaouen and the golden dunes of the Sahara.',
          seo_keywords: 'Morocco destinations, places to visit in Morocco, Marrakech, Chefchaouen, Sahara Desert, Morocco travel guide',
          featured: true,
          views: 352,
          comments_enabled: true,
          social_sharing: {
            facebook: true,
            twitter: true,
            pinterest: true
          }
        },
        {
          title: 'Essential Moroccan Phrases Every Traveler Should Know',
          subtitle: 'Navigate Morocco with confidence using these useful phrases',
          content: `
            <p>While many Moroccans in tourist areas speak English, learning a few key phrases in Arabic or French can enhance your travel experience tremendously. Locals always appreciate when travelers make an effort to speak their language, and it can help you navigate markets, transportation, and daily interactions with more confidence.</p>
            
            <h2>Useful Arabic Phrases</h2>
            
            <ul>
              <li><strong>Salam aleikum</strong> - Peace be upon you (Hello)</li>
              <li><strong>Aleikum salam</strong> - Peace be upon you too (Response to hello)</li>
              <li><strong>Shukran</strong> - Thank you</li>
              <li><strong>Afak</strong> - Please</li>
              <li><strong>La, shukran</strong> - No, thank you</li>
              <li><strong>B'saha</strong> - Enjoy (said before someone eats)</li>
              <li><strong>La bas?</strong> - How are you?</li>
              <li><strong>La bas, hamdulillah</strong> - I'm fine, thank God</li>
              <li><strong>Smehli</strong> - Excuse me/I'm sorry</li>
              <li><strong>B'shhal?</strong> - How much?</li>
              <li><strong>Ghali!</strong> - Too expensive!</li>
              <li><strong>Fin...?</strong> - Where is...?</li>
              <li><strong>Ma fhemtsh</strong> - I don't understand</li>
            </ul>
            
            <h2>Useful French Phrases</h2>
            
            <p>French is widely spoken in Morocco, especially in larger cities and for business purposes.</p>
            
            <ul>
              <li><strong>Bonjour</strong> - Hello/Good day</li>
              <li><strong>Bonsoir</strong> - Good evening</li>
              <li><strong>Merci</strong> - Thank you</li>
              <li><strong>S'il vous plaît</strong> - Please</li>
              <li><strong>Parlez-vous anglais?</strong> - Do you speak English?</li>
              <li><strong>Je ne comprends pas</strong> - I don't understand</li>
              <li><strong>Combien ça coûte?</strong> - How much does it cost?</li>
              <li><strong>C'est trop cher</strong> - That's too expensive</li>
              <li><strong>Où est...?</strong> - Where is...?</li>
              <li><strong>Je voudrais...</strong> - I would like...</li>
              <li><strong>L'addition, s'il vous plaît</strong> - The bill, please</li>
            </ul>
            
            <h2>Cultural Notes on Language</h2>
            
            <p>Morocco has several languages in use:</p>
            
            <ul>
              <li><strong>Darija</strong> - Moroccan Arabic, the everyday language</li>
              <li><strong>Standard Arabic</strong> - Official language used in government, media, and education</li>
              <li><strong>Amazigh/Berber</strong> - Indigenous languages spoken in different regions</li>
              <li><strong>French</strong> - Widely used in business, government and education</li>
              <li><strong>Spanish</strong> - Common in northern regions near Spain</li>
              <li><strong>English</strong> - Increasingly common in tourist areas and among younger Moroccans</li>
            </ul>
            
            <p>When speaking with shopkeepers or taxi drivers, starting with "Salam aleikum" followed by French or English often works well. Many Moroccans are multilingual and will quickly adjust to your preferred language.</p>
            
            <h2>Tips for Communication</h2>
            
            <ul>
              <li>Learn numbers in Arabic to help with shopping and negotiating</li>
              <li>Use a translation app when necessary, but having key phrases memorized is more efficient</li>
              <li>Speak respectfully and use polite forms, especially with elders</li>
              <li>Accompany your words with a smile - universal in any language!</li>
              <li>If someone helps you with translation or directions, a small thank you (shukran) goes a long way</li>
            </ul>
            
            <p>Even knowing just a few phrases will enrich your Moroccan experience and help you connect with locals in a more meaningful way. The effort to speak even basic Arabic or French is always appreciated and often leads to warmer interactions and sometimes even friendship!</p>
          `,
          featured_image: {
            url: '/images/blog/morocco-language.jpg',
            alt: 'Moroccan street market with Arabic signage',
            caption: 'Learning a few phrases helps when navigating Morocco\'s vibrant markets'
          },
          category: 'Travel Tips',
          tags: ['Travel Tips', 'Moroccan Culture'],
          status: 'published',
          author: admin._id,
          meta_description: 'Learn essential Arabic and French phrases to enhance your Morocco travel experience. These key expressions will help you navigate markets, restaurants, and daily interactions.',
          seo_keywords: 'Morocco language, Arabic phrases, Moroccan Arabic, French in Morocco, communication tips, Morocco travel phrases',
          featured: false,
          views: 187,
          comments_enabled: true
        },
        {
          title: 'Moroccan Cuisine: A Taste of North African Flavors',
          subtitle: 'Explore the rich culinary traditions and must-try dishes of Morocco',
          content: `
            <p>Moroccan cuisine is a rich sensory experience, blending flavors, spices, and cooking techniques from Arab, Berber, Mediterranean, and African influences. The result is a diverse and flavorful culinary tradition that's recognized as one of the most distinguished in the world.</p>
            
            <h2>Signature Dishes of Morocco</h2>
            
            <h3>Tagine</h3>
            <p>Named after the conical clay pot it's cooked in, tagine is a slow-cooked stew typically $e with meat (lamb, chicken, or beef), vegetables, and a blend of spices. Popular variations include chicken with preserved lemons and olives, lamb with prunes and almonds, and vegetable tagine with couscous. The cooking method allows the flavors to meld together while keeping the ingredients tender and moist.</p>
            
            <h3>Couscous</h3>
            <p>Traditionally served on Fridays after prayers, couscous is tiny steamed semolina granules typically served with a flavorful vegetable stew and meat. The preparation is labor-intensive when done traditionally, involving multiple steamings to achieve the perfect light and fluffy texture.</p>
            
            <h3>Pastilla</h3>
            <p>This sweet and savory pie represents the height of Moroccan culinary artistry. Traditional pastilla features layers of paper-thin pastry filled with pigeon (or chicken), almonds, eggs, and spices, then topped with powdered sugar and cinnamon. The combination of savory meat, crunchy nuts, and sweet spices creates an unforgettable flavor experience.</p>
            
            <h3>Harira</h3>
            <p>This hearty soup is especially popular during Ra$an to break the fast. $e with tomatoes, lentils, chickpeas, herbs, and sometimes meat, harira is thickened with beaten eggs or a flour mixture and finished with a squeeze of lemon juice.</p>
            
            <h2>Essential Moroccan Spices and Ingredients</h2>
            
            <h3>Ras el Hanout</h3>
            <p>Meaning "head of the shop," this complex spice blend can contain up to 30 different spices, with each spice merchant having their own unique recipe. Common components include cardamom, clove, cinnamon, coriander, cumin, paprika, and turmeric.</p>
            
            <h3>Preserved Lemons</h3>
            <p>These pickled lemons add a distinctive tangy flavor to many Moroccan dishes. After being preserved in salt and their own juices for at least a month, they develop a unique taste that's essential to authentic Moroccan cooking.</p>
            
            <h3>Argan Oil</h3>
            <p>Native to Morocco, this nutty-flavored oil is produced from the kernels of the argan tree. While it's gained international fame for cosmetic uses, in Morocco it's often used culinarily, drizzled over couscous or used for dipping bread.</p>
            
            <h2>Moroccan Breads and Sweets</h2>
            
            <h3>Khobz</h3>
            <p>This round flatbread is a staple at every Moroccan meal, used to scoop up tagines and salads instead of utensils in traditional settings.</p>
            
            <h3>Msemen</h3>
            <p>These square-shaped pan-fried pastries can be served with honey and butter for breakfast or stuffed with savory fillings for a snack.</p>
            
            <h3>Moroccan Pastries</h3>
            <p>Sweet treats like chebakia (sesame cookies soaked in honey), ghoriba (shortbread cookies), and kaab el ghazal ("gazelle horns" filled with almond paste) are often served with mint tea.</p>
            
            <h2>The Ritual of Mint Tea</h2>
            
            <p>No exploration of Moroccan cuisine would be complete without mentioning the importance of mint tea. Often called "Moroccan whiskey" as a humorous nod to Morocco's limited alcohol consumption, mint tea is prepared with great ceremony. Green tea is mixed with a generous amount of fresh mint and sugar, then poured from high above the glass to create a frothy top. Refusing tea when offered is considered impolite, as sharing tea is a gesture of hospitality and friendship.</p>
            
            <h2>Where to Experience Moroccan Cuisine</h2>
            
            <ul>
              <li>For an authentic experience, a home-cooked meal through a cooking class or homestay offers insight into family recipes passed through generations.</li>
              <li>Traditional restaurants called "riads" (converted traditional houses with interior gardens) offer elegant dining experiences with authentic cuisine.</li>
              <li>Street food stalls, particularly in places like Jemaa el-Fnaa in Marrakech, provide affordable and authentic tastes of local specialties.</li>
            </ul>
            
            <p>Moroccan cuisine, with its blend of sweet and savory flavors, aromatic spices, and time-honored cooking techniques, offers visitors a taste of the country's rich cultural heritage. A culinary journey through Morocco is an essential part of understanding and appreciating this fascinating North African kingdom.</p>
          `,
          featured_image: {
            url: '/images/blog/moroccan-cuisine.jpg',
            alt: 'Traditional Moroccan tagine dish with couscous',
            caption: 'A colorful Moroccan tagine, one of the country\'s most famous dishes'
          },
          category: 'Food',
          tags: ['Moroccan Food', 'Culture', 'Travel Tips'],
          status: 'published',
          author: admin._id,
          meta_description: 'Discover the rich flavors of Moroccan cuisine, from aromatic tagines to delicate pastilla and refreshing mint tea. Learn about key ingredients and must-try dishes.',
          seo_keywords: 'Moroccan food, Moroccan cuisine, tagine, couscous, mint tea, Morocco culinary guide, Moroccan dishes',
          featured: true,
          views: 243,
          comments_enabled: true
        }
      ]);
      
      console.log(`${blogs.length} blogs created`);
      return blogs;
    } else {
      console.log('Blogs already exist');
      return [];
    }
  } catch (err) {
    console.error('Error creating blogs:', err);
    process.exit(1);
  }
};

// Run the seeding
const seedData = async () => {
  try {
    const admin = await createAdminUser();
    const categories = await createCategories();
    const tags = await createTags();
    await createBlogs(admin, categories, tags);
    
    console.log('Database seeded successfully');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
};

// Run the seed function
seedData(); 