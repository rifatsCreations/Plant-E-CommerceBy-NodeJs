
const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const fs = require('fs');
const path = require('path');
const socketio = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketio(server);
const PORT = 4050;

// Static files and views
app.use('/uploads', express.static('uploads'));
app.set('view engine', 'ejs');
app.set('views', 'views');
app.use(express.static('public'));

// Middleware for parsing request body
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Routes
const homeRoutes = require('./routes/home');
const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const cartRoutes = require('./routes/cart');
const productRoutes = require('./routes/product');

app.use('/', homeRoutes);
app.use('/admin', adminRoutes);
app.use('/shop', shopRoutes);
app.use('/cart', cartRoutes);
app.use('/admin', productRoutes); // Fix: Avoid duplicate admin routes

// Socket.io connection
io.on('connection', (socket) => {
    console.log('A user connected');
    
    socket.on('message', (message) => {
        console.log('Received message:', message);
        io.emit('message', message);
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

// Product Details Route
app.get('/product/:id', (req, res) => {
    const productId = req.params.id;
    const productFilePath = path.join(__dirname, 'data', 'products.json');

    fs.readFile(productFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading product data:', err);
            return res.status(500).send('Internal Server Error');
        }

        try {
            const products = JSON.parse(data);
            const product = products.find(product => product.id === productId);
            if (product) {
                res.render('product_details', { product });
            } else {
                res.status(404).send('Product not found');
            }
        } catch (error) {
            console.error('Error parsing product data:', error);
            res.status(500).send('Internal Server Error');
        }
    });
});

// Start server
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

