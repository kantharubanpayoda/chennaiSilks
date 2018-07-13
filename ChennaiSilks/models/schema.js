var mongoose = require('../models/mongoose');
// var Schema       = mongoose.Schema;
var ObjectId = mongoose.Schema.Types.ObjectId;

var productDetailSchema = mongoose.Schema({
  productID:{type: String, required: true, unique: true},
  price:String,
  type:String,
  name:String,
  description:String,
  rejectReason: String,
  status : String,
  images:[String],
  isApprovalNeeded:{type: Boolean, required: true},
  supplier: {type: ObjectId, required: true},
  designer: {type: ObjectId, required: true},
  reviewer: {type: ObjectId},
  createdDate: {type: Date, required: true},
  updatedDate: Date
});

productDetailSchema.index({ productID: 'text', price: 'text', type: 'text', material: 'text', occuation: 'text',
color: 'text', finishing: 'text', weightInGrams: 'text', wash: 'text', exchange: 'text', shipping: 'text',
disclaimer: 'text', createdDate: 'text', status: 'text'},{name: "searchIndex"});

var productDetail = mongoose.model('product', productDetailSchema);
exports.productDetail = productDetail;

var profilesSchema = mongoose.Schema({
  userId : String,
  username: String,
  password: String,
  roles: [String],
  name: String,
  profileImage: String,
  emailId: String,
  mappedUser: ObjectId
});
var profiles = mongoose.model('profile', profilesSchema);
exports.profiles = profiles;

var categorySchema = mongoose.Schema({
  categoryId: {type: String, required: true, unique: true},
  name: {type: String, required: true, unique: true},
  approvalNeeded: {type: Boolean, required: true}
});

categorySchema.index({ categoryId: 'text', name: 'text'},{name: "categorySearchIndex"});

var category = mongoose.model('category', categorySchema);
exports.category = category;
