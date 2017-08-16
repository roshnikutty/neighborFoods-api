const mongoose = require('mongoose');
var Schema = mongoose.Schema;

const sellerListingSchema = new Schema({
    seller_name: { type: String, required: true },
    sell_dish: { type: String, required: true },
    sell_cuisine: { type: String },
    sell_date: { type: Date, default: Date.now, required: true },
    sell_plate_count: { type: Number, trim: true, required: true },
    sell_plate_cost: { type: Number, trim: true, required: true },
    sell_allergens: { type: String, required: true },
    sell_email_address: {
        type: String,
        trim: true,
        lowercase: true,
        required: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    },
    sell_status: {type: String}
});

const buyerListingSchema = new Schema({
    buyer_name: { type: String, required: true },
    buy_date: { type: Date, default: Date.now, required: true },
    buy_plate_count: { type: Number, trim: true, required: true },
    buy_email_address: {
        type: String,
        trim: true,
        lowercase: true,
        required: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    }
});

sellerListingSchema.methods.apiRepr = function () {
    return {
        meal_id: this.id,
        seller_name: this.seller_name,
        sell_dish: this.sell_dish,
        sell_cuisine: this.sell_cuisine,
        sell_date: this.sell_date,
        sell_plate_count: this.sell_plate_count,
        sell_plate_cost: this.sell_plate_cost,
        sell_allergens: this.sell_allergens,
        sell_email_address: this.sell_email_address,
        sell_status: this.sell_status
    };
}

buyerListingSchema.methods.apiRepr = function () {
    return {
        buyer_id: this.id,
        buyer_name: this.buyer_name,
        buy_date: this.buy_date,
        buy_plate_count: this.buy_plate_count,
        buy_email_address: this.buy_email_address
    };
}
const Seller = mongoose.model('Seller', sellerListingSchema);
const Buyer = mongoose.model('Buyer', buyerListingSchema);

module.exports = { Seller, Buyer };
