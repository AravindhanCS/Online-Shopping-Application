const firestoreUrl = "https://firestore.googleapis.com/v1/projects/online-shopping-2c207/databases/(default)/documents";
const productUrl = `${firestoreUrl}/products`;
const categoryUrl = `${firestoreUrl}/category`;
const cartCounterUrl = `${firestoreUrl}/counters/cartCounter`;
const userUrl = `${firestoreUrl}/users`;
const purchaseUrl = `${firestoreUrl}/purchase`;
const purchaseCounterUrl = `${firestoreUrl}/counters/purchaseCounter`;


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
    window.location.href = "cart.html";
}

window.onload = async function () {
    await initial();
};

let NoOfProducts;
let itemsAmount;
let totalAmount;
let creditPoint;
let eachProductTotalPrice = [];
let creditPointsRemain;

const customerId = sessionStorage.getItem('customer_Id');

// Initialize and load cart
async function initial() {

    document.getElementById("useCreditPoints").disabled = true;

    const storedMessages = JSON.parse(sessionStorage.getItem('productToBuy'));

    if(storedMessages.length==0){
        alert("No Product to Buy!!");
        let confirmation=confirm("Are you willing to go to Home Page!!");
        if(confirmation){
            window.location.href="customerFirstPage.html";
        }
        else return;
    }

    const productGrid = document.getElementById("productGrid");
    NoOfProducts=storedMessages.length;
    itemsAmount=0;

    for(let i=0;i<storedMessages.length;i++){

        let productId=storedMessages[i].productId;
        let quantity=storedMessages[i].quantity;

        const productCard = document.createElement("div");
        productCard.className = "product-card";

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

        eachProductTotalPrice[i]=quantity*productsData[0].document.fields.price.doubleValue;
        itemsAmount=itemsAmount+eachProductTotalPrice[i];


        productCard.innerHTML = `
                        <img src="${productsData[0].document.fields.imageUrl.stringValue}" alt="${productsData[0].document.fields.title.stringValue}">
                        <div class="product-info">
                            <h3>${productsData[0].document.fields.title.stringValue}</h3>
                            <p>${productsData[0].document.fields.description.stringValue}</p>
                            <p>Qty: ${quantity}</p>
                            <div class="price">$${eachProductTotalPrice}</div>
                        </div>
                    `;
                    productGrid.appendChild(productCard);
    }

    const productsResponse = await fetch(`https://firestore.googleapis.com/v1/projects/online-shopping-2c207/databases/(default)/documents:runQuery`, {
        method: 'POST',
        headers: {
            // 'Authorization': `Bearer YOUR_FIREBASE_AUTH_TOKEN`, // Add your token
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            structuredQuery: {
                from: [{ collectionId: "users" }], // Your product collection
                where: {
                    fieldFilter: {
                        field: { fieldPath: "customer_Id" }, // Field to filter by category ID
                        op: "EQUAL",
                        value: { integerValue:  customerId} // Category ID to match
                    }
                }
            }
        })
    });

    const productsData = await productsResponse.json();

    creditPoint=productsData[0].document.fields.creditScore.integerValue;

    creditPointsRemain=creditPoint;

    totalAmount = itemsAmount;

    if(creditPoint>=1000){
        document.getElementById("useCreditPoints").disabled = false;
    }

    document.querySelectorAll('.value')[0].innerHTML=`${NoOfProducts}`;
    document.querySelectorAll('.value')[1].innerHTML=`${itemsAmount}`;
    document.querySelectorAll('.value')[2].innerHTML=`${creditPoint}`;
    document.querySelectorAll('.value')[3].innerHTML=`${totalAmount}`;
}

document.getElementById("useCreditPoints").addEventListener('change', async function(){
    if(document.getElementById("useCreditPoints").checked){
        totalAmount=itemsAmount-creditPoint;
        if(totalAmount<0){
            totalAmount=0;
        }
        updateInDOM();
    }
    else{
        totalAmount=itemsAmount;
        updateInDOM();
    }
})

async function proceedToBuy(){

    const storedMessages = JSON.parse(sessionStorage.getItem('productToBuy'));

    const purchaseId = await getAndIncrementPurchaseId();

    let modeOfPayment="cash";

    let cashAmount;
    let creditAmount;

    for(let i=0;i<NoOfProducts;i++){
        cashAmount=0;
        creditAmount=0;

        if(document.getElementById("useCreditPoints").checked){
            let temp=eachProductTotalPrice[i]-creditPointsRemain;
            if(temp==0){
                creditPointsRemain=0;
                creditAmount=eachProductTotalPrice[i];
                modeOfPayment="creditPoints";
            }
            else if(temp<0){
                creditPointsRemain=-(temp);
                creditAmount=eachProductTotalPrice[i];
                modeOfPayment="creditPoints";
            }
            else{
                if(creditPointsRemain==0){
                    creditAmount=0;
                    cashAmount=temp;
                    modeOfPayment="cash";
                }
                else{
                    creditPointsRemain=0;
                    creditAmount=creditPointsRemain;
                    cashAmount=temp;
                    modeOfPayment="both";
                }
            }
        }

        else if(!document.getElementById("useCreditPoints").checked){
            cashAmount=eachProductTotalPrice[i];
            creditAmount=0;
            modeOfPayment="cash";
        }

        const productId = storedMessages[i].productId;
        const quantity = storedMessages[i].quantity;

        const purchaseData = {
            fields: {
                purchaseId: {integerValue: purchaseId},
                productId: {integerValue: productId},
                customerId: { integerValue: customerId },
                modeOfPayment: { stringValue: modeOfPayment },
                cashAmount: { integerValue: cashAmount },
                creditAmount: { integerValue: creditAmount },
                quantity: { integerValue: quantity },
                purchaseDate: { timestampValue: new Date().toISOString() }
            }
        };
    
        try {
            const response = await fetch(purchaseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // 'Authorization': `Bearer ${sessionStorage.getItem('idToken')}` // Assuming idToken is stored in sessionStorage
                },
                body: JSON.stringify(purchaseData)
            });
            if (response.ok) {
                console.log('A Transaction complete!');
            } else {
                console.log('Failed to add product');
            }
        } catch (error) {
            console.error('Error adding product:', error);
        }
        await updateQuantityInProducts(productId,quantity);
    } 

    await updateCreditScore();

    alert("Product Bought successfully!!");
    let message=[];
    sessionStorage.setItem('productToBuy',JSON.stringify(message));
    location.reload();
}

