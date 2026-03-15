import pg from 'pg';
const c = new pg.Client('postgresql://postgres:B%24R%3F7Bcs2B8Axxj@db.xqsfdzxpfidzpmdqypzp.supabase.co:5432/postgres');
await c.connect();

// Check existing orders
console.log('=== ORDERS ===');
const orders = await c.query(`SELECT id, order_id, status, client_id, client_user_id, company_id, total, created_at FROM orders ORDER BY id`);
console.table(orders.rows);

// Check orders columns
console.log('\n=== ORDERS COLUMNS ===');
const cols = await c.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'orders' ORDER BY ordinal_position`);
console.table(cols.rows);

// Check cart items to debug weight
console.log('\n=== CART ITEMS ===');
const cartCols = await c.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'cart_items' ORDER BY ordinal_position`);
console.log('Cart items columns:', cartCols.rows.map(r => r.column_name));

const cartItems = await c.query(`SELECT * FROM cart_items LIMIT 10`);
console.table(cartItems.rows);

// Check clients table (Payload)
console.log('\n=== CLIENTS (Payload) ===');
const clients = await c.query(`SELECT id, supabase_id, email, full_name FROM clients ORDER BY id`);
console.table(clients.rows);

await c.end();
