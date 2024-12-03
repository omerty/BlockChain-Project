const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cors = require('cors');
const app = express();
const prisma = new PrismaClient();
const PORT = 5000;
const fs = require('fs');

app.use(cors()); 
const paypal = require('paypal-rest-sdk');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const { OAuth2Client } = require('google-auth-library');
const googleAuthClient = new OAuth2Client("914908438061-rsoo3512p3b0nngm4lh8tjo7dn3sbbkk.apps.googleusercontent.com");

const multer = require('multer');
const path = require('path');


paypal.configure({
    mode: 'live', 
    client_id: 'AVke1FQXvcnZnvkwzEA0usjb71MJ1Idrm1T07yshT_1hONJNBw7u4TJW-42OO7zcxHRJw2TIaeyyD5kL',
    client_secret: 'EL5PSfUO0kqyubjrGqmwi1MQ8yF6TGnIFYcq06ajslDcgMLBBqOAbuydvBWOzomjC9P84hK50Da5pFCV',
  });
  
  app.post('/paypal-transaction', async (req, res) => {
    const { productId, buyerEmail, sellerEmail, paymentDetails } = req.body;
    
    try {  
      console.log('PayPal Payment Successful:', paymentDetails);
      const buyer = await prisma.user.findUnique({
        where: { email: buyerEmail },
      });
      
      if (!buyer) {
        throw new Error("Buyer not found");
      }

      await prisma.product.update({
        where: {
            id: productId, 
        },
        data: {
            owner: {
            connect: { id: buyer.id }, 
            },
            purchasedBy: {
            connect: { id: buyer.id },
            },
            purchased: true, 
        },
      });
  
      res.status(200).json({ message: 'Payment processed successfully' });
    } catch (error) {
      console.error('Error processing PayPal payment:', error);
      res.status(500).json({ error: 'Error processing PayPal payment' });
    }
  });



const uploadDir = path.join(__dirname, '..', '..', 'public', 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});
  
const upload = multer({ storage });

app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded');
  }
  console.log(req.file.filename);
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

        const user = await prisma.user.findUnique({
            where: {
                email: email,
            },
        });

        if (user) {
            return res.status(404).json({ message: 'User Already Exists.' }); 
        } 

        try {
            const newUser = await prisma.user.create({
                data: {
                    email,
                    password: '',
                    products: { create: [] },
                    wallets: [],
                    purchased: { create: [] }
                },
            });

            return res.status(201).json({ message: 'Registration successful', email: email }); 
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'User creation failed' }); 
        }

    } catch (error) {
        console.error('Google token verification error:', error);
        return res.status(500).send('Google sign-up failed');
    }
});


app.post('/google-login', async (req, res) => {
    const { token } = req.body;

    console.log('Received token:', token);

    try {
        const ticket = await googleAuthClient.verifyIdToken({
            idToken: token,
            audience: "914908438061-rsoo3512p3b0nngm4lh8tjo7dn3sbbkk.apps.googleusercontent.com", 
        });

        const payload = ticket.getPayload();
        const email = payload.email;

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

        console.log("Product Found");
        res.json(serializeProducts([product]));
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/email/:id', async (req, res) => {
    const { id } = req.params; // Extract `id` from route params
    try {
        // Fetch product details using the correct `id`
        const product = await prisma.product.findUnique({
            where: { id: Number(id) }, // Ensure `id` is a number
        });

        // If the product doesn't exist, return a 404 response
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Fetch the user who owns the product
        const user = await prisma.user.findUnique({
            where: { email: product.ownerEmail }, // Use `ownerEmail` field
        });

        // If the user doesn't exist, return a 404 response
        if (!user) {
            return res.status(404).json({ error: 'Owner not found' });
        }

        console.log("Product Found");
        res.json(user.email); // Return the owner's email
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


app.get('/api/transactions', (req, res) => {
    
  });



app.post('/saveProduct', async (req, res) => {
    const { owner, ownerId, price, name, imageUrl } = req.body; 
    console.log('Request body:', req.body);

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

        if (!user.wallets.includes(ownerId)) {
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    wallets: {
                        push: ownerId, 
                    },
                },
            });
        }

        const newProduct = await prisma.product.create({
            data: {
                name: name,
                price: price,
                purchased: true,
                ownerEmail: owner, 
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
        const user = await prisma.user.findUnique({
            where: { email: email },
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const product = await prisma.product.findUnique({
            where: { id: Number(productId) },
        });

        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        if (!user.wallets.includes(walletAddress)) {
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    wallets: {
                        push: walletAddress, 
                    },
                },
            });
        }

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





app.post('/api/messages', async (req, res) => {
    const { sender, receiver, message } = req.body;
    
    try {
      const newMessage = await prisma.message.create({
        data: {
          sender,
          receiver,
          message,
        },
      });
  
      res.status(201).json(newMessage);
    } catch (error) {
      console.error('Error saving message:', error);
      res.status(500).json({ error: 'Failed to save message' });
    }
  });

  // Assuming you're using Express and Prisma
  app.get('/api/user/:email', async (req, res) => {
    const { email } = req.params;
    try {
        const user = await prisma.user.findUnique({
            where: { email: email },
            include: {
                products: true, // Include the user's products
            },
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching user data' });
    }
  });
  
  app.get('/api/messages/:buyer/:seller', async (req, res) => {
    const { buyer, seller } = req.params;
  
    try {
      const messages = await prisma.message.findMany({
        where: {
          OR: [
            { sender: buyer, receiver: seller },
            { sender: seller, receiver: buyer },
          ],
        },
      });
      
      res.json(messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  });


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