async function updateQuantityInProducts(productId,quantity){

    

    let oldQuantity;
    let isAvailable;

    try {
        const response = await fetch( productUrl , {
            method: 'GET',
            headers: {
                // 'Authorization': `Bearer ${idToken}`,
            }
        });

        const data = await response.json();

        for(let i=0;i<data.documents.length;i++){
            const product_Id=data.documents[i].fields.productId.integerValue;
            if(productId==product_Id){
                oldQuantity=data.documents[i].fields.quantity.integerValue;
           }
        }

    } catch (error) {
        console.error('Error fetching product ID:', error);
    }

    let newQuantity=oldQuantity-quantity;

    if(newQuantity==0){
        isAvailable=false;
    }
    else if(newQuantity>0){
        isAvailable=true;
    }

    let documentId=await getDocumentIdByProductId(productId);

    let updateFields = `updateMask.fieldPaths=quantity&&updateMask.fieldPaths=isAvailable`;
    const response = await fetch(`https://firestore.googleapis.com/v1/projects/online-shopping-2c207/databases/(default)/documents/products/${documentId}?${updateFields}`, {
        method: 'PATCH',  // Use PATCH for partial updates
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            fields: {
                quantity: { integerValue: newQuantity},
                isAvailable:{booleanValue: isAvailable }
            }
        })
    });

    if (response.ok) {
        console.log('products updated successfully.');
    } else {
        console.error('Error updating credit score:', response.statusText);
    }
}

async function getDocumentIdByProductId(productId) {

    try {
        const response = await fetch(productUrl, {
            method: 'GET',
            headers: {
                // 'Authorization': `Bearer ${idToken}`,
            }
        });

        const data = await response.json();

        let documentId;

        for(let i=0;i<data.documents.length;i++){
            const product_Id=data.documents[i].fields.productId.integerValue;
            if(productId==product_Id){
                documentId=data.documents[i].name.split('/').pop();
           }
        }

        return documentId;
    } catch (error) {
        console.error('Error fetching document ID:', error);
    }
}

async function updateCreditScore(){

    let extraCreditPoints;

    if(document.getElementById("useCreditPoints").checked){
        extraCreditPoints=0;
    }
    else if(!document.getElementById("useCreditPoints").checked){
        extraCreditPoints=(itemsAmount/50);
    }

    creditPointsRemain= parseInt(creditPointsRemain) +extraCreditPoints;

    let documentId=await getDocumentIdByUserId(customerId);

    let updateFields = `updateMask.fieldPaths=creditScore`;
    const response = await fetch(`https://firestore.googleapis.com/v1/projects/online-shopping-2c207/databases/(default)/documents/users/${documentId}?${updateFields}`, {
        method: 'PATCH',  // Use PATCH for partial updates
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            fields: {
                creditScore: { integerValue: creditPointsRemain}
            }
        })
    });

    if (response.ok) {
        console.log('credit updated successfully.');
    } else {
        console.error('Error updating credit score:', response.statusText);
    }
}

// Get document ID by cart ID
async function getDocumentIdByUserId(userId) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', userUrl, true);

        xhr.onreadystatechange = function () {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    const data = JSON.parse(xhr.responseText);
                    let documentId;
                    
                    for (let i = 0; i < data.documents.length; i++) {
                        const customer_Id = data.documents[i].fields.customer_Id.integerValue;
                        if (userId == customer_Id) {
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

function updateInDOM() {

    document.querySelectorAll('.value')[0].innerHTML=`${NoOfProducts}`;
    document.querySelectorAll('.value')[1].innerHTML=`${itemsAmount}`;
    document.querySelectorAll('.value')[2].innerHTML=`${creditPoint}`;
    document.querySelectorAll('.value')[3].innerHTML=`${totalAmount}`;

}

async function getAndIncrementPurchaseId() {
    try {
        // Fetch the current product counter
        const response = await fetch(purchaseCounterUrl, {
            method: 'GET',
            headers: {
                // 'Authorization': `Bearer ${idToken}`,
            }
        });

        const data = await response.json();
        let currentPurchaseId = data.fields.lastPurchaseId.integerValue;

        // Increment the counter
        let newPurchaseId = parseInt(currentPurchaseId) + 1;

        // Update the counter document in Firestore
        const updateResponse = await fetch(purchaseCounterUrl, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                // 'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify({
                fields: {
                    lastPurchaseId: { integerValue: newPurchaseId.toString() }
                }
            })
        });

        if(updateResponse.ok){
            console.log('purchase id updated');
        }

        if (!updateResponse.ok) {
            throw new Error("Failed to update purchase counter");
        }

        return newPurchaseId; // Return the new incremented ProductID
    } catch (error) {
        console.error('Error fetching/incrementing PurchaseID:', error);
        return null;
    }
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
