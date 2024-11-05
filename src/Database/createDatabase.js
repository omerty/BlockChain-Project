const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cors = require('cors');
const app = express();
const prisma = new PrismaClient();
const PORT = 5000;

// Middleware to parse JSON and URL-encoded data
app.use(cors()); // Enable CORS
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/registerUser', async (req, res) => {
    const { email, password } = req.body;
    console.log('Received:', { email, password });
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                products: { create: [] }, 
                wallets: [],
                purchased: { create: [] }
            },
        });
        res.status(201).json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'User creation failed' });
    }
});

app.post('/loginUser', async (req, res) => {
    const { email, password } = req.body;
    console.log('Received:', { email, password });

    try {
        const user = await prisma.user.findUnique({
            where: {
                email: email,
            },
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid password.' });
        }

        console.log("LOGIN");
        res.status(200).json({ message: 'Login successful'});
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ error: 'An error occurred during login.' });
    }
});


app.get('/Products', async (req, res) => {
    console.log('Request Query:', req.query); 
    const { email } = req.query; 

    try {
        const user = await prisma.user.findUnique({
            where: {
                email: email,
            },
            include: {
                products: true,  
            },
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const products = serializeProducts(user.products);  
        res.status(200).json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'An error occurred while fetching products.' });
    }
});

app.get('/api/products', async (req, res) => {
    try {
      const products = await prisma.product.findMany();
      res.json(products);
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/saveProduct', async (req, res) => {
    const { productId, ownerId, price, name } = req.body;
    console.log(productId, ownerId, price, name); 

    try {
        // Find the user by email
        const user = await prisma.user.findUnique({
            where: { email: ownerId },
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const existingProduct = await prisma.product.findUnique({
            where: { name: name },
        });

        if (existingProduct) {
            return res.status(400).json({ message: 'Product with this name already exists.' });
        }

        const productPrice = BigInt(price); 

        const newProduct = await prisma.product.create({
            data: {
                name: name,
                price: productPrice,
                purchased: true,
                ownerId: user.id,
                purchasedBy: {
                    connect: { id: user.id },
                },
            },
        });

        console.log("Product added:", newProduct);
        res.status(201).json({ message: 'Product saved successfully.' });
    } catch (error) {
        console.error('Error saving product:', error);
        res.status(500).json({ error: 'An error occurred while saving the product.' });
    }
});

app.delete('/products/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const product = await prisma.product.findUnique({
            where: { id: Number(id) }, // Ensure the ID is a number
        });

        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        await prisma.product.delete({
            where: { id: Number(id) },
        });

        res.status(200).json({ message: 'Product removed successfully.' });
    } catch (error) {
        console.error('Error removing product:', error);
        res.status(500).json({ error: 'An error occurred while removing the product.' });
    }
});



function serializeProducts(products) {
    return products.map(product => ({
        ...product,
        price: product.price.toString(), 
    }));
}


app.post('/updateProduct', async (req, res) => {
    const { productId, email } = req.body;
  
    try {
      const user = await prisma.user.findUnique({
        where: { email: email },
      });
  
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }
  
      await prisma.product.update({
        where: { id: productId },
        data: {
          purchased: true,
          purchasedBy: {
            connect: { id: user.id }, 
          },
        },
      });
  
      res.status(200).json({ message: 'Product purchased successfully.' });
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({ error: 'An error occurred while updating the product.' });
    }
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
