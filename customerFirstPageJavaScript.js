const firestoreUrl = "https://firestore.googleapis.com/v1/projects/online-shopping-2c207/databases/(default)/documents";
const productUrl = `${firestoreUrl}/products`;
const categoryUrl = `${firestoreUrl}/category`;
const cartUrl = `${firestoreUrl}/cart`;
const cartCounterUrl = `${firestoreUrl}/counters/cartCounter`;

// Redirect to Profile
function goToProfile() {
    window.location.href = "customerProfile.html"; // Replace with your home page URL
}

function goToCart() {
    window.location.href = "cart.html"; // Replace with your home page URL
}

// Search Box Toggle
document.querySelectorAll('input[name="viewOption"]').forEach((radio) => {
    radio.addEventListener('change', (event) => {
        const searchInput = document.getElementById('searchInput');

        if (event.target.id === 'viewAll') {
            searchInput.disabled = true;  // Disable the search box
            searchInput.placeholder = "Search disabled in View All mode";
        } else {
            searchInput.disabled = false;  // Enable the search box
            searchInput.placeholder = "Search here...";
        }
    });
});


window.onload = async function() {
    await initial();
};

async function initial(){
    const productsResponse = await fetch(`https://firestore.googleapis.com/v1/projects/online-shopping-2c207/databases/(default)/documents:runQuery`, {
        method: 'POST',
        headers: {
            // 'Authorization': `Bearer YOUR_FIREBASE_AUTH_TOKEN`, // Add your token
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            structuredQuery: {
                from: [{ collectionId: "products" }], // Your product collection
                where: {
                    fieldFilter: {
                        field: { fieldPath: "isActive" }, // Field to filter by category ID
                        op: "EQUAL",
                        value: { booleanValue: true } // Category ID to match
                    }
                }
            }
        })
    });
    
    const productsData = await productsResponse.json();
    
    let isActiveProduct=productsData[0].document;
    if(isActiveProduct!=undefined){
        displayProducts(productsData);
    }
}





let productId;
let productsList = [];

