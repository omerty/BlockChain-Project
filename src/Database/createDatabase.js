const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cors = require('cors');
const app = express();
const prisma = new PrismaClient();
const PORT = 5000;
const fs = require('fs');

// Middleware to parse JSON and URL-encoded data
app.use(cors()); 
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const { OAuth2Client } = require('google-auth-library');
const googleAuthClient = new OAuth2Client("914908438061-rsoo3512p3b0nngm4lh8tjo7dn3sbbkk.apps.googleusercontent.com");


const multer = require('multer');
const path = require('path');

// Define storage and filename configurations

// Set the upload directory to the 'public' folder
const uploadDir = path.join(__dirname, '..', '..', 'public', 'uploads');

// Check if the directory exists, and create it if it doesn't
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Use the previously defined 'uploadDir' here
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});
  
  // Initialize Multer middleware with the storage configuration
  const upload = multer({ storage });

// POST route for file upload
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded');
  }
  console.log(req.file.filename);
  // After the file is uploaded, use req.file to access file details
  const ImgR = `/uploads/${req.file.filename}`;
  res.json({ ImgR });
});

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

// Example POST route to handle Google sign-up
app.post('/googleSignup', async (req, res) => {
    console.log('Google sign-up request received');
    try {
        const { token } = req.body;
        const ticket = await googleAuthClient.verifyIdToken({
            idToken: token,
            audience: "914908438061-rsoo3512p3b0nngm4lh8tjo7dn3sbbkk.apps.googleusercontent.com", 
        }); 

        const payload = ticket.getPayload();
        const email = payload.email;

        // Now find the user in the database by email
        const user = await prisma.user.findUnique({
            where: {
                email: email,
            },
        });

        if (user) {
            return res.status(404).json({ message: 'User Already Exists.' }); // Return here to prevent further execution
        } 

        try {
            // Create a new user
            const newUser = await prisma.user.create({
                data: {
                    email,
                    password: '',
                    products: { create: [] },
                    wallets: [],
                    purchased: { create: [] }
                },
            });

            return res.status(201).json({ message: 'Registration successful', email: email }); // Send success response
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'User creation failed' }); // Return after sending error response
        }

    } catch (error) {
        console.error('Google token verification error:', error);
        return res.status(500).send('Google sign-up failed'); // Return after sending error response
    }
});


app.post('/google-login', async (req, res) => {
    const { token } = req.body;  // token is passed from the frontend

    console.log('Received token:', token);

    try {
        // Verifying the token
        const ticket = await googleAuthClient.verifyIdToken({
            idToken: token,
            audience: "914908438061-rsoo3512p3b0nngm4lh8tjo7dn3sbbkk.apps.googleusercontent.com", 
        });

        const payload = ticket.getPayload();
        const email = payload.email;

        // Now find the user in the database by email
        const user = await prisma.user.findUnique({
            where: {
                email: email,
            },
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.status(200).json({ message: 'Login successful', email: email });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ error: 'An error occurred during login.' });
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
    const { owner, ownerId, price, name, imageUrl } = req.body; 
    console.log(owner, ownerId, price, name, imageUrl);
    console.log("Image URL received:", imageUrl);

    try {
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
                imageUrl: imageUrl,

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

        console.log("Product Sold");
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
