const firestoreUrl = "https://firestore.googleapis.com/v1/projects/online-shopping-2c207/databases/(default)/documents";
const productUrl = `${firestoreUrl}/products`;
const categoryUrl = `${firestoreUrl}/category`;

// Redirect to Home
function goHome() {
    window.location.href = "adminFirstPage.html"; // Replace with your home page URL
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
            
            let productId;

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
               }
            }

            if(productId==undefined){
                alert("No Such Product Exist!!");
                location.reload();
            }

            // Fetch product by name
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

            if(productId==undefined){
                alert("No Such Product Exist!!");
                location.reload();
            }

            displayProducts(productsData);
        } else if (viewByCategory) {
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

            if(productId==undefined){
                alert("No Such Product Exist!!");
                location.reload();
            }
    

            displayProducts(productsData);
           
        } else if (viewAll) {
            // Fetch all products
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
            console.log(productsData);
            displayProducts(productsData); // Assuming the API returns documents in 'documents' array
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
        if(!product.document.fields.isAvailable.booleanValue){
            stockAvailable="out of stock!!";
        }
        
        // Assuming product has fields: title, description, price, imageUrl
        productCard.innerHTML = `
            <img src="${product.document.fields.imageUrl.stringValue}" alt="${product.document.fields.title.stringValue}">
            <div class="product-info">
                <h3>${product.document.fields.title.stringValue}</h3>
                <p>${product.document.fields.description.stringValue}</p>
                <p>Qty: ${product.document.fields.quantity.integerValue}</p>
                <p>${stockAvailable}</p>
                <div class="price">$${product.document.fields.price.doubleValue.toFixed(2)}</div>
                
            </div>
        `;
        
        productGrid.appendChild(productCard);
    });
}
