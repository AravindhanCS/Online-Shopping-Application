const firestoreUrl = "https://firestore.googleapis.com/v1/projects/online-shopping-2c207/databases/(default)/documents";
const productUrl = `${firestoreUrl}/products`;
const categoryUrl = `${firestoreUrl}/category`;
const cartUrl = `${firestoreUrl}/cart`;
const cartCounterUrl = `${firestoreUrl}/counters/cartCounter`;

// Redirect to Home
function goHome() {
    window.location.href = "customerFirstPage.html";
}

// Redirect to Profile
function goToProfile() {
    window.location.href = "customerProfile.html"; // Replace with your home page URL
}

// Reload cart page
function goToCart() {
    location.reload();
}

window.onload = async function () {
    await initial();
};

// Initialize and load cart
async function initial() {
    const customerId = sessionStorage.getItem('customer_Id');
    
    // AJAX POST request to Firestore to fetch the cart
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://firestore.googleapis.com/v1/projects/online-shopping-2c207/databases/(default)/documents:runQuery`, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    
    xhr.onreadystatechange = function () {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200) {
                const cartData = JSON.parse(xhr.responseText);
                let isProductInCart = cartData[0].document;

                if (isProductInCart !== undefined) {
                    displayProducts(cartData);
                } else {
                    alert("No Products in the Cart!!");
                }
            } else {
                console.error('Error fetching cart data:', xhr.statusText);
            }
        }
    };
    
    xhr.send(JSON.stringify({
        structuredQuery: {
            from: [{ collectionId: "cart" }],
            where: {
                compositeFilter: {
                    op: "AND",
                    filters: [
                        {
                            fieldFilter: {
                                field: { fieldPath: "customerId" },
                                op: "EQUAL",
                                value: { integerValue: customerId }
                            }
                        },
                        {
                            fieldFilter: {
                                field: { fieldPath: "isActive" },
                                op: "EQUAL",
                                value: { booleanValue: true }
                            }
                        }
                    ]
                }
            }
        }
    }));
}

// Display products
async function displayProducts(products) {
    const productGrid = document.getElementById("productGrid");

    let NoOfProducts=0;

    products.forEach(async product => {
        NoOfProducts=NoOfProducts+1;
        const productCard = document.createElement("div");
        productCard.className = "product-card";

        const productId = product.document.fields.productId.integerValue;

        // AJAX POST request to get product data
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `https://firestore.googleapis.com/v1/projects/online-shopping-2c207/databases/(default)/documents:runQuery`, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        
        xhr.onreadystatechange = function () {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    const productData = JSON.parse(xhr.responseText);
                    
                    let stockAvailable = "";
                    let isStockAvailable = productData[0].document.fields.isAvailable.booleanValue;

                    if (!isStockAvailable) {
                        stockAvailable = "out of stock!!";
                    }

                    productCard.innerHTML = `
                        <img src="${productData[0].document.fields.imageUrl.stringValue}" alt="${productData[0].document.fields.title.stringValue}">
                        <div class="product-info">
                            <h3>${productData[0].document.fields.title.stringValue}</h3>
                            <p>${productData[0].document.fields.description.stringValue}</p>
                            <p>${stockAvailable}</p>
                            <p>Qty: ${product.document.fields.quantity.integerValue}</p>
                            <div class="price">$${productData[0].document.fields.price.doubleValue.toFixed(2)}</div>
                            ${isStockAvailable ? `<button data-product='${JSON.stringify(product)}' onclick="buyNow(this)">Buy Now</button>` : ''}
                            ${isStockAvailable ? `<button id="modifyQuantity" data-product='${JSON.stringify(product)}' onclick="modifyQuantity(this)">Modify Quantity</button>` : ''}
                            <button data-product='${JSON.stringify(product)}' onclick="deleteCart(this)">Delete</button>
                        </div>
                    `;
                    productGrid.appendChild(productCard);
                } else {
                    console.error('Error fetching product data:', xhr.statusText);
                }
            }
        };
        
        xhr.send(JSON.stringify({
            structuredQuery: {
                from: [{ collectionId: "products" }],
                where: {
                    compositeFilter: {
                        op: "AND",
                        filters: [
                            {
                                fieldFilter: {
                                    field: { fieldPath: "productId" },
                                    op: "EQUAL",
                                    value: { integerValue: productId }
                                }
                            },
                            {
                                fieldFilter: {
                                    field: { fieldPath: "isActive" },
                                    op: "EQUAL",
                                    value: { booleanValue: true }
                                }
                            }
                        ]
                    }
                }
            }
        }));
    });

    document.getElementById('totalproducts').innerHTML=`&nbsp ${NoOfProducts}`;
}

