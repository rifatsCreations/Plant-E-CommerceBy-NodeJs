const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Helper function to read and parse JSON files safely
const readJsonFile = (filePath, defaultData = []) => {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                if (err.code === 'ENOENT') { // File not found
                    console.warn(`File not found: ${filePath}. Returning default data.`);
                    return resolve(defaultData); // Return empty array if file doesn't exist
                }
                console.error(`Error reading file ${filePath}:`, err);
                return reject(new Error('Internal Server Error'));
            }

            if (!data.trim()) { // If file is empty or contains only whitespace
                console.warn(`File is empty: ${filePath}. Returning default data.`);
                return resolve(defaultData); // Return empty array if file is empty
            }

            try {
                const parsedData = JSON.parse(data);
                resolve(parsedData);
            } catch (parseErr) {
                console.error(`Error parsing JSON from ${filePath}:`, parseErr);
                reject(new Error('Internal Server Error: Malformed JSON data'));
            }
        });
    });
};

// Helper function to write JSON files safely
const writeJsonFile = (filePath, data) => {
    return new Promise((resolve, reject) => {
        fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8', (err) => {
            if (err) {
                console.error(`Error writing file ${filePath}:`, err);
                return reject(new Error('Internal Server Error'));
            }
            resolve();
        });
    });
};

router.get('/', async (req, res) => {
    const cartFilePath = path.join(__dirname, '../data/cart.json');
    const productsFilePath = path.join(__dirname, '../data/products.json');

    try {
        const cartItems = await readJsonFile(cartFilePath, []);
        const products = await readJsonFile(productsFilePath, []);

        const cartItemsWithDetails = cartItems.map(cartItem => {
            const product = products.find(product => product.id === cartItem.productId);
            // Ensure product exists before accessing its properties
            if (product) {
                return {
                    id: product.id,
                    product_title: product.product_title,
                    product_price: product.product_price,
                    product_description: product.product_description,
                    image_path: product.image_path,
                    quantity: cartItem.quantity
                };
            }
            return null; // Handle cases where product is not found (optional, depends on your logic)
        }).filter(item => item !== null); // Filter out nulls if products aren't found

        res.render('cart', { cartItems: cartItemsWithDetails });
    } catch (error) {
        console.error('Error in GET /cart:', error);
        res.status(500).send(error.message);
    }
});

router.post('/add', async (req, res) => {
    const productId = req.body.productId;
    const cartFilePath = path.join(__dirname, '../data/cart.json');

    try {
        let cart = await readJsonFile(cartFilePath, []);

        const existingProductIndex = cart.findIndex(item => item.productId === productId);

        if (existingProductIndex !== -1) {
            cart[existingProductIndex].quantity++;
        } else {
            cart.push({ productId: productId, quantity: 1 });
        }

        await writeJsonFile(cartFilePath, cart);
        console.log('Product added to cart:', productId);
        res.redirect('/');
    } catch (error) {
        console.error('Error in POST /cart/add:', error);
        res.status(500).send(error.message);
    }
});

router.post('/increment', async (req, res) => {
    const productId = req.body.productId;
    const cartFilePath = path.join(__dirname, '../data/cart.json');

    try {
        let cart = await readJsonFile(cartFilePath, []);

        const itemIndex = cart.findIndex(item => item.productId === productId);
        if (itemIndex !== -1) {
            cart[itemIndex].quantity++;
            await writeJsonFile(cartFilePath, cart);
            res.sendStatus(200);
        } else {
            res.status(404).send('Product not found in cart');
        }
    } catch (error) {
        console.error('Error in POST /cart/increment:', error);
        res.status(500).send(error.message);
    }
});

router.post('/decrement', async (req, res) => {
    const productId = req.body.productId;
    const cartFilePath = path.join(__dirname, '../data/cart.json');

    try {
        let cart = await readJsonFile(cartFilePath, []);

        const itemIndex = cart.findIndex(item => item.productId === productId);
        if (itemIndex !== -1) {
            if (cart[itemIndex].quantity > 1) {
                cart[itemIndex].quantity--;
            } else {
                cart.splice(itemIndex, 1); // Remove item if quantity becomes 0
            }
            await writeJsonFile(cartFilePath, cart);
            res.sendStatus(200);
        } else {
            res.status(404).send('Product not found in cart');
        }
    } catch (error) {
        console.error('Error in POST /cart/decrement:', error);
        res.status(500).send(error.message);
    }
});

router.post('/delete', async (req, res) => {
    const productId = req.body.productId;
    const cartFilePath = path.join(__dirname, '../data/cart.json');

    try {
        let cart = await readJsonFile(cartFilePath, []);

        const index = cart.findIndex(item => item.productId === productId);
        if (index !== -1) {
            cart.splice(index, 1);
            await writeJsonFile(cartFilePath, cart);
            console.log('Item deleted from cart:', productId);
            res.sendStatus(200);
        } else {
            res.status(404).send('Item not found in cart');
        }
    } catch (error) {
        console.error('Error in POST /cart/delete:', error);
        res.status(500).send(error.message);
    }
});

module.exports = router;

