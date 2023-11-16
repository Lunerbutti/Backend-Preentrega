const fs = require('fs').promises;
const path = require('path');

class CartsManager {
    constructor() {
        this.filePath = path.join(__dirname, '..', 'files', 'carts.json');
    }

    async initializeCartFile() {
        const defaultData = [];
        await this.saveCartsToJSON(defaultData);
    }

    async createCart() {
        try {
            let data;
            let carts = [];
            try {
                data = await fs.readFile(this.filePath, 'utf8');
                carts = JSON.parse(data);
            } catch (error) {
                await this.initializeCartFile();
                data = await fs.readFile(this.filePath, 'utf8');
                carts = JSON.parse(data);
            }
            const cartIdCounter = Math.max(...carts.map(cart => cart.id), 0) + 1;
            const newCart = {
                id: cartIdCounter,
                products: [],
            };
            carts.push(newCart);
            await this.saveCartsToJSON(carts);
            return newCart;
        } catch (error) {
            console.error('Cart Error', error.message);
            return null;
        }
    }

    async getCartById(cartId) {
        const carts = await this.getCarts();
        const cart = carts.find(cart => cart.id === cartId);
        if (cart) {
            const products = await Promise.all(cart.products.map(async product => {
                const productData = await fs.readFile(path.join(__dirname, '..', 'files', 'productsList.json'), 'utf8');
                const products = JSON.parse(productData);
                const productObj = products.find(p => p.id === product.id);
                return { ...product, ...productObj };
            }));
            return { ...cart, products };
        } else {
            return "Cart not found.";
        }
    }

    async saveCartsToJSON(carts) {
        try {
            const data = JSON.stringify(carts, null, 2);
            await fs.writeFile(this.filePath, data);
        } catch (error) {
            console.error('Saveing ERROR:', error.message);
        }
    }

    async getCarts() {
        try {
            const data = await fs.readFile(this.filePath, 'utf8');
            if (!data) {
                await this.saveCartsToJSON([]);
                return [];
            }
            return JSON.parse(data);
        } catch (error) {
            console.error('Can´t reed the cart from JSON', error.message);
            return [];
        }
    }

    async addProductToCart(cartId, productId) {
        try {
            const carts = await this.getCarts();
            const cartIndex = carts.findIndex(cart => cart.id === cartId);
    
            if (cartIndex === -1) {
                return { error: "Cart Not Found", status: 404 };
            }
    
            const cart = carts[cartIndex];
    
            const productData = await fs.readFile(path.join(__dirname, '..', 'files', 'productList.json'), 'utf8');
            const products = JSON.parse(productData);
            const productIndex = products.findIndex(p => p.id === productId);
    
            if (productIndex === -1) {
                return { error: "Product didn-t found.", status: 400 };
            }
    
            const cartProductIndex = cart.products.findIndex(product => product.id === productId);
    
            if (cartProductIndex === -1) {
                cart.products.push({ id: productId, quantity: 1 });
            } else {
                cart.products[cartProductIndex].quantity++;
            }
    
            await this.saveCartsToJSON(carts);
            return { message: "Added to Cart.", status: 200 };
        } catch (error) {
            console.error('Error Cart didn-t save', error.message);
            return { error: "Error Cart didnt save", status: 500 };
        }
    }
}

module.exports = CartsManager;