// Function to search for products based on the selected filter
async function searchProducts() {
    const viewByCategory = document.getElementById("viewByCategory").checked;
    const viewByProduct = document.getElementById("viewByProduct").checked;
    const viewAll = document.getElementById("viewAll").checked;
    const searchInput = document.getElementById("searchInput").value.trim().toLowerCase();

    // Clear previous results
    const productGrid = document.getElementById("productGrid");
    productGrid.innerHTML = '';

    try {
        if (viewByProduct) {

            if (!searchInput) {
                alert('Search box is empty');
                return;
            }

            productsList=[];


            const response = await fetch(productUrl, {
                method: 'GET',
                headers: {
                    // 'Authorization': `Bearer ${idToken}`,
                }
            });
        
            const data = await response.json();
        
            for(let i=0;i<data.documents.length;i++){
                const productName=data.documents[i].fields.title.stringValue.trim().toLowerCase();
                if(searchInput==productName){
                    productId=data.documents[i].fields.productId.integerValue;
                    const productsResponse = await fetch(`https://firestore.googleapis.com/v1/projects/online-shopping-2c207/databases/(default)/documents:runQuery`, {
                        method: 'POST',
                        headers: {
                            // 'Authorization': Bearer YOUR_FIREBASE_AUTH_TOKEN, // Add your token if required
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            structuredQuery: {
                                from: [{ collectionId: "products" }], // Your product collection
                                where: {
                                    compositeFilter: { // Use compositeFilter for multiple conditions
                                        op: "AND", // Combine the filters with "AND"
                                        filters: [
                                            {
                                                fieldFilter: {
                                                    field: { fieldPath: "productId" }, // Field to filter by category ID
                                                    op: "EQUAL",
                                                    value: { integerValue: productId } // Category ID to match
                                                }
                                             },
                                            {
                                                fieldFilter: {
                                                    field: { fieldPath: "isActive" }, // Field to filter by active status
                                                    op: "EQUAL",
                                                    value: { booleanValue: true } // Only fetch active products
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        })
                    });
                    const productsData = await productsResponse.json();
                    productsList.push(productsData[0]);
               }
            }

            for(let i=0;i<productsList.length;i++){
                let isActiveProduct=productsList[i].document;
                if(isActiveProduct==undefined){
                    productsList.splice(i,1);
                }
            }

            if(productsList.length>0){
                displayProducts(productsList);
            }
            else{
                alert("No Such Product Exist!!");
                location.reload();
            }
        } else if (viewByCategory) {

            if (!searchInput) {
                alert('Search box is empty');
                return;
            }

            // Fetch category ID first
            const response = await fetch(categoryUrl, {
                method: 'GET',
                headers: {
                    // 'Authorization': `Bearer ${idToken}`,
                }
            });
        
            const data = await response.json();
        
            let categoryId;

            for(let i=0;i<data.documents.length;i++){
                const categoryName=data.documents[i].fields.name.stringValue.trim().toLowerCase();
                if(searchInput==categoryName){
                  categoryId=data.documents[i].fields.category_Id.integerValue;
               }
            }

            if(categoryId==undefined){
                alert("No Such Category Exist!!");
                location.reload();
            }   

            // Now fetch products by category ID
            const productsResponse = await fetch(`https://firestore.googleapis.com/v1/projects/online-shopping-2c207/databases/(default)/documents:runQuery`, {
            method: 'POST',
            headers: {
                // 'Authorization': Bearer YOUR_FIREBASE_AUTH_TOKEN, // Add your token if required
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                structuredQuery: {
                    from: [{ collectionId: "products" }], // Your product collection
                    where: {
                        compositeFilter: { // Use compositeFilter for multiple conditions
                            op: "AND", // Combine the filters with "AND"
                            filters: [
                                {
                                    fieldFilter: {
                                        field: { fieldPath: "categoryId" }, // Field to filter by category ID
                                        op: "EQUAL",
                                        value: { integerValue: categoryId } // Category ID to match
                                    }
                                },
                                {
                                    fieldFilter: {
                                        field: { fieldPath: "isActive" }, // Field to filter by active status
                                        op: "EQUAL",
                                        value: { booleanValue: true } // Only fetch active products
                                    }
                                }
                            ]
                        }
                    }
                }
            })
        });
            const productsData = await productsResponse.json();
            let isActiveProduct=productsData[0].document;
            if(isActiveProduct!=undefined){
                displayProducts(productsData);
            }
            else{
                alert("No Products in this category!!");
                location.reload();
            }
            
           
        } else if (viewAll) {
            // Fetch all products
            if (searchInput) {
                alert('Showing All items!!');
                const searchInput = document.getElementById("searchInput");
                searchInput.value='';
            }

            const productsResponse = await fetch(`https://firestore.googleapis.com/v1/projects/online-shopping-2c207/databases/(default)/documents:runQuery`, {
                method: 'POST',
                headers: {
                    // 'Authorization': `Bearer YOUR_FIREBASE_AUTH_TOKEN`, // Add your token
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    structuredQuery: {
                        from: [{ collectionId: "products" }], // Your product collection
                        where: {
                            fieldFilter: {
                                field: { fieldPath: "isActive" }, // Field to filter by category ID
                                op: "EQUAL",
                                value: { booleanValue: true } // Category ID to match
                            }
                        }
                    }
                })
            });

            const productsData = await productsResponse.json();

            let isActiveProduct=productsData[0].document;
            if(isActiveProduct!=undefined){
                displayProducts(productsData);
            }
            else{
                alert("No Products exists!!");
                location.reload();
            }
        }
    } catch (error) {
        console.error("Error fetching products:", error);
    }
}

// Function to display products in the product grid
function displayProducts(products) {
    const productGrid = document.getElementById("productGrid");
    
    products.forEach(product => {
        const productCard = document.createElement("div");
        productCard.className = "product-card";

        let stockAvailable="";
        console.log();
        let isStockAvailable=product.document.fields.isAvailable.booleanValue;
        if(!isStockAvailable){
            stockAvailable="out of stock!!";
        }
        
        // Assuming product has fields: title, description, price, imageUrl
        productCard.innerHTML = `
                    <img src="${product.document.fields.imageUrl.stringValue}" alt="${product.document.fields.title.stringValue}">
                    <div class="product-info">
                        <h3>${product.document.fields.title.stringValue}</h3>
                        <p>${product.document.fields.description.stringValue}</p>
                        <p>${stockAvailable}</p>
                        <div class="price">$${product.document.fields.price.doubleValue.toFixed(2)}</div>
                        ${isStockAvailable ? `<button data-product='${JSON.stringify(product)}' onclick="buyNow(this)">Buy Now</button>`:''}
                        ${isStockAvailable ? `<button id="addToCart" data-product='${JSON.stringify(product)}' onclick="addToCart(this)">Add to Cart</button>`:''}
                    </div>
                `;
        productGrid.appendChild(productCard);
    });
}

let quantity;
let productToAddToCart;
let productToBuy;

async function addToCart(button){
    productToAddToCart = JSON.parse(button.getAttribute('data-product'));
    document.getElementById('addToCartModal').style.display = 'flex';
}

function buyNow(button){
    productToBuy = JSON.parse(button.getAttribute('data-product'));
    document.getElementById('buyNowModal').style.display = 'flex';
}

async function getAndIncrementCartId() {
    try {
        // Fetch the current product counter
        const response = await fetch(cartCounterUrl, {
            method: 'GET',
            headers: {
                // 'Authorization': `Bearer ${idToken}`,
            }
        });

        const data = await response.json();
        let currentCartId = data.fields.lastCartId.integerValue;

        // Increment the counter
        let newCartId = parseInt(currentCartId) + 1;

        // Update the counter document in Firestore
        const updateResponse = await fetch(cartCounterUrl, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                // 'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify({
                fields: {
                    lastCartId: { integerValue: newCartId.toString() }
                }
            })
        });

        if (!updateResponse.ok) {
            throw new Error("Failed to update Cart counter");
        }

        return newCartId; // Return the new incremented CategoryID
    } catch (error) {
        console.error('Error fetching/incrementing CartID:', error);
        return null;
    }
}

