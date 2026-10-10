/**
 * server/config/menuData.js
 * Single authoritative source of truth for the canteen menu.
 * The student client is NEVER trusted to supply final item prices.
 * All order totals are recalculated on the server from this data.
 */

export const MENU_CATEGORIES = {
  SNACKS: 'Snacks',
  MEALS: 'Meals',
  BEVERAGES: 'Beverages',
  DESSERTS: 'Desserts'
};

/**
 * Sample canteen menu. In a real deployment this would come from a database.
 * `price` is the INR amount the server uses to recalculate order totals.
 */
export const menuItems = [
  {
    id: 'm1',
    name: 'Cold Coffee',
    description: 'Chilled coffee with milk and ice',
    price: 50,
    category: MENU_CATEGORIES.BEVERAGES,
    image: 'cold-coffee',
    available: true
  },
  {
    id: 'm2',
    name: 'Masala Dosa',
    description: 'Crispy dosa with potato filling and sambar',
    price: 80,
    category: MENU_CATEGORIES.MEALS,
    image: 'masala-dosa',
    available: true
  },
  {
    id: 'm3',
    name: 'Veg Sandwich',
    description: 'Grilled veggie sandwich with cheese',
    price: 60,
    category: MENU_CATEGORIES.SNACKS,
    image: 'veg-sandwich',
    available: true
  },
  {
    id: 'm4',
    name: 'Chicken Biryani',
    description: 'Fragrant basmati rice with spiced chicken',
    price: 140,
    category: MENU_CATEGORIES.MEALS,
    image: 'chicken-biryani',
    available: true
  },
  {
    id: 'm5',
    name: 'Mango Lassi',
    description: 'Sweet yogurt blended with ripe mango',
    price: 45,
    category: MENU_CATEGORIES.BEVERAGES,
    image: 'mango-lassi',
    available: true
  },
  {
    id: 'm6',
    name: 'Samosa',
    description: 'Spiced potato pastry with chutney',
    price: 30,
    category: MENU_CATEGORIES.SNACKS,
    image: 'samosa',
    available: true
  },
  {
    id: 'm7',
    name: 'Paneer Tikka',
    description: 'Marinated paneer grilled in a tandoor',
    price: 120,
    category: MENU_CATEGORIES.SNACKS,
    image: 'paneer-tikka',
    available: true
  },
  {
    id: 'm8',
    name: 'Chocolate Brownie',
    description: 'Warm brownie with a scoop of vanilla ice cream',
    price: 70,
    category: MENU_CATEGORIES.DESSERTS,
    image: 'brownie',
    available: true
  },
  {
    id: 'm9',
    name: 'Tea',
    description: 'Masala chai',
    price: 20,
    category: MENU_CATEGORIES.BEVERAGES,
    image: 'tea',
    available: true
  },
  {
    id: 'm10',
    name: 'Veg Thali',
    description: 'Complete meal with roti, dal, rice, and curry',
    price: 110,
    category: MENU_CATEGORIES.MEALS,
    image: 'veg-thali',
    available: true
  },
  {
    id: 'm11',
    name: 'Cold Drink',
    description: 'Chilled canned beverage',
    price: 40,
    category: MENU_CATEGORIES.BEVERAGES,
    image: 'cold-drink',
    available: false
  },
  {
    id: 'm12',
    name: 'Gulab Jamun',
    description: 'Soft milk-solid dumplings in sugar syrup',
    price: 60,
    category: MENU_CATEGORIES.DESSERTS,
    image: 'gulab-jamun',
    available: true
  }
];

/**
 * Build a lookup map keyed by item id for fast server-side validation.
 */
export const menuById = Object.fromEntries(menuItems.map(item => [item.id, item]));

/**
 * Returns the authoritative menu payload expected by the student client.
 * Only exposes fields the client is allowed to display.
 */
export function buildMenuPayload() {
  return {
    success: true,
    menu: menuItems.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      image: item.image,
      available: item.available
    }))
  };
}