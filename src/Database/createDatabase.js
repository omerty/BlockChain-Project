const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cors = require('cors');
const app = express();
const prisma = new PrismaClient();
const PORT = 5000;

// Middleware to parse JSON and URL-encoded data
app.use(cors()); 
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
      res.json(serializeProducts(products));
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/products/:id', async (req, res) => {
    const { id } = req.params; 
    try {
        const product = await prisma.product.findUnique({
            where: { id: Number(id) }, 
        });

        if (!product) {
            console.log("No Product");
            return res.status(404).json({ message: 'Product not found.' });
        }

        console.log("PRoduct Found");
        res.json(serializeProducts([product]));
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/saveProduct', async (req, res) => {
    const { owner, ownerId, price, name } = req.body; 
    console.log(owner, ownerId, price, name);

    try {
        // Find the user by email (or however you identify users)
        const user = await prisma.user.findUnique({
            where: { email: owner },
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
        console.log("HERE1");
        // Check if the wallet address already exists in the wallets array
        if (!user.wallets.includes(ownerId)) {
            // Add the wallet address to the wallets array
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    wallets: {
                        push: ownerId, // Add the wallet address to the array
                    },
                },
            });
        }

        const newProduct = await prisma.product.create({
            data: {
                name: name,
                price: price,
                purchased: true,
                ownerId: user.id, 
                purchased: false,
                walletAddress: ownerId, 
            },
        });

        console.log("Product added:", newProduct);
        res.status(201).json({ message: 'Product saved successfully.', product: newProduct });
    } catch (error) {
        console.error('Error saving product:', error);
        res.status(500).json({ error: 'An error occurred while saving the product.' });
    }
});


app.post('/purchaseProduct', async (req, res) => {
    const { walletAddress, email, productId } = req.body; 
    console.log("HI");
    try {
        // Find the user by email
        const user = await prisma.user.findUnique({
            where: { email: email },
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Find the product by ID
        const product = await prisma.product.findUnique({
            where: { id: Number(productId) },
        });

        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        // Check if the wallet address already exists in the user's wallets
        if (!user.wallets.includes(walletAddress)) {
            // Update the user to add the new wallet address if it's not already there
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    wallets: {
                        push: walletAddress, // Add the wallet address to the array
                    },
                },
            });
        }

        // Update the product to set the new owner and mark it as purchased
        const updatedProduct = await prisma.product.update({
            where: { id: product.id },
            data: {
                ownerId: user.id,             
                walletAddress: walletAddress, 
                purchased: true,              
                purchasedBy: {
                    connect: { id: user.id }, 
                },
            },
        });

        res.status(201).json({ message: 'Product ownership updated successfully.', product: updatedProduct });
    } catch (error) {
        console.error('Error updating product owner:', error);
        res.status(500).json({ error: 'An error occurred while updating product ownership.' });
    }
});

// app.get('/user/:id', async (req, res) => {
//     const {id} = req.params;

//     try{
//         const user = await prisma.user.findUnique({
//             where: {id: Number(id)},
//         })

//         if(!user) {
//             return res.status(404).json({ message: 'Product not found.' });
//         }
//     }
// })

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