document.querySelector('.close').addEventListener('click', function () {
    document.getElementById('addToCartModal').style.display = 'none'; // Hide modal
});

document.querySelectorAll('.close')[1].addEventListener('click', function (){
    document.getElementById('buyNowModal').style.display = 'none'; 
});

document.getElementById('submitBuyQuantityBtn').addEventListener('click', async function () {
    quantityInput =  document.getElementById('buyQuantity').value;
   
    if(quantityInput<1){
        alert("Please enter a number greater than 0.");
        document.getElementById('buyQuantity').value = "";
        return; // Clear the input field if invalid
    }

    const response = await fetch(productUrl, {
        method: 'GET',
        headers: {
            // 'Authorization': `Bearer ${idToken}`,
        }
    });

    const data = await response.json();

    const productId = productToBuy.document.fields.productId.integerValue;
    let currentProductId=productId;

    let isQuantityAvailable=true;
    let availableQuantity;

    for(let i=0;i<data.documents.length;i++){
        const product_Id=data.documents[i].fields.productId.integerValue;
        if(productId==product_Id){
            const isActive = data.documents[i].fields.isActive.booleanValue;
            const isAvailable = data.documents[i].fields.isAvailable.booleanValue;
            if(isActive && isAvailable){
                let quantityInDatabase=parseInt(data.documents[i].fields.quantity.integerValue);
                if(quantityInput>quantityInDatabase){
                    isQuantityAvailable=false;
                    availableQuantity=quantityInDatabase;
                }
            }  
       }
    }

    if(isQuantityAvailable){

        const productDataToBuy = [
            { productId: currentProductId, quantity: quantityInput}
        ];
        sessionStorage.setItem('productToBuy',JSON.stringify(productDataToBuy));
        window.location.href = "buyPage.html";
    }
    else{
        alert(`Quantity Exceded!! Quantity  present in inventory: ${availableQuantity}`);
        document.getElementById('buyQuantity').value = "";
        return;
    }
});




