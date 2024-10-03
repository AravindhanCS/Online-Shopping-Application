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
    window.location.href = "cart.html";
}

function logOut(){
    sessionStorage.setItem('customer_Id',0)
    window.location.href = "index.html";
}

window.onload = async function() {
    await initial();
};

async function initial(){

    const customerId = sessionStorage.getItem('customer_Id');

    const customerResponse = await fetch(`https://firestore.googleapis.com/v1/projects/online-shopping-2c207/databases/(default)/documents:runQuery`, {
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
                        value: { integerValue: customerId } // Category ID to match
                    }
                }
            }
        })
    });

    const customerData = await customerResponse.json();

    const customerName  = customerData[0].document.fields.name.stringValue;
    const creditPoints = customerData[0].document.fields.creditScore.integerValue;

    document.getElementById("customer-name").innerHTML=`${customerName}`;
    document.getElementById("creditpoints").innerHTML=`${creditPoints}`;

    const purchaseResponse = await fetch(`https://firestore.googleapis.com/v1/projects/online-shopping-2c207/databases/(default)/documents:runQuery`, {
        method: 'POST',
        headers: {
            // 'Authorization': `Bearer YOUR_FIREBASE_AUTH_TOKEN`, // Add your token
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            structuredQuery: {
                from: [{ collectionId: "purchase" }], // Your product collection
                where: {
                    fieldFilter: {
                        field: { fieldPath: "customerId" }, // Field to filter by category ID
                        op: "EQUAL",
                        value: { integerValue: customerId } // Category ID to match
                    }
                }
            }
        })
    });
    
    const purchaseData = await purchaseResponse.json();

    // Clear previous results
    const productGrid = document.getElementById("productGrid");
    productGrid.innerHTML = '';

    
    for(let purchase=0;purchase<purchaseData.length;purchase++){
        let productId = purchaseData[purchase].document.fields.productId.integerValue;
        let quantity = purchaseData[purchase].document.fields.quantity.integerValue;
        
        let cashAmount =purchaseData[purchase].document.fields.cashAmount.integerValue;
        let creditAmount=purchaseData[purchase].document.fields.creditAmount.integerValue;
        let totalAmount=parseInt(cashAmount)+parseInt(creditAmount);


        const productResponse = await fetch(`https://firestore.googleapis.com/v1/projects/online-shopping-2c207/databases/(default)/documents:runQuery`, {
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
                            field: { fieldPath: "productId" }, // Field to filter by category ID
                            op: "EQUAL",
                            value: { integerValue: productId } // Category ID to match
                        }
                    }
                }
            })
        });
    
        const productData = await productResponse.json();

        let imageUrl = productData[0].document.fields.imageUrl.stringValue;
        let productName = productData[0].document.fields.title.stringValue;

        const productCard = document.createElement("div");
        productCard.className = "product-card";

        productCard.innerHTML = `
                    <img src="${imageUrl}" alt="${productName}">
                    <div class="product-info">
                        <h3>${productName}</h3>
                        
                        <p>Quantity: ${quantity}</p>
                        <div class="price">Total Amount: ${totalAmount}</div>
                    </div>
                `;
        productGrid.appendChild(productCard);
    }
}