//Buy now method
async function buyNow(button){
    let productToBuy= JSON.parse(button.getAttribute('data-product'));
    let currentProductId = productToBuy.document.fields.productId.integerValue;
    let buyQuantity = productToBuy.document.fields.quantity.integerValue;

    let isQuantityAvailable=await checkQuantity(currentProductId,buyQuantity);

    console.log(isQuantityAvailable);

    if(isQuantityAvailable){
        const productDataToBuy = [
            { productId: currentProductId, quantity: buyQuantity}
        ];
        sessionStorage.setItem('productToBuy',JSON.stringify(productDataToBuy));
        window.location.href = "buyPage.html";
    } 
}


// Modify quantity function
async function modifyQuantity(button) {
    cartToBeModified = JSON.parse(button.getAttribute('data-product'));
    document.getElementById('modifyQuantityModal').style.display = 'flex';
}

document.querySelector('.close').addEventListener('click', function () {
    document.getElementById('modifyQuantityModal').style.display = 'none'; // Hide modal
});

document.getElementById('submitQuantityBtn').addEventListener('click', async function () {
    quantity = document.getElementById('quantity').value;

    if(quantity<1){
        alert("Please enter a number greater than 0.");
        document.getElementById('quantity').value = "";
        return; // Clear the input field if invalid
    }

    const cartId = cartToBeModified.document.fields.cartId.integerValue;
    
    let documentId = await getDocumentIdByCartId(cartId);

    // AJAX PATCH request to update cart
    const xhr = new XMLHttpRequest();
    xhr.open('PATCH', `${cartUrl}/${documentId}?updateMask.fieldPaths=quantity&&updateMask.fieldPaths=updatedAt`, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    
    xhr.onreadystatechange = function () {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200) {
                alert('Cart updated successfully.');
                document.getElementById('modifyQuantityModal').style.display = 'none';
                // Update the quantity displayed on the page
                updateCartQuantityInDOM(cartToBeModified.document.fields.productId.integerValue, quantity);
                location.reload();
        
            } else {
                console.error('Error updating cart:', xhr.statusText);
            }
        }
    };
    
    xhr.send(JSON.stringify({
        fields: {
            quantity: { integerValue: quantity.toString() },
            updatedAt: { timestampValue: new Date().toISOString() }
        }
    }));
});

// Get document ID by cart ID
async function getDocumentIdByCartId(cartId) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', cartUrl, true);

        xhr.onreadystatechange = function () {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    const data = JSON.parse(xhr.responseText);
                    let documentId;
                    
                    for (let i = 0; i < data.documents.length; i++) {
                        const cart_Id = data.documents[i].fields.cartId.integerValue;
                        if (cartId == cart_Id) {
                            documentId = data.documents[i].name.split('/').pop();
                            break;
                        }
                    }
                    resolve(documentId);
                } else {
                    console.error('Error fetching document ID:', xhr.statusText);
                    reject(null);
                }
            }
        };
        
        xhr.send();
    });
}

function updateCartQuantityInDOM(productId, newQuantity) {

    // Find the product card in the DOM using the productId
    const productCards = document.querySelectorAll('.product-card');
    
    productCards.forEach(card => {
        // Check if the productId in the card matches the updated productId
        const product = card.querySelector('[data-product]').getAttribute('data-product');
        const productJason = JSON.parse(product);

        const cardProductId = productJason.document.fields.productId.integerValue;
        
        if (cardProductId==productId) {
            // Find the quantity element inside the card and update it
            const quantityElement = card.querySelector('p:nth-child(4)'); // Assuming it's the 4th <p> element
            quantityElement.textContent = `Qty: ${newQuantity}`;
        }
    });
}

async function deleteCart(button){
    let confirmation = confirm("Do you want to delete thid item from cart?");
    cartToBeModified = JSON.parse(button.getAttribute('data-product'));
    if(confirmation){
        const cartId = cartToBeModified.document.fields.cartId.integerValue;
    
        let documentId = await getDocumentIdByCartId(cartId);
    
        // AJAX PATCH request to update cart
        const xhr = new XMLHttpRequest();
        xhr.open('PATCH', `${cartUrl}/${documentId}?updateMask.fieldPaths=isActive`, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        
        xhr.onreadystatechange = function () {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    alert('Cart deleted successfully.');
                    location.reload();
                } else {
                    console.error('Error updating cart:', xhr.statusText);
                }
            }
        };
        
        xhr.send(JSON.stringify({
            fields: {
                isActive: { booleanValue: false },
                updatedAt: { timestampValue: new Date().toISOString() }
            }
        }));
    }
    else return;
}

