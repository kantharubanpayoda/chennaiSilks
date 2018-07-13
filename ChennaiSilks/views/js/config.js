var config = {};

config.snapshotFormat = 'jpeg';
config.maxImageLimit = 10;
config.gridPageSize = 10;
config.galleryPageSize = 18;
config.statusMapper = {all: "all", toBeApproved: "Yet to be Approved", rejToSupplier: "Rejected to Supplier",  subToApprover: "Submitted to the Approver", rejFromApprover: "Rejected from Approver", approved: "Approved"}
config.recentProductsCount = 4;
config.filterMapper = {supplier: [{key: "all", value: "All"}, {key: "toBeApproved", value: "Yet to be Approved"}, {key: "rejToSupplier", value: "Rejected"}, {key: "approvedForSupplier",value: "Approved"}],
                       designer: [{key: "all",value: "All"}, {key: "toBeApproved",value: "Yet to be Approved"}, {key: "rejToSupplier",value: "Rejected to Supplier"}, {key: "subToApprover",value: "Submitted to the Approver"}, {key: "rejFromApprover",value: "Rejected from Approver"}, {key: "approved",value: "Approved"} ],
                       reviewer: [{key: "all",value: "All"}, {key: "subToApprover",value: "Yet to be Approved"}, {key: "rejFromApprover",value: "Rejected"}, {key: "approved",value: "Approved"}]};

//api routes
config.magentoServerURl = "https://tcs-qa.payoda.com";
config.getProductFromMagento = "/rest/V1/getDetail";
config.getOauthToken = "/rest/V1/integration/admin/token";
config.serverURL = window.location.origin;
config.signin = '/profile/signin';
config.signout = '/profile/signout';
config.getProfile = '/profile/getProfile';
config.recoverPassword = '/profile/recoverPassword';
config.updateProfile = '/profile/updateProfile';
config.addProfileImage = '/profile/addProfileImage';
config.fetchProductById = '/product/getProductById';
config.getStatistics = '/statistics/getStatistics';
config.getUserStatistics = '/statistics/getUserStatistics';
config.getProducts = '/product/getProducts';
config.addImage = '/product/addImage';
config.createProduct = '/product/createProduct';
config.updateProduct = '/product/updateProduct';
config.downloadProducts = '/product/downloadProducts';
config.deleteProduct = '/product/deleteProduct';
config.deleteMultipleProduct = '/product/deleteMultipleProduct';
config.getRecentProducts = '/product/getRecentProducts';
config.addUpdateCategory = "/categories/addupdateCategory";
config.getCategories = "/categories/getCategoryList";
config.deleteCategory = "/categories/deleteCategory";
config.addUser = "/profile/addUser";
config.getRoleBasedUserList = "/profile/getRoleBasedUserList";
config.getUserList = "/profile/getUserList";
config.deleteUser = "/profile/deleteUser";
config.getUser = "/profile/getUser";
config.supplier = "supplier";
config.designer = "designer";
config.reviewer = "reviewer";
config.magentoUsername = "apiadmin";
config.magentoPassword = "admin@123";
//error messages
config.invalidFileFormat = 'File format not supported. Please upload .jpg/.jpeg/.png/.gif files';
config.reasonInvalid = 'Please enter the reason for rejection';
config.invalidProductScanned = 'Product Id mismatch. Please scan the product with Id:'
config.serverError = 'Server Error';
config.categoryInvalid = "Please enter valid Category name";