document.getElementById('submitQuantityBtn').addEventListener('click', async function () {

    quantity =  document.getElementById('quantity').value;

    if(quantity<1){
        alert("Please enter a number greater than 0.");
        document.getElementById('quantity').value = "";
        return; // Clear the input field if invalid
    }
    
    const response = await fetch(cartUrl, {
        method: 'GET',
        headers: {
            // 'Authorization': `Bearer ${idToken}`,
        }
    });

    const data = await response.json();

    const productId = productToAddToCart.document.fields.productId.integerValue;
    let isProductExistInCart=false;
    let cartId;

        for(let i=0;i<data.documents.length;i++){
            const product_Id=data.documents[i].fields.productId.integerValue;
            if(productId==product_Id){
                const isActive = data.documents[i].fields.isActive.booleanValue;
                if(isActive){
                    isProductExistInCart=true;
                    quantity=parseInt(quantity)+parseInt(data.documents[i].fields.quantity.integerValue);
                    cartId=data.documents[i].fields.cartId.integerValue;
                }  
           }
        }

    if(isProductExistInCart){

        let documentId = await getDocumentIdByCartId(cartId);

        try {
            let updateFields = `updateMask.fieldPaths=quantity&&updateMask.fieldPaths=updatedAt`;
            const response = await fetch(`https://firestore.googleapis.com/v1/projects/online-shopping-2c207/databases/(default)/documents/cart/${documentId}?${updateFields}`, {
                method: 'PATCH',  // Use PATCH for partial updates
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fields: {
                        quantity: { integerValue: quantity.toString() },
                        updatedAt: { timestampValue: new Date().toISOString() }
                    }
                })
            });

            if (response.ok) {
                alert('Product Added to Cart!!');
                location.reload();
            } else {
                console.error('Error updating cart:', response.statusText);
            }
        } catch (error) {
            console.error('Error updating cart:', error);
        }
    }

    cartId=await getAndIncrementCartId();
    const customerId=sessionStorage.getItem('customer_Id');
    const cartData = {
        fields: {
            cartId: {integerValue: cartId},
            customerId: {integerValue: customerId},
            productId: { integerValue: productId },
            quantity: { integerValue: quantity.toString() },
            createdAt: { timestampValue: new Date().toISOString() },
            isActive: { booleanValue: true }
        }
    };

    try {
        const response = await fetch(cartUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // 'Authorization': `Bearer ${sessionStorage.getItem('idToken')}` // Assuming idToken is stored in sessionStorage
            },
            body: JSON.stringify(cartData)
        });
        if (response.ok) {
            alert('Product Added to Cart!!');
            // Optionally redirect to another page
            location.reload();
        } else {
            alert('Failed to add to cart');
        }
    } catch (error) {
        console.error('Error adding product to cart:', error);
    }
});

async function getDocumentIdByCartId(cartId) {

    try {
        const response = await fetch(cartUrl, {
            method: 'GET',
            headers: {
                // 'Authorization': `Bearer ${idToken}`,
            }
        });

        const data = await response.json();

        let documentId;

        for(let i=0;i<data.documents.length;i++){
            const cart_Id=data.documents[i].fields.cartId.integerValue;
            if(cartId==cart_Id){
                documentId=data.documents[i].name.split('/').pop();
           }
        }

        return documentId;
    } catch (error) {
        console.error('Error fetching document ID:', error);
    }
}