async function proceedToBuy(){

    const customerId = sessionStorage.getItem('customer_Id');
    
    // AJAX POST request to Firestore to fetch the cart
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://firestore.googleapis.com/v1/projects/online-shopping-2c207/databases/(default)/documents:runQuery`, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    
    xhr.onreadystatechange = async function () {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200) {
                const cartData = JSON.parse(xhr.responseText);
                let isProductInCart = cartData[0].document;

                if (isProductInCart !== undefined) {
                    let productDataToBuy = await sendProductsToBuy(cartData);
                    console.log(JSON.stringify(productDataToBuy));
                    sessionStorage.setItem('productToBuy',JSON.stringify(productDataToBuy));
                    window.location.href = "buyPage.html";
                } else {
                    alert("No Products in the Cart!!");
                }
            } else {
                console.error('Error fetching cart data:', xhr.statusText);
            }
        }
    };
    
    xhr.send(JSON.stringify({
        structuredQuery: {
            from: [{ collectionId: "cart" }],
            where: {
                compositeFilter: {
                    op: "AND",
                    filters: [
                        {
                            fieldFilter: {
                                field: { fieldPath: "customerId" },
                                op: "EQUAL",
                                value: { integerValue: customerId }
                            }
                        },
                        {
                            fieldFilter: {
                                field: { fieldPath: "isActive" },
                                op: "EQUAL",
                                value: { booleanValue: true }
                            }
                        }
                    ]
                }
            }
        }
    }));
}

async function sendProductsToBuy(products) {

    let productDataToBuy = [];

    // Use map to create an array of Promises
    const productPromises = products.map(product => {
        return new Promise((resolve, reject) => {

            const productId = product.document.fields.productId.integerValue;
            let currentProductId = productId;
            let currentQuantity = product.document.fields.quantity.integerValue;

            // AJAX POST request to get product data
            const xhr = new XMLHttpRequest();
            xhr.open('POST', `https://firestore.googleapis.com/v1/projects/online-shopping-2c207/databases/(default)/documents:runQuery`, true);
            xhr.setRequestHeader('Content-Type', 'application/json');

            xhr.onreadystatechange = async function () {
                if (xhr.readyState === XMLHttpRequest.DONE) {
                    if (xhr.status === 200) {
                        try {
                            const productData = JSON.parse(xhr.responseText);

                            let isStockAvailable = productData[0].document.fields.isAvailable.booleanValue;
                            if (isStockAvailable) {

                                let isQuantityAvailable=await checkQuantity(currentProductId,currentQuantity);

                                if(isQuantityAvailable){
                                    let currentProductObject = {
                                        productId: currentProductId,
                                        quantity: currentQuantity
                                    };
                                    productDataToBuy.push(currentProductObject);
                                }    
                                resolve(); // Resolve promise on success
                            } else {
                                let name = productData[0].document.fields.title.stringValue;
                                alert(`${name} is out of stock!!`);
                                resolve(); // Resolve even if out of stock, since we don't want to reject the entire flow
                            }
                        } catch (error) {
                            reject(error); // Reject promise on JSON parse error
                        }

                    } else {
                        reject(`Error fetching product data: ${xhr.statusText}`);
                    }
                }
            };

            xhr.send(JSON.stringify({
                structuredQuery: {
                    from: [{ collectionId: "products" }],
                    where: {
                        compositeFilter: {
                            op: "AND",
                            filters: [
                                {
                                    fieldFilter: {
                                        field: { fieldPath: "productId" },
                                        op: "EQUAL",
                                        value: { integerValue: productId }
                                    }
                                },
                                {
                                    fieldFilter: {
                                        field: { fieldPath: "isActive" },
                                        op: "EQUAL",
                                        value: { booleanValue: true }
                                    }
                                }
                            ]
                        }
                    }
                }
            }));
        });
    });

    // Wait for all promises to resolve
    await Promise.all(productPromises);

    return productDataToBuy; // Return product data after all promises are resolved
}

async function checkQuantity(toCheckProductId, toCheckQuantity){

    const response = await fetch(productUrl, {
        method: 'GET',
        headers: {
            // 'Authorization': `Bearer ${idToken}`,
        }
    });

    const data = await response.json();

    const productId = toCheckProductId;

    let isQuantityAvailable=true;
    let availableQuantity;
    let productName;

    for(let i=0;i<data.documents.length;i++){
        const product_Id=data.documents[i].fields.productId.integerValue;
        if(productId==product_Id){
            const isActive = data.documents[i].fields.isActive.booleanValue;
            const isAvailable = data.documents[i].fields.isAvailable.booleanValue;
            if(isActive && isAvailable){
                let quantityInDatabase=parseInt(data.documents[i].fields.quantity.integerValue);
                if(toCheckQuantity>quantityInDatabase){
                    isQuantityAvailable=false;
                    availableQuantity=quantityInDatabase;
                    productName=data.documents[i].fields.title.stringValue;
                }
            }  
       }
    }

    if(isQuantityAvailable){
        return true;
    }
    else{
        alert(`Quantity Exceded for ${productName}!! Quantity  present in inventory: ${availableQuantity}`);
        return false;
    }
}
